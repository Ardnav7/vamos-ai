"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Message = {
  id: string;
  text: string;
  sender: "carlos" | "user";
};

const REASON_LABELS: Record<string, string> = {
  travel: "Travel & Holidays",
  work: "Work & Career",
  family: "Family or Partner",
  school: "School or University",
  culture: "Culture & TV",
  curious: "Just curious",
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Complete beginner — I know almost nothing",
  basics: "Some basics — I know a few words and phrases",
  conversational: "Conversational — I can have simple conversations",
};

const DEFAULT_FIRST_MESSAGE =
  "¡Hola! I'm Carlos. We're going to have a real conversation in Spanish — don't worry about making mistakes, that's how we learn. Tell me, ¿cómo te llamas? (What's your name?)";

const SUMMARY_STORAGE_KEY = "vamosai_summary_data";

function ConversationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const getContext = useCallback(() => {
    const name = searchParams.get("name") || undefined;
    const reasonSlug = searchParams.get("reason");
    const levelSlug = searchParams.get("level");
    return {
      name,
      reason: reasonSlug ? REASON_LABELS[reasonSlug] : undefined,
      level: levelSlug ? LEVEL_LABELS[levelSlug] : undefined,
    };
  }, [searchParams]);

  useEffect(() => {
    const fromSummary = searchParams.get("from") === "summary";
    if (fromSummary) {
      const stored = sessionStorage.getItem(SUMMARY_STORAGE_KEY);
      if (stored) {
        try {
          const { messages: storedMessages } = JSON.parse(stored);
          if (Array.isArray(storedMessages) && storedMessages.length > 0) {
            setMessages(storedMessages);
          }
        } catch {
          // Ignore parse errors
        }
      }
      setIsInitializing(false);
      return;
    }

    const context = getContext();
    const hasContext = context.name || context.reason || context.level;

    if (!hasContext) {
      setMessages([
        {
          id: "1",
          sender: "carlos",
          text: DEFAULT_FIRST_MESSAGE,
        },
      ]);
      setIsInitializing(false);
      return;
    }

    const fetchFirstMessage = async () => {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [], context }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to get response");
        }

        setMessages([
          {
            id: "1",
            sender: "carlos",
            text: data.message,
          },
        ]);
      } catch (error) {
        setMessages([
          {
            id: "1",
            sender: "carlos",
            text: DEFAULT_FIRST_MESSAGE,
          },
        ]);
      } finally {
        setIsInitializing(false);
      }
    };

    fetchFirstMessage();
  }, [getContext, searchParams]);

  const handleEndConversation = () => {
    const context = getContext();
    const params = new URLSearchParams();
    if (context.name) params.set("name", context.name);
    const reasonSlug = searchParams.get("reason");
    const levelSlug = searchParams.get("level");
    if (reasonSlug) params.set("reason", reasonSlug);
    if (levelSlug) params.set("level", levelSlug);

    sessionStorage.setItem(
      SUMMARY_STORAGE_KEY,
      JSON.stringify({
        messages,
        name: context.name || "",
        returnParams: params.toString(),
      })
    );
    router.push("/summary");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || isInitializing) return;

    const userText = inputValue.trim();
    setInputValue("");

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: "user",
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    const context = getContext();

    try {
      const openaiMessages = messages.map((m) => ({
        role: m.sender === "carlos" ? ("assistant" as const) : ("user" as const),
        content: m.text,
      }));
      openaiMessages.push({ role: "user" as const, content: userText });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: openaiMessages, context }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const carlosMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "carlos",
        text: data.message,
      };
      setMessages((prev) => [...prev, carlosMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "carlos",
        text: `Sorry, something went wrong. ${error instanceof Error ? error.message : "Please try again."}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing && messages.length === 0) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center">
        <p className="text-slate-400">Getting Carlos ready...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      {/* Header */}
      <header className="p-4 sm:p-6 border-b border-slate-700/50 relative">
        <h1 className="text-white font-semibold text-lg sm:text-xl text-center">
          Talking with Carlos 🇪🇸
        </h1>
        <button
          onClick={handleEndConversation}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
        >
          End conversation
        </button>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.sender === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {message.sender === "carlos" && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#F97316] flex items-center justify-center text-white font-bold text-sm">
                  C
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl ${
                  message.sender === "carlos"
                    ? "bg-slate-700/50 text-white rounded-tl-sm"
                    : "bg-slate-600 text-white rounded-tr-sm"
                }`}
              >
                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                  {message.text}
                </p>
              </div>
            </div>
          ))}

          {/* Carlos is typing indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#F97316] flex items-center justify-center text-white font-bold text-sm">
                C
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-slate-700/50">
                <p className="text-sm text-slate-400 italic">
                  Carlos is typing...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="p-4 sm:p-6 border-t border-slate-700/50">
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto flex gap-4"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading || isInitializing}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent text-base disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isLoading || isInitializing}
            className="px-6 py-3 bg-[#F97316] text-white font-semibold rounded-xl hover:bg-[#ea580c] transition-colors text-base disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ConversationScreen() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    }>
      <ConversationContent />
    </Suspense>
  );
}
