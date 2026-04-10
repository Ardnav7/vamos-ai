import {
  AudioModule,
  RecordingPresets,
  useAudioPlayer,
  useAudioRecorder,
} from "expo-audio";
import { useCallback, useRef } from "react";

export { useAudioPlayer, useAudioRecorder, RecordingPresets };

export async function configureAudioForPlayback(): Promise<void> {
  await AudioModule.setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: false,
  });
}

export async function configureAudioForRecording(): Promise<void> {
  await AudioModule.setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: true,
  });
}

export async function requestMicPermission(): Promise<boolean> {
  const { granted } = await AudioModule.requestRecordingPermissionsAsync();
  return granted;
}

export function base64ToUri(base64: string): string {
  return `data:audio/mpeg;base64,${base64}`;
}

export function useAudioPlayback() {
  const player = useAudioPlayer(null);
  const resolveRef = useRef<(() => void) | null>(null);

  const play = useCallback(
    async (base64: string): Promise<void> => {
      await configureAudioForPlayback();
      return new Promise<void>((resolve) => {
        resolveRef.current = resolve;
        const uri = base64ToUri(base64);
        player.replace({ uri });
        player.play();
      });
    },
    [player]
  );

  const stop = useCallback(() => {
    player.pause();
    player.seekTo(0);
    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
  }, [player]);

  player.addListener("playbackStatusUpdate", (status) => {
    if (status.didJustFinish && resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
  });

  return { play, stop, player };
}
