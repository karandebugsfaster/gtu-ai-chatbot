import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import Document from '@/lib/db/models/Document';
import { extractTextByPage } from '@/lib/utils/pdfProcessor';
import { chunkByPage } from '@/lib/utils/textChunker';
import { generateEmbeddings } from '@/lib/ai/embeddings';

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

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Find document
    const document = await Document.findById(documentId);
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.processingStatus === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Document already processed' },
        { status: 400 }
      );
    }

    // Update status to processing
    document.processingStatus = 'processing';
    await document.save();

    // Start processing (this could be moved to a background job)
    try {
      // Step 1: Extract text from PDF
      const { pages, totalPages, metadata } = await extractTextByPage(
        document.fileDetails.filePath
      );

      // Update metadata
      document.metadata.totalPages = totalPages;
      if (metadata?.Title) document.metadata.title = metadata.Title;
      if (metadata?.Author) document.metadata.author = metadata.Author;

      // Step 2: Chunk the text
      const chunks = chunkByPage(pages, 1000);

      // Step 3: Generate embeddings
      const chunkTexts = chunks.map(c => c.content);
      const embeddings = await generateEmbeddings(chunkTexts);

      // Step 4: Save chunks with embeddings
      document.chunks = chunks.map((chunk, index) => ({
        content: chunk.content,
        embedding: embeddings[index],
        pageNumber: chunk.pageNumber,
        startIndex: chunk.startIndex,
        endIndex: chunk.endIndex,
        metadata: {
          chunkIndex: index
        }
      }));

      document.totalChunks = chunks.length;
      document.processingStatus = 'completed';
      await document.save();

      return NextResponse.json({
        success: true,
        message: 'Document processed successfully',
        chunksCreated: chunks.length,
        totalPages
      });

    } catch (processingError) {
      console.error('Processing error:', processingError);
      
      document.processingStatus = 'failed';
      document.processingError = processingError.message;
      await document.save();

      return NextResponse.json(
        { success: false, error: 'Document processing failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Process document error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process document' },
      { status: 500 }
    );
  }
}