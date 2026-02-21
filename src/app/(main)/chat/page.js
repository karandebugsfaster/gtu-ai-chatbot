// This is main chat page.js
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ChatMessage, { TypingIndicator } from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/InputBox";
import WelcomeScreen from "@/components/chat/WelcomeScreen";
import toast from "react-hot-toast";

function ChatContent() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(() => {
    if (typeof window !== 'undefined' && sessionId) {
      const saved = localStorage.getItem(`uploadedFile_${sessionId}`);
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    if (sessionId && session) {
      loadChatHistory(sessionId);
    }
  }, [sessionId, session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
    // ✅ Save uploadedFile to localStorage whenever it changes
  useEffect(() => {
    if (sessionId && uploadedFile) {
      localStorage.setItem(`uploadedFile_${sessionId}`, JSON.stringify(uploadedFile));
    }
  }, [uploadedFile, sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatHistory = async (sid) => {
    try {
      const response = await fetch(`/api/chat/history?sessionId=${sid}`);
      const data = await response.json();

      if (data.success && data.chat) {
        setMessages(data.chat.messages || []);
        setCurrentSessionId(sid);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  //  // ✅ ADD: Handle file upload
  // const handleFileUpload = async (file) => {
  //   try {
  //     const formData = new FormData();
  //     formData.append('file', file);
  //     formData.append('sessionId', currentSessionId);

  //     const response = await fetch('/api/chat/upload', {
  //       method: 'POST',
  //       body: formData,
  //     });

  //     const data = await response.json();

  //     if (data.success) {
  //       setUploadedFile({
  //         fileName: data.fileName,
  //         documentId: data.documentId,
  //         stats: data.stats,
  //       });

  //       // Show success message
  //       alert(`PDF uploaded successfully! ${data.stats.savedChunks} chunks created. You can now ask questions from this document.`);
  //     } else {
  //       throw new Error(data.error || 'Upload failed');
  //     }
  //   } catch (error) {
  //     console.error('Upload error:', error);
  //     throw error;
  //   }
  // };

  // In ChatContent (page.js) - Update handleFileUpload
const handleFileUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", currentSessionId);

      const uploadResponse = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.success) {
        // ✅ Set uploaded file immediately (will trigger localStorage save via useEffect)
        const fileData = {
          fileName: uploadData.fileName,
          documentId: uploadData.documentId,
          stats: uploadData.stats,
        };
        
        setUploadedFile(fileData);
        
        toast.success(
          `PDF uploaded! ${uploadData.stats.savedChunks} chunks + ${uploadData.stats.diagramCount || 0} diagrams extracted.`
        );
      } else {
        throw new Error(uploadData.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message);
      throw error;
    }
  };

  // ✅ ADD: Remove uploaded file
  // ✅ Clear uploadedFile from localStorage when removed
  const handleRemoveFile = async () => {
    if (confirm('Remove uploaded document? You will switch back to general questions.')) {
      setUploadedFile(null);
      if (sessionId) {
        localStorage.removeItem(`uploadedFile_${sessionId}`);
      }
    }
  };

  const handleSendMessage = async (message, context) => {
    if (!message.trim()) return;

    if (!session) {
      toast.error("Please sign in to use the chat feature");
      router.push("/signin");
      return;
    }

    let sid = currentSessionId;
    if (!sid) {
      try {
        const response = await fetch("/api/chat/new-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context }),
        });
        const data = await response.json();
        if (data.success) {
          sid = data.sessionId;
          setCurrentSessionId(sid);
        }
      } catch (error) {
        toast.error("Failed to create chat session");
        return;
      }
    }

    const userMessage = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sid,
          message,
          context,
        }),
      });

      const data = await response.json();

    if (data.success) {
  const assistantMessage = {
    role: "assistant",
    content: data.response,
    timestamp: new Date(),
    metadata: {
      sources: data.sources || [],
      hasContext: data.metadata?.hasContext || false,
      diagrams: data.diagrams || [],   // ✅ ADD THIS
    },
  };
        setMessages((prev) => [...prev, assistantMessage]);

        // ✅ Tell SubscriptionBadge to refresh message count
        window.dispatchEvent(new Event("gtu:message-sent"));
      } else {
        toast.error(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  // ✅ ADD THIS — don't render until session is confirmed
  if (status === "loading") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "#6b7280",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomeScreen
            onSendMessage={handleSendMessage}
            isAuthenticated={!!session}
          />
        ) : (
          <div className="max-w-8xl mx-auto px-4">
            {messages.map((msg, i) => (
              <div key={i} className="message-group">
                <ChatMessage message={msg} isLast={i === messages.length - 1} />
              </div>
            ))}
            {/* // Show while loading: */}
            {loading && <TypingIndicator />}
            {loading && (
              <div className="py-8">
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 rounded-sm bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      

      {/* Input Box */}
      {/* <ChatInput onSendMessage={handleSendMessage} disabled={loading} /> */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onFileUpload={handleFileUpload}
        onRemoveFile={handleRemoveFile}
        uploadedFileName={uploadedFile?.fileName}
        disabled={loading} // ✅ Use 'loading' which is defined at line 15
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          Loading...
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
