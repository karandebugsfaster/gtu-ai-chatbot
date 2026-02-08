import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import Document from '@/lib/db/models/Document';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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

    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title');
    const type = formData.get('type');
    const subjectId = formData.get('subjectId');
    const branchId = formData.get('branchId');
    const semester = parseInt(formData.get('semester'));
    const academicYear = formData.get('academicYear');
    
    // Optional metadata
    const author = formData.get('author');
    const publisher = formData.get('publisher');
    const edition = formData.get('edition');
    const year = formData.get('year');

    // Validation
    if (!file || !title || !type || !subjectId || !branchId || !semester || !academicYear) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Check file type (PDF only)
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Create upload directory structure
    const typeDir = join(UPLOAD_DIR, type);
    const subjectDir = join(typeDir, subjectId);
    
    if (!existsSync(typeDir)) {
      await mkdir(typeDir, { recursive: true });
    }
    if (!existsSync(subjectDir)) {
      await mkdir(subjectDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const fileName = `${timestamp}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = join(subjectDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create document record
    const document = await Document.create({
      title,
      type,
      subject: subjectId,
      branch: branchId,
      semester,
      academicYear,
      fileDetails: {
        originalName,
        fileName,
        filePath,
        fileSize: file.size,
        mimeType: file.type
      },
      metadata: {
        author: author || undefined,
        publisher: publisher || undefined,
        edition: edition || undefined,
        year: year || undefined
      },
      processingStatus: 'pending',
      uploadedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      documentId: document._id,
      processingStatus: document.processingStatus
    }, { status: 201 });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'File upload failed' },
      { status: 500 }
    );
  }
}