"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ChatNavbar from "@/components/ChatNavbar";
import LoadingDots from "@/components/LoadingDots";
import ChatInput from "@/components/ChatInput";
import ChatMessageList, {
  type ChatMessage,
} from "@/components/ChatMessageList";

type DBMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  messages: DBMessage[];
  hasMore: boolean;
};

export default function Home() {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const { data: session } = useSession();
  const router = useRouter();

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const isLoading =
    status === "submitted" ||
    (status === "streaming" &&
      messages[messages.length - 1]?.role !== "assistant");

  // Check onboarding
  useEffect(() => {
    const checkOnboarded = async () => {
      if (!session?.user?.id) return;
      const res = await fetch("/api/me");
      const data = await res.json();
      console.log("the onboarding detail", data);
      if (!data.onboarded) {
        router.push("/onboarding");
      }
    };
    checkOnboarded();
  }, [session, router]);

  // Load initial conversation
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const response = await fetch("/api/conversation?page=1&limit=20");
        const data: Conversation = await response.json();

        setConversationId(data.id);
        setHasMore(data.hasMore);

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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load more messages when scrolled to top
  const loadMoreMessages = async () => {
    if (isFetchingMore || !hasMore || !conversationId) return;
    setIsFetchingMore(true);

    const container = mainRef.current;
    const previousScrollHeight = container?.scrollHeight ?? 0;

    try {
      const nextPage = page + 1;
      const response = await fetch(
        `/api/conversation?page=${nextPage}&limit=20`,
      );
      const data = await response.json();

      setHasMore(data.hasMore);
      setPage(nextPage);

      if (data?.messages.length > 0) {
        setMessages((prev) => [
          ...data?.messages.map((m: DBMessage) => ({
            id: m.id,
            role: m.role === "USER" ? "user" : "assistant",
            content: m.content,
            parts: [{ type: "text" as const, text: m.content }],
          })),
          ...prev,
        ]);

        // Restore scroll position after prepending
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - previousScrollHeight;
          }
        });
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setIsFetchingMore(false);
    }
  };

  // Scroll listener
  useEffect(() => {
    const container = mainRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop === 0 && hasMore && !isFetchingMore) {
        loadMoreMessages();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, isFetchingMore, page, conversationId]);

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
    <div className="flex h-screen flex-col bg-gray-950 text-gray-100">
      <ChatNavbar />

      {/* This fills remaining space and scrolls internally */}
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6 min-h-0"
      >
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Loading more indicator at top */}
          {isFetchingMore && (
            <div className="flex justify-center py-3">
              <div className="flex gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}

          {hasMore && !isFetchingMore && (
            <div className="flex justify-center py-2">
              <button
                onClick={loadMoreMessages}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Load earlier messages
              </button>
            </div>
          )}

          {messages.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <p className="text-center text-gray-500 text-sm">
                Hi, I am your AI Twin. Start talking to me.
              </p>
            </div>
          )}

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
