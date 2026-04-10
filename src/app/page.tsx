import Link from "next/link";

export default function WelcomeScreen() {
  return (
    <div className="min-h-screen bg-[var(--vamos-canvas)] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[120px]"
          style={{ backgroundColor: "var(--brand-soft)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ backgroundColor: "var(--glow-slate)" }}
        />
        <div
          className="absolute top-1/3 left-0 w-[300px] h-[300px] rounded-full blur-[80px] opacity-80"
          style={{ backgroundColor: "var(--brand-soft)" }}
        />
      </div>

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <header className="relative z-10 p-6 sm:p-8 flex items-center justify-between">
        <span className="text-white font-bold text-xl tracking-tight">
          <span className="text-brand">V</span>
          <span>amosAI</span>
        </span>
        <span className="text-slate-500 text-sm border border-slate-700 px-3 py-1 rounded-full">
          Beta
        </span>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 sm:px-8 pb-16">
        <div className="max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-slate-700/80 bg-slate-800/40 backdrop-blur-sm">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--brand)" }}
            />
            <span className="text-slate-400 text-sm tracking-wide">
              Voice-first Spanish with Carlos
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-[1.05] mb-5 tracking-tight">
            Speak Spanish.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-teal-300">
              From day one.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-lg mx-auto leading-relaxed">
            Real conversation practice — no games, no streaks.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="group relative inline-flex items-center gap-2 px-8 py-4 bg-brand text-white font-semibold rounded-xl hover:bg-brand-hover transition-all duration-200 text-base shadow-[0_0_40px_var(--brand-glow)] hover:shadow-[0_0_56px_var(--brand-glow)]"
            >
              Start speaking for free
              <span className="group-hover:translate-x-1 transition-transform duration-200">
                →
              </span>
            </Link>
          </div>

          <p className="mt-8 text-slate-600 text-sm">Beta — free while it lasts</p>
        </div>

        <div className="relative z-10 mt-14 flex flex-wrap items-center justify-center gap-3 max-w-xl">
          {[
            { emoji: "🎙️", text: "Voice-first" },
            { emoji: "🇪🇸", text: "Real scenarios" },
            { emoji: "⚡", text: "Minutes a day" },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm"
            >
              <span>{item.emoji}</span>
              <span className="text-slate-300 text-sm">{item.text}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
