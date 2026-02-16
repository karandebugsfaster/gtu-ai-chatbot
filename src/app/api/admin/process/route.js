// // src/app/api/admin/process/route.js
// import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth/authOptions";
// import connectDB from "@/lib/db/mongodb";
// import Document from "@/lib/db/models/Document";
// import EmbeddingChunk from "@/lib/db/models/EmbeddingChunk";

// // At top of process/route.js — parse Cloudinary credentials
// const cloudUrl = new URL(
//   process.env.CLOUDINARY_URL.replace("cloudinary://", "https://"),
// );
// const cloudName = cloudUrl.hostname;
// const apiKey = cloudUrl.username;
// const apiSecret = cloudUrl.password;

// import { v2 as cloudinary } from "cloudinary";
// cloudinary.config({
//   cloud_name: cloudName,
//   api_key: apiKey,
//   api_secret: apiSecret,
// });

// // Then replace extractTextFromURL to generate signed URL:
// async function extractTextFromURL(url, cloudinaryId) {
//   console.log("[process] Fetching PDF from Cloudinary...");

//   // ✅ Generate signed URL that bypasses access restrictions
//   const signedUrl = cloudinaryId
//     ? cloudinary.url(cloudinaryId, {
//         resource_type: "raw",
//         sign_url: true,
//         type: "upload",
//       })
//     : url; // fallback to raw URL for old docs
//   console.log("[process] cloudinaryId:", cloudinaryId); // ✅ ADD
//   console.log("[process] signedUrl:", signedUrl); // ✅ ADD

//   const response = await fetch(signedUrl);
//   if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);
//   console.log("[process] PDF fetched");

//   const arrayBuffer = await response.arrayBuffer();
//   const uint8Array = new Uint8Array(arrayBuffer);

//   console.log(
//     `[process] PDF fetched (${(uint8Array.length / 1024 / 1024).toFixed(1)} MB), extracting text...`,
//   );

//   const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
//   const pdf = await getDocument({ data: uint8Array, verbosity: 0 }).promise;

//   let fullText = "";
//   for (let i = 1; i <= pdf.numPages; i++) {
//     if (i % 50 === 0)
//       console.log(`[process] Processing page ${i}/${pdf.numPages}...`);
//     const page = await pdf.getPage(i);
//     const content = await page.getTextContent();
//     fullText += content.items.map((item) => item.str).join(" ") + "\n";
//   }

//   console.log(
//     `[process] Extracted ${fullText.length} chars from ${pdf.numPages} pages`,
//   );
//   return fullText;
// }

// // ── Extract text from base64 (backward compat for old docs) ──────────────────
// async function extractTextFromBase64(base64Data) {
//   const uint8Array = new Uint8Array(Buffer.from(base64Data, "base64"));
//   const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
//   const pdf = await getDocument({ data: uint8Array, verbosity: 0 }).promise;

//   let fullText = "";
//   for (let i = 1; i <= pdf.numPages; i++) {
//     const page = await pdf.getPage(i);
//     const content = await page.getTextContent();
//     fullText += content.items.map((item) => item.str).join(" ") + "\n";
//   }
//   return fullText;
// }

// // ── Chunk text ────────────────────────────────────────────────────────────────
// function chunkText(text, chunkSize = 600, overlap = 100) {
//   const clean = text
//     .replace(/\s+/g, " ")
//     .replace(/[^\x20-\x7E\n]/g, " ")
//     .trim();

//   if (clean.length < 50) return [];

//   const chunks = [];
//   const advance = chunkSize - overlap; // always positive = 500
//   let start = 0;

//   while (start < clean.length) {
//     const end = Math.min(start + chunkSize, clean.length);
//     const chunk = clean.slice(start, end).trim();
//     if (chunk.length > 30) chunks.push(chunk);
//     start += advance;
//   }

//   return chunks;
// }

// export async function POST(request) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session || session.user?.role !== "admin") {
//       return NextResponse.json(
//         { success: false, error: "Unauthorized" },
//         { status: 401 },
//       );
//     }

//     const body = await request.json().catch(() => ({}));
//     const { documentId } = body;

//     if (!documentId) {
//       return NextResponse.json(
//         { success: false, error: "documentId required" },
//         { status: 400 },
//       );
//     }

//     await connectDB();

//     // ✅ Select both fileUrl (new) and fileData (old)
//     const doc =
//       await Document.findById(documentId).select("+fileData +fileUrl");
//     if (!doc)
//       return NextResponse.json(
//         { success: false, error: "Document not found" },
//         { status: 404 },
//       );

//     // Mark processing
//     doc.processingStatus = "processing";
//     await doc.save();
//     console.log(`[process] Starting: "${doc.title}" (${doc._id})`);

//     // ── Extract text ──────────────────────────────────────────────────────────
//     let extractedText = "";
//     try {
//       // ✅ Pass cloudinaryId so we can generate signed URL
//       if (doc.fileUrl) {
//         extractedText = await extractTextFromURL(doc.fileUrl, doc.cloudinaryId);
//       } else if (doc.fileData) {
//         // ✅ Old: use base64 (backward compat)
//         extractedText = await extractTextFromBase64(doc.fileData);
//       } else {
//         throw new Error("No file URL or data found");
//       }
//     } catch (pdfError) {
//       console.error("[process] PDF error:", pdfError.message);
//       doc.processingStatus = "failed";
//       await doc.save();
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Failed to extract text: " + pdfError.message,
//         },
//         { status: 500 },
//       );
//     }

//     if (extractedText.trim().length < 30) {
//       doc.processingStatus = "failed";
//       await doc.save();
//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "PDF appears to be image/scanned — no text found. Min 30 characters needed.",
//         },
//         { status: 400 },
//       );
//     }

//     // ── Chunk ─────────────────────────────────────────────────────────────────
//     const chunks = chunkText(extractedText);
//     console.log(`[process] Created ${chunks.length} chunks`);

//     if (chunks.length === 0) {
//       doc.processingStatus = "failed";
//       await doc.save();
//       return NextResponse.json(
//         { success: false, error: "No valid chunks created" },
//         { status: 400 },
//       );
//     }

//     // ── Delete old chunks ─────────────────────────────────────────────────────
//     await EmbeddingChunk.deleteMany({ documentId: doc._id });

//     // ── Save chunks ───────────────────────────────────────────────────────────
//     const savedChunks = [];
//     let failed = 0;

//     // Batch insert in groups of 50 for large docs
//     const BATCH_SIZE = 50;
//     for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
//       const batch = chunks.slice(i, i + BATCH_SIZE).map((text, j) => ({
//         documentId: doc._id,
//         documentTitle: doc.title,
//         text,
//         branch: doc.branch,
//         semester: doc.semester,
//         subject: doc.subject,
//         type: doc.type,
//         chunkIndex: i + j,
//         totalChunks: chunks.length,
//         // ✅ No embedding — keyword search handles retrieval
//       }));

//       try {
//         await EmbeddingChunk.insertMany(batch, { ordered: false });
//         batch.forEach((_, j) => savedChunks.push(i + j));
//         console.log(
//           `[process] Saved chunks ${i + 1}-${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length}`,
//         );
//       } catch (batchErr) {
//         console.error(`[process] Batch ${i} error:`, batchErr.message);
//         failed += batch.length;
//       }
//     }

//     doc.processingStatus = savedChunks.length > 0 ? "completed" : "failed";
//     doc.totalChunks = savedChunks.length;
//     await doc.save();

//     console.log(
//       `[process] ✅ Done: ${savedChunks.length} chunks, ${failed} failed`,
//     );

//     return NextResponse.json({
//       success: savedChunks.length > 0,
//       message: `Processing complete: ${savedChunks.length}/${chunks.length} chunks saved`,
//       stats: {
//         totalChunks: chunks.length,
//         savedChunks: savedChunks.length,
//         failedChunks: failed,
//         textLength: extractedText.length,
//       },
//     });
//   } catch (error) {
//     console.error("[process] Fatal error:", error.message);
//     return NextResponse.json(
//       { success: false, error: "Processing failed: " + error.message },
//       { status: 500 },
//     );
//   }
// }
// src/app/api/admin/upload/route.js
// src/app/api/admin/process/route.js
import { NextResponse }   from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }    from '@/lib/auth/authOptions';
import connectDB          from '@/lib/db/mongodb';
import Document           from '@/lib/db/models/Document';
import EmbeddingChunk     from '@/lib/db/models/EmbeddingChunk';

// ── Extract text from PDF URL using pdfjs-dist ────────────────────────────────
async function extractTextFromURL(url) {
  console.log('[process] Fetching PDF from Cloudinary...');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);

  const arrayBuffer = await response.arrayBuffer();
  const uint8Array  = new Uint8Array(arrayBuffer);

  console.log(`[process] PDF fetched (${(uint8Array.length / 1024 / 1024).toFixed(1)} MB), extracting text...`);

  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const pdf = await getDocument({ data: uint8Array, verbosity: 0 }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    if (i % 50 === 0) console.log(`[process] Processing page ${i}/${pdf.numPages}...`);
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(' ') + '\n';
  }

  console.log(`[process] Extracted ${fullText.length} chars from ${pdf.numPages} pages`);
  return fullText;
}

// ── Extract text from base64 (backward compat for old docs) ──────────────────
async function extractTextFromBase64(base64Data) {
  const uint8Array  = new Uint8Array(Buffer.from(base64Data, 'base64'));
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdf = await getDocument({ data: uint8Array, verbosity: 0 }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(' ') + '\n';
  }
  return fullText;
}

// ── Chunk text ────────────────────────────────────────────────────────────────
function chunkText(text, chunkSize = 600, overlap = 100) {
  const clean = text
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .trim();

  if (clean.length < 50) return [];

  const chunks  = [];
  const advance = chunkSize - overlap; // always positive = 500
  let   start   = 0;

  while (start < clean.length) {
    const end   = Math.min(start + chunkSize, clean.length);
    const chunk = clean.slice(start, end).trim();
    if (chunk.length > 30) chunks.push(chunk);
    start += advance;
  }

  return chunks;
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json({ success: false, error: 'documentId required' }, { status: 400 });
    }

    await connectDB();

    // ✅ Select both fileUrl (new) and fileData (old) 
    const doc = await Document.findById(documentId).select('+fileData +fileUrl');
    if (!doc) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });

    // Mark processing
    doc.processingStatus = 'processing';
    await doc.save();
    console.log(`[process] Starting: "${doc.title}" (${doc._id})`);

    // ── Extract text ──────────────────────────────────────────────────────────
    let extractedText = '';
    try {
      if (doc.fileUrl) {
        // ✅ New: fetch from Cloudinary
        extractedText = await extractTextFromURL(doc.fileUrl);
      } else if (doc.fileData) {
        // ✅ Old: use base64 (backward compat)
        extractedText = await extractTextFromBase64(doc.fileData);
      } else {
        throw new Error('No file URL or data found');
      }
    } catch (pdfError) {
      console.error('[process] PDF error:', pdfError.message);
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
        { success: false, error: 'PDF appears to be image/scanned — no text found. Min 30 characters needed.' },
        { status: 400 }
      );
    }

    // ── Chunk ─────────────────────────────────────────────────────────────────
    const chunks = chunkText(extractedText);
    console.log(`[process] Created ${chunks.length} chunks`);

    if (chunks.length === 0) {
      doc.processingStatus = 'failed';
      await doc.save();
      return NextResponse.json({ success: false, error: 'No valid chunks created' }, { status: 400 });
    }

    // ── Delete old chunks ─────────────────────────────────────────────────────
    await EmbeddingChunk.deleteMany({ documentId: doc._id });

    // ── Save chunks ───────────────────────────────────────────────────────────
    const savedChunks = [];
    let failed = 0;

    // Batch insert in groups of 50 for large docs
    const BATCH_SIZE = 50;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE).map((text, j) => ({
        documentId:    doc._id,
        documentTitle: doc.title,
        text,
        branch:        doc.branch,
        semester:      doc.semester,
        subject:       doc.subject,
        type:          doc.type,
        chunkIndex:    i + j,
        totalChunks:   chunks.length,
        // ✅ No embedding — keyword search handles retrieval
      }));

      try {
        await EmbeddingChunk.insertMany(batch, { ordered: false });
        batch.forEach((_, j) => savedChunks.push(i + j));
        console.log(`[process] Saved chunks ${i + 1}-${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length}`);
      } catch (batchErr) {
        console.error(`[process] Batch ${i} error:`, batchErr.message);
        failed += batch.length;
      }
    }

    doc.processingStatus = savedChunks.length > 0 ? 'completed' : 'failed';
    doc.totalChunks      = savedChunks.length;
    await doc.save();

    console.log(`[process] ✅ Done: ${savedChunks.length} chunks, ${failed} failed`);

    return NextResponse.json({
      success: savedChunks.length > 0,
      message: `Processing complete: ${savedChunks.length}/${chunks.length} chunks saved`,
      stats: {
        totalChunks:  chunks.length,
        savedChunks:  savedChunks.length,
        failedChunks: failed,
        textLength:   extractedText.length,
      },
    });

  } catch (error) {
    console.error('[process] Fatal error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Processing failed: ' + error.message },
      { status: 500 }
    );
  }
}