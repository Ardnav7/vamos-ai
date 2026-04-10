import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const SUMMARY_PROMPT = `You are Carlos, a warm Spanish tutor. Analyze this conversation and return a JSON object with this exact structure. Return ONLY valid JSON, no other text.

{
  "strengths": [
    "First specific strength about their Spanish",
    "Second specific strength about their Spanish",
    "Third specific strength about their Spanish"
  ],
  "improvement": "One specific actionable tip for tomorrow",
  "score": 45
}

CRITICAL RULES:
- STRENGTHS TONE: Write ALL strengths in second person, directly addressing the user. Use "you" — never "the learner", "they", or third person. Be warm and personal, like you're talking to a friend. Reference actual words, phrases, or moments from the conversation.
  WRONG: "The learner showed curiosity", "They asked for greetings"
  RIGHT: "You jumped straight into asking for useful phrases — that's exactly the right instinct", "You stayed engaged even when things got tricky"
- No labels or prefixes before strengths (e.g. do NOT write "Strength 1:" or "You did well at:").
- The improvement must be one specific, actionable tip based on their actual mistakes or gaps. Reference what they said. No generic advice. (Already in second person.)
- The score is a number 0-100 reflecting vocabulary, grammar, and comprehension. Beginners: 20-40, intermediate: 40-70, advanced: 70-100.
- Output ONLY the JSON object. No markdown, no code blocks, no explanatory text.`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const { messages, name } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages must be a non-empty array" },
        { status: 400 }
      );
    }

    const conversationText = messages
      .map(
        (m: { role: string; content: string }) =>
          `${m.role === "user" ? "Learner" : "Carlos"}: ${m.content}`
      )
      .join("\n\n");

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SUMMARY_PROMPT },
        {
          role: "user",
          content: `Analyze this Spanish learning conversation:\n\n${conversationText}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from OpenAI" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);

    const score = typeof parsed.score === "number"
      ? parsed.score
      : typeof parsed.fluencyScore === "number"
        ? parsed.fluencyScore
        : 0;

    if (
      !Array.isArray(parsed.strengths) ||
      typeof parsed.improvement !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid response format from OpenAI" },
        { status: 500 }
      );
    }

    const stripInstructionPrefix = (text: string) =>
      text
        .replace(/^(strength\s*\d+\s*[-:]\s*)/i, "")
        .replace(/^(you\s+did\s+well\s*(at|with)?\s*[-:]\s*)/i, "")
        .trim();

    const toSecondPerson = (text: string) =>
      stripInstructionPrefix(text)
        .replace(/\bthe learner's\b/gi, "your")
        .replace(/\bthe learner\b/gi, "you")
        .replace(/\btheir\b/gi, "your")
        .replace(/\bthem\b/gi, "you")
        .replace(/\bthey\b/gi, "you");

    return NextResponse.json({
      strengths: parsed.strengths
        .slice(0, 3)
        .map((s: string) => toSecondPerson(String(s))),
      improvement: parsed.improvement.trim(),
      fluencyScore: Math.min(100, Math.max(0, Math.round(score))),
      name: name || "there",
    });
  } catch (error) {
    console.error("Summary API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate summary",
      },
      { status: 500 }
    );
  }
}
