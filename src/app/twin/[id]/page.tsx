"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type TwinUser = {
  id: string;
  name: string;
  username: string;
  image: string;
  readinessScore: number;
};

type DBMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
};

export default function TwinChatPage() {
  const params = useParams();
  const friendId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [twinUser, setTwinUser] = useState<TwinUser | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/twin-chat",
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    const init = async () => {
      try {
        const [convRes, userRes] = await Promise.all([
          fetch(`/api/twin-chat?friendId=${friendId}`),
          fetch(`/api/users/${friendId}`),
        ]);

        const convData = await convRes.json();
        const userData = await userRes.json();

        setConversationId(convData.id);
        setTwinUser(userData.user);

        if (convData.messages?.length > 0) {
          setMessages(
            convData.messages.map((m: DBMessage) => ({
              id: m.id,
              role: m.role === "USER" ? "user" : "assistant",
              content: m.content,
              parts: [{ type: "text" as const, text: m.content }],
            })),
          );
        }
      } catch (err) {
        console.error("Failed to init twin chat:", err);
      } finally {
        setIsLoadingPage(false);
      }
    };
    init();
  }, [friendId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !conversationId) return;
    await sendMessage({
      text: inputValue,
      metadata: { conversationId, friendId },
    });
    setInputValue("");
  };

  if (isLoadingPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="flex gap-2">
          <span
            className="h-2 w-2 rounded-full bg-purple-500 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-2 w-2 rounded-full bg-purple-500 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="h-2 w-2 rounded-full bg-purple-500 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-gray-800 px-4 py-3 sm:px-6 flex-shrink-0">
        <Link
          href="/friends"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>

        {twinUser?.image ? (
          <Image
            src={twinUser.image}
            alt={twinUser.name}
            width={36}
            height={36}
            className="rounded-full"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-amber-600 flex items-center justify-center text-xs font-semibold">
            {twinUser?.name?.[0] ?? "?"}
          </div>
        )}

        <div className="flex-1">
          <p className="text-sm font-semibold text-white">
            {twinUser?.name}&apos;s Twin
          </p>
          <p className="text-xs text-gray-400">@{twinUser?.username}</p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">Readiness</p>
          <p className="text-sm font-semibold text-purple-400">
            {twinUser?.readinessScore}%
          </p>
        </div>
      </header>

      {/* Warning banner */}
      <div className="bg-amber-950/40 border-b border-amber-800/30 px-4 py-2 text-center flex-shrink-0">
        <p className="text-xs text-amber-400">
          You are chatting with{" "}
          <span className="font-semibold">{twinUser?.name}&apos;s AI twin</span>{" "}
          — not the real person
        </p>
      </div>

      {/* Messages — fills remaining space, scrolls internally */}
      <main
        ref={messagesEndRef}
        className="flex-1 overflow-y-auto min-h-0 px-3 py-4 sm:px-6 sm:py-6"
      >
        <div className="mx-auto max-w-2xl space-y-6">
          {messages.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  Start a conversation with {twinUser?.name}&apos;s twin
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Responses are AI generated based on their personality
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id}>
              {message.role === "user" ? (
                <div className="flex justify-end gap-3">
                  <div className="flex max-w-[75%] flex-col items-end">
                    <div className="rounded-2xl rounded-br-sm bg-purple-600 px-4 py-3 text-sm leading-relaxed text-white shadow-lg shadow-purple-900/30">
                      {message.parts
                        .filter((p) => p.type === "text")
                        .map((p, i) =>
                          p.type === "text" ? (
                            <span key={i}>{p.text}</span>
                          ) : null,
                        )}
                    </div>
                    <span className="mt-1 text-xs text-gray-500">
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600/20 text-[10px] font-semibold text-purple-200">
                    You
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 ml-4">
                  {twinUser?.image ? (
                    <Image
                      src={twinUser.image}
                      alt={twinUser.name}
                      width={32}
                      height={32}
                      className="rounded-full opacity-80"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600/20 text-[10px] font-semibold text-amber-200">
                      {twinUser?.name?.[0] ?? "T"}
                    </div>
                  )}
                  <div className="flex max-w-[75%] flex-col">
                    <div className="rounded-2xl rounded-bl-sm bg-gray-800 px-4 py-3 text-sm leading-relaxed text-gray-50 shadow-lg shadow-black/40">
                      {message.parts
                        .filter((p) => p.type === "text")
                        .map((p, i) =>
                          p.type === "text" ? (
                            <span key={i}>{p.text}</span>
                          ) : null,
                        )}
                    </div>
                    <span className="mt-1 text-xs text-gray-500">
                      {twinUser?.name}&apos;s twin ·{" "}
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3 ml-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600/20 text-[10px] font-semibold text-amber-200">
                {twinUser?.name?.[0] ?? "T"}
              </div>
              <div className="flex max-w-[60%] flex-col">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-gray-800 px-4 py-3 shadow-lg shadow-black/40">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span className="mt-1 text-xs text-gray-500">
                  {twinUser?.name}&apos;s twin is typing...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="border-t border-gray-800 bg-gray-900 px-3 py-3 sm:px-6 sm:py-4 flex-shrink-0">
        <form onSubmit={handleSend}>
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <div className="flex flex-1 items-center gap-3 rounded-full bg-gray-800 px-4 py-2 shadow-inner shadow-black/40">
              <input
                type="text"
                placeholder={`Message ${twinUser?.name}'s twin...`}
                className="w-full bg-transparent text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white transition-colors hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 12 7-7 7 7" />
                <path d="M12 19V5" />
              </svg>
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}
