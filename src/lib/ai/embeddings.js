import { pipeline } from '@xenova/transformers';

// Cache the pipeline so it only loads once
let embeddingPipeline = null;

async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log('[embeddings] Loading local embedding model...');
    // Downloads ~25MB model once, then caches it
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'  // Fast, small, good quality
    );
    console.log('[embeddings] Model loaded ✅');
  }
  return embeddingPipeline;
}

export async function generateEmbedding(text) {
  try {
    const extractor = await getEmbeddingPipeline();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    // Convert to plain array
    return Array.from(output.data);
  } catch (error) {
    console.error('[embeddings] Error:', error.message);
    throw new Error('Failed to generate embedding: ' + error.message);
  }
}

export async function generateEmbeddings(texts) {
  try {
    const extractor = await getEmbeddingPipeline();
    const embeddings = [];

    for (const text of texts) {
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      embeddings.push(Array.from(output.data));
    }

    return embeddings;
  } catch (error) {
    console.error('[embeddings] Batch error:', error.message);
    throw error;
  }
}

// Cosine similarity between two vectors
export function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) return 0;

  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot   += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}