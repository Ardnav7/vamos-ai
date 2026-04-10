"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const CONFIDENCE_KEY_PREFIX = "vamos_confidence_";

const SCENARIOS = [
  { id: "cafe", emoji: "☕", title: "Café & Bar", description: "Order drinks and food like a local" },
  { id: "meeting", emoji: "👋", title: "Meeting Someone", description: "Greetings, names and small talk" },
  { id: "airport", emoji: "✈️", title: "Airport & Travel", description: "Navigate airports and travel" },
  { id: "hotel", emoji: "🏨", title: "Hotel Check-in", description: "Check in and ask for what you need" },
  { id: "restaurant", emoji: "🍽️", title: "Restaurant", description: "Order food and handle the bill" },
  { id: "shopping", emoji: "🛒", title: "Shopping", description: "Buy things and ask about prices" },
  { id: "directions", emoji: "🗺️", title: "Directions", description: "Ask for and understand directions" },
  { id: "work", emoji: "💼", title: "Work & Professional", description: "Meetings and introductions" },
];

function ScenariosContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "";
  const [confidenceScores, setConfidenceScores] = useState<Record<string, number>>({});

  useEffect(() => {
    const scores: Record<string, number> = {};
    SCENARIOS.forEach((item) => {
      try {
        const stored = localStorage.getItem(`${CONFIDENCE_KEY_PREFIX}${item.id}`);
        if (stored) {
          const num = parseInt(stored, 10);
          if (!isNaN(num)) scores[item.id] = num;
        }
      } catch {}
    });
    setConfidenceScores(scores);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--vamos-canvas)] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ backgroundColor: "var(--brand-soft)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ backgroundColor: "var(--glow-slate)" }}
        />
      </div>

      <header className="relative z-10 p-6 sm:p-8 flex items-center justify-between border-b border-slate-800/50">
        <Link href="/" className="text-white font-bold text-xl tracking-tight">
          <span className="text-brand">V</span>amosAI
        </Link>
        {name && (
          <span className="text-slate-500 text-sm border border-slate-700 px-3 py-1 rounded-full">
            {name}
          </span>
        )}
      </header>

      <main className="relative z-10 flex-1 px-6 sm:px-8 max-w-4xl mx-auto w-full py-10">
        <div className="mb-10">
          {name && (
            <p className="text-brand text-sm font-medium tracking-widest uppercase mb-3">
              Welcome back, {name}
            </p>
          )}
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">
            Choose your scene.
          </h1>
          <p className="text-slate-400 text-lg">
            Every scenario is a real situation. Carlos will be there with you.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-5">
          {SCENARIOS.map((item) => {
            const score = confidenceScores[item.id];
            const hasScore = typeof score === "number";

            return (
              <Link
                key={item.id}
                href={`/voice-lesson?scenario=${item.id}&${searchParams.toString()}`}
                className="group relative p-5 sm:p-6 rounded-2xl border border-slate-700/50 bg-slate-800/30 hover:border-brand/50 hover:bg-slate-800/60 transition-all duration-300 text-left flex flex-col overflow-hidden backdrop-blur-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand/0 to-brand/0 group-hover:from-brand/5 group-hover:to-transparent transition-all duration-300 rounded-2xl" />

                <span className="text-3xl block mb-4 relative z-10">{item.emoji}</span>
                <h2 className="text-white font-semibold text-base sm:text-lg mb-1 relative z-10 group-hover:text-brand transition-colors duration-200">
                  {item.title}
                </h2>
                <p className="text-slate-500 text-sm mb-5 flex-1 relative z-10 leading-relaxed">
                  {item.description}
                </p>
                <div className="relative z-10 mt-auto">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-slate-600 text-xs">
                      {hasScore ? `${score}% confident` : "Not started"}
                    </p>
                    {hasScore && <p className="text-brand text-xs font-medium">Continue →</p>}
                  </div>
                  <div className="h-0.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-500"
                      style={{ width: hasScore ? `${score}%` : "0%" }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default function ScenariosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--vamos-canvas)] flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
      </div>
    }>
      <ScenariosContent />
    </Suspense>
  );
}
