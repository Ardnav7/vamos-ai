import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, FontSize, Spacing } from "../lib/constants";
import { updateProgress, setOnboarded } from "../lib/storage";

const LEVELS = [
  { id: "beginner", label: "Complete beginner", sub: "I know almost nothing" },
  { id: "basics", label: "Some basics", sub: "I know a few words" },
  { id: "conversational", label: "Conversational", sub: "I can have simple chats" },
] as const;

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<string | null>(null);

  const finish = async () => {
    await updateProgress((p) => ({
      ...p,
      name: name.trim(),
      level: level || "beginner",
    }));
    await setOnboarded();
    router.replace("/(app)");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.progress}>
            {[1, 2].map((s) => (
              <View
                key={s}
                style={[
                  styles.dot,
                  s === step ? styles.dotActive : s < step ? styles.dotDone : undefined,
                ]}
              />
            ))}
          </View>

          {step === 1 && (
            <View style={styles.content}>
              <Text style={styles.stepLabel}>Step 1 of 2</Text>
              <Text style={styles.heading}>What should Carlos call you?</Text>
              <Text style={styles.sub}>Just a first name is fine.</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Sofia"
                placeholderTextColor={Colors.textDim}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => name.trim() && setStep(2)}
              />
              <Pressable
                style={[styles.cta, !name.trim() && styles.ctaDisabled]}
                disabled={!name.trim()}
                onPress={() => setStep(2)}
              >
                <Text style={styles.ctaText}>Continue</Text>
              </Pressable>
            </View>
          )}

          {step === 2 && (
            <View style={styles.content}>
              <Text style={styles.stepLabel}>Step 2 of 2</Text>
              <Text style={styles.heading}>How much Spanish do you know?</Text>
              <Text style={styles.sub}>Carlos adjusts from wherever you are.</Text>
              <View style={styles.levels}>
                {LEVELS.map((l) => (
                  <Pressable
                    key={l.id}
                    style={[
                      styles.levelCard,
                      level === l.id && styles.levelCardActive,
                    ]}
                    onPress={() => setLevel(l.id)}
                  >
                    <Text style={styles.levelLabel}>{l.label}</Text>
                    <Text style={styles.levelSub}>{l.sub}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                style={[styles.cta, !level && styles.ctaDisabled]}
                disabled={!level}
                onPress={finish}
              >
                <Text style={styles.ctaText}>Start learning</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.canvas },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: Spacing.xxl },
  progress: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.huge,
  },
  dot: {
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  dotActive: { width: 40, backgroundColor: Colors.brand },
  dotDone: { backgroundColor: Colors.brandGlow },
  content: { flex: 1, justifyContent: "center" },
  stepLabel: {
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
    marginBottom: Spacing.sm,
    lineHeight: 42,
  },
  sub: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    marginBottom: Spacing.xxxl,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: Spacing.lg,
    fontSize: FontSize.lg,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.lg,
  },
  levels: { gap: Spacing.md, marginBottom: Spacing.xxl },
  levelCard: {
    padding: Spacing.lg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  levelCardActive: {
    borderColor: Colors.brand,
    backgroundColor: Colors.brandSoft,
  },
  levelLabel: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: "600",
    marginBottom: 4,
  },
  levelSub: { color: Colors.textSecondary, fontSize: FontSize.sm },
  cta: {
    backgroundColor: Colors.brand,
    borderRadius: 14,
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  ctaDisabled: { opacity: 0.3 },
  ctaText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: "700",
  },
});
