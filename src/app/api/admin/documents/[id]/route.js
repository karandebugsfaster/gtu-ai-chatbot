import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import Document from '@/lib/db/models/Document';

export async function GET(request, context) {
  try {
    const { id } = await context.params; // ✅ Next.js 15

    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const document = await Document.findById(id).select('-fileData').lean();
    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, document });

  } catch (error) {
    console.error('[admin/documents/id] GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  try {
    const { id } = await context.params; // ✅ Next.js 15

    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let body;
    try { body = await request.json(); } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const allowed = ['title', 'type', 'branch', 'semester', 'subject', 'academicYear', 'author', 'processingStatus'];
    const updates = {};
    allowed.forEach(key => { if (body[key] !== undefined) updates[key] = body[key]; });

    const document = await Document.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-fileData').lean();

    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, document });

  } catch (error) {
    console.error('[admin/documents/id] PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const { id } = await context.params; // ✅ Next.js 15

    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const document = await Document.findById(id);
    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    // Hard delete — we store fileData in MongoDB as base64, no filesystem file
    await Document.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });

  } catch (error) {
    console.error('[admin/documents/id] DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}