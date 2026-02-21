import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import Document from '@/lib/db/models/Document';
import PYQQuestion from '@/lib/db/models/PYQQuestion';

const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8002';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId } = await request.json();

    await connectDB();
    
    const doc = await Document.findById(documentId).select('+fileUrl');
    if (!doc || doc.type !== 'pyq') {
      return NextResponse.json(
        { success: false, error: 'Document must be a PYQ' },
        { status: 400 }
      );
    }

    // Extract year from academicYear or document title
    const year = extractYear(doc.academicYear, doc.title);

    // Fetch PDF
    const response = await fetch(doc.fileUrl);
    const pdfBuffer = Buffer.from(await response.arrayBuffer());

    // Extract questions
    const questions = await extractQuestionsFromPYQ(pdfBuffer, {
      documentId: doc._id,
      year,
      semester: doc.semester,
      subject: doc.subject,
      branch: doc.branch
    });

    console.log(`[process-pyq] Extracted ${questions.length} questions`);

    if (questions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No questions found in PDF'
      }, { status: 400 });
    }

    // Generate embeddings
    const questionTexts = questions.map(q => q.questionText);
    const embeddings = await generateEmbeddings(questionTexts);

    // Save to MongoDB
    const savedQuestions = [];
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      question.embedding = embeddings[i];
      
      const saved = await PYQQuestion.create(question);
      savedQuestions.push(saved);
    }

    // Update document status
    doc.processingStatus = 'completed';
    await doc.save();

    return NextResponse.json({
      success: true,
      message: `Processed ${savedQuestions.length} questions`,
      questionCount: savedQuestions.length,
      year
    });

  } catch (error) {
    console.error('[process-pyq] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function extractYear(academicYear, title) {
  // Try academicYear first
  if (academicYear) {
    const match = academicYear.match(/(\d{4})/);
    if (match) return parseInt(match[1]);
  }
  
  // Try title
  const match = title.match(/(\d{4})/);
  if (match) return parseInt(match[1]);
  
  // Default to current year
  return new Date().getFullYear();
}

async function extractQuestionsFromPYQ(pdfBuffer, metadata) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  
  const uint8Array = new Uint8Array(pdfBuffer);
  const pdf = await getDocument({ data: uint8Array, verbosity: 0 }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(' ') + '\n';
  }
  
  return parseQuestions(fullText, metadata);
}

function parseQuestions(text, metadata) {
  const questions = [];
  
  // Pattern 1: Q.1, Q1, Question 1
  const pattern1 = /(?:Q\.?|Question)\s*(\d+)\s*(.+?)(?=(?:Q\.?|Question)\s*\d+|\[(\d+)\s*marks?\]|$)/gis;
  
  let match;
  while ((match = pattern1.exec(text)) !== null) {
    const questionNumber = match[1];
    const questionText = match[2].trim();
    const marks = extractMarks(questionText);
    
    if (questionText.length > 10 && questionText.length < 500) {
      questions.push({
        year: metadata.year,
        semester: metadata.semester,
        subject: metadata.subject,
        branch: metadata.branch,
        questionNumber,
        questionText: cleanQuestionText(questionText),
        marks,
        section: detectSection(questionText),
        documentId: metadata.documentId
      });
    }
  }
  
  // Pattern 2: Simple numbered list (fallback)
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
          questionNumber,
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
  return text
    .replace(/\[?\d+\s*marks?\]?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMarks(text) {
  const markPattern = /\[?(\d+)\s*marks?\]?/i;
  const match = text.match(markPattern);
  return match ? parseInt(match[1]) : 7;
}

function detectSection(text) {
  const sectionPattern = /Section\s*([A-C])/i;
  const match = text.match(sectionPattern);
  return match ? match[1] : 'A';
}

async function generateEmbeddings(texts) {
  try {
    const response = await fetch(`${EMBEDDING_SERVICE_URL}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts })
    });

    const data = await response.json();
    
    // if (!data.success) {
    //   throw new Error(data.error || 'Embedding generation failed');
    // }

    if (!data.embeddings) {
  throw new Error(data.error || 'Embedding generation failed');
}

    return data.embeddings;
  } catch (error) {
    console.error('[generateEmbeddings] Error:', error);
    throw error;
  }
}