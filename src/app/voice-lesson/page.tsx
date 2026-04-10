"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { posthog, initPostHog } from "@/lib/posthog";

type Status =
  | "idle"
  | "loading"
  | "carlos-speaking"
  | "your-turn"
  | "processing"
  | "ended";

/** WhatsApp / Instagram / FB in-app browsers often report maxTouchPoints === 0 but still need a user tap for audio. */
function isEmbeddedOrInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /WhatsApp|Instagram|FBAN|FBAV|Line\/|Telegram|wv\)|WebView|CriOS/i.test(ua);
}

/** iOS Safari blocks programmatic audio until there is a user gesture; async fetch breaks the chain. */
function isTouchLikeDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    navigator.maxTouchPoints > 0 ||
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    isEmbeddedOrInAppBrowser()
  );
}

/** Play in a tap handler so later TTS can play after fetch on iOS. */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQQAAAAAAA==";

async function unlockWebAudioForIOS(): Promise<void> {
  try {
    const a = new Audio(SILENT_WAV);
    a.volume = 0.01;
    await a.play();
    a.pause();
    a.removeAttribute("src");
  } catch {
    /* ignore */
  }
}

type TranscriptEntry = {
  role: "carlos" | "user";
  text: string;
};

const SCENARIO_NAMES: Record<string, string> = {
  cafe: "Café & Bar",
  meeting: "Meeting Someone",
  airport: "Airport & Travel",
  hotel: "Hotel Check-in",
  restaurant: "Restaurant",
  shopping: "Shopping",
  directions: "Directions",
  work: "Work & Professional",
};

function VoiceLessonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scenario = searchParams.get("scenario") || "cafe";
  const name = searchParams.get("name") || "";
  const level = searchParams.get("level") || "beginner";

  const [status, setStatus] = useState<Status>("loading");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentPhrase, setCurrentPhrase] = useState("");
  const [act, setAct] = useState<1 | 2 | 3>(1);
  const [isRecording, setIsRecording] = useState(false);
  const [touchLike, setTouchLike] = useState(false);
  /** Desktop: open immediately. Mobile: open after user taps Start (required for iOS audio). */
  const [introGateOpen, setIntroGateOpen] = useState(false);

  const previousPhrases =
    typeof window !== "undefined"
      ? localStorage.getItem("vamos_previous_phrases") || ""
      : "";

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const hasStartedRef = useRef(false);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const startAbortRef = useRef<AbortController | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** iOS / in-app browsers: play() after fetch often fails — second tap fixes it. */
  const [pendingAudioBase64, setPendingAudioBase64] = useState<string | null>(null);

  const scenarioName = SCENARIO_NAMES[scenario] || scenario;

  const tierForApi = (() => {
    if (level === "conversational") return "confident";
    if (level === "basics") return "comfortable";
    return "survival";
  })();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    const t = isTouchLikeDevice();
    setTouchLike(t);
    if (t) {
      setStatus("idle");
    } else {
      setIntroGateOpen(true);
    }
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  };

  type PlayResult = "ok" | "autoplay_blocked";

  const playAudioFromBase64 = useCallback((base64: string): Promise<PlayResult> => {
    return new Promise((resolve, reject) => {
      const audioBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const blob = new Blob([audioBytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.setAttribute("playsinline", "");
      audio.setAttribute("webkit-playsinline", "true");
      audio.preload = "auto";
      audio.onended = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        resolve("ok");
      };
      audio.onerror = (e) => {
        URL.revokeObjectURL(url);
        console.error("[voice-lesson] Audio playback error:", e);
        reject(e);
      };
      audio.play().catch((err: unknown) => {
        const name =
          err && typeof err === "object" && "name" in err ? (err as { name: string }).name : "";
        if (name === "NotAllowedError" || name === "AbortError") {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          resolve("autoplay_blocked");
          return;
        }
        reject(err);
      });
    });
  }, []);

  /** After autoplay_blocked, user taps — play() runs inside a real gesture. */
  const playPendingAudioFromTap = async () => {
    if (!pendingAudioBase64) return;
    setErrorMessage(null);
    const b64 = pendingAudioBase64;
    setPendingAudioBase64(null);
    setStatus("carlos-speaking");
    try {
      const r = await playAudioFromBase64(b64);
      if (r === "autoplay_blocked") {
        setPendingAudioBase64(b64);
        setStatus("carlos-speaking");
        return;
      }
      setStatus("your-turn");
    } catch {
      setPendingAudioBase64(b64);
      setErrorMessage("Could not play audio. Try again or open in Safari/Chrome.");
      setStatus("your-turn");
    }
  };

  const handleRetryStart = () => {
    setErrorMessage(null);
    const ac = new AbortController();
    startAbortRef.current?.abort();
    startAbortRef.current = ac;
    void runStartLesson(ac.signal);
  };

  const runStartLesson = useCallback(
    async (signal: AbortSignal) => {
      setErrorMessage(null);
      setPendingAudioBase64(null);
      setStatus("loading");
      try {
        const response = await fetch("/api/voice/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenario, name, tier: tierForApi }),
          signal,
        });

        if (signal.aborted) return;

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const msg =
            (errData?.error as string) ??
            "Could not start the lesson. If this keeps happening, the server may be missing an API key.";
          console.error("[voice-lesson] API error:", msg);
          setErrorMessage(msg);
          setStatus("idle");
          return;
        }

        const data = await response.json();
        if (signal.aborted) return;

        setTranscript([{ role: "carlos", text: data.carlosText }]);
        try {
          posthog.capture("session_started", { scenario, name });
        } catch {
          /* analytics optional */
        }
        const sayMatch = data.carlosText?.match(
          /(?:say|Say)\s*(?:just\s+)?(?:that\s+one\s+word\s+with\s+me:\s+)?([^.!?]+)/i
        );
        setCurrentPhrase(sayMatch ? sayMatch[1].trim() : "");
        setStatus("carlos-speaking");

        const playResult = await playAudioFromBase64(data.audioBase64);
        if (signal.aborted) return;

        if (playResult === "autoplay_blocked") {
          setPendingAudioBase64(data.audioBase64);
          return;
        }
        setStatus("your-turn");
      } catch (err: unknown) {
        if (signal.aborted) return;
        if (err && typeof err === "object" && "name" in err && (err as { name: string }).name === "AbortError") {
          return;
        }
        console.error("[voice-lesson] Error:", err);
        setErrorMessage("Something went wrong starting the lesson. Check your connection and try again.");
        setStatus("idle");
      }
    },
    [scenario, name, tierForApi, playAudioFromBase64]
  );

  useEffect(() => {
    if (!introGateOpen) return;

    stopAudio();
    const ac = new AbortController();
    startAbortRef.current = ac;
    void runStartLesson(ac.signal);

    return () => {
      ac.abort();
      startAbortRef.current = null;
      stopAudio();
    };
  }, [introGateOpen, runStartLesson]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  useEffect(() => {
    return () => {
      if (transcript.length > 0) {
        posthog.capture("session_abandoned", {
          scenario,
          name,
          exchangeCount: transcript.length,
        });
      }
    };
  }, [transcript]);

  useEffect(() => {
    return () => {
      // Stop audio
      stopAudio();

      // Stop microphone and recording
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== "inactive") {
        mr.stop();
      }
      mediaRecorderRef.current = null;
      chunksRef.current = [];

      // Stop all microphone tracks
      if (mr) {
        const stream = mr.stream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      }

      // Reset start flag so new session can begin fresh
      hasStartedRef.current = false;
    };
  }, []);

  const handleStartLessonTap = async () => {
    setErrorMessage(null);
    await unlockWebAudioForIOS();
    setIntroGateOpen(true);
  };

  const handleMicClick = () => {
    if (status !== "your-turn") return;

    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await sendAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("[voice-lesson] Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setStatus("processing");
    }
  };

  const sendAudio = async (audioBlob: Blob) => {
    setStatus("processing");
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("scenario", scenario);
      formData.append("name", name);
      formData.append("level", level);
      formData.append("act", String(act));
      formData.append("transcript", JSON.stringify(transcript));
      formData.append("previousPhrases", previousPhrases);

      const response = await fetch("/api/voice/respond", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data?.error ?? "Failed to get response";
        console.error("[voice-lesson] API error:", msg);
        setErrorMessage(msg);
        setStatus("your-turn");
        return;
      }

      setTranscript((prev) => [
        ...prev,
        { role: "user", text: data.userText },
        { role: "carlos", text: data.carlosText },
      ]);

      setCurrentPhrase("");
      setStatus("carlos-speaking");

      const playResult = await playAudioFromBase64(data.audioBase64);
      if (playResult === "autoplay_blocked") {
        setPendingAudioBase64(data.audioBase64);
        return;
      }

      setStatus("your-turn");
    } catch (err) {
      console.error("[voice-lesson] Error:", err);
      setStatus("your-turn");
    }
  };

  const handleEndLesson = () => {
    stopAudio();
    setStatus("ended");

    const fullTranscript = transcript
      .map((t) => `${t.role === "carlos" ? "Carlos" : "User"}: ${t.text}`)
      .join("\n\n");

    posthog.capture("session_completed", {
      scenario,
      name,
      exchangeCount: transcript.length,
    });

    // Extract Spanish phrases user said this session and save for next session
    const userLines = transcript
      .filter((t) => t.role === "user")
      .map((t) => t.text)
      .join(" ");

    const spanishHints = [
      "quisiera",
      "gracias",
      "hola",
      "café",
      "cuenta",
      "mesa",
      "por favor",
      "buenos",
      "buenas",
      "cómo",
      "dónde",
      "cuánto",
      "tengo",
      "quiero",
      "una",
      "un",
      "con",
      "sin",
      "agua",
      "vino",
      "cerveza",
      "la",
      "el",
      "los",
      "las",
    ];

    const foundPhrases = spanishHints.filter((phrase) =>
      userLines.toLowerCase().includes(phrase.toLowerCase())
    );

    if (foundPhrases.length > 0) {
      localStorage.setItem(
        "vamos_previous_phrases",
        foundPhrases.slice(0, 3).join(", ")
      );
    }

    sessionStorage.setItem(
      "vamosai_voice_summary",
      JSON.stringify({
        transcript: fullTranscript,
        name: name || "there",
        scenario,
      })
    );
    router.push("/voice-summary");
  };

  const getStatusText = () => {
    if (pendingAudioBase64) {
      return "Your browser blocked autoplay — tap below to hear Carlos.";
    }
    switch (status) {
      case "idle":
        return "Tap the button below to start";
      case "loading":
        return "Starting your lesson...";
      case "carlos-speaking":
        return "Carlos is speaking...";
      case "your-turn":
        return "Your turn — tap the mic";
      case "processing":
        return "Processing...";
      case "ended":
        return "";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-[var(--vamos-canvas)] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[480px] h-[320px] rounded-full blur-[100px]"
          style={{ backgroundColor: "var(--brand-soft)" }}
        />
      </div>
      <header className="relative z-10 p-4 sm:p-6 border-b border-slate-700/50 flex items-center justify-between">
        <button
          onClick={() => {
            stopAudio();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
              mediaRecorderRef.current.stop();
            }
            hasStartedRef.current = false;
            router.push(`/scenarios?${searchParams.toString()}`);
          }}
          className="text-slate-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <div className="text-center">
          <h1 className="text-white font-semibold text-lg">{scenarioName}</h1>
        </div>
        <button
          onClick={handleEndLesson}
          className="text-sm text-slate-400 hover:text-slate-300"
        >
          End lesson
        </button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-24 h-24 rounded-full bg-brand flex items-center justify-center text-white font-bold text-2xl mb-6 shadow-[0_0_40px_var(--brand-glow)]">
          C
        </div>
        <p className="text-slate-400 text-lg mb-4 text-center">{getStatusText()}</p>

        {errorMessage && (
          <p className="text-amber-400/90 text-sm text-center mb-3 max-w-md mx-auto px-2">
            {errorMessage}
          </p>
        )}

        {errorMessage && status === "idle" && introGateOpen && (
          <button
            type="button"
            onClick={handleRetryStart}
            className="mb-4 px-6 py-3 rounded-xl border border-brand text-brand font-semibold hover:bg-brand/10 transition-colors"
          >
            Try again
          </button>
        )}

        {pendingAudioBase64 && (
          <button
            type="button"
            onClick={playPendingAudioFromTap}
            className="mb-8 px-8 py-4 rounded-xl bg-brand text-white font-semibold hover:bg-brand-hover transition-colors shadow-[0_0_30px_var(--brand-glow)]"
          >
            Tap to hear Carlos
          </button>
        )}

        {touchLike && !introGateOpen && (
          <button
            type="button"
            onClick={handleStartLessonTap}
            className="mb-8 px-8 py-4 rounded-xl bg-brand text-white font-semibold hover:bg-brand-hover transition-colors shadow-[0_0_30px_var(--brand-glow)]"
          >
            Start lesson
          </button>
        )}

        {status === "your-turn" && currentPhrase && (
          <p className="text-brand text-2xl sm:text-3xl font-semibold text-center mb-8 min-h-[3rem]">
            {currentPhrase}
          </p>
        )}

        <button
          onClick={handleMicClick}
          disabled={status !== "your-turn"}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? "bg-brand animate-pulse"
              : status === "your-turn"
                ? "bg-brand hover:bg-brand-hover"
                : "bg-slate-600 cursor-not-allowed"
          }`}
        >
          <svg
            className="w-10 h-10 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 3c0 .55.45 1 1 1s1-.45 1-1v-1c0-.55-.45-1-1-1s-1 .45-1 1v1z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </button>

        {transcript.length > 0 && (
          <div className="mt-12 w-full max-w-2xl">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transcript.map((entry, i) => (
                <p
                  key={i}
                  className={`text-sm ${
                    entry.role === "carlos" ? "text-slate-400" : "text-slate-300"
                  }`}
                >
                  <span className="font-medium">
                    {entry.role === "carlos" ? "Carlos: " : "You: "}
                  </span>
                  {entry.text}
                </p>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function VoiceLessonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--vamos-canvas)] flex items-center justify-center">
          <p className="text-slate-400">Loading...</p>
        </div>
      }
    >
      <VoiceLessonContent />
    </Suspense>
  );
}
