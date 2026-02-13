import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import Document from '@/lib/db/models/Document';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    if (session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse multipart form data
    let formData;
    try {
      formData = await request.formData();
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'Failed to parse form data' },
        { status: 400 }
      );
    }

    // Extract all fields - log them to debug
    const title        = formData.get('title')?.toString().trim();
    const type         = formData.get('type')?.toString().trim();
    const branch       = formData.get('branch')?.toString().trim();
    const semester     = formData.get('semester')?.toString().trim();
    const subject      = formData.get('subject')?.toString().trim();
    const academicYear = formData.get('academicYear')?.toString().trim() || '2024-25';
    const author       = formData.get('author')?.toString().trim() || '';
    const file         = formData.get('file');

    // Debug log every field received
    console.log('[upload] Fields received:', {
      title, type, branch, semester, subject, academicYear, author,
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size
    });

    // Validate required fields one by one for clear error messages
    const missing = [];
    if (!title)    missing.push('title');
    if (!type)     missing.push('type');
    if (!branch)   missing.push('branch');
    if (!semester) missing.push('semester');
    if (!subject)  missing.push('subject');
    if (!file)     missing.push('file');

    if (missing.length > 0) {
      console.log('[upload] Missing fields:', missing);
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // File size check (50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 50MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer for storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await connectDB();

    // Save document metadata to MongoDB
    // Store file as base64 OR save path if using local storage
    const document = await Document.create({
      title,
      type,
      branch,
      semester: Number(semester), // ensure it's a number
      subject,
      academicYear,
      author: author || undefined,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      // Store as base64 for now (for small files)
      // For production, use cloud storage like S3/Cloudinary
      fileData: buffer.toString('base64'),
      uploadedBy: session.user.id,
      processingStatus: 'pending',
      createdAt: new Date()
    });

    console.log('[upload] Document saved:', document._id);

    return NextResponse.json(
      {
        success: true,
        message: 'Document uploaded successfully',
        documentId: document._id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[upload] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed: ' + error.message },
      { status: 500 }
    );
  }
}

// Required for file uploads in Next.js
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };