import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { isOnboarded } from "../lib/storage";
import { configureAudioForPlayback } from "../lib/audio";
import { Colors } from "../lib/constants";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboardedState] = useState(false);

  useEffect(() => {
    (async () => {
      await configureAudioForPlayback();
      const done = await isOnboarded();
      setOnboardedState(done);
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.brand} size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.canvas },
          animation: "fade",
        }}
        initialRouteName={onboarded ? "(app)" : "onboarding"}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="lesson" options={{ gestureEnabled: false }} />
        <Stack.Screen name="summary" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
});
