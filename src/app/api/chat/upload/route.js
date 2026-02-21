import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import Document from '@/lib/db/models/Document';
import Diagram from '@/lib/db/models/Diagram';
// import { extractDiagramsFromPDF } from '@/lib/diagram-extractor'
import { uploadPDFToCloudinary } from '@/lib/cloudinary';

export const runtime = 'nodejs';

const DIAGRAM_EXTRACTOR_URL = process.env.DIAGRAM_EXTRACTOR_URL || 'http://localhost:8001';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const sessionId = formData.get('sessionId')?.toString().trim();

    if (!file) {
      return NextResponse.json({ success: false, error: 'File is required' }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID is required' }, { status: 400 });
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileSize = buffer.length;

    if (fileSize > 20 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File too large (max 20MB)' },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    console.log(`[user-upload] Uploading "${file.name}" (${(fileSize/1024/1024).toFixed(1)}MB)...`);
    const { url: fileUrl, publicId: cloudinaryId, bytes } = await uploadPDFToCloudinary(
      buffer,
      `user_${session.user.id}_${sessionId}_${Date.now()}`
    );
    console.log(`[user-upload] Cloudinary success: ${fileUrl}`);

    // Save to MongoDB
    await connectDB();
    const doc = await Document.create({
      title: file.name,
      type: 'notes',
      branch: 'general',
      semester: 0,
      subject: 'user-document',
      academicYear: new Date().getFullYear().toString(),
      author: session.user.name || session.user.email,
      fileUrl,
      cloudinaryId,
      fileSize: bytes,
      processingStatus: 'pending',
      uploadedByUser: session.user.id,
      isUserUpload: true,
      sessionId,
    });

    console.log(`[user-upload] Document saved: ${doc._id}`);

    // ═══════════════════════════════════════════════════════════════════
    // PARALLEL PROCESSING: Chunks + Diagrams
    // ═══════════════════════════════════════════════════════════════════
    
    const [chunkResult, diagramResult] = await Promise.allSettled([
      // Process 1: Extract text chunks
      processTextChunks(buffer, doc, session.user.id, sessionId),
      
      // Process 2: Extract diagrams
      extractDiagramsFromPDF(buffer, doc, session.user.id, sessionId)
    ]);

    // Check chunk processing result
    let stats = { savedChunks: 0 };
    if (chunkResult.status === 'fulfilled') {
      stats = chunkResult.value;
    } else {
      console.error('[user-upload] Chunk processing failed:', chunkResult.reason);
      return NextResponse.json({
        success: false,
        error: 'Failed to process PDF chunks: ' + chunkResult.reason.message
      }, { status: 500 });
    }

    // Check diagram extraction result
    let diagramCount = 0;
    if (diagramResult.status === 'fulfilled') {
      diagramCount = diagramResult.value;
      console.log(`[user-upload] Extracted ${diagramCount} diagrams`);
    } else {
      console.warn('[user-upload] Diagram extraction failed (non-fatal):', diagramResult.reason.message);
      // Don't fail the upload if diagram extraction fails
    }

    return NextResponse.json({
      success: true,
      message: 'PDF uploaded and processed successfully',
      documentId: doc._id.toString(),
      fileName: file.name,
      stats: {
        ...stats,
        diagramCount
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[user-upload] Error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Upload failed: ' + error.message },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Helper Function 1: Process Text Chunks
// ═══════════════════════════════════════════════════════════════════════

async function processTextChunks(pdfBuffer, doc, userId, sessionId) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const EmbeddingChunk = (await import('@/lib/db/models/EmbeddingChunk')).default;

  const uint8Array = new Uint8Array(pdfBuffer);
  const pdf = await getDocument({ data: uint8Array, verbosity: 0 }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(' ') + '\n';
  }

  if (fullText.trim().length < 30) {
    throw new Error('PDF appears to be scanned/image-based. No text found.');
  }

  // Chunk text
  const chunks = chunkText(fullText);

  if (chunks.length === 0) {
    throw new Error('No valid chunks created');
  }

  // Delete old chunks for this session
  await EmbeddingChunk.deleteMany({ 
    sessionId,
    uploadedBy: userId 
  });

  // Save chunks
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
      sessionId,
      isUserUpload: true,
      uploadedBy: userId,
    }));

    try {
      await EmbeddingChunk.insertMany(batch, { ordered: false });
      batch.forEach((_, j) => savedChunks.push(i + j));
    } catch (batchErr) {
      console.error(`[processTextChunks] Batch ${i} error:`, batchErr.message);
    }
  }

  doc.processingStatus = savedChunks.length > 0 ? 'completed' : 'failed';
  doc.totalChunks = savedChunks.length;
  await doc.save();

  return {
    totalChunks: chunks.length,
    savedChunks: savedChunks.length,
    textLength: fullText.length
  };
}

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

// ═══════════════════════════════════════════════════════════════════════
// Helper Function 2: Extract Diagrams
// ═══════════════════════════════════════════════════════════════════════

async function extractDiagramsFromPDF(pdfBuffer, doc, userId, sessionId) {
  try {
    // Call Python microservice
const formData = new FormData();

const blob = new Blob([pdfBuffer], { type: "application/pdf" });

formData.append("file", blob, "document.pdf");

    const extractResponse = await fetch(`${DIAGRAM_EXTRACTOR_URL}/extract-diagrams`, {
      method: 'POST',
      body: formData,
    //   headers: formData.getHeaders(),
    });

    const extractData = await extractResponse.json();

    if (!extractData.success || extractData.diagrams.length === 0) {
      return 0;
    }

    const Diagram = (await import('@/lib/db/models/Diagram')).default;
    const savedDiagrams = [];

    for (const diagram of extractData.diagrams) {
      try {
        const imageBuffer = Buffer.from(diagram.imageBuffer, 'base64');
        
        const sharp = (await import('sharp')).default;
        const optimizedBuffer = await sharp(imageBuffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();

        const { v2: cloudinary } = await import('cloudinary');
        
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              public_id: `user_diagram_${userId}_${sessionId}_page${diagram.pageNumber}_${diagram.imageIndex}`,
              folder: 'diagrams',
              resource_type: 'image',
              format: 'jpg',
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(optimizedBuffer);
        });

        const diagramDoc = await Diagram.create({
          documentId: doc._id,
          documentTitle: doc.title,
          pageNumber: diagram.pageNumber,
          figureNumber: diagram.figureNumber,
          captionText: diagram.captionText,
          contextText: diagram.contextText,
          imageUrl: uploadResult.secure_url,
          cloudinaryId: uploadResult.public_id,
          dimensions: diagram.dimensions,
          imageFormat: diagram.imageFormat,
          imageType: 'diagram',
          subject: doc.subject,
          semester: doc.semester,
          branch: doc.branch,
          sessionId,
          isUserUpload: true,
          uploadedBy: userId
        });

        savedDiagrams.push(diagramDoc);
      } catch (err) {
        console.error(`[extractDiagrams] Failed to process diagram ${diagram.imageIndex}:`, err);
      }
    }

    return savedDiagrams.length;

  } catch (error) {
    console.error('[extractDiagrams] Error:', error);
    return 0; // Don't fail upload if diagram extraction fails
  }
}

