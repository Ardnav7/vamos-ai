import type { Tier, ScenarioId } from "./constants";
import { TIER_ORDER } from "./constants";
import { getProgress, type UserProgress, type PhraseEntry } from "./storage";

/**
 * Given the current progress, return phrases due for spaced-repetition warm-up.
 * Picks phrases the user hasn't used in the last 2 days, prioritizing those
 * with fewer uses. Returns up to `limit` phrases.
 */
export function getDueWarmupPhrases(
  progress: UserProgress,
  limit = 3
): PhraseEntry[] {
  const now = Date.now();
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

  return Object.values(progress.phrases)
    .filter((p) => {
      const lastUsedMs = new Date(p.lastUsed).getTime();
      return now - lastUsedMs > twoDaysMs;
    })
    .sort((a, b) => a.timesUsed - b.timesUsed)
    .slice(0, limit);
}

/**
 * Get phrases that the user has from a specific scenario's sessions.
 * Useful for building the warm-up portion of the prompt.
 */
export function getPreviousPhrasesForPrompt(
  progress: UserProgress
): string {
  const phrases = Object.values(progress.phrases)
    .filter((p) => p.timesUsed >= 1)
    .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
    .slice(0, 8)
    .map((p) => p.spanish);
  return phrases.join(", ");
}

/**
 * Determine the next tier for a scenario based on score and sessions.
 */
export function computeNextTier(
  currentTier: Tier,
  sessionsCompleted: number,
  score: number
): Tier {
  const currentIdx = TIER_ORDER.indexOf(currentTier);

  if (
    currentTier === "survival" &&
    score >= 70 &&
    sessionsCompleted >= 2
  ) {
    return "comfortable";
  }

  if (
    currentTier === "comfortable" &&
    score >= 80 &&
    sessionsCompleted >= 5
  ) {
    return "confident";
  }

  return currentTier;
}

/**
 * Merge new phrases from a session summary into the user's phrase bank.
 */
export function mergePhrases(
  existing: Record<string, PhraseEntry>,
  newPhrases: string[],
  needsPractice: string[] = []
): Record<string, PhraseEntry> {
  const merged = { ...existing };
  const now = new Date().toISOString();

  for (const phrase of newPhrases) {
    const key = phrase.toLowerCase().trim();
    if (!key) continue;
    const prev = merged[key];
    const timesUsed = (prev?.timesUsed || 0) + 1;
    merged[key] = {
      spanish: phrase,
      english: prev?.english || "",
      timesUsed,
      lastUsed: now,
      mastered: timesUsed >= 2,
    };
  }

  for (const phrase of needsPractice) {
    const key = phrase.toLowerCase().trim();
    if (!key || merged[key]) continue;
    merged[key] = {
      spanish: phrase,
      english: "",
      timesUsed: 0,
      lastUsed: now,
      mastered: false,
    };
  }

  return merged;
}

/**
 * Get overall stats from progress.
 */
export function getStats(progress: UserProgress) {
  const phrases = Object.values(progress.phrases);
  return {
    totalSessions: progress.totalSessions,
    totalPhrases: phrases.length,
    masteredPhrases: phrases.filter((p) => p.mastered).length,
    scenariosStarted: Object.values(progress.scenarios).filter(
      (s) => s.sessionsCompleted > 0
    ).length,
  };
}
