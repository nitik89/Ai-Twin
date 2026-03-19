"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Dilemma = {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

type ThisOrThatPair = {
  optionA: string;
  optionB: string;
  category: string;
};

type Prediction = {
  statement: string;
};

type Discovery = {
  id: string;
  dilemma: Dilemma;
  thisOrThat: ThisOrThatPair[];
  predictions: Prediction[];
  dilemmaAnswer: string | null;
  thisOrThatAnswers: string[] | null;
  predictionAnswers: string[] | null;
  completedAt: string | null;
};

export default function DiscoverPage() {
  const [discovery, setDiscovery] = useState<Discovery | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [dilemmaAnswer, setDilemmaAnswer] = useState<string | null>(null);
  const [thisOrThatAnswers, setThisOrThatAnswers] = useState<string[]>(
    Array(10).fill(""),
  );
  const [predictionAnswers, setPredictionAnswers] = useState<string[]>(
    Array(3).fill(""),
  );

  useEffect(() => {
    const fetchDiscovery = async () => {
      try {
        const res = await fetch("/api/discover");
        const data = await res.json();
        setDiscovery(data);
      } catch (err) {
        console.error("Failed to fetch discovery:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDiscovery();
  }, []);

  const handleSubmit = async () => {
    if (!discovery) return;
    setIsSubmitting(true);
    try {
      await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discoveryId: discovery.id,
          dilemmaAnswer,
          thisOrThatAnswers,
          predictionAnswers,
        }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit discovery:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const thisOrThatComplete = thisOrThatAnswers.every((a) => a !== "");
  const predictionsComplete = predictionAnswers.every((a) => a !== "");

  if (isLoading) {
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

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-600 mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">
          Your twin learned something new
        </h2>
        <p className="text-gray-400 text-sm mb-8">
          Come back tomorrow for more discoveries
        </p>
        <Link
          href="/"
          className="rounded-full bg-purple-600 px-8 py-3 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
        >
          Back to Chat
        </Link>
      </div>
    );
  }

  if (!discovery) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <p className="text-gray-400">
          Failed to load discovery. Please try again.
        </p>
      </div>
    );
  }

  const steps = [
    { number: 1, label: "Dilemma" },
    { number: 2, label: "This or That" },
    { number: 3, label: "Predictions" },
  ];

  const dilemmaOptions = [
    { key: "A", text: discovery.dilemma.optionA },
    { key: "B", text: discovery.dilemma.optionB },
    { key: "C", text: discovery.dilemma.optionC },
    { key: "D", text: discovery.dilemma.optionD },
  ];

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
          <h1 className="text-sm font-semibold text-white">Daily Discovery</h1>
          <p className="text-xs text-gray-400">
            Help your twin learn about you
          </p>
        </div>
      </header>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-3 px-4 py-5">
        {steps.map((step, i) => (
          <div key={step.number} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`h-2.5 w-16 rounded-full transition-colors ${
                  currentStep > step.number
                    ? "bg-purple-400"
                    : currentStep === step.number
                      ? "bg-purple-600"
                      : "bg-gray-700"
                }`}
              />
              <span
                className={`text-xs ${
                  currentStep === step.number
                    ? "text-purple-400"
                    : "text-gray-600"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="h-px w-4 bg-gray-700 mb-4" />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 pb-10">
        {/* Step 1 — Dilemma */}
        {currentStep === 1 && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold text-purple-400">01</span>
              <span className="text-sm font-semibold text-white">
                Today &apos;s Dilemma
              </span>
            </div>
            <p className="text-base font-medium text-white mb-6 leading-relaxed">
              {discovery.dilemma.question}
            </p>
            <div className="space-y-3">
              {dilemmaOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setDilemmaAnswer(option.key)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                    dilemmaAnswer === option.key
                      ? "border-purple-500 bg-purple-600 text-white"
                      : "border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      dilemmaAnswer === option.key
                        ? "bg-white/20"
                        : "bg-gray-700"
                    }`}
                  >
                    {option.key}
                  </span>
                  <span className="text-sm leading-relaxed">{option.text}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentStep(2)}
              disabled={!dilemmaAnswer}
              className="mt-6 w-full rounded-full bg-purple-600 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}

        {/* Step 2 — This or That */}
        {currentStep === 2 && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-purple-400">02</span>
              <span className="text-sm font-semibold text-white">
                This or That
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-5">
              Pick instinctively — go with your gut
            </p>

            <div className="space-y-4">
              {discovery.thisOrThat.map((pair, i) => (
                <div key={i}>
                  <p className="text-xs text-gray-500 mb-1">{pair.category}</p>
                  <div className="flex overflow-hidden rounded-xl border border-gray-700">
                    <button
                      onClick={() => {
                        const updated = [...thisOrThatAnswers];
                        updated[i] = "A";
                        setThisOrThatAnswers(updated);
                      }}
                      className={`flex-1 py-3 text-sm font-medium transition-colors ${
                        thisOrThatAnswers[i] === "A"
                          ? "bg-purple-600 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {pair.optionA}
                    </button>
                    <div className="flex items-center px-2 text-xs text-gray-600">
                      or
                    </div>
                    <button
                      onClick={() => {
                        const updated = [...thisOrThatAnswers];
                        updated[i] = "B";
                        setThisOrThatAnswers(updated);
                      }}
                      className={`flex-1 py-3 text-sm font-medium transition-colors ${
                        thisOrThatAnswers[i] === "B"
                          ? "bg-purple-600 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {pair.optionB}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-gray-500 text-center">
              {thisOrThatAnswers.filter((a) => a !== "").length}/10 answered
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 rounded-full border border-gray-700 py-3 text-sm font-medium text-gray-400 hover:bg-gray-800 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                disabled={!thisOrThatComplete}
                className="flex-1 rounded-full bg-purple-600 py-3 text-sm font-medium text-white hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Predictions */}
        {currentStep === 3 && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-purple-400">03</span>
              <span className="text-sm font-semibold text-white">
                Twin Predictions
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-5">
              How well does your twin know you?
            </p>

            <div className="space-y-4">
              {discovery.predictions.map((prediction, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-700 bg-gray-800 p-4"
                >
                  <p className="text-sm text-white mb-3 leading-relaxed">
                    {prediction.statement}
                  </p>
                  <div className="flex gap-2">
                    {["Yes", "Sometimes", "No"].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          const updated = [...predictionAnswers];
                          updated[i] = option;
                          setPredictionAnswers(updated);
                        }}
                        className={`flex-1 rounded-full py-2 text-xs font-medium transition-colors ${
                          predictionAnswers[i] === option
                            ? "bg-purple-600 text-white"
                            : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 rounded-full border border-gray-700 py-3 text-sm font-medium text-gray-400 hover:bg-gray-800 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!predictionsComplete || isSubmitting}
                className="flex-1 rounded-full bg-purple-600 py-3 text-sm font-medium text-white hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit & Train Twin"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
