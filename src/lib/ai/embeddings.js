// import openai, { validateOpenAIKey } from './openai.js';

// const EMBEDDING_MODEL = 'text-embedding-3-small';
// const EMBEDDING_DIMENSIONS = 1536;

// /**
//  * Generate embedding for a single text
//  */
// export async function generateEmbedding(text) {
//   validateOpenAIKey();
  
//   try {
//     const response = await openai.embeddings.create({
//       model: EMBEDDING_MODEL,
//       input: text.replace(/\n/g, ' ').trim(),
//       encoding_format: 'float'
//     });

//     return response.data[0].embedding;
//   } catch (error) {
//     console.error('Embedding generation error:', error);
//     throw new Error('Failed to generate embedding');
//   }
// }

// /**
//  * Generate embeddings for multiple texts in batch
//  */
// export async function generateEmbeddings(texts) {
//   validateOpenAIKey();
  
//   try {
//     // OpenAI allows up to 2048 inputs per request
//     const batchSize = 100;
//     const allEmbeddings = [];

//     for (let i = 0; i < texts.length; i += batchSize) {
//       const batch = texts.slice(i, i + batchSize);
//       const cleanedBatch = batch.map(text => text.replace(/\n/g, ' ').trim());

//       const response = await openai.embeddings.create({
//         model: EMBEDDING_MODEL,
//         input: cleanedBatch,
//         encoding_format: 'float'
//       });

//       const embeddings = response.data.map(item => item.embedding);
//       allEmbeddings.push(...embeddings);

//       // Small delay to avoid rate limits
//       if (i + batchSize < texts.length) {
//         await new Promise(resolve => setTimeout(resolve, 100));
//       }
//     }

//     return allEmbeddings;
//   } catch (error) {
//     console.error('Batch embedding generation error:', error);
//     throw new Error('Failed to generate embeddings');
//   }
// }

// /**
//  * Calculate cosine similarity between two vectors
//  */
// export function cosineSimilarity(vecA, vecB) {
//   if (vecA.length !== vecB.length) {
//     throw new Error('Vectors must have the same length');
//   }

//   let dotProduct = 0;
//   let normA = 0;
//   let normB = 0;

//   for (let i = 0; i < vecA.length; i++) {
//     dotProduct += vecA[i] * vecB[i];
//     normA += vecA[i] * vecA[i];
//     normB += vecB[i] * vecB[i];
//   }

//   normA = Math.sqrt(normA);
//   normB = Math.sqrt(normB);

//   if (normA === 0 || normB === 0) {
//     return 0;
//   }

//   return dotProduct / (normA * normB);
// }