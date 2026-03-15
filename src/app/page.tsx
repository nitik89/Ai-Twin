"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ChatNavbar from "@/components/ChatNavbar";
import LoadingDots from "@/components/LoadingDots";
import ChatMessageList, { type ChatMessage } from "@/components/ChatMessageList";
import ChatInput from "@/components/ChatInput";

type DBMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  messages: DBMessage[];
};

export default function Home() {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const response = await fetch("/api/conversation");
        const data: Conversation = await response.json();

        setConversationId(data.id);

        if (data.messages.length > 0) {
          setMessages(
            data.messages.map((m) => ({
              id: m.id,
              role: m.role === "USER" ? "user" : "assistant",
              content: m.content,
              parts: [{ type: "text" as const, text: m.content }],
            })),
          );
        }
      } catch (error) {
        console.error("Failed to load conversation:", error);
      } finally {
        setIsLoadingConversation(false);
      }
    };

    fetchConversation();
  }, [setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !conversationId) return;
    await sendMessage({
      text: inputValue,
      metadata: { conversationId },
    });
    setInputValue("");
  };

  if (isLoadingConversation) {
    return <LoadingDots />;
  }

  const chatMessages: ChatMessage[] = messages.map((m) => ({
    id: m.id,
    role: m.role,
    parts: m.parts ?? [],
  }));

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-gray-100">
      <ChatNavbar />

      <main className="flex-1 overflow-y-auto scroll-smooth px-3 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto flex h-full max-w-2xl flex-col justify-end">
          <ChatMessageList
            messages={chatMessages}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
          />
        </div>
      </main>

      <ChatInput
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSubmit={handleSend}
        isLoading={isLoading}
      />
    </div>
  );
}
