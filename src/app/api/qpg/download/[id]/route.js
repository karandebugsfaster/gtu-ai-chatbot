import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import GeneratedQP from '@/lib/db/models/GeneratedQP';
import { jsPDF } from 'jspdf';

export async function GET(request, context) {
  try {
    // ✅ FIX 1: await context.params (Next.js 15)
    const { id } = await context.params;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // ✅ FIX 3: No populate() — branch/subject are plain strings from the form
    const qp = await GeneratedQP.findById(id).lean();

    if (!qp) {
      return NextResponse.json(
        { success: false, error: 'Question paper not found' },
        { status: 404 }
      );
    }

    // Optional: check ownership (only creator can download)
    // if (qp.userId?.toString() !== session.user.id) {
    //   return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    // }

    // ✅ FIX 2: Generate PDF in memory — no filesystem needed
    const pdfBuffer = generateQuestionPaperPDF(qp);

    // Fire-and-forget download count increment
    GeneratedQP.findByIdAndUpdate(id, { $inc: { downloads: 1 } }).exec();

    const fileName = `QP_${qp.subject || 'paper'}_Sem${qp.semester || ''}_${Date.now()}.pdf`
      .replace(/[^a-zA-Z0-9_.-]/g, '_');

    // ✅ FIX 4: Use native Response, not NextResponse, for binary data
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length':      String(pdfBuffer.length),
      },
    });

  } catch (error) {
    console.error('[qpg/download] Error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to download: ' + error.message },
      { status: 500 }
    );
  }
}

// ─── PDF GENERATOR ────────────────────────────────────────────────────────────
function generateQuestionPaperPDF(qp) {
  const doc = new jsPDF();
  let y = 20;

  const safeText = (text) => String(text || '');

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('GUJARAT TECHNOLOGICAL UNIVERSITY', 105, y, { align: 'center' });

  y += 10;
  doc.setFontSize(13);

  // ✅ branch/subject are strings now, not objects
  const branchDisplay = safeText(qp.branch).toUpperCase();
  doc.text(branchDisplay, 105, y, { align: 'center' });

  y += 9;
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Semester: ${safeText(qp.semester)}`, 105, y, { align: 'center' });

  y += 9;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text(safeText(qp.subject), 105, y, { align: 'center' });

  y += 12;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(`Total Marks: ${safeText(qp.totalMarks || qp.config?.totalMarks || 70)}`, 20, y);
  doc.text(`Duration: ${safeText(qp.examDuration || qp.config?.duration || 180)} mins`, 150, y);

  y += 8;
  doc.line(20, y, 190, y);
  y += 10;

  // ── Instructions ─────────────────────────────────────────────────────────
  doc.setFont(undefined, 'bold');
  doc.setFontSize(10);
  doc.text('INSTRUCTIONS:', 20, y);
  y += 7;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  const defaultInstructions = [
    '1. Attempt all questions.',
    '2. Make suitable assumptions wherever necessary.',
    '3. Figures to the right indicate full marks.',
  ];
  defaultInstructions.forEach(line => {
    doc.text(line, 25, y);
    y += 5;
  });

  // Custom instructions if provided
  if (qp.instructions?.trim()) {
    const customLines = doc.splitTextToSize(qp.instructions, 165);
    customLines.forEach(line => {
      doc.text(line, 25, y);
      y += 5;
    });
  }

  y += 5;

  // ── Sections / Questions ──────────────────────────────────────────────────
  const sections = qp.sections || [];

  if (sections.length > 0) {
    // Structured sections (from old format)
    sections.forEach((section) => {
      if (y > 250) { doc.addPage(); y = 20; }

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(safeText(section.name), 20, y);
      y += 6;

      if (section.instructions) {
        doc.setFontSize(9);
        doc.setFont(undefined, 'italic');
        const iLines = doc.splitTextToSize(safeText(section.instructions), 170);
        doc.text(iLines, 25, y);
        y += iLines.length * 5 + 3;
      }

      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);

      (section.questions || []).forEach((question) => {
        if (y > 260) { doc.addPage(); y = 20; }

        const qText = `${question.questionNumber || ''}. ${safeText(question.questionText)}`;
        const qLines = doc.splitTextToSize(qText, 160);
        doc.text(qLines, 25, y);
        doc.text(`[${question.marks || ''}]`, 185, y, { align: 'right' });
        y += qLines.length * 5;

        if (question.alternatives?.length > 0) {
          y += 3;
          doc.setFont(undefined, 'bold');
          doc.text('OR', 105, y, { align: 'center' });
          y += 5;
          doc.setFont(undefined, 'normal');
          const orLines = doc.splitTextToSize(safeText(question.alternatives[0]), 160);
          doc.text(orLines, 25, y);
          doc.text(`[${question.marks || ''}]`, 185, y, { align: 'right' });
          y += orLines.length * 5;
        }

        y += 5;
      });

      y += 5;
    });

  } else if (qp.questions?.length > 0) {
    // ✅ Flat questions array (from new QPG form format)
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('QUESTIONS', 20, y);
    y += 8;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);

    qp.questions.forEach((q, i) => {
      if (y > 260) { doc.addPage(); y = 20; }

      const questionText = typeof q === 'string' ? q : safeText(q.text || q.question || q);
      const marks = typeof q === 'object' ? (q.marks || '') : '';
      const qText = `${i + 1}. ${questionText}`;
      const qLines = doc.splitTextToSize(qText, marks ? 160 : 170);

      doc.text(qLines, 20, y);
      if (marks) doc.text(`[${marks}]`, 185, y, { align: 'right' });
      y += qLines.length * 6 + 4;
    });

  } else {
    // No questions — placeholder
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.text('No questions available for this paper.', 20, y);
  }

  // ── Footer on every page ──────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont(undefined, 'italic');
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    doc.text('*  *  *  *  *', 105, 290, { align: 'center' });
  }

  // ✅ Return Buffer directly (no filesystem)
  return Buffer.from(doc.output('arraybuffer'));
}