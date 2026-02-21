// src/app/api/chat/process/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import Document from '@/lib/db/models/Document';
import EmbeddingChunk from '@/lib/db/models/EmbeddingChunk';

// ── Extract text from PDF URL ────────────────────────────────────────────
async function extractTextFromURL(url) {
  console.log('[user-process] Fetching PDF from Cloudinary...');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);

  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  console.log(`[user-process] PDF fetched (${(uint8Array.length / 1024 / 1024).toFixed(1)} MB)`);

  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdf = await getDocument({ data: uint8Array, verbosity: 0 }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    if (i % 20 === 0) console.log(`[user-process] Processing page ${i}/${pdf.numPages}...`);
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(' ') + '\n';
  }

  console.log(`[user-process] Extracted ${fullText.length} chars from ${pdf.numPages} pages`);
  return fullText;
}

// ── Chunk text ────────────────────────────────────────────────────────────
function chunkText(text, chunkSize = 600, overlap = 100) {
  const clean = text
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .trim();

  if (clean.length < 50) return [];

  const chunks = [];
  const advance = chunkSize - overlap;
  let start = 0;

  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    const chunk = clean.slice(start, end).trim();
    if (chunk.length > 30) chunks.push(chunk);
    start += advance;
  }

  return chunks;
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { documentId, sessionId } = body;

    if (!documentId) {
      return NextResponse.json({ success: false, error: 'documentId required' }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'sessionId required' }, { status: 400 });
    }

    await connectDB();

    // ✅ Find document (must be uploaded by this user)
    const doc = await Document.findOne({
      _id: documentId,
      uploadedByUser: session.user.id,
      sessionId,
    }).select('+fileUrl');

    if (!doc) {
      return NextResponse.json(
        { success: false, error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    // Mark processing
    doc.processingStatus = 'processing';
    await doc.save();
    console.log(`[user-process] Starting: "${doc.title}" (${doc._id})`);

    // ── Extract text ──────────────────────────────────────────────────────
    let extractedText = '';
    try {
      if (doc.fileUrl) {
        extractedText = await extractTextFromURL(doc.fileUrl);
      } else {
        throw new Error('No file URL found');
      }
    } catch (pdfError) {
      console.error('[user-process] PDF error:', pdfError.message);
      doc.processingStatus = 'failed';
      await doc.save();
      return NextResponse.json(
        { success: false, error: 'Failed to extract text: ' + pdfError.message },
        { status: 500 }
      );
    }

    if (extractedText.trim().length < 30) {
      doc.processingStatus = 'failed';
      await doc.save();
      return NextResponse.json(
        { success: false, error: 'PDF appears to be scanned/image-based. No text found.' },
        { status: 400 }
      );
    }

    // ── Chunk ─────────────────────────────────────────────────────────────
    const chunks = chunkText(extractedText);
    console.log(`[user-process] Created ${chunks.length} chunks`);

    if (chunks.length === 0) {
      doc.processingStatus = 'failed';
      await doc.save();
      return NextResponse.json({ success: false, error: 'No valid chunks created' }, { status: 400 });
    }

    // ── Delete old chunks for this session ────────────────────────────────
    await EmbeddingChunk.deleteMany({ 
      sessionId,
      uploadedBy: session.user.id 
    });

    // ── Save chunks ───────────────────────────────────────────────────────
    const savedChunks = [];
    const BATCH_SIZE = 50;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE).map((text, j) => ({
        documentId: doc._id,
        documentTitle: doc.title,
        text,
        branch: doc.branch,
        semester: doc.semester,
        subject: doc.subject,
        type: doc.type,
        chunkIndex: i + j,
        totalChunks: chunks.length,
        // ✅ User upload specific fields
        sessionId,
        isUserUpload: true,
        uploadedBy: session.user.id,
      }));

      try {
        await EmbeddingChunk.insertMany(batch, { ordered: false });
        batch.forEach((_, j) => savedChunks.push(i + j));
        console.log(`[user-process] Saved chunks ${i + 1}-${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length}`);
      } catch (batchErr) {
        console.error(`[user-process] Batch ${i} error:`, batchErr.message);
      }
    }

    doc.processingStatus = savedChunks.length > 0 ? 'completed' : 'failed';
    doc.totalChunks = savedChunks.length;
    await doc.save();

    console.log(`[user-process] ✅ Done: ${savedChunks.length} chunks saved`);

    return NextResponse.json({
      success: savedChunks.length > 0,
      message: `Processing complete: ${savedChunks.length}/${chunks.length} chunks saved`,
      stats: {
        totalChunks: chunks.length,
        savedChunks: savedChunks.length,
        textLength: extractedText.length,
      },
    });

  } catch (error) {
    console.error('[user-process] Fatal error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Processing failed: ' + error.message },
      { status: 500 }
    );
  }
}