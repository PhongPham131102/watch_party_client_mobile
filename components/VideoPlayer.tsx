import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Video, ResizeMode, AVPlaybackStatus, Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";

interface VideoPlayerProps {
  uri: string;
  poster?: string;
  onBack?: () => void;
}

export default function VideoPlayer({ uri, poster, onBack }: VideoPlayerProps) {
  const video = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus>(
    {} as AVPlaybackStatus
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Configure audio session
  useEffect(() => {
    // Enable audio playback in silent mode
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  }, []);

  const handleFullscreenToggle = async () => {
    if (isFullscreen) {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    } else {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <View style={styles.container}>
      <Video
        ref={video}
        style={styles.video}
        source={{ uri }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        onPlaybackStatusUpdate={(status) => {
          setStatus(status);
          if (status.isLoaded) {
            setIsLoading(false);
          }
        }}
        posterSource={poster ? { uri: poster } : undefined}
        posterStyle={{ resizeMode: "cover" }}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      )}

      {/* Custom Overlay Controls (Visible when not playing or if needed) */}
      {/* Note: useNativeControls is true, so we rely mainly on system controls, 
          but usually we want a custom back button if fullscreen. */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "black",
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});
