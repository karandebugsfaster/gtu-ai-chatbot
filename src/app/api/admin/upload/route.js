
// src/app/api/admin/upload/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import Document from '@/lib/db/models/Document';
import { uploadPDFToCloudinary } from '@/lib/cloudinary';

// export const config = { api: { bodyParser: false } };
// ✅ Next.js 14+ way
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();

    const title        = formData.get('title')?.toString().trim();
    const type         = formData.get('type')?.toString()       || 'notes';
    const branch       = formData.get('branch')?.toString().trim();
    const semester     = parseInt(formData.get('semester')?.toString() || '0');
    const subject      = formData.get('subject')?.toString().trim();
    const academicYear = formData.get('academicYear')?.toString() || '2024-25';
    const author       = formData.get('author')?.toString().trim() || '';
    const file         = formData.get('file');

    // Validate
    if (!title)    return NextResponse.json({ success: false, error: 'Title is required'    }, { status: 400 });
    if (!branch)   return NextResponse.json({ success: false, error: 'Branch is required'   }, { status: 400 });
    if (!semester) return NextResponse.json({ success: false, error: 'Semester is required' }, { status: 400 });
    if (!subject)  return NextResponse.json({ success: false, error: 'Subject is required'  }, { status: 400 });
    if (!file)     return NextResponse.json({ success: false, error: 'File is required'     }, { status: 400 });

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer      = Buffer.from(arrayBuffer);
    const fileSize    = buffer.length;

    if (fileSize > 100 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large (max 100MB)' }, { status: 400 });
    }

    // ✅ Upload to Cloudinary
    console.log(`[upload] Uploading "${title}" (${(fileSize/1024/1024).toFixed(1)}MB) to Cloudinary...`);
    const { url: fileUrl, publicId: cloudinaryId, bytes } = await uploadPDFToCloudinary(
      buffer,
      `${branch}_sem${semester}_${subject}_${Date.now()}`
    );
    console.log(`[upload] Cloudinary upload success: ${fileUrl}`);

    // ✅ Save to MongoDB WITHOUT fileData
    await connectDB();
    const doc = await Document.create({
      title,
      type,
      branch,
      semester,
      subject,
      academicYear,
      author,
      fileUrl,          // ✅ Cloudinary URL
      cloudinaryId,     // ✅ For deletion later
      fileSize: bytes,
      processingStatus: 'pending',
      uploadedBy:       session.user.id,
    });

    console.log(`[upload] Document saved: ${doc._id}`);

    return NextResponse.json({
      success:    true,
      message:    'Document uploaded successfully',
      documentId: doc._id,
      fileUrl,
    }, { status: 201 });

  } catch (error) {
    console.error('[upload] Error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Upload failed: ' + error.message },
      { status: 500 }
    );
  }
}