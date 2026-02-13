import { generateEmbedding, cosineSimilarity } from './embeddings';
import connectDB from '@/lib/db/mongodb';

// Dynamic import for the model to avoid server/client issues
async function getEmbeddingChunkModel() {
  const { default: EmbeddingChunk } = await import('@/lib/db/models/EmbeddingChunk');
  return EmbeddingChunk;
}

export async function retrieveRelevantChunks(query, context = {}, topK = 5) {
  try {
    await connectDB();
    const EmbeddingChunk = await getEmbeddingChunkModel();

    // Get query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Build filter
    const filter = {};
    if (context.branch)   filter.branch   = context.branch;
    if (context.semester) filter.semester = Number(context.semester);
    if (context.subject)  filter.subject  = { $regex: context.subject, $options: 'i' };

    // Fetch candidates (limit to 200 for performance)
    const chunks = await EmbeddingChunk.find(filter).limit(200).lean();

    if (chunks.length === 0) return [];

    // Score all chunks
    const scored = chunks
      .filter(chunk => chunk.embedding?.length > 0)
      .map(chunk => ({
        ...chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding)
      }))
      .filter(chunk => chunk.score > 0.3)   // minimum relevance threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored.map(chunk => ({
      text:  chunk.text,
      score: chunk.score,
      source: {
        title:       chunk.title      || chunk.documentTitle || 'Unknown',
        subject:     chunk.subject    || '',
        pageNumber:  chunk.pageNumber || null,
        chunkIndex:  chunk.chunkIndex || 0,
      }
    }));

  } catch (error) {
    console.error('[retrieval] Error:', error.message);
    return []; // graceful fallback — chat still works without context
  }
}