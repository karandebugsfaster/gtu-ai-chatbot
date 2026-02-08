import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import ChatHistory from '@/lib/db/models/ChatHistory';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { context, title } = body;

    const sessionId = uuidv4();

    const chatSession = await ChatHistory.create({
      user: session.user.id,
      sessionId,
      title: title || 'New Chat',
      context: context || { mode: 'general' },
      messages: [],
      totalMessages: 0,
      isActive: true
    });

    return NextResponse.json({
      success: true,
      sessionId: chatSession.sessionId,
      chatId: chatSession._id
    });

  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create chat session' },
      { status: 500 }
    );
  }
}