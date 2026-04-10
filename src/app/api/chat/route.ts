import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const CARLOS_SYSTEM_PROMPT = `You are Carlos, a warm, patient, and slightly humorous Spanish tutor. You are having a real conversation with an English speaker who is learning Spanish.

Your rules:
- Always respond in a mix of Spanish and English — write your main response in Spanish, then add the English translation in brackets afterwards
- Keep responses short — 2-3 sentences maximum
- When the user makes a grammar mistake, don't point it out harshly — instead, naturally use the correct version in your reply so they absorb it organically
- Ask one follow-up question at the end of each message to keep the conversation going
- Be warm, encouraging, and human — never robotic
- Remember details the user tells you and reference them naturally in later messages`;

function buildSystemPrompt(context?: {
  name?: string;
  reason?: string;
  level?: string;
}): string {
  if (!context || (!context.name && !context.reason && !context.level)) {
    return CARLOS_SYSTEM_PROMPT;
  }
  const parts: string[] = [CARLOS_SYSTEM_PROMPT, "\n\nContext about the learner:"];
  if (context.name) parts.push(`- Their name is ${context.name}`);
  if (context.reason)
    parts.push(`- They're learning Spanish because: ${context.reason}`);
  if (context.level)
    parts.push(
      `- Their level: ${context.level}. Adjust your Spanish complexity and English support accordingly — beginners need more English and simpler Spanish.`
    );
  return parts.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const { messages, context } = await request.json();

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages must be an array" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });
    const systemPrompt = buildSystemPrompt(context);

    const chatMessages: { role: "user" | "assistant" | "system"; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    if (messages.length === 0 && context) {
      chatMessages.push({
        role: "user",
        content: `Generate your first message to greet ${context.name || "them"}. Reference their reason for learning (${context.reason || "general interest"}) and adapt to their level (${context.level || "unknown"}). Be warm and ask them a simple question to get started.`,
      });
    } else {
      chatMessages.push(
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        }))
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: chatMessages,
    });

    const assistantMessage = completion.choices[0]?.message?.content;

    if (!assistantMessage) {
      return NextResponse.json(
        { error: "No response from OpenAI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get response",
      },
      { status: 500 }
    );
  }
}
