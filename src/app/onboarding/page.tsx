"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const REASONS = [
  { id: "travel", emoji: "✈️", label: "Travel & Holidays" },
  { id: "work", emoji: "💼", label: "Work & Career" },
  { id: "family", emoji: "❤️", label: "Family or Partner" },
  { id: "school", emoji: "🎓", label: "School or University" },
  { id: "culture", emoji: "🎬", label: "Culture & TV" },
  { id: "curious", emoji: "⚡", label: "Just curious" },
] as const;

const LEVELS = [
  { id: "beginner", label: "Complete beginner", description: "I know almost nothing" },
  { id: "basics", label: "Some basics", description: "I know a few words and phrases" },
  { id: "conversational", label: "Conversational", description: "I can have simple conversations" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);

  const handleFinish = async () => {
    localStorage.setItem("vamos_user_name", name);
    localStorage.setItem("vamos_user_email", email);
    try {
      const submitUrl = `https://docs.google.com/forms/d/e/1FAIpQLSceC_wofgt5CRnA8uYQbrw1WY1uN20Z8sF3HS5pNc53d6IvzQ/formResponse?entry.200216211=${encodeURIComponent(name)}&entry.1289985144=${encodeURIComponent(email)}&submit=Submit`;
      const img = document.createElement("img");
      img.src = submitUrl;
      img.style.display = "none";
      document.body.appendChild(img);
      setTimeout(() => document.body.removeChild(img), 3000);
    } catch {}
    try {
      const { posthog } = await import("@/lib/posthog");
      posthog.identify(email, { name, email });
    } catch {}
    const params = new URLSearchParams();
    if (name) params.set("name", name);
    if (reason) params.set("reason", reason);
    if (level) params.set("level", level);
    router.push(`/scenarios?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[var(--vamos-canvas)] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[100px]"
          style={{ backgroundColor: "var(--brand-soft)" }}
        />
      </div>

      <header className="relative z-10 p-6 sm:p-8 flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-xl tracking-tight">
          <span className="text-brand">V</span>amosAI
        </Link>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-300 ${
                s === step ? "w-8 bg-brand" : s < step ? "w-4 bg-brand/50" : "w-4 bg-slate-700"
              }`}
            />
          ))}
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col px-6 sm:p-8 max-w-lg mx-auto w-full">
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-brand text-sm font-medium tracking-widest uppercase mb-4">Step 1 of 3</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 tracking-tight">
              Before we start
            </h1>
            <p className="text-slate-400 text-lg mb-10">Carlos needs to know who he&apos;s talking to.</p>
            <form
              onSubmit={(e) => { e.preventDefault(); if (name.trim() && email.trim()) setStep(2); }}
              className="space-y-4"
            >
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Your name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sofia"
                  className="w-full px-4 py-4 rounded-xl bg-slate-800/80 text-white placeholder-slate-600 border border-slate-700 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/50 text-base transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Your email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full px-4 py-4 rounded-xl bg-slate-800/80 text-white placeholder-slate-600 border border-slate-700 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/50 text-base transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!name.trim() || !email.trim()}
                className="w-full py-4 rounded-xl bg-brand text-white font-bold hover:bg-brand-hover transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_30px_var(--brand-glow)] hover:shadow-[0_0_40px_var(--brand-glow)] mt-2"
              >
                Continue →
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col justify-center py-8">
            <p className="text-brand text-sm font-medium tracking-widest uppercase mb-4">Step 2 of 3</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 tracking-tight">
              What&apos;s pulling you<br />toward Spanish?
            </h1>
            <p className="text-slate-400 text-base mb-8">Carlos tailors the sessions to what actually matters to you.</p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReason(r.id)}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                    reason === r.id
                      ? "border-brand bg-brand/10 shadow-[0_0_20px_var(--brand-glow)]"
                      : "border-slate-700 bg-slate-800/40 hover:border-slate-500"
                  }`}
                >
                  <span className="text-xl block mb-2">{r.emoji}</span>
                  <span className="text-white font-medium text-sm">{r.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => reason && setStep(3)}
              disabled={!reason}
              className="w-full py-4 rounded-xl bg-brand text-white font-bold hover:bg-brand-hover transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_30px_var(--brand-glow)]"
            >
              Continue →
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col justify-center py-8">
            <p className="text-brand text-sm font-medium tracking-widest uppercase mb-4">Step 3 of 3</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 tracking-tight">
              How much Spanish<br />do you already know?
            </h1>
            <p className="text-slate-400 text-base mb-8">No wrong answer. Carlos adjusts from wherever you are.</p>
            <div className="space-y-3 mb-8">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLevel(l.id)}
                  className={`w-full p-5 rounded-xl border text-left transition-all duration-200 ${
                    level === l.id
                      ? "border-brand bg-brand/10 shadow-[0_0_20px_var(--brand-glow)]"
                      : "border-slate-700 bg-slate-800/40 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold">{l.label}</span>
                    {level === l.id && <span className="text-brand text-sm">✓ Selected</span>}
                  </div>
                  <p className="text-slate-400 text-sm">{l.description}</p>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => level && handleFinish()}
              disabled={!level}
              className="w-full py-4 rounded-xl bg-brand text-white font-bold hover:bg-brand-hover transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_30px_var(--brand-glow)] hover:shadow-[0_0_40px_var(--brand-glow)]"
            >
              Meet Carlos →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
