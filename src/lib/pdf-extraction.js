import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export async function extractQuestionsFromPYQ(pdfBuffer, metadata) {
  /**
   * Extract individual questions from PYQ PDF
   * Returns: Array of question objects
   */
  
  const uint8Array = new Uint8Array(pdfBuffer);
  const pdf = await getDocument({ data: uint8Array, verbosity: 0 }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(' ') + '\n';
  }
  
  // Parse questions using regex patterns
  const questions = parseQuestions(fullText, metadata);
  
  return questions;
}

function parseQuestions(text, metadata) {
  /**
   * Split text into individual questions
   * Handles patterns like:
   * - Q.1, Q1, Question 1
   * - 1., 2., 3.
   * - (a), (b), (c)
   */
  
  const questions = [];
  
  // Pattern 1: Numbered questions with marks
  // Example: "Q.1 Explain the OSI model. [7 marks]"
  const pattern1 = /(?:Q\.?|Question)\s*(\d+)\s*(.+?)(?=(?:Q\.?|Question)\s*\d+|\[(\d+)\s*marks?\]|$)/gis;
  
  let match;
  while ((match = pattern1.exec(text)) !== null) {
    const questionNumber = match[1];
    const questionText = match[2].trim();
    const marks = extractMarks(questionText);
    
    if (questionText.length > 10) {  // Filter out noise
      questions.push({
        year: metadata.year,
        semester: metadata.semester,
        subject: metadata.subject,
        branch: metadata.branch,
        questionNumber: questionNumber,
        questionText: cleanQuestionText(questionText),
        marks: marks,
        section: detectSection(questionText),
        documentId: metadata.documentId
      });
    }
  }
  
  // Pattern 2: Simple numbered list
  // Example: "1. What is polymorphism?"
  if (questions.length === 0) {
    const pattern2 = /(\d+)\.\s*(.+?)(?=\d+\.|$)/gs;
    
    while ((match = pattern2.exec(text)) !== null) {
      const questionNumber = match[1];
      const questionText = match[2].trim();
      
      if (questionText.length > 10 && questionText.length < 500) {
        questions.push({
          year: metadata.year,
          semester: metadata.semester,
          subject: metadata.subject,
          branch: metadata.branch,
          questionNumber: questionNumber,
          questionText: cleanQuestionText(questionText),
          marks: extractMarks(questionText),
          section: 'A',
          documentId: metadata.documentId
        });
      }
    }
  }
  
  return questions;
}

function cleanQuestionText(text) {
  // Remove marks notation, extra whitespace
  return text
    .replace(/\[?\d+\s*marks?\]?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMarks(text) {
  const markPattern = /\[?(\d+)\s*marks?\]?/i;
  const match = text.match(markPattern);
  return match ? parseInt(match[1]) : 7; // Default 7 marks
}

function detectSection(text) {
  // Detect section (A, B, C) from context
  const sectionPattern = /Section\s*([A-C])/i;
  const match = text.match(sectionPattern);
  return match ? match[1] : 'A';
}