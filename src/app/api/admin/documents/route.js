import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import Document from '@/lib/db/models/Document';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const type     = searchParams.get('type');
    const branch   = searchParams.get('branch');
    const semester = searchParams.get('semester');

    const query = {};
    if (type)     query.type     = type;
    if (branch)   query.branch   = branch;
    if (semester) query.semester = Number(semester);

    // Don't return fileData (base64) — too large
    const documents = await Document.find(query)
      .select('-fileData')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, documents });
  } catch (error) {
    console.error('[admin/documents] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Document ID required' }, { status: 400 });
    }

    await connectDB();
    await Document.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    console.error('[admin/documents] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}