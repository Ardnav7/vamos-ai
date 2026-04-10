import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  Colors,
  FontSize,
  Spacing,
  SCENARIOS,
  TIER_LABELS,
} from "../../lib/constants";
import {
  getProgress,
  getScenarioProgress,
  type UserProgress,
} from "../../lib/storage";
import PhraseChip from "../../components/PhraseChip";

export default function ProfileScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useFocusEffect(
    useCallback(() => {
      getProgress().then(setProgress);
    }, [])
  );

  if (!progress) return null;

  const phrases = Object.values(progress.phrases);
  const mastered = phrases.filter((p) => p.mastered || p.timesUsed >= 2);

  const handleReset = () => {
    Alert.alert("Reset all data?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace("/onboarding");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Progress</Text>
        <Text style={styles.sub}>
          {progress.name ? `${progress.name}'s` : "Your"} learning journey
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statBig}>{progress.totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statBig}>{mastered.length}</Text>
            <Text style={styles.statLabel}>Phrases</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statBig}>
              {
                SCENARIOS.filter(
                  (s) => getScenarioProgress(progress, s.id).sessionsCompleted > 0
                ).length
              }
            </Text>
            <Text style={styles.statLabel}>Scenarios</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Scenarios</Text>
        {SCENARIOS.map((s) => {
          const sp = getScenarioProgress(progress, s.id);
          return (
            <View key={s.id} style={styles.scenarioRow}>
              <Text style={styles.scenarioEmoji}>{s.emoji}</Text>
              <View style={styles.scenarioInfo}>
                <Text style={styles.scenarioName}>{s.title}</Text>
                <Text style={styles.scenarioMeta}>
                  {sp.sessionsCompleted > 0
                    ? `${TIER_LABELS[sp.tier]} · ${sp.sessionsCompleted} sessions · best ${sp.bestScore}%`
                    : "Not started"}
                </Text>
              </View>
            </View>
          );
        })}

        {mastered.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: Spacing.xxxl }]}>
              Phrase bank
            </Text>
            <View style={styles.phraseWrap}>
              {mastered.map((p) => (
                <PhraseChip key={p.spanish} text={p.spanish} variant="mastered" />
              ))}
            </View>
          </>
        )}

        <Pressable style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetText}>Reset all data</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.canvas },
  scroll: { padding: Spacing.xl, paddingBottom: 120 },
  heading: {
    color: Colors.white,
    fontSize: FontSize.xxxl,
    fontWeight: "700",
  },
  sub: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: 4,
    marginBottom: Spacing.xxl,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statBig: {
    color: Colors.brand,
    fontSize: FontSize.xxl,
    fontWeight: "700",
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: Spacing.md,
  },
  scenarioRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scenarioEmoji: { fontSize: 24, marginRight: Spacing.md },
  scenarioInfo: { flex: 1 },
  scenarioName: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: "600",
  },
  scenarioMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  phraseWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  resetBtn: {
    marginTop: Spacing.huge,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  resetText: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    fontWeight: "600",
  },
});
