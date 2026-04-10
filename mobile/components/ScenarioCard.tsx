import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Colors, FontSize, Spacing, TIER_LABELS } from "../lib/constants";
import type { Tier } from "../lib/constants";

interface Props {
  emoji: string;
  title: string;
  description: string;
  tier: Tier;
  sessionsCompleted: number;
  bestScore: number;
  onPress: () => void;
}

export default function ScenarioCard({
  emoji,
  title,
  description,
  tier,
  sessionsCompleted,
  bestScore,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.footer}>
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>{TIER_LABELS[tier]}</Text>
        </View>
        {sessionsCompleted > 0 && (
          <Text style={styles.score}>{bestScore}%</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    margin: Spacing.xs,
  },
  cardPressed: {
    borderColor: Colors.brand,
    backgroundColor: Colors.surface,
  },
  emoji: { fontSize: 28, marginBottom: Spacing.sm },
  title: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  tierBadge: {
    backgroundColor: Colors.brandSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tierText: {
    color: Colors.brand,
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
  score: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
});
