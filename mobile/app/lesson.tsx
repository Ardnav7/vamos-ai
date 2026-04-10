import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAudioRecorder, RecordingPresets } from "expo-audio";
import { Colors, FontSize, Spacing, SCENARIOS } from "../lib/constants";
import {
  getProgress,
  getMasteredPhrasesList,
} from "../lib/storage";
import { getPreviousPhrasesForPrompt } from "../lib/progress";
import { startLesson, sendVoiceResponse } from "../lib/api";
import {
  useAudioPlayback,
  requestMicPermission,
  configureAudioForRecording,
  configureAudioForPlayback,
} from "../lib/audio";
import CarlosAvatar from "../components/CarlosAvatar";

type Status = "loading" | "carlos-speaking" | "your-turn" | "processing" | "ended";
type Entry = { role: "carlos" | "user"; text: string };

export default function LessonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    scenario: string;
    name: string;
    level: string;
    tier: string;
  }>();

  const scenario = params.scenario || "cafe";
  const name = params.name || "";
  const level = params.level || "beginner";
  const tier = params.tier || "survival";

  const scenarioTitle =
    SCENARIOS.find((s) => s.id === scenario)?.title || scenario;

  const [status, setStatus] = useState<Status>("loading");
  const [transcript, setTranscript] = useState<Entry[]>([]);
  const [micGranted, setMicGranted] = useState(false);
  const [masteredPhrases, setMasteredPhrases] = useState("");
  const [previousPhrases, setPreviousPhrases] = useState("");

  const scrollRef = useRef<ScrollView>(null);
  const { play, stop } = useAudioPlayback();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => {
    (async () => {
      const granted = await requestMicPermission();
      setMicGranted(granted);
      if (!granted) {
        Alert.alert(
          "Microphone needed",
          "VamosAI needs mic access so you can practice speaking Spanish."
        );
      }
      const p = await getProgress();
      setMasteredPhrases(getMasteredPhrasesList(p).join(", "));
      setPreviousPhrases(getPreviousPhrasesForPrompt(p));
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatus("loading");
        const data = await startLesson(scenario, name, tier);
        if (cancelled) return;
        setTranscript([{ role: "carlos", text: data.carlosText }]);
        setStatus("carlos-speaking");
        await play(data.audioBase64);
        if (cancelled) return;
        setStatus("your-turn");
      } catch (err) {
        if (!cancelled) {
          console.error("[lesson] start error:", err);
          setStatus("your-turn");
        }
      }
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, [scenario, name, tier]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [transcript]);

  const startRecording = useCallback(async () => {
    if (status !== "your-turn" || !micGranted) return;
    try {
      await configureAudioForRecording();
      recorder.record();
    } catch (err) {
      console.error("[lesson] record error:", err);
    }
  }, [status, micGranted, recorder]);

  const stopRecording = useCallback(async () => {
    if (!recorder.isRecording) return;
    try {
      await recorder.stop();
      await configureAudioForPlayback();
      setStatus("processing");

      const uri = recorder.uri;
      if (!uri) {
        setStatus("your-turn");
        return;
      }

      const ext = Platform.OS === "ios" ? "m4a" : "webm";
      const mimeType = Platform.OS === "ios" ? "audio/m4a" : "audio/webm";

      const response = await fetch(uri);
      const blob = await response.blob();
      const audioBlob = new Blob([blob], { type: mimeType });

      const data = await sendVoiceResponse({
        audioBlob,
        scenario,
        name,
        level,
        act: Math.min(3, Math.floor(transcript.length / 4) + 1),
        transcript: transcript.map((t) => ({
          role: t.role,
          text: t.text,
        })),
        previousPhrases,
        masteredPhrases,
      });

      setTranscript((prev) => [
        ...prev,
        { role: "user", text: data.userText },
        { role: "carlos", text: data.carlosText },
      ]);

      setStatus("carlos-speaking");
      await play(data.audioBase64);
      setStatus("your-turn");
    } catch (err) {
      console.error("[lesson] respond error:", err);
      setStatus("your-turn");
    }
  }, [recorder, scenario, name, level, transcript, masteredPhrases, play]);

  const endLesson = useCallback(async () => {
    stop();
    if (recorder.isRecording) {
      await recorder.stop();
    }
    setStatus("ended");

    const fullTranscript = transcript
      .map((t) => `${t.role === "carlos" ? "Carlos" : "User"}: ${t.text}`)
      .join("\n\n");

    router.replace({
      pathname: "/summary",
      params: {
        transcript: fullTranscript,
        name: name || "there",
        scenario,
      },
    });
  }, [transcript, name, scenario, stop, recorder, router]);

  const statusText = (() => {
    switch (status) {
      case "loading":
        return "Setting up...";
      case "carlos-speaking":
        return "Carlos is speaking";
      case "your-turn":
        return "Your turn — hold to speak";
      case "processing":
        return "Processing...";
      default:
        return "";
    }
  })();

  const micActive = status === "your-turn" && micGranted;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            stop();
            router.back();
          }}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.scenarioTitle}>{scenarioTitle}</Text>
        <Pressable onPress={endLesson}>
          <Text style={styles.endText}>End</Text>
        </Pressable>
      </View>

      <View style={styles.center}>
        <CarlosAvatar size={80} speaking={status === "carlos-speaking"} />
        <Text style={styles.status}>{statusText}</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.transcript}
        contentContainerStyle={styles.transcriptContent}
      >
        {transcript.map((entry, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              entry.role === "user" ? styles.userBubble : styles.carlosBubble,
            ]}
          >
            <Text style={styles.bubbleRole}>
              {entry.role === "carlos" ? "Carlos" : "You"}
            </Text>
            <Text style={styles.bubbleText}>{entry.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.micArea}>
        <Pressable
          disabled={!micActive}
          onPressIn={startRecording}
          onPressOut={stopRecording}
          style={({ pressed }) => [
            styles.micBtn,
            micActive && styles.micBtnActive,
            pressed && micActive && styles.micBtnRecording,
            status === "processing" && styles.micBtnProcessing,
          ]}
        >
          <Text style={styles.micIcon}>🎙️</Text>
        </Pressable>
        <Text style={styles.micHint}>
          {micActive ? "Hold to speak" : ""}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.canvas },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backText: { color: Colors.textSecondary, fontSize: FontSize.md },
  scenarioTitle: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: "600",
  },
  endText: { color: Colors.textMuted, fontSize: FontSize.sm },
  center: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  status: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  transcript: { flex: 1 },
  transcriptContent: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  bubble: {
    borderRadius: 16,
    padding: Spacing.lg,
    maxWidth: "85%",
  },
  carlosBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.brandSoft,
    borderWidth: 1,
    borderColor: Colors.brandGlow,
  },
  bubbleRole: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  bubbleText: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  micArea: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    paddingBottom: Spacing.huge,
  },
  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.border,
  },
  micBtnActive: {
    borderColor: Colors.brand,
    backgroundColor: Colors.surface,
  },
  micBtnRecording: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
    transform: [{ scale: 1.1 }],
  },
  micBtnProcessing: {
    opacity: 0.5,
  },
  micIcon: { fontSize: 28 },
  micHint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.sm,
  },
});
