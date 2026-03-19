"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function MirrorPage() {
  const [letter, setLetter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMirror = async () => {
      try {
        const res = await fetch("/api/mirror");
        const data = await res.json();
        if (data.error) {
          setError(data.error);
          return;
        }
        setLetter(data.letter);
      } catch (err) {
        console.error("Failed to fetch mirror:", err);
        setError("Failed to generate your mirror letter");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMirror();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-gray-800 px-4 py-4 sm:px-6">
        <Link
          href="/"
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
        <div>
          <h1 className="text-sm font-semibold text-white">The Mirror</h1>
          <p className="text-xs text-gray-400">What your twin sees in you</p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
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
            <p className="text-sm text-gray-500">
              Your twin is writing your letter...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-800/30 bg-red-900/10 p-8 text-center">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-gray-800 px-6 py-2 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Card */}
            <div className="rounded-2xl border border-purple-800/30 bg-gray-900 p-8">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Your Twin</p>
                  <p className="text-xs text-gray-400">Monthly reflection</p>
                </div>
                <div className="ml-auto">
                  <p className="text-xs text-gray-500">
                    {new Date().toLocaleDateString([], {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Letter */}
              <div className="prose prose-invert max-w-none">
                {letter?.split("\n").map((line, i) =>
                  line.trim() === "" ? (
                    <div key={i} className="h-4" />
                  ) : (
                    <p
                      key={i}
                      className={`text-sm leading-relaxed ${
                        line.startsWith("Dear") || line.startsWith("—")
                          ? "font-medium text-purple-300"
                          : "text-gray-200"
                      }`}
                    >
                      {line}
                    </p>
                  ),
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (letter) {
                    navigator.clipboard.writeText(letter);
                  }
                }}
                className="flex-1 rounded-full border border-gray-700 py-3 text-sm font-medium text-gray-400 hover:bg-gray-800 transition-colors"
              >
                Copy letter
              </button>
              <Link
                href="/"
                className="flex-1 rounded-full bg-purple-600 py-3 text-sm font-medium text-white text-center hover:bg-purple-500 transition-colors"
              >
                Back to Chat
              </Link>
            </div>

            <p className="text-center text-xs text-gray-600">
              This letter is generated from your conversations and behaviour
              profile
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
