import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, FontSize, Spacing } from "../lib/constants";
import { getSummary, type SummaryResponse } from "../lib/api";
import { updateProgress } from "../lib/storage";
import { mergePhrases, computeNextTier } from "../lib/progress";
import ProgressRing from "../components/ProgressRing";
import PhraseChip from "../components/PhraseChip";

export default function SummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    transcript: string;
    name: string;
    scenario: string;
  }>();

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSummary(
          params.transcript || "",
          params.name || "",
          params.scenario || ""
        );
        setSummary(data);

        await updateProgress((p) => {
          const scenario = params.scenario || "";
          const prev = p.scenarios[scenario] || {
            tier: "survival" as const,
            sessionsCompleted: 0,
            bestScore: 0,
          };

          const phrases = mergePhrases(
            p.phrases,
            data.phrasesMastered,
            data.phrasesNeedsPractice
          );

          const nextTier = computeNextTier(
            prev.tier,
            prev.sessionsCompleted,
            data.score
          );

          return {
            ...p,
            totalSessions: p.totalSessions + 1,
            phrases,
            scenarios: {
              ...p.scenarios,
              [scenario]: {
                tier: nextTier,
                sessionsCompleted: prev.sessionsCompleted + 1,
                bestScore: Math.max(prev.bestScore, data.score),
              },
            },
          };
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={Colors.brand} size="large" />
        <Text style={styles.loadingText}>Carlos is reviewing your session...</Text>
      </SafeAreaView>
    );
  }

  if (error || !summary) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error || "No data"}</Text>
        <Pressable onPress={() => router.replace("/(app)")}>
          <Text style={styles.linkText}>Go home</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>Session complete</Text>
        <Text style={styles.heading}>
          {summary.name}, that was real Spanish.
        </Text>
        <Text style={styles.sub}>Here's how you did.</Text>

        <View style={styles.scoreCard}>
          <ProgressRing score={summary.score} size={96} />
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>Confidence Score</Text>
            <Text style={styles.scoreStatement}>
              {summary.confidenceStatement}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.dot, { backgroundColor: Colors.success }]} />
            <Text style={[styles.sectionTitle, { color: Colors.success }]}>
              What you did well
            </Text>
          </View>
          {summary.strengths.map((s, i) => (
            <View key={i} style={styles.strengthRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.strengthText}>{s}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.dot, { backgroundColor: Colors.brand }]} />
            <Text style={[styles.sectionTitle, { color: Colors.brand }]}>
              Focus tomorrow
            </Text>
          </View>
          <Text style={styles.bodyText}>{summary.improvement}</Text>
        </View>

        {summary.phrasesMastered.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View
                style={[styles.dot, { backgroundColor: Colors.textSecondary }]}
              />
              <Text style={styles.sectionTitle}>Phrases from this session</Text>
            </View>
            <View style={styles.phraseWrap}>
              {summary.phrasesMastered.map((p, i) => (
                <PhraseChip key={i} text={p} variant="mastered" />
              ))}
              {summary.phrasesNeedsPractice.map((p, i) => (
                <PhraseChip key={`np-${i}`} text={p} variant="practice" />
              ))}
            </View>
          </View>
        )}

        {summary.nextSessionTeaser && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.dot, { backgroundColor: Colors.textMuted }]} />
              <Text style={styles.sectionTitle}>What's next</Text>
            </View>
            <Text style={styles.bodyText}>{summary.nextSessionTeaser}</Text>
          </View>
        )}

        <Pressable
          style={styles.cta}
          onPress={() => router.replace("/(app)")}
        >
          <Text style={styles.ctaText}>Keep practising →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.canvas },
  center: {
    flex: 1,
    backgroundColor: Colors.canvas,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  scroll: { padding: Spacing.xl, paddingBottom: 120 },
  loadingText: { color: Colors.textMuted, fontSize: FontSize.sm },
  errorText: { color: Colors.danger, fontSize: FontSize.md },
  linkText: { color: Colors.brand, fontSize: FontSize.md },
  eyebrow: {
    color: Colors.brand,
    fontSize: FontSize.xs,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: Spacing.md,
  },
  heading: {
    color: Colors.white,
    fontSize: FontSize.xxxl,
    fontWeight: "700",
    lineHeight: 42,
    marginBottom: Spacing.sm,
  },
  sub: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    marginBottom: Spacing.xxl,
  },
  scoreCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xl,
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.xxl,
  },
  scoreInfo: { flex: 1 },
  scoreLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: 4,
  },
  scoreStatement: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: "500",
    lineHeight: 22,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  strengthRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  check: { color: Colors.success, fontSize: FontSize.md },
  strengthText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
  bodyText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  phraseWrap: { flexDirection: "row", flexWrap: "wrap" },
  cta: {
    backgroundColor: Colors.brand,
    borderRadius: 16,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    marginTop: Spacing.xxl,
  },
  ctaText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: "700",
  },
});
