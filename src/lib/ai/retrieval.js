// import Document from '../db/models/Document.js';
// import { generateEmbedding, cosineSimilarity } from './embeddings.js';

// /**
//  * Search for relevant document chunks based on query
//  */
// export async function searchRelevantChunks(query, context = {}, options = {}) {
//   const {
//     topK = 5,
//     minSimilarity = 0.7,
//     subjectId,
//     branchId,
//     semester,
//     documentTypes = ['book', 'notes', 'reference']
//   } = { ...context, ...options };

//   try {
//     // Generate query embedding
//     const queryEmbedding = await generateEmbedding(query);

//     // Build document filter
//     const filter = {
//       processingStatus: 'completed',
//       isActive: true,
//       type: { $in: documentTypes }
//     };

//     if (subjectId) filter.subject = subjectId;
//     if (branchId) filter.branch = branchId;
//     if (semester) filter.semester = semester;

//     // Fetch relevant documents
//     const documents = await Document.find(filter)
//       .select('title type chunks subject branch semester')
//       .populate('subject', 'subjectName subjectCode')
//       .lean();

//     if (!documents || documents.length === 0) {
//       return {
//         results: [],
//         message: 'No documents found for this context'
//       };
//     }

//     // Calculate similarity for all chunks
//     const allChunks = [];

//     documents.forEach(doc => {
//       doc.chunks.forEach((chunk, chunkIndex) => {
//         const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
        
//         if (similarity >= minSimilarity) {
//           allChunks.push({
//             documentId: doc._id,
//             documentTitle: doc.title,
//             documentType: doc.type,
//             subject: doc.subject,
//             chunkIndex,
//             content: chunk.content,
//             pageNumber: chunk.pageNumber,
//             similarity,
//             metadata: chunk.metadata
//           });
//         }
//       });
//     });

//     // Sort by similarity and take top K
//     const topChunks = allChunks
//       .sort((a, b) => b.similarity - a.similarity)
//       .slice(0, topK);

//     return {
//       results: topChunks,
//       totalFound: allChunks.length,
//       query
//     };
//   } catch (error) {
//     console.error('Retrieval error:', error);
//     throw new Error('Failed to search documents');
//   }
// }

// /**
//  * Build context for AI from retrieved chunks
//  */
// export function buildContextFromChunks(chunks, query) {
//   if (!chunks || chunks.length === 0) {
//     return {
//       hasContext: false,
//       contextText: '',
//       sources: []
//     };
//   }

//   const contextParts = [];
//   const sources = [];

//   chunks.forEach((chunk, index) => {
//     const sourceInfo = `[Source ${index + 1}: ${chunk.documentTitle}${chunk.pageNumber ? ` - Page ${chunk.pageNumber}` : ''}]`;
//     contextParts.push(`${sourceInfo}\n${chunk.content}\n`);

//     sources.push({
//       documentId: chunk.documentId,
//       title: chunk.documentTitle,
//       type: chunk.documentType,
//       pageNumber: chunk.pageNumber,
//       relevance: chunk.similarity,
//       subject: chunk.subject
//     });
//   });

//   const contextText = `
// RELEVANT COURSE MATERIAL:
// ${contextParts.join('\n---\n')}

// INSTRUCTIONS:
// - Answer the question STRICTLY based on the course material above
// - If the material doesn't contain information to answer the question, respond with: "This topic is not covered in the uploaded course material."
// - Cite sources using [Source X] notation when referencing specific information
// - Be accurate, clear, and educational
// - If you need to make any assumptions, state them clearly

// USER QUESTION: ${query}
// `;

//   return {
//     hasContext: true,
//     contextText,
//     sources
//   };
// }