import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Diagram from '@/lib/db/models/Diagram';

export async function GET(request) {
  try {
    await connectDB();
    
    const diagrams = await Diagram.find({}).limit(10).lean();
    
    return NextResponse.json({
      success: true,
      count: diagrams.length,
      diagrams: diagrams.map(d => ({
        _id: d._id,
        documentTitle: d.documentTitle,
        figureNumber: d.figureNumber,
        captionText: d.captionText,
        pageNumber: d.pageNumber,
        imageUrl: d.imageUrl,
        isUserUpload: d.isUserUpload,
        sessionId: d.sessionId,
      }))
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}