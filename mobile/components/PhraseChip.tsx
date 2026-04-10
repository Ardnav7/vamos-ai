import React from "react";
import { Text, StyleSheet } from "react-native";
import { Colors, FontSize, Spacing } from "../lib/constants";

interface Props {
  text: string;
  variant?: "mastered" | "practice";
}

export default function PhraseChip({ text, variant = "mastered" }: Props) {
  const isMastered = variant === "mastered";
  return (
    <Text
      style={[
        styles.chip,
        isMastered ? styles.mastered : styles.practice,
      ]}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 10,
    fontSize: FontSize.sm,
    fontWeight: "500",
    overflow: "hidden",
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  mastered: {
    backgroundColor: Colors.brandSoft,
    color: Colors.brand,
    borderWidth: 1,
    borderColor: Colors.brandGlow,
  },
  practice: {
    backgroundColor: "transparent",
    color: Colors.textSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
