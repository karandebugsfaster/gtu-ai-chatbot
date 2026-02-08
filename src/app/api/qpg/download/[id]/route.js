import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import GeneratedQP from '@/lib/db/models/GeneratedQP';
import { jsPDF } from 'jspdf';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

const OUTPUT_DIR = join(process.cwd(), 'uploads', 'generated-qps');

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = params;

    const qp = await GeneratedQP.findById(id)
      .populate('subject', 'subjectName subjectCode')
      .populate('branch', 'branchName branchCode')
      .lean();

    if (!qp) {
      return NextResponse.json(
        { success: false, error: 'Question paper not found' },
        { status: 404 }
      );
    }

    // Check if PDF already exists
    if (qp.pdfFile && qp.pdfFile.filePath && existsSync(qp.pdfFile.filePath)) {
      const pdfBuffer = readFileSync(qp.pdfFile.filePath);
      
      // Increment download count
      await GeneratedQP.updateOne(
        { _id: id },
        { $inc: { downloads: 1 } }
      );

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${qp.pdfFile.fileName}"`,
        },
      });
    }

    // Generate PDF
    const pdfBuffer = await generateQuestionPaperPDF(qp);

    // Save PDF
    if (!existsSync(OUTPUT_DIR)) {
      await mkdir(OUTPUT_DIR, { recursive: true });
    }

    const fileName = `QP_${qp._id}_${Date.now()}.pdf`;
    const filePath = join(OUTPUT_DIR, fileName);
    await writeFile(filePath, pdfBuffer);

    // Update database
    await GeneratedQP.updateOne(
      { _id: id },
      {
        pdfFile: {
          fileName,
          filePath,
          generatedAt: new Date()
        },
        $inc: { downloads: 1 }
      }
    );

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Download QP error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download question paper' },
      { status: 500 }
    );
  }
}

async function generateQuestionPaperPDF(qp) {
  const doc = new jsPDF();
  
  let y = 20;

  // Header
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('GUJARAT TECHNOLOGICAL UNIVERSITY', 105, y, { align: 'center' });
  
  y += 10;
  doc.setFontSize(14);
  doc.text(qp.branch.branchName.toUpperCase(), 105, y, { align: 'center'});
  
  y += 10;
  doc.setFontSize(12);
  doc.text(`Semester: ${qp.semester}`, 105, y, { align: 'center' });
  
  y += 15;
  doc.setFont(undefined, 'bold');
  doc.text(qp.subject.subjectName, 105, y, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`(${qp.subject.subjectCode})`, 105, y + 5, { align: 'center' });
  
  y += 15;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(`Total Marks: ${qp.config.totalMarks}`, 20, y);
  doc.text(`Duration: ${qp.config.duration}`, 150, y);
  
  y += 10;
  doc.line(20, y, 190, y);
  y += 10;

  // Instructions
  doc.setFont(undefined, 'bold');
  doc.text('INSTRUCTIONS:', 20, y);
  y += 7;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.text('1. Attempt all questions.', 25, y);
  y += 5;
  doc.text('2. Make suitable assumptions wherever necessary.', 25, y);
  y += 5;
  doc.text('3. Figures to the right indicate full marks.', 25, y);
  y += 10;

  // Sections
  qp.sections.forEach((section, sIndex) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`${section.name}`, 20, y);
    y += 6;
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'italic');
    const instrLines = doc.splitTextToSize(section.instructions, 170);
    doc.text(instrLines, 25, y);
    y += instrLines.length * 5 + 5;

    doc.setFont(undefined, 'normal');
    
    section.questions.forEach((question, qIndex) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      const qText = `${question.questionNumber}. ${question.questionText}`;
      const qLines = doc.splitTextToSize(qText, 160);
      
      doc.text(qLines, 25, y);
      doc.text(`[${question.marks}]`, 185, y, { align: 'right' });
      
      y += qLines.length * 5;

      // OR option
      if (question.alternatives && question.alternatives.length > 0) {
        y += 3;
        doc.setFont(undefined, 'bold');
        doc.text('OR', 105, y, { align: 'center' });
        y += 5;
        doc.setFont(undefined, 'normal');
        
        const orText = `${question.questionNumber}. ${question.alternatives[0]}`;
        const orLines = doc.splitTextToSize(orText, 160);
        doc.text(orLines, 25, y);
        doc.text(`[${question.marks}]`, 185, y, { align: 'right' });
        y += orLines.length * 5;
      }
      
      y += 5;
    });

    y += 5;
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont(undefined, 'italic');
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    doc.text('*************', 105, 290, { align: 'center' });
  }

  return Buffer.from(doc.output('arraybuffer'));
}