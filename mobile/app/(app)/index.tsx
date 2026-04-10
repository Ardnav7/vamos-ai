import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  Colors,
  FontSize,
  Spacing,
  SCENARIOS,
} from "../../lib/constants";
import {
  getProgress,
  getScenarioProgress,
  type UserProgress,
} from "../../lib/storage";
import ScenarioCard from "../../components/ScenarioCard";

export default function HomeScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useFocusEffect(
    useCallback(() => {
      getProgress().then(setProgress);
    }, [])
  );

  if (!progress) return null;

  const totalPhrases = Object.keys(progress.phrases).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {progress.name ? `Hey, ${progress.name}` : "Hey there"}
          </Text>
          <Text style={styles.subGreeting}>Pick a scenario to practice.</Text>
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{progress.totalSessions}</Text>
            <Text style={styles.statLabel}>sessions</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{totalPhrases}</Text>
            <Text style={styles.statLabel}>phrases</Text>
          </View>
        </View>
      </View>
      <FlatList
        data={SCENARIOS}
        numColumns={2}
        contentContainerStyle={styles.grid}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const sp = getScenarioProgress(progress, item.id);
          return (
            <ScenarioCard
              emoji={item.emoji}
              title={item.title}
              description={item.description}
              tier={sp.tier}
              sessionsCompleted={sp.sessionsCompleted}
              bestScore={sp.bestScore}
              onPress={() =>
                router.push({
                  pathname: "/lesson",
                  params: {
                    scenario: item.id,
                    name: progress.name,
                    level: progress.level,
                    tier: sp.tier,
                  },
                })
              }
            />
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.canvas },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  greeting: {
    color: Colors.white,
    fontSize: FontSize.xxl,
    fontWeight: "700",
  },
  subGreeting: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: 4,
  },
  stats: { flexDirection: "row", gap: Spacing.lg },
  stat: { alignItems: "center" },
  statNum: {
    color: Colors.brand,
    fontSize: FontSize.xl,
    fontWeight: "700",
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  grid: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
});
