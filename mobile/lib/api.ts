import { API_BASE_URL } from "./constants";

export interface StartResponse {
  audioBase64: string;
  carlosText: string;
}

export interface RespondResponse {
  userText: string;
  carlosText: string;
  audioBase64: string;
}

export interface SummaryResponse {
  strengths: string[];
  improvement: string;
  score: number;
  confidenceStatement: string;
  phrasesMastered: string[];
  phrasesNeedsPractice: string[];
  nextSessionTeaser: string;
  name: string;
}

export async function startLesson(
  scenario: string,
  name: string,
  tier?: string
): Promise<StartResponse> {
  const res = await fetch(`${API_BASE_URL}/api/voice/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario, name, tier }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to start lesson");
  }
  return res.json();
}

export async function sendVoiceResponse(params: {
  audioBlob: Blob;
  scenario: string;
  name: string;
  level: string;
  act: number;
  transcript: Array<{ role: string; text: string }>;
  previousPhrases: string;
  masteredPhrases: string;
}): Promise<RespondResponse> {
  const form = new FormData();
  form.append("audio", params.audioBlob, "recording.webm");
  form.append("scenario", params.scenario);
  form.append("name", params.name);
  form.append("level", params.level);
  form.append("act", String(params.act));
  form.append("transcript", JSON.stringify(params.transcript));
  form.append("previousPhrases", params.previousPhrases);
  form.append("masteredPhrases", params.masteredPhrases);

  const res = await fetch(`${API_BASE_URL}/api/voice/respond`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to get response");
  }
  return res.json();
}

export async function getSummary(
  transcript: string,
  name: string,
  scenario: string
): Promise<SummaryResponse> {
  const res = await fetch(`${API_BASE_URL}/api/voice/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript, name, scenario }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to generate summary");
  }
  return res.json();
}
