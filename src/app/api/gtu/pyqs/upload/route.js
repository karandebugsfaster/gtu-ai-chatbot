import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import PYQ from '@/lib/db/models/PYQ';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'pyqs');

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
    const examName = formData.get('examName');
    const subjectId = formData.get('subjectId');
    const branchId = formData.get('branchId');
    const semester = parseInt(formData.get('semester'));
    const academicYear = formData.get('academicYear');
    const examDate = formData.get('examDate');
    const examType = formData.get('examType') || 'regular';
    const totalMarks = parseInt(formData.get('totalMarks')) || 70;
    const duration = formData.get('duration') || '3 hours';

    if (!file || !examName || !subjectId || !branchId || !semester || !academicYear) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create directory
    const subjectDir = join(UPLOAD_DIR, subjectId);
    if (!existsSync(subjectDir)) {
      await mkdir(subjectDir, { recursive: true });
    }

    // Save file
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = join(subjectDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create PYQ record
    const pyq = await PYQ.create({
      examName,
      subject: subjectId,
      branch: branchId,
      semester,
      academicYear,
      examDate: examDate ? new Date(examDate) : undefined,
      examType,
      totalMarks,
      duration,
      fileDetails: {
        originalName: file.name,
        fileName,
        filePath,
        fileSize: file.size
      },
      processingStatus: 'pending',
      uploadedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      message: 'PYQ uploaded successfully',
      pyqId: pyq._id
    }, { status: 201 });

  } catch (error) {
    console.error('PYQ upload error:', error);
    return NextResponse.json(
      { success: false, error: 'PYQ upload failed' },
      { status: 500 }
    );
  }
}