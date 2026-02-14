import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import Document from '@/lib/db/models/Document';
import { requireBooks } from '@/lib/utils/featureGate';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const type     = searchParams.get('type');
    const branch   = searchParams.get('branch');
    const semester = searchParams.get('semester');
    const subject  = searchParams.get('subject');
    const year     = searchParams.get('year');
    const search   = searchParams.get('search');

    // ✅ Books and reference material → Ranker plan only
    // ✅ PYQ and notes → free for everyone
    if (type === 'book' || type === 'reference') {
      const session = await getServerSession(authOptions);

      if (!session) {
        return NextResponse.json(
          {
            success:      false,
            error:        'Please sign in to access GTU Books',
            code:         'UNAUTHORIZED',
            upgradeUrl:   '/pricing',
          },
          { status: 401 }
        );
      }

      const guard = await requireBooks(request);
      if (guard.error) return guard.error;
    }

    // Build query
    const query = { processingStatus: { $ne: 'failed' } };
    if (type)     query.type           = type;
    if (branch)   query.branch         = branch;
    if (semester) query.semester       = Number(semester);
    if (year)     query.academicYear   = year;

    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { title:   { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { author:  { $regex: search, $options: 'i' } },
      ];
    }

    const documents = await Document.find(query)
      .select('-fileData')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ success: true, documents });

  } catch (error) {
    console.error('[gtu/resources] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}