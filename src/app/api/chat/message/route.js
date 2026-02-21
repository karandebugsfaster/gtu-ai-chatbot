// // import { NextResponse } from "next/server";
// // import { getServerSession } from "next-auth";
// // import { authOptions } from "@/lib/auth/authOptions";
// // import connectDB from "@/lib/db/mongodb";
// // import ChatHistory from "@/lib/db/models/ChatHistory";
// // import { retrieveRelevantChunks } from "@/lib/ai/retrieval";
// // import { generateChatCompletion } from "@/lib/ai/chatCompletion";

// // export async function POST(request) {
// //   const startTime = Date.now();

// //   try {
// //     const session = await getServerSession(authOptions);
// //     if (!session) {
// //       return NextResponse.json(
// //         { success: false, error: "Unauthorized" },
// //         { status: 401 },
// //       );
// //     }

// //     await connectDB();

// //     // ── Check message limit ────────────────────────────────────────────────
// //     const User = (await import("@/lib/db/models/User")).default;
// //     const user = await User.findById(session.user.id).select(
// //       "subscription messagesUsed",
// //     );

// //     const now = new Date();
// //     const sub = user?.subscription;
// //     const isActiveSub =
// //       sub?.status === "active" && sub?.endDate && new Date(sub.endDate) > now;
// //     const planId = isActiveSub ? sub.plan : "free";

// //     const LIMITS = { free: 15, plus: 200, pro: 600, ranker: 2000 };
// //     const limit = LIMITS[planId] || 15;
// //     const used = user?.messagesUsed || 0;

// //     if (used >= limit) {
// //       return NextResponse.json(
// //         {
// //           success: false,
// //           error: `Message limit reached for ${planId} plan. Upgrade to continue.`,
// //         },
// //         { status: 429 },
// //       );
// //     }
// //     // ── End limit check ───────────────────────────────────────────────────

// //     // Parse request body
// //     let body;
// //     try {
// //       body = await request.json();
// //     } catch {
// //       return NextResponse.json(
// //         { success: false, error: "Invalid request body" },
// //         { status: 400 },
// //       );
// //     }

// //     const { sessionId, message, context } = body;

// //     if (!sessionId || !message?.trim()) {
// //       return NextResponse.json(
// //         { success: false, error: "sessionId and message are required" },
// //         { status: 400 },
// //       );
// //     }

// //     // ── Find chat session ──────────────────────────────────────────────────
// //     const chatSession = await ChatHistory.findOne({
// //       sessionId,
// //       user: session.user.id,
// //     });

// //     if (!chatSession) {
// //       return NextResponse.json(
// //         { success: false, error: "Chat session not found" },
// //         { status: 404 },
// //       );
// //     }

// //     // ── Step 1: Retrieve relevant chunks from uploaded documents ───────────
// //     const retrievalContext = context || chatSession.context || {};

// //     let contextText = null;
// //     let sources = [];

// //     try {
// //       const chunks = await retrieveRelevantChunks(
// //         message,
// //         {
// //           branch: retrievalContext.branch || retrievalContext.branchId,
// //           semester: retrievalContext.semester,
// //           subject: retrievalContext.subject || retrievalContext.subjectId,
// //         },
// //         5,
// //       );

// //       if (chunks.length > 0) {
// //         // Build context string from top chunks
// //         contextText = chunks
// //           .map(
// //             (chunk, i) =>
// //               `[Source ${i + 1}: ${chunk.source.title}]\n${chunk.text}`,
// //           )
// //           .join("\n\n");

// //         // Build sources array for response
// //         sources = chunks.map((chunk) => ({
// //           title: chunk.source.title,
// //           subject: chunk.source.subject,
// //           pageNumber: chunk.source.pageNumber,
// //           relevance: Math.round(chunk.score * 100),
// //         }));
// //       }
// //     } catch (retrievalError) {
// //       // Retrieval failure should not stop the chat
// //       console.warn(
// //         "[chat/message] Retrieval failed (non-fatal):",
// //         retrievalError.message,
// //       );
// //     }

// //     // ── Step 2: Build chat history for context ─────────────────────────────
// //     const recentMessages = chatSession.messages
// //       .slice(-10) // last 10 messages for context window
// //       .map((msg) => ({
// //         role: msg.role,
// //         content: msg.content,
// //       }));

// //     // Add current user message
// //     const messages = [...recentMessages, { role: "user", content: message }];

// //     // ── Step 3: Generate response via Groq ────────────────────────────────
// //     const aiResponse = await generateChatCompletion(messages, contextText);

// //     // ── Step 4: Save both messages to chat history ────────────────────────
// //     const userMessage = {
// //       role: "user",
// //       content: message,
// //       timestamp: new Date(),
// //     };

// //     const assistantMessage = {
// //       role: "assistant",
// //       content: aiResponse,
// //       timestamp: new Date(),
// //       metadata: {
// //         sources,
// //         responseTime: Date.now() - startTime,
// //         hasContext: !!contextText,
// //       },
// //     };

// //     chatSession.messages.push(userMessage, assistantMessage);
// //     chatSession.totalMessages = (chatSession.totalMessages || 0) + 2;
// //     chatSession.lastActivity = new Date();

// //     // Auto-generate title from first message
// //     if (
// //       (!chatSession.title || chatSession.title === "New Chat") &&
// //       chatSession.totalMessages <= 2
// //     ) {
// //       chatSession.title =
// //         message.substring(0, 50) + (message.length > 50 ? "..." : "");
// //     }

// //     await chatSession.save();
// //     // ✅ ADD THIS — increment user's message count
// //     // const User = (await import("@/lib/db/models/User")).default;
// //     await User.findByIdAndUpdate(session.user.id, {
// //       $inc: { messagesUsed: 1 },
// //     });

// //     // ── Step 5: Return response ───────────────────────────────────────────
// //     return NextResponse.json({
// //       success: true,
// //       response: aiResponse,
// //       sources,
// //       metadata: {
// //         hasContext: !!contextText,
// //         responseTime: Date.now() - startTime,
// //       },
// //     });
// //   } catch (error) {
// //     console.error("[chat/message] Error:", error.message);

// //     // Groq rate limit
// //     if (error.message?.includes("Rate limit")) {
// //       return NextResponse.json(
// //         { success: false, error: "Too many requests. Please wait a moment." },
// //         { status: 429 },
// //       );
// //     }

// //     return NextResponse.json(
// //       { success: false, error: "Failed to process message: " + error.message },
// //       { status: 500 },
// //     );
// //   }
// // }
// // src/app/api/chat/message/route.js - MODIFY retrieval section
// import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth/authOptions";
// import connectDB from "@/lib/db/mongodb";
// import ChatHistory from "@/lib/db/models/ChatHistory";
// import EmbeddingChunk from "@/lib/db/models/EmbeddingChunk";
// import { generateChatCompletion } from "@/lib/ai/chatCompletion";
// import { retrieveDiagrams } from "@/lib/ai/diagramRetrieval";
// import { analyzeQuestionFrequency } from "@/lib/ai/pyqAnalytics";

// export async function POST(request) {
//   const startTime = Date.now();

//   try {
//     const session = await getServerSession(authOptions);
//     if (!session) {
//       return NextResponse.json(
//         { success: false, error: "Unauthorized" },
//         { status: 401 },
//       );
//     }

//     await connectDB();

//     // ── Check message limit ────────────────────────────────────────────────
//     const User = (await import("@/lib/db/models/User")).default;
//     const user = await User.findById(session.user.id).select("subscription messagesUsed");

//     const now = new Date();
//     const sub = user?.subscription;
//     const isActiveSub = sub?.status === "active" && sub?.endDate && new Date(sub.endDate) > now;
//     const planId = isActiveSub ? sub.plan : "free";

//     const LIMITS = { free: 15, plus: 200, pro: 600, ranker: 2000 };
//     const limit = LIMITS[planId] || 15;
//     const used = user?.messagesUsed || 0;

//     if (used >= limit) {
//       return NextResponse.json(
//         { success: false, error: `Message limit reached for ${planId} plan. Upgrade to continue.` },
//         { status: 429 },
//       );
//     }

//     let body;
//     try {
//       body = await request.json();
//     } catch {
//       return NextResponse.json(
//         { success: false, error: "Invalid request body" },
//         { status: 400 },
//       );
//     }

//     const { sessionId, message, context } = body;

//     if (!sessionId || !message?.trim()) {
//       return NextResponse.json(
//         { success: false, error: "sessionId and message are required" },
//         { status: 400 },
//       );
//     }
//       // ✅ CHECK FOR DIAGRAM QUERY FIRST
//   const diagramResult = await retrieveDiagrams(message, context);
  
//   if (diagramResult.isDiagramQuery && diagramResult.diagrams.length > 0) {
//     // Return diagram response
//     const diagramResponse = formatDiagramResponse(diagramResult.diagrams);
    
//     return NextResponse.json({
//       success: true,
//       response: diagramResponse.text,
//       diagrams: diagramResult.diagrams, // ✅ Return image URLs
//       metadata: {
//         isDiagramResponse: true,
//         diagramCount: diagramResult.diagrams.length
//       }
//     });
//   }

//     // 2. ✅ Analyze PYQ frequency
//   let frequencyAnalysis = null;
//   if (context.subject && context.semester && context.branch) {
//     try {
//       frequencyAnalysis = await analyzeQuestionFrequency(message, context);
//     } catch (err) {
//       console.warn('[chat/message] PYQ analysis failed:', err);
//     }
//   }

//     // ── Find chat session ──────────────────────────────────────────────────
//     const chatSession = await ChatHistory.findOne({
//       sessionId,
//       user: session.user.id,
//     });

//     if (!chatSession) {
//       return NextResponse.json(
//         { success: false, error: "Chat session not found" },
//         { status: 404 },
//       );
//     }

//     // ── MODIFIED: Retrieve relevant chunks ─────────────────────────────────
//     let contextText = null;
//     let sources = [];

//     try {
//       // ✅ FIRST: Try to find user-uploaded chunks for this session
//       const userChunks = await EmbeddingChunk.find({
//         $text: { $search: message },
//         sessionId: sessionId,
//         isUserUpload: true,
//         uploadedBy: session.user.id,
//       })
//         .sort({ score: { $meta: 'textScore' } })
//         .limit(5)
//         .lean();

//       if (userChunks.length > 0) {
//         // ✅ User has uploaded a document - use ONLY those chunks
//         console.log(`[chat/message] Found ${userChunks.length} chunks from user-uploaded document`);
        
//         contextText = userChunks
//           .map((chunk, i) => `[Source ${i + 1}: ${chunk.documentTitle}]\n${chunk.text}`)
//           .join('\n\n');

//         sources = userChunks.map((chunk) => ({
//           title: chunk.documentTitle,
//           subject: 'Your uploaded document',
//           relevance: Math.round((chunk.score || 1) * 100),
//         }));

//       } else {
//         // ✅ No user document - fall back to admin-uploaded documents
//         const retrievalContext = context || chatSession.context || {};
        
//         const adminChunks = await EmbeddingChunk.find({
//           $text: { $search: message },
//           isUserUpload: { $ne: true }, // Only admin documents
//           ...(retrievalContext.branch && { branch: retrievalContext.branch }),
//           ...(retrievalContext.semester && { semester: retrievalContext.semester }),
//           ...(retrievalContext.subject && { subject: retrievalContext.subject }),
//         })
//           .sort({ score: { $meta: 'textScore' } })
//           .limit(5)
//           .lean();

//         if (adminChunks.length > 0) {
//           console.log(`[chat/message] Found ${adminChunks.length} chunks from admin documents`);
          
//           contextText = adminChunks
//             .map((chunk, i) => `[Source ${i + 1}: ${chunk.documentTitle}]\n${chunk.text}`)
//             .join('\n\n');

//           sources = adminChunks.map((chunk) => ({
//             title: chunk.documentTitle,
//             subject: chunk.subject,
//             relevance: Math.round((chunk.score || 1) * 100),
//           }));
//         }
//       }
//     } catch (retrievalError) {
//       console.warn("[chat/message] Retrieval failed (non-fatal):", retrievalError.message);
//     }

//      // 4. Build context with frequency info
//   let systemPrompt = contextText;
  
//   if (frequencyAnalysis && frequencyAnalysis.frequency > 0) {
//     systemPrompt += `\n\n[PYQ FREQUENCY ANALYSIS]
// This question appears ${frequencyAnalysis.totalOccurrences} times across ${frequencyAnalysis.years.length} years.
// Frequency: ${frequencyAnalysis.frequency}% (${frequencyAnalysis.analysisSpan})
// Importance: ${frequencyAnalysis.importance}
// Average Marks: ${frequencyAnalysis.averageMarks}

// Mention this frequency data naturally in your answer.`;
//   }
  
//   // 5. Generate AI response
//   const aiResponse = await generateChatCompletion(messages, systemPrompt);
  
//   // 6. Return with frequency metadata
//   return NextResponse.json({
//     success: true,
//     response: aiResponse,
//     sources,
//     frequency: frequencyAnalysis, // ✅ Include frequency data
//     metadata: {
//       hasContext: !!contextText,
//       hasFrequencyData: !!frequencyAnalysis,
//       responseTime: Date.now() - startTime
//     }
//   });
// }

//     // ── Step 2: Build chat history for context ─────────────────────────────
//     const recentMessages = chatSession.messages
//       .slice(-10)
//       .map((msg) => ({
//         role: msg.role,
//         content: msg.content,
//       }));

//     const messages = [...recentMessages, { role: "user", content: message }];

//     // ── Step 3: Generate response via Groq ────────────────────────────────
//     const aiResponse = await generateChatCompletion(messages, contextText);

//     // ── Step 4: Save messages ──────────────────────────────────────────────
//     const userMessage = {
//       role: "user",
//       content: message,
//       timestamp: new Date(),
//     };

//     const assistantMessage = {
//       role: "assistant",
//       content: aiResponse,
//       timestamp: new Date(),
//       metadata: {
//         sources,
//         responseTime: Date.now() - startTime,
//         hasContext: !!contextText,
//       },
//     };

//     chatSession.messages.push(userMessage, assistantMessage);
//     chatSession.totalMessages = (chatSession.totalMessages || 0) + 2;
//     chatSession.lastActivity = new Date();

//     if ((!chatSession.title || chatSession.title === "New Chat") && chatSession.totalMessages <= 2) {
//       chatSession.title = message.substring(0, 50) + (message.length > 50 ? "..." : "");
//     }

//     await chatSession.save();
//     await User.findByIdAndUpdate(session.user.id, { $inc: { messagesUsed: 1 } });

//     // ── Step 5: Return response ───────────────────────────────────────────
//     return NextResponse.json({
//       success: true,
//       response: aiResponse,
//       sources,
//       metadata: {
//         hasContext: !!contextText,
//         responseTime: Date.now() - startTime,
//       },
//     });
//   } catch (error) {
//     console.error("[chat/message] Error:", error.message);

//     if (error.message?.includes("Rate limit")) {
//       return NextResponse.json(
//         { success: false, error: "Too many requests. Please wait a moment." },
//         { status: 429 },
//       );
//     }

//     return NextResponse.json(
//       { success: false, error: "Failed to process message: " + error.message },
//       { status: 500 },
//     );
//   }
// }

// function formatDiagramResponse(diagrams) {
//   if (diagrams.length === 1) {
//     const d = diagrams[0];
//     return {
//       text: `Here is ${d.figureNumber || 'the diagram'} from ${d.documentTitle} (Page ${d.pageNumber}):\n\n${d.caption || 'Diagram extracted from textbook'}`,
//       images: diagrams
//     };
//   } else {
//     const text = `I found ${diagrams.length} relevant diagrams:\n\n` +
//       diagrams.map((d, i) => 
//         `${i+1}. ${d.figureNumber || `Diagram ${i+1}`} - ${d.documentTitle} (Page ${d.pageNumber})`
//       ).join('\n');
    
//     return { text, images: diagrams };
//   }
// }

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongodb";
import ChatHistory from "@/lib/db/models/ChatHistory";
import EmbeddingChunk from "@/lib/db/models/EmbeddingChunk";
import { generateChatCompletion } from "@/lib/ai/chatCompletion";
import { retrieveDiagrams } from "@/lib/ai/diagramRetrieval";
import { analyzeQuestionFrequency } from "@/lib/ai/pyqAnalytics";

export async function POST(request) {
  const startTime = Date.now();

  try {
    // ══════════════════════════════════════════════════════════════════════
    // STEP 1: Authentication Check
    // ══════════════════════════════════════════════════════════════════════
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // ══════════════════════════════════════════════════════════════════════
    // STEP 2: Check Message Limit
    // ══════════════════════════════════════════════════════════════════════
    const User = (await import("@/lib/db/models/User")).default;
    const user = await User.findById(session.user.id).select("subscription messagesUsed");

    const now = new Date();
    const sub = user?.subscription;
    const isActiveSub = sub?.status === "active" && sub?.endDate && new Date(sub.endDate) > now;
    const planId = isActiveSub ? sub.plan : "free";

    const LIMITS = { free: 15, plus: 200, pro: 600, ranker: 2000 };
    const limit = LIMITS[planId] || 15;
    const used = user?.messagesUsed || 0;

    if (used >= limit) {
      return NextResponse.json(
        { success: false, error: `Message limit reached for ${planId} plan. Upgrade to continue.` },
        { status: 429 }
      );
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 3: Parse Request Body
    // ══════════════════════════════════════════════════════════════════════
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { sessionId, message, context } = body;

    if (!sessionId || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: "sessionId and message are required" },
        { status: 400 }
      );
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 4: Find Chat Session
    // ══════════════════════════════════════════════════════════════════════
    const chatSession = await ChatHistory.findOne({
      sessionId,
      user: session.user.id,
    });

    if (!chatSession) {
      return NextResponse.json(
        { success: false, error: "Chat session not found" },
        { status: 404 }
      );
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 5: Check for Diagram Query (Priority Check)
    // ══════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════
// STEP 5: Check for Diagram Query (PURE IMAGE RETURN - NO LLM)
// ══════════════════════════════════════════════════════════════════════

const diagramResult = await retrieveDiagrams(message, {
  ...context,
  ...(context || chatSession.context || {}),
  sessionId,
  userId: session.user.id,
});

// ✅ ADD THIS DEBUG BLOCK:
console.log('═══════════════════════════════════════════════════════════');
console.log('🔍 DIAGRAM RETRIEVAL DEBUG');
console.log('═══════════════════════════════════════════════════════════');
console.log('User Query:', message);
console.log('Session ID:', sessionId);
console.log('User ID:', session.user.id);
console.log('Context:', JSON.stringify(context, null, 2));
console.log('-----------------------------------------------------------');
console.log('Result - Is Diagram Query:', diagramResult.isDiagramQuery);
console.log('Result - Diagrams Found:', diagramResult.diagrams?.length || 0);
if (diagramResult.diagrams && diagramResult.diagrams.length > 0) {
  console.log('First Diagram Details:');
  console.log('  - Image URL:', diagramResult.diagrams[0].imageUrl);
  console.log('  - Figure Number:', diagramResult.diagrams[0].figureNumber);
  console.log('  - Caption:', diagramResult.diagrams[0].caption);
  console.log('  - Page:', diagramResult.diagrams[0].pageNumber);
  console.log('  - Document:', diagramResult.diagrams[0].documentTitle);
} else {
  console.log('❌ NO DIAGRAMS FOUND!');
}
console.log('═══════════════════════════════════════════════════════════\n');

console.log('[chat/message] Diagram detection:', {
  isDiagramQuery: diagramResult.isDiagramQuery,
  diagramCount: diagramResult.diagrams?.length || 0,
  query: message
});

if (diagramResult.isDiagramQuery) {
  // ✅ NO DIAGRAMS FOUND
  if (!diagramResult.diagrams || diagramResult.diagrams.length === 0) {
    const userMessage = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    const assistantMessage = {
      role: "assistant",
      content: "I couldn't find that specific diagram in the uploaded materials. Could you please provide more details about which figure you're looking for?",
      timestamp: new Date(),
      metadata: {
        isDiagramResponse: true,
        diagrams: [],
        responseTime: Date.now() - startTime,
      },
    };

    chatSession.messages.push(userMessage, assistantMessage);
    chatSession.totalMessages = (chatSession.totalMessages || 0) + 2;
    chatSession.lastActivity = new Date();
    await chatSession.save();
    await User.findByIdAndUpdate(session.user.id, { $inc: { messagesUsed: 1 } });

    return NextResponse.json({
      success: true,
      response: assistantMessage.content,
      diagrams: [],
      metadata: {
        isDiagramResponse: true,
        diagramCount: 0,
        responseTime: Date.now() - startTime,
      },
    });
  }

  // ✅ DIAGRAMS FOUND - Return PURE image response
  const userMessage = {
    role: "user",
    content: message,
    timestamp: new Date(),
  };

  // Build caption from diagram metadata
  const diagramCaptions = diagramResult.diagrams.map((d, i) => {
    if (diagramResult.diagrams.length === 1) {
      return `${d.figureNumber || 'Diagram'} from ${d.documentTitle} (Page ${d.pageNumber})`;
    }
    return `${i + 1}. ${d.figureNumber || `Diagram ${i + 1}`} - ${d.documentTitle} (Page ${d.pageNumber})`;
  }).join('\n');

  const assistantMessage = {
    role: "assistant",
    content: diagramCaptions, // ✅ Just caption, NO ASCII art
    timestamp: new Date(),
    metadata: {
      isDiagramResponse: true,
      diagrams: diagramResult.diagrams, // ✅ Array of {imageUrl, figureNumber, caption, pageNumber, documentTitle}
      responseTime: Date.now() - startTime,
    },
  };

  chatSession.messages.push(userMessage, assistantMessage);
  chatSession.totalMessages = (chatSession.totalMessages || 0) + 2;
  chatSession.lastActivity = new Date();
  await chatSession.save();
  await User.findByIdAndUpdate(session.user.id, { $inc: { messagesUsed: 1 } });

  console.log('[chat/message] Returning diagram response:', {
    diagramCount: diagramResult.diagrams.length,
    diagrams: diagramResult.diagrams.map(d => ({ imageUrl: d.imageUrl, figureNumber: d.figureNumber }))
  });

  return NextResponse.json({
    success: true,
    response: diagramCaptions,
    diagrams: diagramResult.diagrams, // ✅ CRITICAL: Return diagram objects with imageUrl
    metadata: {
      isDiagramResponse: true,
      diagramCount: diagramResult.diagrams.length,
      responseTime: Date.now() - startTime,
    },
  });
}
    // ══════════════════════════════════════════════════════════════════════
    // STEP 6: Analyze PYQ Frequency (Background Analysis)
    // ══════════════════════════════════════════════════════════════════════
    let frequencyAnalysis = null;
    const effectiveContext = context || chatSession.context || {};
    
    if (effectiveContext.subject && effectiveContext.semester && effectiveContext.branch) {
      try {
        frequencyAnalysis = await analyzeQuestionFrequency(message, effectiveContext);
      } catch (err) {
        console.warn("[chat/message] PYQ analysis failed:", err.message);
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 7: Retrieve RAG Chunks (User Uploads OR Admin Documents)
    // ══════════════════════════════════════════════════════════════════════
    let contextText = null;
    let sources = [];

    try {
      // ✅ PRIORITY 1: Check for user-uploaded documents in this session
      const userChunks = await EmbeddingChunk.find({
        $text: { $search: message },
        sessionId: sessionId,
        isUserUpload: true,
        uploadedBy: session.user.id,
      })
        .sort({ score: { $meta: "textScore" } })
        .limit(5)
        .lean();

      if (userChunks.length > 0) {
        // ✅ User has uploaded a document - use ONLY those chunks
        console.log(`[chat/message] Found ${userChunks.length} chunks from user-uploaded document`);

        contextText = userChunks
          .map((chunk, i) => `[Source ${i + 1}: ${chunk.documentTitle}]\n${chunk.text}`)
          .join("\n\n");

        sources = userChunks.map((chunk) => ({
          title: chunk.documentTitle,
          subject: "Your uploaded document",
          relevance: Math.round((chunk.score || 1) * 100),
        }));
      } else {
        // ✅ PRIORITY 2: Fall back to admin-uploaded documents
        const adminChunks = await EmbeddingChunk.find({
          $text: { $search: message },
          isUserUpload: { $ne: true },
          ...(effectiveContext.branch && { branch: effectiveContext.branch }),
          ...(effectiveContext.semester && { semester: effectiveContext.semester }),
          ...(effectiveContext.subject && { subject: effectiveContext.subject }),
        })
          .sort({ score: { $meta: "textScore" } })
          .limit(5)
          .lean();

        if (adminChunks.length > 0) {
          console.log(`[chat/message] Found ${adminChunks.length} chunks from admin documents`);

          contextText = adminChunks
            .map((chunk, i) => `[Source ${i + 1}: ${chunk.documentTitle}]\n${chunk.text}`)
            .join("\n\n");

          sources = adminChunks.map((chunk) => ({
            title: chunk.documentTitle,
            subject: chunk.subject,
            relevance: Math.round((chunk.score || 1) * 100),
          }));
        }
      }
    } catch (retrievalError) {
      console.warn("[chat/message] Retrieval failed (non-fatal):", retrievalError.message);
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 8: Build System Prompt with Context + Frequency Data
    // ══════════════════════════════════════════════════════════════════════
    let systemPrompt = contextText || "";

    if (frequencyAnalysis && frequencyAnalysis.frequency > 0) {
      systemPrompt += `\n\n[PYQ FREQUENCY ANALYSIS]
This question appears ${frequencyAnalysis.totalOccurrences} times across ${frequencyAnalysis.years.length} years.
Frequency: ${frequencyAnalysis.frequency}% (${frequencyAnalysis.analysisSpan})
Importance: ${frequencyAnalysis.importance}
Average Marks: ${frequencyAnalysis.averageMarks}

Mention this frequency data naturally in your answer.`;
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 9: Build Chat History + Generate AI Response
    // ══════════════════════════════════════════════════════════════════════
    const recentMessages = chatSession.messages.slice(-10).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const messages = [...recentMessages, { role: "user", content: message }];

    const aiResponse = await generateChatCompletion(messages, systemPrompt);

    // ══════════════════════════════════════════════════════════════════════
    // STEP 10: Save Messages to Chat History
    // ══════════════════════════════════════════════════════════════════════
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
        hasFrequencyData: !!frequencyAnalysis,
      },
    };

    chatSession.messages.push(userMessage, assistantMessage);
    chatSession.totalMessages = (chatSession.totalMessages || 0) + 2;
    chatSession.lastActivity = new Date();

    // Auto-generate title from first message
    if ((!chatSession.title || chatSession.title === "New Chat") && chatSession.totalMessages <= 2) {
      chatSession.title = message.substring(0, 50) + (message.length > 50 ? "..." : "");
    }

    await chatSession.save();
    await User.findByIdAndUpdate(session.user.id, { $inc: { messagesUsed: 1 } });

    // ══════════════════════════════════════════════════════════════════════
    // STEP 11: Return Final Response
    // ══════════════════════════════════════════════════════════════════════
    return NextResponse.json({
      success: true,
      response: aiResponse,
      sources,
      frequency: frequencyAnalysis,
      metadata: {
        hasContext: !!contextText,
        hasFrequencyData: !!frequencyAnalysis,
        responseTime: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error("[chat/message] Error:", error.message);

    if (error.message?.includes("Rate limit")) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to process message: " + error.message },
      { status: 500 }
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ══════════════════════════════════════════════════════════════════════════

function formatDiagramResponse(diagrams) {
  if (diagrams.length === 1) {
    const d = diagrams[0];
    return {
      text: `Here is ${d.figureNumber || "the diagram"} from ${d.documentTitle} (Page ${d.pageNumber}):\n\n${d.caption || "Diagram extracted from textbook"}`,
      images: diagrams,
    };
  } else {
    const text =
      `I found ${diagrams.length} relevant diagrams:\n\n` +
      diagrams.map((d, i) => `${i + 1}. ${d.figureNumber || `Diagram ${i + 1}`} - ${d.documentTitle} (Page ${d.pageNumber})`).join("\n");

    return { text, images: diagrams };
  }
}