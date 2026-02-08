import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import ChatHistory from '@/lib/db/models/ChatHistory';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Get specific chat session
      const chatSession = await ChatHistory.findOne({
        sessionId,
        user: session.user.id
      })
      .populate('context.subject', 'subjectName subjectCode')
      .populate('context.branch', 'branchName branchCode')
      .lean();

      if (!chatSession) {
        return NextResponse.json(
          { success: false, error: 'Chat session not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        chat: chatSession
      });
    } else {
      // Get all chat sessions for user
      const chatSessions = await ChatHistory.find({
        user: session.user.id,
        isActive: true
      })
      .select('sessionId title context totalMessages lastActivity createdAt')
      .populate('context.subject', 'subjectName')
      .sort({ lastActivity: -1 })
      .limit(50)
      .lean();

      return NextResponse.json({
        success: true,
        chats: chatSessions,
        total: chatSessions.length
      });
    }

  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}