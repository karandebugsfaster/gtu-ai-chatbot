import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import PYQ from '@/lib/db/models/PYQ';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const year = searchParams.get('year');
    const examType = searchParams.get('examType');

    if (!subjectId) {
      return NextResponse.json(
        { success: false, error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    const filter = {
      subject: subjectId,
      processingStatus: 'completed',
      isActive: true
    };

    if (year) filter.academicYear = year;
    if (examType) filter.examType = examType;

    const pyqs = await PYQ.find(filter)
      .populate('subject', 'subjectName subjectCode')
      .populate('branch', 'branchName branchCode')
      .sort({ examDate: -1 })
      .lean();

    // Group by academic year
    const groupedByYear = pyqs.reduce((acc, pyq) => {
      const year = pyq.academicYear;
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(pyq);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      pyqs,
      groupedByYear,
      total: pyqs.length
    });

  } catch (error) {
    console.error('Get PYQs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PYQs' },
      { status: 500 }
    );
  }
}