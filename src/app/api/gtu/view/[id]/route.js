import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Document from '@/lib/db/models/Document';

export async function GET(request, context) {
  try {
    // ✅ FIX 1: await params (Next.js 15 requirement)
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Document ID required' },
        { status: 400 }
      );
    }

    await connectDB();

    // ✅ FIX 2: Use lean() AFTER select, and log what we get
    const doc = await Document.findById(id).select('+fileData').lean();

    console.log('[gtu/view] Looking for doc:', id);
    console.log('[gtu/view] Found:', doc ? `"${doc.title}" hasFileData=${!!doc.fileData}` : 'NOT FOUND');

    if (!doc) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    if (!doc.fileData) {
      return NextResponse.json(
        { success: false, error: 'File data not available for this document' },
        { status: 404 }
      );
    }

    // Increment views (don't await — fire and forget)
    Document.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();

    // Convert base64 → buffer → serve as PDF
    const buffer = Buffer.from(doc.fileData, 'base64');

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `inline; filename="${doc.fileName || doc.title}.pdf"`,
        'Content-Length':      String(buffer.length),
        'Cache-Control':       'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('[gtu/view] Error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to load document: ' + error.message },
      { status: 500 }
    );
  }
}