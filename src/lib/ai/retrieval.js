import connectDB from '@/lib/db/mongodb';

export async function retrieveRelevantChunks(query, context = {}, topK = 5) {
  try {
    await connectDB();

    const EmbeddingChunk = (await import('@/lib/db/models/EmbeddingChunk')).default;

    // Build filter from context
    const filter = {};
    if (context.branch)   filter.branch   = context.branch;
    if (context.semester) filter.semester = Number(context.semester);
    if (context.subject)  filter.subject  = { $regex: context.subject, $options: 'i' };

    // ✅ Keyword-based search — extract important words from query
    const keywords = extractKeywords(query);

    if (keywords.length > 0) {
      filter.$or = keywords.map(kw => ({
        text: { $regex: kw, $options: 'i' }
      }));
    }

    const chunks = await EmbeddingChunk
      .find(filter)
      .limit(topK)
      .lean();

    if (chunks.length === 0) return [];

    // Score by keyword matches
    const scored = chunks
      .map(chunk => ({
        ...chunk,
        score: scoreChunk(chunk.text, keywords),
      }))
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored.map(chunk => ({
      text:  chunk.text,
      score: chunk.score,
      source: {
        title:      chunk.documentTitle || chunk.title || 'Study Material',
        subject:    chunk.subject       || '',
        pageNumber: chunk.pageNumber    || null,
      }
    }));

  } catch (error) {
    // ✅ Never crash the chat — just return empty
    console.warn('[retrieval] Failed (non-fatal):', error.message);
    return [];
  }
}

// ── Extract meaningful keywords from query ────────────────────────────────────
function extractKeywords(query) {
  const stopWords = new Set([
    'what', 'is', 'are', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for',
    'of', 'and', 'or', 'but', 'how', 'why', 'when', 'where', 'who', 'which',
    'explain', 'define', 'describe', 'tell', 'me', 'about', 'can', 'you',
    'please', 'with', 'it', 'its', 'this', 'that', 'do', 'does', 'did',
    'give', 'write', 'list', 'difference', 'between', 'example'
  ]);

  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
    .slice(0, 6); // top 6 keywords
}

// ── Score a chunk based on keyword frequency ──────────────────────────────────
function scoreChunk(text, keywords) {
  if (!text || keywords.length === 0) return 0;
  const lower = text.toLowerCase();
  let score = 0;
  keywords.forEach(kw => {
    const matches = (lower.match(new RegExp(kw, 'gi')) || []).length;
    score += matches;
  });
  return score;
}