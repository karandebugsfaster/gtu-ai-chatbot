import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import Document from '@/lib/db/models/Document';
import Diagram from '@/lib/db/models/Diagram';

const DIAGRAM_EXTRACTOR_URL = process.env.DIAGRAM_EXTRACTOR_URL || 'http://localhost:8001';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ success: false, error: 'documentId required' }, { status: 400 });
    }

    await connectDB();
    
    const doc = await Document.findById(documentId).select('+fileUrl');
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    console.log(`[process-diagrams] Starting diagram extraction for: ${doc.title}`);

    // Fetch PDF from Cloudinary
    const response = await fetch(doc.fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status}`);
    }

    const pdfBuffer = Buffer.from(await response.arrayBuffer());

    // Call Python microservice
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', pdfBuffer, { filename: 'document.pdf' });

    console.log(`[process-diagrams] Calling Python service at ${DIAGRAM_EXTRACTOR_URL}/extract-diagrams`);

    const extractResponse = await fetch(`${DIAGRAM_EXTRACTOR_URL}/extract-diagrams`, {
      method: 'POST',
      body: formData,
    });

    const extractData = await extractResponse.json();

    if (!extractData.success) {
      throw new Error(extractData.error || 'Diagram extraction failed');
    }

    console.log(`[process-diagrams] Extracted ${extractData.diagrams.length} diagrams`);

    // Process each diagram
    const savedDiagrams = [];
    
    for (const diagram of extractData.diagrams) {
      try {
        // Convert base64 back to buffer
        const imageBuffer = Buffer.from(diagram.imageBuffer, 'base64');
        
        // Optimize with sharp
        const sharp = (await import('sharp')).default;
        const optimizedBuffer = await sharp(imageBuffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();

        // Upload to Cloudinary
        const { v2: cloudinary } = await import('cloudinary');
        
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              public_id: `diagram_${doc._id}_page${diagram.pageNumber}_${diagram.imageIndex}`,
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

        // Save to MongoDB
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
          imageType: classifyImageType(diagram.captionText, diagram.contextText),
          subject: doc.subject,
          semester: doc.semester,
          branch: doc.branch
        });

        savedDiagrams.push(diagramDoc);

      } catch (err) {
        console.error(`[process-diagrams] Failed to process diagram ${diagram.imageIndex}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Extracted ${savedDiagrams.length} diagrams`,
      diagramCount: savedDiagrams.length,
      diagrams: savedDiagrams
    });

  } catch (error) {
    console.error('[process-diagrams] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function classifyImageType(caption, context) {
  const text = (caption + ' ' + context).toLowerCase();
  
  if (text.includes('circuit') || text.includes('schematic')) return 'circuit';
  if (text.includes('graph') || text.includes('plot')) return 'graph';
  if (text.includes('chart') || text.includes('bar') || text.includes('pie')) return 'chart';
  if (text.includes('diagram') || text.includes('illustration')) return 'diagram';
  
  return 'other';
}