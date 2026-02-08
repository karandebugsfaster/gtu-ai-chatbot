import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import PYQ from '@/lib/db/models/PYQ';
import GeneratedQP from '@/lib/db/models/GeneratedQP';
import Subject from '@/lib/db/models/Subject';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { subjectId, config } = body;

    if (!subjectId || !config) {
      return NextResponse.json(
        { success: false, error: 'Subject ID and configuration are required' },
        { status: 400 }
      );
    }

    // Get subject details
    const subject = await Subject.findById(subjectId)
      .populate('branch', 'branchName branchCode')
      .lean();

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Fetch PYQs for analysis
    const pyqs = await PYQ.find({
      subject: subjectId,
      processingStatus: 'completed',
      isActive: true
    }).lean();

    if (pyqs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No PYQs available for this subject' },
        { status: 404 }
      );
    }

    // Generate question paper based on GTU pattern
    const generatedQP = await generateGTUQuestionPaper(pyqs, subject, config, session.user.id);

    return NextResponse.json({
      success: true,
      questionPaper: generatedQP
    }, { status: 201 });

  } catch (error) {
    console.error('Generate QP error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate question paper' },
      { status: 500 }
    );
  }
}

async function generateGTUQuestionPaper(pyqs, subject, config, userId) {
  // Collect all questions
  const allQuestions = [];
  pyqs.forEach(pyq => {
    pyq.questions.forEach(q => {
      allQuestions.push({
        ...q,
        sourcePYQ: pyq._id,
        year: pyq.academicYear
      });
    });
  });

  // Define GTU standard pattern (70 marks, 3-hour exam)
  const pattern = {
    totalMarks: config.totalMarks || 70,
    duration: config.duration || '3 hours',
    sections: [
      {
        name: 'Q.1',
        type: 'Multiple Choice',
        instructions: 'Answer all 14 questions (1 mark each)',
        totalMarks: 14,
        questionsToSelect: 14,
        marksPerQuestion: 1,
        difficulty: 'easy'
      },
      {
        name: 'Q.2',
        type: 'Short Answer',
        instructions: 'Answer any 7 out of 14 questions (2 marks each)',
        totalMarks: 14,
        questionsToSelect: 14,
        marksPerQuestion: 2,
        difficulty: 'medium'
      },
      {
        name: 'Q.3 to Q.5',
        type: 'Long Answer',
        instructions: 'Answer any 3 out of 6 questions (7 marks each, with OR options)',
        totalMarks: 21,
        questionsToSelect: 6,
        marksPerQuestion: 7,
        difficulty: 'hard',
        hasOR: true
      }
    ]
  };

  // Generate sections
  const generatedSections = [];

  for (const section of pattern.sections) {
    const sectionQuestions = [];

    if (section.type === 'Multiple Choice') {
      // Generate MCQs (for now, use short questions and convert to MCQ format)
      const candidates = allQuestions.filter(q => 
        q.marks === 1 || q.marks === 2
      );

      const selected = selectRandomQuestions(candidates, section.questionsToSelect);

      selected.forEach((q, idx) => {
        sectionQuestions.push({
          questionNumber: `${idx + 1}`,
          questionText: convertToMCQ(q.questionText),
          marks: section.marksPerQuestion,
          unit: q.unit,
          topic: q.topic,
          difficulty: 'easy',
          source: 'pyq',
          sourcePYQ: q.sourcePYQ
        });
      });

    } else if (section.type === 'Short Answer') {
      const candidates = allQuestions.filter(q => 
        q.marks >= 2 && q.marks <= 3
      );

      const selected = selectRandomQuestions(candidates, section.questionsToSelect);

      selected.forEach((q, idx) => {
        sectionQuestions.push({
          questionNumber: `${idx + 1}`,
          questionText: q.questionText,
          marks: section.marksPerQuestion,
          unit: q.unit,
          topic: q.topic,
          difficulty: 'medium',
          source: 'pyq',
          sourcePYQ: q.sourcePYQ
        });
      });

    } else if (section.type === 'Long Answer' && section.hasOR) {
      const candidates = allQuestions.filter(q => 
        q.marks >= 5 && q.marks <= 7
      );

      const selected = selectRandomQuestions(candidates, section.questionsToSelect);

      // Create pairs for OR questions
      for (let i = 0; i < selected.length; i += 2) {
        const q1 = selected[i];
        const q2 = selected[i + 1] || selected[0]; // Fallback if odd number

        sectionQuestions.push({
          questionNumber: `${Math.floor(i / 2) + 1}`,
          questionText: q1.questionText,
          marks: section.marksPerQuestion,
          unit: q1.unit,
          topic: q1.topic,
          difficulty: 'hard',
          source: 'pyq',
          sourcePYQ: q1.sourcePYQ,
          alternatives: [q2.questionText]
        });
      }
    }

    generatedSections.push({
      name: section.name,
      type: section.type,
      instructions: section.instructions,
      totalMarks: section.totalMarks,
      questions: sectionQuestions
    });
  }

  // Create and save generated question paper
  const qp = await GeneratedQP.create({
    title: `${subject.subjectName} - Generated Question Paper`,
    subject: subject._id,
    branch: subject.branch._id,
    semester: subject.semester,
    generationType: 'pattern-based',
    config: {
      totalMarks: pattern.totalMarks,
      duration: pattern.duration
    },
    sections: generatedSections,
    analysisUsed: {
      pyqsAnalyzed: pyqs.map(p => p._id),
      yearRange: {
        start: Math.min(...pyqs.map(p => p.academicYear)),
        end: Math.max(...pyqs.map(p => p.academicYear))
      },
      patternDetected: 'GTU Standard Pattern',
      confidenceScore: 0.85
    },
    generatedBy: userId
  });

  return qp;
}

function selectRandomQuestions(questions, count) {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function convertToMCQ(questionText) {
  // Simple conversion - in production, use AI to generate options
  return `${questionText}\n(A) Option A\n(B) Option B\n(C) Option C\n(D) Option D`;
}