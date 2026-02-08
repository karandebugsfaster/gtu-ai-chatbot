import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import Document from '@/lib/db/models/Document';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const subjectId = searchParams.get('subjectId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build filter
    const filter = { isActive: true };
    if (type) filter.type = type;
    if (subjectId) filter.subject = subjectId;
    if (status) filter.processingStatus = status;
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    // Get total count
    const total = await Document.countDocuments(filter);

    // Get documents
    const documents = await Document.find(filter)
      .select('-chunks') // Don't send chunks in list view
      .populate('subject', 'subjectName subjectCode')
      .populate('branch', 'branchName branchCode')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      documents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}