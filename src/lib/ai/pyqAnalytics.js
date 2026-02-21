import PYQQuestion from '@/lib/db/models/PYQQuestion';
// import { generateEmbedding } from '@/lib/embeddings';
import { generateEmbedding } from './embeddings';

export function cosineSimilarity(vecA, vecB) {
  /**
   * Calculate cosine similarity between two vectors
   * Returns: similarity score (0 to 1)
   */
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magA * magB);
}

export async function analyzeQuestionFrequency(userQuery, context) {
  /**
   * Analyze how frequently similar questions appear in PYQs
   * Returns: { frequency, importance, similarQuestions, years }
   */
  
  // Generate embedding for user query
  const queryEmbedding = await generateEmbedding(userQuery);
  
  // Fetch all questions for this subject/semester/branch
  const allQuestions = await PYQQuestion.find({
    subject: context.subject,
    semester: context.semester,
    branch: context.branch
  }).lean();
  
  if (allQuestions.length === 0) {
    return {
      frequency: 0,
      importance: 'No Data',
      similarQuestions: [],
      years: []
    };
  }
  
  // Calculate similarity scores
  const SIMILARITY_THRESHOLD = 0.75; // Tunable (0.75 = 75% similar)
  
  const similarQuestions = allQuestions
    .map(q => ({
      ...q,
      similarity: cosineSimilarity(queryEmbedding, q.embedding)
    }))
    .filter(q => q.similarity >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity);
  
  // Calculate frequency
  const uniqueYears = [...new Set(allQuestions.map(q => q.year))];
  const yearsWithSimilarQuestion = [...new Set(similarQuestions.map(q => q.year))];
  
  const frequencyPercentage = (yearsWithSimilarQuestion.length / uniqueYears.length) * 100;
  
  // Determine importance
  let importance;
  if (frequencyPercentage >= 70) importance = 'High';
  else if (frequencyPercentage >= 40) importance = 'Medium';
  else importance = 'Low';
  
  // Optional: Weighted scoring based on marks
  const totalMarks = similarQuestions.reduce((sum, q) => sum + q.marks, 0);
  const averageMarks = totalMarks / similarQuestions.length || 0;
  
  if (averageMarks >= 10 && frequencyPercentage >= 50) {
    importance = 'Very High';
  }
  
  return {
    frequency: Math.round(frequencyPercentage),
    importance,
    similarQuestions: similarQuestions.slice(0, 5).map(q => ({
      text: q.questionText,
      year: q.year,
      marks: q.marks,
      similarity: Math.round(q.similarity * 100)
    })),
    years: yearsWithSimilarQuestion,
    totalOccurrences: similarQuestions.length,
    averageMarks: Math.round(averageMarks),
    analysisSpan: `${Math.min(...uniqueYears)}-${Math.max(...uniqueYears)}`
  };
}