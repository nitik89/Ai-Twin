"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleComplete = async () => {
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, bio }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      await update();
      router.push("/");
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950">
      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600 text-xl font-semibold text-white mb-4">
            AT
          </div>
          <h1 className="text-2xl font-semibold text-white">
            Set up your profile
          </h1>
          <p className="mt-2 text-center text-sm text-gray-400">
            Help your twin get to know you faster
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6 flex gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-purple-600" : "bg-gray-800"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8">
          {step === 1 && (
            <div>
              <h2 className="mb-2 text-lg font-medium text-white">
                Choose a username
              </h2>
              <p className="mb-6 text-sm text-gray-400">
                This is how people will find you on AI Twin
              </p>
              <input
                type="text"
                placeholder="@username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))
                }
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
              />
              {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
              <button
                onClick={() => {
                  if (!username.trim()) {
                    setError("Username is required");
                    return;
                  }
                  setError("");
                  setStep(2);
                }}
                className="mt-6 w-full rounded-full bg-purple-600 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-500"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-2 text-lg font-medium text-white">
                Tell your twin about you
              </h2>
              <p className="mb-6 text-sm text-gray-400">
                A short bio gives your twin a head start
              </p>
              <textarea
                placeholder="I'm a developer who loves building AI projects. I think in systems and communicate directly..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 resize-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional but recommended
              </p>
              {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-full border border-gray-700 py-3 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="flex-1 rounded-full bg-purple-600 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-50"
                >
                  {isLoading ? "Setting up..." : "Start my twin"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
