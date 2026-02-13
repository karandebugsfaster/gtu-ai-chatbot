import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import ChatHistory from '@/lib/db/models/ChatHistory';
import { chatMessageSchema } from '@/lib/utils/validation';
// import { searchRelevantChunks, buildContextFromChunks } from '@/lib/ai/retrieval';
import { retrieveRelevantChunks } from '@/lib/ai/retrieval';
import { generateChatCompletion } from '@/lib/ai/chatCompletion';
import { generateChatResponse, buildChatMessages, validateResponse } from '@/lib/ai/chatCompletion';

export async function POST(request) {
  const startTime = Date.now();

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
    const validatedData = chatMessageSchema.parse(body);
    const { sessionId, message, context } = validatedData;

    // Find chat session
    const chatSession = await ChatHistory.findOne({
      sessionId,
      user: session.user.id
    });

    if (!chatSession) {
      return NextResponse.json(
        { success: false, error: 'Chat session not found' },
        { status: 404 }
      );
    }

    // Step 1: Search for relevant content
    const retrievalContext = context || chatSession.context;
    const searchResults = await searchRelevantChunks(message, {
      subjectId: retrievalContext.subjectId,
      branchId: retrievalContext.branchId,
      semester: retrievalContext.semester
    });

    // Step 2: Build context from retrieved chunks
    const { hasContext, contextText, sources } = buildContextFromChunks(
      searchResults.results,
      message
    );

    // Step 3: Prepare chat history
    const recentMessages = chatSession.messages
      .slice(-10)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Step 4: Build messages for AI
    const messages = buildChatMessages(
      message,
      hasContext ? contextText : message,
      recentMessages
    );

    // Step 5: Generate AI response
    const aiResponse = await generateChatResponse(messages);

    // Step 6: Validate response
    const validation = validateResponse(aiResponse.content, hasContext);
    const finalResponse = validation.isValid 
      ? aiResponse.content 
      : validation.correctedResponse;

    // Step 7: Save messages to chat history
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    const assistantMessage = {
      role: 'assistant',
      content: finalResponse,
      timestamp: new Date(),
      metadata: {
        retrievedDocuments: sources.map(s => ({
          documentId: s.documentId,
          title: s.title,
          relevanceScore: s.relevance,
          chunkIndices: []
        })),
        tokensUsed: aiResponse.tokensUsed?.total || 0,
        responseTime: Date.now() - startTime,
        model: aiResponse.model
      }
    };

    chatSession.messages.push(userMessage, assistantMessage);
    chatSession.totalMessages += 2;
    chatSession.lastActivity = new Date();

    // Auto-generate title from first message if still "New Chat"
    if (chatSession.title === 'New Chat' && chatSession.totalMessages === 2) {
      chatSession.title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
    }

    await chatSession.save();

    // Step 8: Return response
    return NextResponse.json({
      success: true,
      response: finalResponse,
      sources: sources.map(s => ({
        documentId: s.documentId,
        title: s.title,
        type: s.type,
        pageNumber: s.pageNumber,
        relevance: Math.round(s.relevance * 100)
      })),
      metadata: {
        hasContext,
        totalRetrieved: searchResults.totalFound,
        tokensUsed: aiResponse.tokensUsed?.total || 0,
        responseTime: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error('Chat message error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process message' },
      { status: 500 }
    );
  }
}