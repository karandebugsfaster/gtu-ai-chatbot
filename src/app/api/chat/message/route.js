import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongodb";
import ChatHistory from "@/lib/db/models/ChatHistory";
import { retrieveRelevantChunks } from "@/lib/ai/retrieval";
import { generateChatCompletion } from "@/lib/ai/chatCompletion";

export async function POST(request) {
  const startTime = Date.now();

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();

    // ── Check message limit ────────────────────────────────────────────────
    const User = (await import("@/lib/db/models/User")).default;
    const user = await User.findById(session.user.id).select(
      "subscription messagesUsed",
    );

    const now = new Date();
    const sub = user?.subscription;
    const isActiveSub =
      sub?.status === "active" && sub?.endDate && new Date(sub.endDate) > now;
    const planId = isActiveSub ? sub.plan : "free";

    const LIMITS = { free: 15, plus: 200, pro: 600, ranker: 2000 };
    const limit = LIMITS[planId] || 15;
    const used = user?.messagesUsed || 0;

    if (used >= limit) {
      return NextResponse.json(
        {
          success: false,
          error: `Message limit reached for ${planId} plan. Upgrade to continue.`,
        },
        { status: 429 },
      );
    }
    // ── End limit check ───────────────────────────────────────────────────

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { sessionId, message, context } = body;

    if (!sessionId || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: "sessionId and message are required" },
        { status: 400 },
      );
    }

    // ── Find chat session ──────────────────────────────────────────────────
    const chatSession = await ChatHistory.findOne({
      sessionId,
      user: session.user.id,
    });

    if (!chatSession) {
      return NextResponse.json(
        { success: false, error: "Chat session not found" },
        { status: 404 },
      );
    }

    // ── Step 1: Retrieve relevant chunks from uploaded documents ───────────
    const retrievalContext = context || chatSession.context || {};

    let contextText = null;
    let sources = [];

    try {
      const chunks = await retrieveRelevantChunks(
        message,
        {
          branch: retrievalContext.branch || retrievalContext.branchId,
          semester: retrievalContext.semester,
          subject: retrievalContext.subject || retrievalContext.subjectId,
        },
        5,
      );

      if (chunks.length > 0) {
        // Build context string from top chunks
        contextText = chunks
          .map(
            (chunk, i) =>
              `[Source ${i + 1}: ${chunk.source.title}]\n${chunk.text}`,
          )
          .join("\n\n");

        // Build sources array for response
        sources = chunks.map((chunk) => ({
          title: chunk.source.title,
          subject: chunk.source.subject,
          pageNumber: chunk.source.pageNumber,
          relevance: Math.round(chunk.score * 100),
        }));
      }
    } catch (retrievalError) {
      // Retrieval failure should not stop the chat
      console.warn(
        "[chat/message] Retrieval failed (non-fatal):",
        retrievalError.message,
      );
    }

    // ── Step 2: Build chat history for context ─────────────────────────────
    const recentMessages = chatSession.messages
      .slice(-10) // last 10 messages for context window
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    // Add current user message
    const messages = [...recentMessages, { role: "user", content: message }];

    // ── Step 3: Generate response via Groq ────────────────────────────────
    const aiResponse = await generateChatCompletion(messages, contextText);

    // ── Step 4: Save both messages to chat history ────────────────────────
    const userMessage = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    const assistantMessage = {
      role: "assistant",
      content: aiResponse,
      timestamp: new Date(),
      metadata: {
        sources,
        responseTime: Date.now() - startTime,
        hasContext: !!contextText,
      },
    };

    chatSession.messages.push(userMessage, assistantMessage);
    chatSession.totalMessages = (chatSession.totalMessages || 0) + 2;
    chatSession.lastActivity = new Date();

    // Auto-generate title from first message
    if (
      (!chatSession.title || chatSession.title === "New Chat") &&
      chatSession.totalMessages <= 2
    ) {
      chatSession.title =
        message.substring(0, 50) + (message.length > 50 ? "..." : "");
    }

    await chatSession.save();
    // ✅ ADD THIS — increment user's message count
    // const User = (await import("@/lib/db/models/User")).default;
    await User.findByIdAndUpdate(session.user.id, {
      $inc: { messagesUsed: 1 },
    });

    // ── Step 5: Return response ───────────────────────────────────────────
    return NextResponse.json({
      success: true,
      response: aiResponse,
      sources,
      metadata: {
        hasContext: !!contextText,
        responseTime: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error("[chat/message] Error:", error.message);

    // Groq rate limit
    if (error.message?.includes("Rate limit")) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait a moment." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to process message: " + error.message },
      { status: 500 },
    );
  }
}
