import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import PYQ from '@/lib/db/models/PYQ';
import GeneratedQP from '@/lib/db/models/GeneratedQP';
import Subject from '@/lib/db/models/Subject';
import { requireQPG } from '@/lib/utils/featureGate';
import { canUseQPGAnswers } from '@/lib/config/plans';
import { generateChatCompletion } from '@/lib/ai/chatCompletion';

export async function POST(request) {
  try {
    // ✅ PLAN GATE — Pro or Ranker only
    const guard = await requireQPG(request);
    if (guard.error) return guard.error;

    const { session, plan } = guard;
    const includeAnswers    = canUseQPGAnswers(plan); // only Ranker

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
      subject:          subjectId,
      processingStatus: 'completed',
      isActive:         true,
    }).lean();

    // ── Strategy: if PYQs exist → use pattern-based, else → use AI generation
    let generatedQP;

    if (pyqs.length > 0) {
      generatedQP = await generatePatternBasedQP(
        pyqs, subject, config, session.user.id, includeAnswers
      );
    } else {
      // No PYQs uploaded yet — fall back to AI generation
      generatedQP = await generateAIBasedQP(
        subject, config, session.user.id, includeAnswers
      );
    }

    return NextResponse.json({
      success:       true,
      questionPaper: generatedQP,
      metadata: {
        method:         pyqs.length > 0 ? 'pattern-based' : 'ai-generated',
        includeAnswers,
        plan,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[qpg/generate] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate question paper' },
      { status: 500 }
    );
  }
}

// ─── STRATEGY 1: Pattern-based from PYQs ─────────────────────────────────────
async function generatePatternBasedQP(pyqs, subject, config, userId, includeAnswers) {

  // Collect all questions from PYQs
  const allQuestions = [];
  pyqs.forEach(pyq => {
    (pyq.questions || []).forEach(q => {
      allQuestions.push({
        ...q,
        sourcePYQ: pyq._id,
        year:      pyq.academicYear,
      });
    });
  });

  // GTU standard pattern (70 marks, 3-hour exam)
  const pattern = {
    totalMarks: config.totalMarks || 70,
    duration:   config.duration   || '3 hours',
    sections: [
      {
        name:              'Q.1 – Objective Questions',
        type:              'Multiple Choice',
        instructions:      'Answer all 14 questions. (1 mark each)',
        totalMarks:        14,
        questionsToSelect: 14,
        marksPerQuestion:  1,
        difficulty:        'easy',
      },
      {
        name:              'Q.2 – Short Answer Questions',
        type:              'Short Answer',
        instructions:      'Answer any 7 out of 14 questions. (2 marks each)',
        totalMarks:        14,
        questionsToSelect: 14,
        marksPerQuestion:  2,
        difficulty:        'medium',
      },
      {
        name:              'Q.3 to Q.5 – Long Answer Questions',
        type:              'Long Answer',
        instructions:      'Answer any 3 questions. Each question has an OR option. (7 marks each)',
        totalMarks:        21,
        questionsToSelect: 6,
        marksPerQuestion:  7,
        difficulty:        'hard',
        hasOR:             true,
      },
    ],
  };

  let generatedSections = [];

  for (const section of pattern.sections) {
    const sectionQuestions = [];

    if (section.type === 'Multiple Choice') {
      const candidates = allQuestions.filter(q => q.marks === 1 || q.marks === 2);
      const selected   = selectRandom(candidates, section.questionsToSelect);

      selected.forEach((q, idx) => {
        sectionQuestions.push({
          questionNumber: `${idx + 1}`,
          questionText:   convertToMCQ(q.questionText),
          marks:          section.marksPerQuestion,
          unit:           q.unit,
          topic:          q.topic,
          difficulty:     'easy',
          source:         'pyq',
          sourcePYQ:      q.sourcePYQ,
        });
      });

    } else if (section.type === 'Short Answer') {
      const candidates = allQuestions.filter(q => q.marks >= 2 && q.marks <= 3);
      const selected   = selectRandom(candidates, section.questionsToSelect);

      selected.forEach((q, idx) => {
        sectionQuestions.push({
          questionNumber: `${idx + 1}`,
          questionText:   q.questionText,
          marks:          section.marksPerQuestion,
          unit:           q.unit,
          topic:          q.topic,
          difficulty:     'medium',
          source:         'pyq',
          sourcePYQ:      q.sourcePYQ,
        });
      });

    } else if (section.type === 'Long Answer' && section.hasOR) {
      const candidates = allQuestions.filter(q => q.marks >= 5 && q.marks <= 7);
      const selected   = selectRandom(candidates, section.questionsToSelect);

      for (let i = 0; i < selected.length; i += 2) {
        const q1 = selected[i];
        const q2 = selected[i + 1] || selected[0];

        sectionQuestions.push({
          questionNumber: `${Math.floor(i / 2) + 1}`,
          questionText:   q1.questionText,
          marks:          section.marksPerQuestion,
          unit:           q1.unit,
          topic:          q1.topic,
          difficulty:     'hard',
          source:         'pyq',
          sourcePYQ:      q1.sourcePYQ,
          alternatives:   [q2.questionText],
        });
      }
    }

    generatedSections.push({
      name:         section.name,
      type:         section.type,
      instructions: section.instructions,
      totalMarks:   section.totalMarks,
      questions:    sectionQuestions,
    });
  }

  // ✅ If Ranker plan — enhance with AI answers
  if (includeAnswers) {
    generatedSections = await addAIAnswers(
      generatedSections,
      subject,
      config
    );
  }

  const qp = await GeneratedQP.create({
    title:          `${subject.subjectName} - Generated Question Paper`,
    subject:        subject._id,
    branch:         subject.branch._id,
    semester:       subject.semester,
    generationType: 'pattern-based',
    config: {
      totalMarks: pattern.totalMarks,
      duration:   pattern.duration,
      includeAnswers,
    },
    sections: generatedSections,
    analysisUsed: {
      pyqsAnalyzed:     pyqs.map(p => p._id),
      yearRange: {
        start:          Math.min(...pyqs.map(p => p.academicYear)),
        end:            Math.max(...pyqs.map(p => p.academicYear)),
      },
      patternDetected:  'GTU Standard Pattern',
      confidenceScore:  0.85,
    },
    generatedBy: userId,
  });

  return qp;
}

// ─── STRATEGY 2: Pure AI generation (when no PYQs uploaded yet) ──────────────
async function generateAIBasedQP(subject, config, userId, includeAnswers) {
  const branchName  = subject.branch?.branchName  || subject.branch  || 'Engineering';
  const subjectName = subject.subjectName          || subject.subject || 'Subject';
  const subjectCode = subject.subjectCode          || '';

  const prompt = `You are a GTU (Gujarat Technological University) question paper expert.

Generate a complete GTU-style question paper:
- Branch: ${branchName}
- Semester: ${subject.semester}
- Subject: ${subjectName} ${subjectCode ? `(${subjectCode})` : ''}
- Total Marks: ${config.totalMarks || 70}
- Duration: ${config.duration || '3 Hours'}

Use GTU standard format exactly:

GUJARAT TECHNOLOGICAL UNIVERSITY
${branchName.toUpperCase()}
Semester: ${subject.semester}
Subject: ${subjectName} ${subjectCode ? `(${subjectCode})` : ''}
Time: ${config.duration || '3 Hours'} | Total Marks: ${config.totalMarks || 70}

Instructions to Students:
1. Attempt all questions.
2. Make suitable assumptions wherever necessary.
3. Figures to the right indicate full marks.

Q.1 Objective Questions [14 marks]
(Answer all 14 questions - 1 mark each)
1. [MCQ question with 4 options]
2. [MCQ question]
...14 questions...

Q.2 Short Answer Questions [14 marks]
(Answer any 7 out of 14 - 2 marks each)
1. [short question]
2. [short question]
...14 questions...

Q.3 [Long answer question] [7 marks]
OR
Q.3 [Alternative long answer question] [7 marks]

Q.4 [Long answer question] [7 marks]
OR
Q.4 [Alternative long answer question] [7 marks]

Q.5 [Long answer question] [7 marks]
OR
Q.5 [Alternative long answer question] [7 marks]

Rules:
- All questions must be from GTU ${subjectName} Semester ${subject.semester} syllabus
- Questions should be realistic and exam-appropriate
${includeAnswers
  ? '- After EACH question, write: Answer: [comprehensive model answer]'
  : '- DO NOT include answers — questions only'
}

Generate the complete question paper now:`;

  const rawContent = await generateChatCompletion(
    [{ role: 'user', content: prompt }],
    null
  );

  // Save as GeneratedQP with raw AI output
  const qp = await GeneratedQP.create({
    title:          `${subjectName} - AI Generated Question Paper`,
    subject:        subject._id,
    branch:         subject.branch?._id || subject.branch,
    semester:       subject.semester,
    generationType: 'ai-based',
    config: {
      totalMarks:    config.totalMarks || 70,
      duration:      config.duration   || '3 hours',
      includeAnswers,
    },
    sections:    [],         // AI output is in rawContent
    rawContent,
    generatedBy: userId,
  });

  return qp;
}

// ─── Add AI answers to pattern-based sections (Ranker only) ──────────────────
async function addAIAnswers(sections, subject, config) {
  const allQuestions = sections.flatMap(s =>
    s.questions.map(q => q.questionText)
  );

  if (allQuestions.length === 0) return sections;

  const prompt = `You are a GTU exam expert. Provide concise model answers for these ${subject.subjectName} exam questions.

For each question, give a clear, mark-appropriate answer.
Format: Q[number]: [answer]

Questions:
${allQuestions.map((q, i) => `Q${i + 1}: ${q}`).join('\n')}

Provide answers now:`;

  try {
    const answersText = await generateChatCompletion(
      [{ role: 'user', content: prompt }],
      null
    );

    // Parse answers
    const answerLines = answersText.split('\n');
    const answerMap   = {};

    answerLines.forEach(line => {
      const match = line.match(/^Q(\d+):\s*(.+)/);
      if (match) {
        answerMap[parseInt(match[1]) - 1] = match[2].trim();
      }
    });

    // Attach answers to questions
    let qIndex = 0;
    sections.forEach(section => {
      section.questions.forEach(q => {
        if (answerMap[qIndex]) {
          q.answer = answerMap[qIndex];
        }
        qIndex++;
      });
    });

  } catch (err) {
    console.warn('[qpg] Answer generation failed, returning without answers:', err.message);
  }

  return sections;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function selectRandom(questions, count) {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function convertToMCQ(questionText) {
  // In production, use AI to generate real options
  // For now, format as MCQ shell
  return `${questionText}\n(A) Option A\n(B) Option B\n(C) Option C\n(D) Option D`;
}