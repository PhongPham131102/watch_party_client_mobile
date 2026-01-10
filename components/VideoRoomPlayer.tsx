import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Pressable,
  Dimensions,
  StatusBar,
} from "react-native";
import {
  Video,
  ResizeMode,
  AVPlaybackStatus,
  Audio,
  InterruptionModeIOS,
  InterruptionModeAndroid,
} from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";
import { Episode } from "@/types/episode.types";
import { RoomMemberRole } from "@/types/room.types";
import { useRoomStore } from "@/store/room.store";

interface VideoRoomPlayerProps {
  userRole?: RoomMemberRole | null;
  roomCode: string;
  episode: Episode;
  currentTime: number;
  isPlaying: boolean;
  updatedAt: number;
  onPlay: (data: {
    roomCode: string;
    isplaying: boolean;
    currentTime: number;
  }) => void;
  onPause: (data: {
    roomCode: string;
    isplaying: boolean;
    currentTime: number;
  }) => void;
  onSeek: (data: { roomCode: string; currentTime: number }) => void;
  onNextEpisode: (data: { roomCode: string }) => void;
  onPreviousEpisode: (data: { roomCode: string }) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

const VideoRoomPlayer: React.FC<VideoRoomPlayerProps> = ({
  userRole = null,
  roomCode,
  episode,
  currentTime,
  isPlaying,
  updatedAt,
  onPlay,
  onPause,
  onSeek,
  onNextEpisode,
  onPreviousEpisode,
  onFullscreenChange,
}) => {
  const { playlistItems, currentPlayingItem } = useRoomStore();
  const hasNextRef = useRef(false);
  const hasPreviousRef = useRef(false);

  // Next/Previous logic (Mirror Web lines 55-65)
  useEffect(() => {
    if (currentPlayingItem == null) return;
    const hasNext = playlistItems.some(
      (item) => item.position > currentPlayingItem?.position
    );
    hasNextRef.current = hasNext;
    const hasPrevious = playlistItems.some(
      (item) => item.position < currentPlayingItem?.position
    );
    hasPreviousRef.current = hasPrevious;
  }, [playlistItems, currentPlayingItem, episode]);

  const videoRef = useRef<Video>(null);
  const isSyncingRef = useRef(false);
  const isReadyRef = useRef(false);
  const wantToPlayRef = useRef(isPlaying);
  const endedOnceRef = useRef(false);

  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimeoutRef = useRef<any>(null);

  // wantToPlayRef sync (Web logic)
  useEffect(() => {
    wantToPlayRef.current = isPlaying;
  }, [isPlaying]);

  // Audio configuration
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    if (isPlaying && showControls) {
      resetControlsTimeout();
    } else if (!isPlaying) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      setShowControls(true);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, showControls]);

  // Sync Logic (Mirror Web lines 197-216)
  useEffect(() => {
    const video = videoRef.current;
    // CRITICAL: Avoid calling before native view is registered and loaded
    if (!video || isSyncingRef.current || !isReadyRef.current) return;

    const syncVideo = async () => {
      try {
        const status = await video.getStatusAsync();
        if (!status.isLoaded) return;

        const videoCurrentTime = status.positionMillis / 1000;
        const timeDiff = Math.abs(videoCurrentTime - currentTime);

        if (timeDiff > 1) {
          isSyncingRef.current = true;
          await video.setPositionAsync(currentTime * 1000);
          setTimeout(() => {
            isSyncingRef.current = false;
          }, 100);
        }

        if (isPlaying && !status.isPlaying) {
          await video.playAsync().catch(() => {});
        } else if (!isPlaying && status.isPlaying) {
          await video.pauseAsync().catch(() => {});
        }
      } catch (err) {
        console.warn("Sync error (potential view registry issue):", err);
      }
    };

    syncVideo();
  }, [currentTime, isPlaying, updatedAt]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) setVideoError(status.error);
      return;
    }

    // Mark as ready when first loaded
    if (!isReadyRef.current) {
      isReadyRef.current = true;
      // Initial Sync on Join (Force set position once loaded)
      const distToGoal = Math.abs(status.positionMillis / 1000 - currentTime);
      if (distToGoal > 1) {
        videoRef.current?.setPositionAsync(currentTime * 1000).catch(() => {});
      }
    }

    if (!isSyncingRef.current) {
      setLocalCurrentTime(status.positionMillis / 1000);
    }

    if (status.durationMillis) {
      setDuration(status.durationMillis / 1000);
    }

    if (status.playableDurationMillis && status.durationMillis) {
      setBuffered(
        (status.playableDurationMillis / status.durationMillis) * 100
      );
    }

    // UX Loading Logic
    if (status.isBuffering && status.positionMillis === 0) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }

    // Attempt Play (Web logic)
    if (isReadyRef.current && wantToPlayRef.current && !status.isPlaying) {
      videoRef.current?.playAsync().catch(() => {});
    }

    // Ended Logic (Web logic)
    if (status.didJustFinish) {
      if (isSyncingRef.current) return;
      if (endedOnceRef.current) return;

      const remain =
        (status.durationMillis || 0 - status.positionMillis) / 1000;
      if (remain > 0.5) return;

      endedOnceRef.current = true;
      onNextEpisode?.({ roomCode });
    }
  };

  useEffect(() => {
    isReadyRef.current = false;
    endedOnceRef.current = false;
    setIsLoading(true);
    setVideoError(null);
  }, [episode.id]);

  const togglePlay = async () => {
    if (userRole === RoomMemberRole.MEMBER) return;
    resetControlsTimeout();
    try {
      const status = await videoRef.current?.getStatusAsync();
      const currentVideoTime = status?.isLoaded
        ? status.positionMillis / 1000
        : 0;

      if (isPlaying) {
        onPause({ roomCode, isplaying: false, currentTime: currentVideoTime });
      } else {
        onPlay({ roomCode, isplaying: true, currentTime: currentVideoTime });
      }
    } catch (err) {
      console.warn("Toggle play error (native side):", err);
    }
  };

  const [barWidth, setBarWidth] = useState(0);
  const handleSeek = (e: any) => {
    if (userRole === RoomMemberRole.MEMBER || !duration || barWidth === 0)
      return;
    resetControlsTimeout();
    const { locationX } = e.nativeEvent;
    const pos = Math.max(0, Math.min(1, locationX / barWidth));
    onSeek({ currentTime: pos * duration, roomCode: roomCode });
  };

  const toggleFullscreen = async () => {
    resetControlsTimeout();
    if (!isFullscreen) {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
      setIsFullscreen(true);
      onFullscreenChange?.(true);
      StatusBar.setHidden(true);
    } else {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
      setIsFullscreen(false);
      onFullscreenChange?.(false);
      StatusBar.setHidden(false);
    }
  };

  const displayTime = isSyncingRef.current ? currentTime : localCurrentTime;
  const progressPercent = (displayTime / (duration || 1)) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={isFullscreen ? styles.fullscreenContainer : styles.container}>
      <Pressable
        onPress={() => {
          setShowControls((prev) => !prev);
        }}
        style={styles.videoWrapper}
      >
        <Video
          ref={videoRef}
          style={styles.video}
          // Use initialStatus for join-sync to avoid jumping from 0
          source={{ uri: episode.masterM3u8Minio }}
          status={{ positionMillis: currentTime * 1000, shouldPlay: isPlaying }}
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          progressUpdateIntervalMillis={500}
        />
      </Pressable>

      {isLoading && !videoError && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ef4444" />
        </View>
      )}

      {showControls && (
        <View style={styles.overlay}>
          <View style={styles.header}>
            {isFullscreen && (
              <TouchableOpacity
                onPress={toggleFullscreen}
                style={styles.fullscreenBackButton}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
            )}
            <Text style={styles.title} numberOfLines={1}>
              {episode.title}
            </Text>
          </View>

          <View style={styles.centerRow}>
            {userRole !== RoomMemberRole.MEMBER && !isLoading && (
              <>
                <TouchableOpacity
                  disabled={!hasPreviousRef.current}
                  onPress={() => onPreviousEpisode({ roomCode })}
                  style={[
                    styles.skipButton,
                    !hasPreviousRef.current && styles.disabled,
                  ]}
                >
                  <Ionicons
                    name="play-back"
                    size={isFullscreen ? 40 : 32}
                    color="white"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={togglePlay}
                  style={styles.mainPlayButton}
                >
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={isFullscreen ? 56 : 48}
                    color="white"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={!hasNextRef.current}
                  onPress={() => onNextEpisode({ roomCode })}
                  style={[
                    styles.skipButton,
                    !hasNextRef.current && styles.disabled,
                  ]}
                >
                  <Ionicons
                    name="play-forward"
                    size={isFullscreen ? 40 : 32}
                    color="white"
                  />
                </TouchableOpacity>
              </>
            )}
            {userRole === RoomMemberRole.MEMBER && (
              <View style={styles.memberLock}>
                <Ionicons
                  name="lock-closed"
                  size={32}
                  color="rgba(255,255,255,0.4)"
                />
                <Text style={styles.lockText}>Chế độ xem chung</Text>
              </View>
            )}
          </View>

          <View style={styles.bottomSection}>
            <View style={styles.bottomRow}>
              <Text style={styles.timeText}>
                {formatTime(displayTime)} / {formatTime(duration)}
              </Text>
              <TouchableOpacity onPress={toggleFullscreen}>
                <Ionicons
                  name={isFullscreen ? "contract" : "expand"}
                  size={20}
                  color="white"
                />
              </TouchableOpacity>
            </View>
            <Pressable
              onPress={handleSeek}
              onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
              style={styles.progressContainer}
            >
              <View style={styles.progressBg} pointerEvents="none">
                <View style={[styles.bufferedBar, { width: `${buffered}%` }]} />
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercent}%` },
                  ]}
                >
                  {userRole !== RoomMemberRole.MEMBER && (
                    <View style={styles.progressKnob} />
                  )}
                </View>
              </View>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" },
  fullscreenContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: Dimensions.get("window").height,
    height: Dimensions.get("window").width,
    backgroundColor: "#000",
    zIndex: 9999,
  },
  videoWrapper: { flex: 1 },
  video: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "space-between",
  },
  header: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fullscreenBackButton: {
    padding: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
  },
  title: { color: "white", fontSize: 18, fontWeight: "bold", flex: 1 },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
  },
  mainPlayButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  skipButton: { padding: 10 },
  disabled: { opacity: 0.3 },
  bottomSection: { padding: 16, paddingBottom: 20 },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  timeText: { color: "white", fontSize: 13, fontWeight: "600" },
  progressContainer: { height: 20, justifyContent: "center" },
  progressBg: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    position: "relative",
  },
  bufferedBar: {
    position: "absolute",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ef4444",
    borderRadius: 2,
    position: "relative",
  },
  progressKnob: {
    position: "absolute",
    right: -6,
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  memberLock: { alignItems: "center", gap: 12 },
  lockText: { color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "500" },
});

export default VideoRoomPlayer;
