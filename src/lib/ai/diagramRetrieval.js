import Diagram from '@/lib/db/models/Diagram';

/**
 * Stop words to ignore during search
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
  'give', 'show', 'display', 'me', 'please', 'can', 'could', 'would',
  'i', 'need', 'want', 'see', 'view', 'get', 'find', 'looking',
  'what', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would'
]);

/**
 * Detects if user query is asking for a diagram/figure/circuit
 */
export async function detectDiagramIntent(userQuery) {
  const diagramKeywords = [
    'figure', 'diagram', 'circuit', 'image', 'picture', 'illustration',
    'drawing', 'schematic', 'graph', 'chart', 'plot', 'show', 'display'
  ];
  
  const queryLower = userQuery.toLowerCase().trim();
  const matchedKeyword = diagramKeywords.find(kw => queryLower.includes(kw));
  
  if (!matchedKeyword) {
    return { isDiagramQuery: false };
  }
  
  // Extract specific figure reference
  const figurePatterns = [
    /figure\s*(\d+[\.\-]\d+|\d+)/i,
    /fig\.?\s*(\d+[\.\-]\d+|\d+)/i,
    /diagram\s*(\d+)/i,
    /circuit\s*(\d+)/i
  ];
  
  for (const pattern of figurePatterns) {
    const match = userQuery.match(pattern);
    if (match) {
      return {
        isDiagramQuery: true,
        queryType: 'specific_figure',
        figureRef: match[1], // Just the number part
        fullRef: match[0]    // Full match (e.g., "Figure 1.1")
      };
    }
  }
  
  return {
    isDiagramQuery: true,
    queryType: 'concept_diagram'
  };
}

/**
 * Extract meaningful keywords from query (remove stop words)
 */
function extractKeywords(query) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.replace(/[^\w]/g, '')) // Remove punctuation
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Calculate relevance score for a diagram
 */
function scoreDiagram(diagram, intent, keywords) {
  let score = 0;
  
  const searchableText = `
    ${diagram.figureNumber || ''} 
    ${diagram.captionText || ''} 
    ${diagram.contextText || ''}
  `.toLowerCase();

  // ✅ HIGHEST PRIORITY: Exact figure number match
  if (intent.queryType === 'specific_figure' && intent.figureRef) {
    const figureNumberNormalized = (diagram.figureNumber || '').toLowerCase().replace(/\s+/g, '');
    const queryRefNormalized = intent.fullRef.toLowerCase().replace(/\s+/g, '');
    
    if (figureNumberNormalized.includes(intent.figureRef.toLowerCase())) {
      score += 1000; // Massive boost for exact figure match
      console.log(`  🎯 EXACT MATCH: ${diagram.figureNumber} matches ${intent.fullRef}`);
    }
  }

  // ✅ MEDIUM PRIORITY: Keyword matches
  for (const keyword of keywords) {
    if (searchableText.includes(keyword)) {
      score += 10;
      console.log(`  ✓ Keyword match: "${keyword}" in ${diagram.figureNumber || 'Untitled'}`);
    }
  }

  // ✅ BONUS: Title/caption match
  if (diagram.figureNumber && keywords.some(kw => diagram.figureNumber.toLowerCase().includes(kw))) {
    score += 50;
  }

  return score;
}

/**
 * Retrieve diagrams from database
 */
export async function retrieveDiagrams(query, context) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📸 DIAGRAM RETRIEVAL START');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Query:', query);

  const intent = await detectDiagramIntent(query);
  console.log('Intent:', intent);

  if (!intent.isDiagramQuery) {
    console.log('❌ NOT a diagram query\n');
    return { diagrams: [], isDiagramQuery: false };
  }

  const keywords = extractKeywords(query);
  console.log('Keywords:', keywords);

  let allDiagrams = [];

  // ═══════════════════════════════════════════════════════════════════
  // PRIORITY 1: User-uploaded diagrams
  // ═══════════════════════════════════════════════════════════════════
  
  if (context?.sessionId && context?.userId) {
    console.log('\n🔍 Searching USER diagrams...');
    console.log('  SessionId:', context.sessionId);

    try {
      allDiagrams = await Diagram.find({
        sessionId: context.sessionId,
        isUserUpload: true,
        uploadedBy: context.userId,
      }).lean();

      console.log(`  Found ${allDiagrams.length} user diagrams in DB`);

      if (allDiagrams.length > 0) {
        console.log('  Sample diagrams:');
        allDiagrams.slice(0, 3).forEach((d, i) => {
          console.log(`    ${i + 1}. ${d.figureNumber || 'Untitled'} (Page ${d.pageNumber})`);
        });
      }
    } catch (error) {
      console.error('  ❌ Error:', error.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // PRIORITY 2: Admin diagrams (fallback)
  // ═══════════════════════════════════════════════════════════════════
  
  if (allDiagrams.length === 0) {
    console.log('\n🔍 Searching ADMIN diagrams...');

    try {
      allDiagrams = await Diagram.find({
        isUserUpload: { $ne: true },
        ...(context?.subject && { subject: context.subject }),
        ...(context?.semester && { semester: context.semester }),
        ...(context?.branch && { branch: context.branch }),
      }).lean();

      console.log(`  Found ${allDiagrams.length} admin diagrams`);
    } catch (error) {
      console.error('  ❌ Error:', error.message);
    }
  }

  if (allDiagrams.length === 0) {
    console.log('\n❌ NO DIAGRAMS FOUND IN DATABASE\n');
    return { diagrams: [], isDiagramQuery: true };
  }

  // ═══════════════════════════════════════════════════════════════════
  // SCORE AND RANK DIAGRAMS
  // ═══════════════════════════════════════════════════════════════════

  console.log('\n📊 Scoring diagrams...');

  const scoredDiagrams = allDiagrams.map(d => ({
    ...d,
    score: scoreDiagram(d, intent, keywords)
  }));

  // Sort by score (highest first)
  scoredDiagrams.sort((a, b) => b.score - a.score);

  // Filter out zero-score diagrams
  const matchedDiagrams = scoredDiagrams.filter(d => d.score > 0);

  console.log(`\n✅ Matched ${matchedDiagrams.length} diagrams (from ${allDiagrams.length} total)`);
  
  if (matchedDiagrams.length > 0) {
    console.log('\nTop 3 matches:');
    matchedDiagrams.slice(0, 3).forEach((d, i) => {
      console.log(`  ${i + 1}. [Score: ${d.score}] ${d.figureNumber || 'Untitled'} (Page ${d.pageNumber})`);
      console.log(`     URL: ${d.imageUrl}`);
    });
  } else {
    console.log('\n⚠️  NO DIAGRAMS MATCHED THE QUERY');
    console.log('   Returning all diagrams as fallback...');
  }

  // ═══════════════════════════════════════════════════════════════════
  // RETURN TOP 5 (or all if no matches)
  // ═══════════════════════════════════════════════════════════════════

  const finalDiagrams = matchedDiagrams.length > 0 
    ? matchedDiagrams.slice(0, 5)
    : allDiagrams.slice(0, 5); // Fallback: return first 5

  const result = {
    diagrams: finalDiagrams.map(d => ({
      imageUrl: d.imageUrl,
      figureNumber: d.figureNumber,
      caption: d.captionText,
      pageNumber: d.pageNumber,
      documentTitle: d.documentTitle,
    })),
    isDiagramQuery: true,
  };

  console.log(`\n📤 Returning ${result.diagrams.length} diagrams`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return result;
}