import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import PYQ from '@/lib/db/models/PYQ';

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

    const { subjectId, yearRange } = await request.json();

    if (!subjectId || !yearRange) {
      return NextResponse.json(
        { success: false, error: 'Subject ID and year range are required' },
        { status: 400 }
      );
    }

    // Fetch PYQs for the subject and year range
    const pyqs = await PYQ.find({
      subject: subjectId,
      academicYear: {
        $gte: yearRange.start,
        $lte: yearRange.end
      },
      processingStatus: 'completed',
      isActive: true
    }).lean();

    if (pyqs.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No PYQs found for the specified criteria'
      }, { status: 404 });
    }

    // Collect all questions
    const allQuestions = [];
    pyqs.forEach(pyq => {
      pyq.questions.forEach(q => {
        allQuestions.push({
          ...q,
          pyqId: pyq._id,
          year: pyq.academicYear,
          examType: pyq.examType
        });
      });
    });

    // Analyze questions
    const analysis = {
      totalPYQs: pyqs.length,
      totalQuestions: allQuestions.length,
      yearRange,
      
      // Topic frequency analysis
      topicFrequency: analyzeTopicFrequency(allQuestions),
      
      // Unit-wise distribution
      unitDistribution: analyzeUnitDistribution(allQuestions),
      
      // Difficulty distribution
      difficultyDistribution: analyzeDifficulty(allQuestions),
      
      // Mark distribution
      markDistribution: analyzeMarkDistribution(allQuestions),
      
      // Repeated questions
      repeatedQuestions: findRepeatedQuestions(allQuestions),
      
      // High probability questions
      highProbabilityQuestions: getHighProbabilityQuestions(allQuestions),
      
      // Patterns detected
      patterns: detectPatterns(pyqs)
    };

    return NextResponse.json({
      success: true,
      analysis,
      pyqsAnalyzed: pyqs.map(p => ({ id: p._id, year: p.academicYear, exam: p.examName }))
    });

  } catch (error) {
    console.error('PYQ analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    );
  }
}

// Helper functions
function analyzeTopicFrequency(questions) {
  const topicCount = {};
  
  questions.forEach(q => {
    if (q.topic) {
      topicCount[q.topic] = (topicCount[q.topic] || 0) + 1;
    }
  });

  return Object.entries(topicCount)
    .map(([topic, count]) => ({ topic, count, percentage: (count / questions.length * 100).toFixed(2) }))
    .sort((a, b) => b.count - a.count);
}

function analyzeUnitDistribution(questions) {
  const unitCount = {};
  
  questions.forEach(q => {
    if (q.unit) {
      unitCount[q.unit] = (unitCount[q.unit] || 0) + 1;
    }
  });

  return Object.entries(unitCount)
    .map(([unit, count]) => ({ unit, count, percentage: (count / questions.length * 100).toFixed(2) }))
    .sort((a, b) => {
      const unitA = parseInt(a.unit.replace(/\D/g, '')) || 0;
      const unitB = parseInt(b.unit.replace(/\D/g, '')) || 0;
      return unitA - unitB;
    });
}

function analyzeDifficulty(questions) {
  const diffCount = {
    easy: 0,
    medium: 0,
    hard: 0
  };

  questions.forEach(q => {
    const diff = q.difficulty || 'medium';
    diffCount[diff]++;
  });

  return {
    easy: { count: diffCount.easy, percentage: (diffCount.easy / questions.length * 100).toFixed(2) },
    medium: { count: diffCount.medium, percentage: (diffCount.medium / questions.length * 100).toFixed(2) },
    hard: { count: diffCount.hard, percentage: (diffCount.hard / questions.length * 100).toFixed(2) }
  };
}

function analyzeMarkDistribution(questions) {
  const markCount = {};
  
  questions.forEach(q => {
    if (q.marks) {
      markCount[q.marks] = (markCount[q.marks] || 0) + 1;
    }
  });

  return Object.entries(markCount)
    .map(([marks, count]) => ({ marks: parseInt(marks), count }))
    .sort((a, b) => a.marks - b.marks);
}

function findRepeatedQuestions(questions) {
  const questionMap = new Map();

  questions.forEach(q => {
    const normalized = normalizeQuestion(q.questionText);
    
    if (questionMap.has(normalized)) {
      const existing = questionMap.get(normalized);
      existing.count++;
      existing.years.push(q.year);
    } else {
      questionMap.set(normalized, {
        questionText: q.questionText,
        count: 1,
        years: [q.year],
        marks: q.marks,
        unit: q.unit,
        topic: q.topic
      });
    }
  });

  return Array.from(questionMap.values())
    .filter(q => q.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

function normalizeQuestion(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getHighProbabilityQuestions(questions) {
  const topicAppearances = {};

  questions.forEach(q => {
    if (q.topic) {
      if (!topicAppearances[q.topic]) {
        topicAppearances[q.topic] = [];
      }
      topicAppearances[q.topic].push(q);
    }
  });

  const highProbability = [];

  Object.entries(topicAppearances).forEach(([topic, qs]) => {
    if (qs.length >= 3) {
      // Get the most recent version
      const sorted = qs.sort((a, b) => b.year.localeCompare(a.year));
      highProbability.push({
        topic,
        frequency: qs.length,
        question: sorted[0],
        probability: ((qs.length / questions.length) * 100).toFixed(2)
      });
    }
  });

  return highProbability.sort((a, b) => b.frequency - a.frequency);
}

function detectPatterns(pyqs) {
  const patterns = [];

  // Pattern 1: Consistent mark distribution
  const markDistributions = pyqs.map(p => {
    const dist = {};
    p.questions.forEach(q => {
      dist[q.marks] = (dist[q.marks] || 0) + 1;
    });
    return dist;
  });

  // Pattern 2: Question count per section
  const questionCounts = pyqs.map(p => p.questions.length);
  const avgQuestions = questionCounts.reduce((a, b) => a + b, 0) / questionCounts.length;

  patterns.push({
    type: 'Question Count',
    pattern: `Average ${avgQuestions.toFixed(0)} questions per paper`,
    confidence: 0.9
  });

  // Pattern 3: Common total marks
  const totalMarks = pyqs.map(p => p.totalMarks);
  const mostCommonMarks = mode(totalMarks);

  patterns.push({
    type: 'Total Marks',
    pattern: `Most common total marks: ${mostCommonMarks}`,
    confidence: 0.95
  });

  return patterns;
}

function mode(arr) {
  const counts = {};
  arr.forEach(val => {
    counts[val] = (counts[val] || 0) + 1;
  });
  
  let maxCount = 0;
  let modeVal = arr[0];
  
  Object.entries(counts).forEach(([val, count]) => {
    if (count > maxCount) {
      maxCount = count;
      modeVal = val;
    }
  });
  
  return modeVal;
}