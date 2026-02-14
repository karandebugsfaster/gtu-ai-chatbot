// src/lib/ai/embeddings.js
// @xenova/transformers removed — incompatible with Vercel serverless
// Retrieval now uses keyword search in retrieval.js

export async function generateEmbedding(text) {
  return null;
}

export async function generateEmbeddings(texts) {
  return texts.map(() => null);
}