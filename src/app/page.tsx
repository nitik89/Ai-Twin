"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

export default function Home() {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [inputValue, setInputValue] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  console.log("the messages are", messages);

  const isLoading = status === "streaming" || status === "submitted";

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    await sendMessage({ text: inputValue });
    setInputValue("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-gray-100">
      {/* Top Navbar */}
      <header className="flex items-center justify-between border-b border-gray-800 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold">
            AT
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">AI Twin</span>
            <span className="text-xs text-gray-400">learning about you</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-medium text-emerald-400">online</span>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto scroll-smooth px-3 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto flex h-full max-w-2xl flex-col justify-end">
          <div className="space-y-6">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center py-20">
                <p className="text-center text-gray-500 text-sm">
                  Hi, I am your AI Twin. Start talking to me.
                </p>
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600/20 text-[10px] font-semibold text-purple-200">
                      AT
                    </div>
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
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600/20 text-[10px] font-semibold text-purple-200">
                  AT
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
                  <span className="mt-1 text-xs text-gray-500">typing…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Bottom Input Area */}
      <footer className="border-t border-gray-800 bg-gray-900 px-3 py-3 sm:px-6 sm:py-4">
        <form onSubmit={handleSend}>
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
              aria-label="Attach a file"
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
                <path d="M21 15V8a5 5 0 0 0-10 0v9a3 3 0 0 1-6 0V9" />
              </svg>
            </button>

            <div className="flex flex-1 items-center gap-3 rounded-full bg-gray-800 px-4 py-2 shadow-inner shadow-black/40">
              <input
                type="text"
                placeholder="Type a message..."
                className="w-full bg-transparent text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-900/50 transition-colors hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
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
