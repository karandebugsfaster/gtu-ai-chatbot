import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import Subject from '@/lib/db/models/Subject';

// GET subjects with filters
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const semester = searchParams.get('semester');
    const academicYear = searchParams.get('academicYear');
    const type = searchParams.get('type');

    const filter = { isActive: true };
    if (branchId) filter.branch = branchId;
    if (semester) filter.semester = parseInt(semester);
    if (academicYear) filter.academicYear = academicYear;
    if (type) filter.type = type;

    const subjects = await Subject.find(filter)
      .populate('branch', 'branchName branchCode')
      .sort({ semester: 1, subjectCode: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      subjects
    });

  } catch (error) {
    console.error('Get subjects error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}

// POST create new subject
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { 
      subjectCode, 
      subjectName, 
      branch, 
      semester, 
      academicYear, 
      type,
      credits,
      description 
    } = body;

    if (!subjectCode || !subjectName || !branch || !semester || !academicYear || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if subject code already exists
    const existing = await Subject.findOne({ subjectCode: subjectCode.toUpperCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Subject code already exists' },
        { status: 409 }
      );
    }

    const subject = await Subject.create({
      subjectCode: subjectCode.toUpperCase(),
      subjectName,
      branch,
      semester,
      academicYear,
      type,
      credits: credits || 4,
      description
    });

    return NextResponse.json({
      success: true,
      subject
    }, { status: 201 });

  } catch (error) {
    console.error('Create subject error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create subject' },
      { status: 500 }
    );
  }
}