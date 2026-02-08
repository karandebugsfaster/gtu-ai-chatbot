import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Subject from '@/lib/db/models/Subject';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const semester = searchParams.get('semester');
    const academicYear = searchParams.get('academicYear');

    if (!branchId || !semester) {
      return NextResponse.json(
        { success: false, error: 'Branch ID and semester are required' },
        { status: 400 }
      );
    }

    const filter = {
      branch: branchId,
      semester: parseInt(semester),
      isActive: true
    };

    if (academicYear) {
      filter.academicYear = academicYear;
    }

    const subjects = await Subject.find(filter)
      .select('subjectCode subjectName type credits description')
      .populate('branch', 'branchName branchCode')
      .sort({ type: 1, subjectCode: 1 })
      .lean();

    // Group by type
    const grouped = {
      core: subjects.filter(s => s.type === 'core'),
      elective: subjects.filter(s => s.type === 'elective')
    };

    return NextResponse.json({
      success: true,
      subjects,
      grouped
    });

  } catch (error) {
    console.error('Get GTU subjects error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}