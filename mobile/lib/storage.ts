import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Tier, ScenarioId } from "./constants";

export interface PhraseEntry {
  spanish: string;
  english: string;
  timesUsed: number;
  lastUsed: string;
  mastered: boolean;
}

export interface ScenarioProgress {
  tier: Tier;
  sessionsCompleted: number;
  bestScore: number;
}

export interface UserProgress {
  name: string;
  email: string;
  level: string;
  totalSessions: number;
  phrases: Record<string, PhraseEntry>;
  scenarios: Record<string, ScenarioProgress>;
}

const PROGRESS_KEY = "vamosai_progress";
const ONBOARDED_KEY = "vamosai_onboarded";

const DEFAULT_PROGRESS: UserProgress = {
  name: "",
  email: "",
  level: "beginner",
  totalSessions: 0,
  phrases: {},
  scenarios: {},
};

export async function getProgress(): Promise<UserProgress> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export async function saveProgress(p: UserProgress): Promise<void> {
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

export async function updateProgress(
  updater: (p: UserProgress) => UserProgress
): Promise<UserProgress> {
  const current = await getProgress();
  const next = updater(current);
  await saveProgress(next);
  return next;
}

export function getScenarioProgress(
  p: UserProgress,
  id: ScenarioId
): ScenarioProgress {
  return (
    p.scenarios[id] ?? { tier: "survival", sessionsCompleted: 0, bestScore: 0 }
  );
}

export function getMasteredPhrasesList(p: UserProgress): string[] {
  return Object.values(p.phrases)
    .filter((e) => e.mastered || e.timesUsed >= 2)
    .map((e) => e.spanish);
}

export async function isOnboarded(): Promise<boolean> {
  const v = await AsyncStorage.getItem(ONBOARDED_KEY);
  return v === "true";
}

export async function setOnboarded(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDED_KEY, "true");
}
