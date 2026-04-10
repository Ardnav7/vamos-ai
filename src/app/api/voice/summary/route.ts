import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { SCENARIO_NAMES } from "@/lib/scenario-scripts";

const SUMMARY_PROMPT = `You are Carlos, a warm Spanish tutor. Analyze ONLY the voice lesson transcript below. Return a JSON object with this exact shape. Return ONLY valid JSON, no other text.

{
  "strengths": [
    "First strength — must cite something the learner actually did in User: lines",
    "Second strength — same rule",
    "Third strength — same rule"
  ],
  "improvement": "One specific tip for next time, tied to a real gap or next step visible in the transcript",
  "confidenceStatement": "One sentence: what they can realistically do now in this scenario, based only on phrases they actually used or clearly succeeded with",
  "nextSessionTeaser": "One sentence teasing the next session, consistent with this scenario and their level",
  "sessionPhrases": ["Canonical Spanish phrase 1", "Canonical Spanish phrase 2"],
  "polishThese": ["Optional short label for something to refine — pronunciation, stress, or one word"]
}

GROUNDING (mandatory — do not invent):
- Read every "User:" line. Strengths MUST reflect real attempts, progress, or wins from those lines. If Carlos corrected them, you may describe the win as moving toward the target only if that appears in the dialogue.
- Do NOT claim they mastered something they never attempted. Do NOT use generic filler ("great job overall") without tying it to the transcript.
- improvement: Pick ONE focus — e.g. stress on a word they mispronounced, a phrase Carlos asked them to add next, or pronunciation of a word that appeared as a mishearing in User: lines. Must be actionable and specific to this session.
- confidenceStatement: Match what the transcript supports. If they only nailed ordering and thanks, say that — do not claim full fluency.
- sessionPhrases: 3 to 8 items. For EACH item: use correct Spanish orthography (accents, ñ). Include ONLY phrases or short clauses the user clearly attempted in User: lines OR the corrected form Carlos accepted in the same turn (e.g. if User said a garbled line and Carlos confirmed "Quisiera un café", you may list "Quisiera un café" as what they achieved).
- MERGE duplicates and near-duplicates (e.g. one line for ordering coffee, not three variants).
- EXCLUDE raw ASR garbage as standalone chips — normalize to the intended Spanish phrase when the lesson goal is clear (e.g. prefer "Quisiera un café" over "Kysera un gafe").
- ORDER phrases roughly as they appeared in the lesson (chronological).
- polishThese: 0 to 3 short items — pronunciation, one word, or politeness — only if the transcript shows a recurring slip or Carlos highlighted it. Use empty array [] if nothing stands out.

TONE:
- Second person ("you") for strengths and improvement.
- Warm, specific, no hollow praise.

Do NOT include confidenceScore in your JSON — scoring is computed separately.
Output ONLY the JSON object. No markdown, no code blocks.`;

/** Spanish orthography (diacritics, ñ, inverted punctuation). */
const SPANISH_MARKS = /[áéíóúñü¿¡]/i;

/** Common English words to avoid treating as Spanish when unaccented. */
const ENGLISH_STOP = new Set([
  "the", "a", "an", "is", "are", "was", "were", "i", "you", "it", "to", "and", "or",
  "of", "in", "on", "for", "that", "this", "with", "have", "yes", "no", "ok", "okay",
  "um", "uh", "hello", "hi", "thanks", "thank", "please", "me", "my", "we", "they",
  "what", "how", "when", "where", "why", "can", "could", "would", "should", "just",
  "say", "try", "like", "go", "get", "got", "think", "know", "want", "need", "make",
  "said", "now", "here", "there", "then", "some", "any", "all", "not", "but", "so",
  "very", "really", "also", "well", "good", "bad", "one", "two", "three", "do", "did",
  "does", "about", "from", "up", "out", "if", "as", "at", "be", "been", "being",
  "order", "want", "coffee", "water", "food", "drink", "something", "thing", "again",
]);

/**
 * Unaccented tokens that are plausibly Spanish (Whisper often drops accents).
 * Used only to keep runs that include at least one likely-Spanish word.
 */
const SPANISH_TOKEN_HINT = new Set([
  "quisiera", "gracias", "hola", "llamo", "llama", "donde", "dónde", "está", "esta",
  "cuesta", "cuánto", "cuanto", "mesa", "para", "dos", "tengo", "reserva", "encantado",
  "encantada", "cuenta", "favor", "café", "cafe", "una", "un", "el", "la", "los", "las",
  "por", "con", "mucho", "gusto", "nombre", "conocerte", "habitación", "habitacion",
  "llaves", "llave", "calle", "aeropuerto", "bien", "mal", "si", "sí", "no", "bueno",
  "buenas", "adiós", "adios", "perdón", "perdon",
]);

/**
 * Parses transcript lines like "User: ..." and extracts Spanish phrases the user actually said.
 * Uses Spanish orthography when present; otherwise short Latin runs excluding obvious English.
 */
function extractSpanishPhrasesFromUserTranscript(transcript: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (raw: string) => {
    const s = raw.replace(/\s+/g, " ").trim();
    if (s.length < 2) return;
    const key = s.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(s);
  };

  const lines = transcript.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^User:\s*(.+)$/i);
    if (!m) continue;
    const text = m[1].trim();
    if (!text) continue;

    const clauses = text.split(/(?<=[.!?])\s+|(?<=[,;])\s+/).map((s) => s.trim()).filter(Boolean);
    const pieces = clauses.length ? clauses : [text];

    for (const piece of pieces) {
      if (SPANISH_MARKS.test(piece) || /ñ/i.test(piece)) {
        push(piece);
        continue;
      }

      const words = piece.match(/[a-záéíóúñü]+/gi) || [];
      let run: string[] = [];
      const flushRun = () => {
        if (run.length === 0) return;
        const lowerWords = run.map((w) => w.toLowerCase());
        const hasSpanishHint = lowerWords.some((lw) => SPANISH_TOKEN_HINT.has(lw));
        if (!hasSpanishHint) {
          run = [];
          return;
        }
        const phrase = run.join(" ");
        if (phrase.length >= 2) push(phrase);
        run = [];
      };

      for (const w of words) {
        const lw = w.toLowerCase();
        if (ENGLISH_STOP.has(lw)) {
          flushRun();
          continue;
        }
        if (lw.length >= 1) run.push(w);
      }
      flushRun();
    }
  }

  return out;
}

function calculateScoreDeterministically(transcript: string, phrasesMastered: string[]): number {
  const lines = transcript.split(/\r?\n\n/);
  const userLines = lines.filter(l => /^User:/i.test(l));
  const carlosLines = lines.filter(l => /^Carlos:/i.test(l));

  if (userLines.length === 0) return 0;

  // Factor 1: Attempt rate — did the user actually speak? (30 points)
  const attemptRate = Math.min(userLines.length / Math.max(carlosLines.length, 1), 1);
  const attemptScore = Math.round(attemptRate * 30);

  // Factor 2: Spanish usage — how many Spanish phrases did they produce? (40 points)
  const spanishScore = Math.min(phrasesMastered.length * 8, 40);

  // Factor 3: Progression — did they speak more as session went on? (20 points)
  const firstHalf = userLines.slice(0, Math.floor(userLines.length / 2));
  const secondHalf = userLines.slice(Math.floor(userLines.length / 2));
  const firstAvgLen = firstHalf.reduce((a, l) => a + l.length, 0) / Math.max(firstHalf.length, 1);
  const secondAvgLen = secondHalf.reduce((a, l) => a + l.length, 0) / Math.max(secondHalf.length, 1);
  const progressionScore = secondAvgLen >= firstAvgLen ? 20 : 10;

  // Factor 4: Session completion — did they reach Act 3 ending? (10 points)
  const lastCarlos = carlosLines[carlosLines.length - 1] || "";
  const completionScore = /real Spanish|on your own|fantástico|completamente/i.test(lastCarlos) ? 10 : 5;

  const total = attemptScore + spanishScore + progressionScore + completionScore;
  return Math.min(100, Math.max(5, total));
}

function normalizePhraseList(raw: unknown, max: number): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const s = String(item).replace(/\s+/g, " ").trim();
    if (s.length < 2) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
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

    const { transcript, name, scenario } = await request.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "transcript is required" },
        { status: 400 }
      );
    }

    const phrasesForScore = extractSpanishPhrasesFromUserTranscript(transcript);

    const scenarioName = SCENARIO_NAMES[scenario as keyof typeof SCENARIO_NAMES] || scenario;

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SUMMARY_PROMPT },
        {
          role: "user",
          content: `Learner name (for tone only): ${name || "there"}\n\nAnalyze this voice lesson (scenario: ${scenarioName}).\n\nTranscript:\n${transcript}`,
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

    const score = calculateScoreDeterministically(transcript, phrasesForScore);

    if (!Array.isArray(parsed.strengths) || typeof parsed.improvement !== "string") {
      return NextResponse.json(
        { error: "Invalid response format from OpenAI" },
        { status: 500 }
      );
    }

    const sessionPhrases = normalizePhraseList(parsed.sessionPhrases, 12);
    const polishThese = normalizePhraseList(parsed.polishThese, 5);

    const displayPhrases =
      sessionPhrases.length > 0 ? sessionPhrases : phrasesForScore.slice(0, 8);

    return NextResponse.json({
      strengths: parsed.strengths.slice(0, 3).map((s: string) => String(s).trim()),
      improvement: String(parsed.improvement).trim(),
      score: Math.min(100, Math.max(0, Math.round(score))),
      confidenceStatement:
        (typeof parsed.confidenceStatement === "string" && parsed.confidenceStatement.trim()) ||
        `You're making progress with ${scenarioName}!`,
      phrasesMastered: displayPhrases,
      phrasesNeedsPractice: polishThese,
      nextSessionTeaser:
        (typeof parsed.nextSessionTeaser === "string" && parsed.nextSessionTeaser.trim()) ||
        `Next time: Carlos will push you further.`,
      phrasesLearned: displayPhrases,
      name: name || "there",
    });
  } catch (error) {
    console.error("Voice summary error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate summary",
      },
      { status: 500 }
    );
  }
}
