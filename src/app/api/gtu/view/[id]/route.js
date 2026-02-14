// src/app/api/gtu/view/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Document from '@/lib/db/models/Document';

export async function GET(request, context) {
  try {
    const { id } = await context.params;
    await connectDB();

    const doc = await Document.findById(id).select('+fileData +fileUrl');
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    // Track view count
    await Document.findByIdAndUpdate(id, { $inc: { views: 1 } });

    // ✅ New: redirect to Cloudinary URL
    if (doc.fileUrl) {
      return NextResponse.redirect(doc.fileUrl);
    }

    // ✅ Old: serve from base64 (backward compat)
    if (doc.fileData) {
      const pdfBuffer = Buffer.from(doc.fileData, 'base64');
      return new NextResponse(pdfBuffer, {
        status:  200,
        headers: {
          'Content-Type':        'application/pdf',
          'Content-Disposition': `inline; filename="${doc.title}.pdf"`,
          'Content-Length':      pdfBuffer.length.toString(),
        },
      });
    }

    return NextResponse.json({ success: false, error: 'No file found' }, { status: 404 });

  } catch (error) {
    console.error('[gtu/view] Error:', error.message);
    return NextResponse.json({ success: false, error: 'Failed to load file' }, { status: 500 });
  }
}