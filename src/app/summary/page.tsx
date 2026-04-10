"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "vamosai_summary_data";

type SummaryData = {
  strengths: string[];
  improvement: string;
  fluencyScore: number;
  name: string;
};

export default function SummaryPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (!stored) {
          router.replace("/");
          return;
        }

        const { messages, name } = JSON.parse(stored);
        const openaiMessages = messages.map((m: { sender: string; text: string }) => ({
          role: m.sender === "carlos" ? "assistant" : "user",
          content: m.text,
        }));

        const response = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: openaiMessages, name }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to generate summary");
        }

        setSummary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [router]);

  const handleKeepPractising = () => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    const returnParams = stored
      ? (() => {
          try {
            const { returnParams } = JSON.parse(stored);
            return returnParams ? `?${returnParams}&from=summary` : "?from=summary";
          } catch {
            return "?from=summary";
          }
        })()
      : "?from=summary";
    router.push(`/conversation${returnParams}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center">
        <p className="text-slate-400">Analysing your conversation...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center px-6">
        <p className="text-red-400 mb-6">{error || "No conversation data"}</p>
        <Link
          href="/"
          className="text-slate-400 hover:text-white underline"
        >
          Return home
        </Link>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (summary.fluencyScore / 100) * circumference;

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      <div className="flex-1 px-6 sm:px-8 py-8 max-w-2xl mx-auto w-full">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          Great conversation, {summary.name}! 🇪🇸
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Here&apos;s how you did today
        </p>

        {/* What you did well - green section */}
        <div className="bg-emerald-900/40 border border-emerald-700/50 rounded-xl p-6 mb-6">
          <h2 className="text-emerald-300 font-semibold text-lg mb-4">
            What you did well ✓
          </h2>
          <ul className="space-y-2">
            {summary.strengths.map((s, i) => (
              <li key={i} className="text-white flex gap-2">
                <span className="text-emerald-400">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Focus on tomorrow - orange section */}
        <div className="bg-[#F97316]/20 border border-[#F97316]/50 rounded-xl p-6 mb-8">
          <h2 className="text-[#F97316] font-semibold text-lg mb-4">
            Focus on this tomorrow →
          </h2>
          <p className="text-white">{summary.improvement}</p>
        </div>

        {/* Fluency score - circular progress */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#334155"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#F97316"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {summary.fluencyScore}
              </span>
            </div>
          </div>
          <p className="text-gray-400 mt-3 text-sm">Fluency Score</p>
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleKeepPractising}
            className="w-full py-4 rounded-lg bg-[#F97316] text-white font-bold hover:bg-[#ea580c] transition-colors"
          >
            Keep practising
          </button>
          <Link
            href="/"
            className="block w-full py-4 rounded-lg border-2 border-slate-600 text-slate-300 font-semibold text-center hover:border-slate-500 hover:text-white transition-colors"
          >
            Come back tomorrow
          </Link>
        </div>
      </div>
    </div>
  );
}
