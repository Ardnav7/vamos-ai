export const API_BASE_URL = "https://vamos-ai.vercel.app";

export const Colors = {
  canvas: "#080C14",
  surface: "#0F1420",
  card: "#161D2B",
  cardBorder: "#1E2A3A",
  brand: "#14B8A6",
  brandHover: "#0D9488",
  brandSoft: "rgba(20, 184, 166, 0.12)",
  brandGlow: "rgba(20, 184, 166, 0.35)",
  white: "#FFFFFF",
  text: "#E2E8F0",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  textDim: "#475569",
  danger: "#EF4444",
  success: "#10B981",
  successSoft: "rgba(16, 185, 129, 0.15)",
  successBorder: "rgba(16, 185, 129, 0.3)",
  border: "#1E293B",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  xxxl: 34,
  hero: 40,
} as const;

export type Tier = "survival" | "comfortable" | "confident";

export const TIER_LABELS: Record<Tier, string> = {
  survival: "Survival",
  comfortable: "Comfortable",
  confident: "Confident",
};

export const TIER_ORDER: Tier[] = ["survival", "comfortable", "confident"];

export type ScenarioId =
  | "cafe"
  | "meeting"
  | "airport"
  | "hotel"
  | "restaurant"
  | "shopping"
  | "directions"
  | "work";

export interface ScenarioDef {
  id: ScenarioId;
  emoji: string;
  title: string;
  description: string;
}

export const SCENARIOS: ScenarioDef[] = [
  { id: "cafe", emoji: "☕", title: "Café & Bar", description: "Order drinks and food" },
  { id: "meeting", emoji: "👋", title: "Meeting Someone", description: "Greetings and small talk" },
  { id: "airport", emoji: "✈️", title: "Airport & Travel", description: "Navigate airports" },
  { id: "hotel", emoji: "🏨", title: "Hotel Check-in", description: "Check in and ask for help" },
  { id: "restaurant", emoji: "🍽️", title: "Restaurant", description: "Order food and pay" },
  { id: "shopping", emoji: "🛒", title: "Shopping", description: "Buy and ask prices" },
  { id: "directions", emoji: "🗺️", title: "Directions", description: "Ask and follow directions" },
  { id: "work", emoji: "💼", title: "Work & Pro", description: "Meetings and intros" },
];
