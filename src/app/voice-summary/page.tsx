"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "vamosai_voice_summary";
const CONFIDENCE_KEY_PREFIX = "vamos_confidence_";

type VoiceSummaryData = {
  strengths: string[];
  improvement: string;
  score: number;
  name: string;
  phrasesLearned: string[];
  confidenceStatement?: string;
  phrasesMastered?: string[];
  phrasesNeedsPractice?: string[];
  nextSessionTeaser?: string;
};

export default function VoiceSummaryPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<VoiceSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoreVisible, setScoreVisible] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (!stored) { router.replace("/"); return; }
        const { transcript, name, scenario } = JSON.parse(stored);
        const response = await fetch("/api/voice/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, name, scenario }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to generate summary");
        setSummary({ ...data, score: data.score ?? data.fluencyScore ?? 0 });
        if (scenario && typeof data.score === "number") {
          try { localStorage.setItem(`${CONFIDENCE_KEY_PREFIX}${scenario}`, String(data.score)); } catch {}
        }
        setTimeout(() => setScoreVisible(true), 300);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--vamos-canvas)] flex flex-col items-center justify-center gap-4">
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-brand animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
        <p className="text-slate-500 text-sm">Carlos is reviewing your session...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-[var(--vamos-canvas)] flex flex-col items-center justify-center px-6">
        <p className="text-red-400 mb-6">{error || "No lesson data"}</p>
        <Link href="/" className="text-slate-400 hover:text-white underline">Return home</Link>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = scoreVisible ? circumference - (summary.score / 100) * circumference : circumference;
  const mastered = summary.phrasesMastered || [];
  const needsPractice = summary.phrasesNeedsPractice || [];

  return (
    <div className="min-h-screen bg-[var(--vamos-canvas)] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px]"
          style={{ backgroundColor: "var(--brand-soft)" }}
        />
      </div>

      <header className="relative z-10 p-6 sm:p-8 border-b border-slate-800/50">
        <Link href="/" className="text-white font-bold text-xl tracking-tight">
          <span className="text-brand">V</span>amosAI
        </Link>
      </header>

      <div className="relative z-10 flex-1 px-6 sm:px-8 py-10 max-w-2xl mx-auto w-full">

        {/* Header */}
        <div className="mb-10">
          <p className="text-brand text-sm font-medium tracking-widest uppercase mb-3">Session complete</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-2">
            {summary.name}, that was real Spanish.
          </h1>
          <p className="text-slate-400 text-lg">Here&apos;s how you did.</p>
        </div>

        {/* Score */}
        <div className="flex items-center gap-8 mb-10 p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#1E293B" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke="var(--brand)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: "stroke-dashoffset 1s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">{summary.score}</span>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Confidence Score</p>
            {summary.confidenceStatement && (
              <p className="text-white font-medium leading-snug">{summary.confidenceStatement}</p>
            )}
          </div>
        </div>

        {/* What you did well */}
        <div className="rounded-2xl border border-emerald-800/40 bg-emerald-900/20 p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <h2 className="text-emerald-400 font-semibold text-sm tracking-widest uppercase">What you did well</h2>
          </div>
          <ul className="space-y-3">
            {summary.strengths.map((s, i) => (
              <li key={i} className="text-white text-sm leading-relaxed flex gap-3">
                <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Focus tomorrow */}
        <div className="rounded-2xl border border-brand/20 bg-brand/5 p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-brand" />
            <h2 className="text-brand font-semibold text-sm tracking-widest uppercase">Focus tomorrow</h2>
          </div>
          <p className="text-white text-sm leading-relaxed">{summary.improvement}</p>
        </div>

        {/* Phrases */}
        {(mastered.length > 0 || needsPractice.length > 0) && (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <h2 className="text-slate-300 font-semibold text-sm tracking-widest uppercase">Phrases from this session</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {mastered.map((phrase, i) => (
                <span key={i} className="px-3 py-1.5 bg-brand/20 border border-brand/40 text-brand rounded-lg text-sm font-medium">
                  {phrase}
                </span>
              ))}
              {needsPractice.map((phrase, i) => (
                <span key={`np-${i}`} className="px-3 py-1.5 border border-slate-600 text-slate-400 rounded-lg text-sm">
                  {phrase}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Next session teaser */}
        {summary.nextSessionTeaser && (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6 mb-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <h2 className="text-slate-400 font-semibold text-sm tracking-widest uppercase">What&apos;s next</h2>
            </div>
            <p className="text-white text-sm leading-relaxed">{summary.nextSessionTeaser}</p>
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-3">
          <Link
            href="/scenarios"
            className="block w-full py-4 rounded-xl bg-brand text-white font-bold hover:bg-brand-hover transition-all duration-200 text-center shadow-[0_0_30px_var(--brand-glow)] hover:shadow-[0_0_40px_var(--brand-glow)]"
          >
            Keep practising →
          </Link>
          <Link
            href="/"
            className="block w-full py-4 rounded-xl border border-slate-700 text-slate-400 font-medium text-center hover:border-slate-500 hover:text-white transition-all duration-200"
          >
            Come back tomorrow
          </Link>
        </div>
      </div>
    </div>
  );
}
