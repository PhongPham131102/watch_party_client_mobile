import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Pressable,
  Dimensions,
  Share,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { movieService } from "@/services/movie.service";
import { roomService } from "@/services/room.service";
import { Movie, Episode } from "@/types/movie.types";
import { RoomType } from "@/types/room.types";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import VideoPlayer from "@/components/VideoPlayer";
import { LinearGradient } from "expo-linear-gradient";
import MovieSwiper from "@/components/MovieSwiper";
import { useAuthStore } from "@/store/auth.store";
import Toast from "react-native-toast-message";
import MovieComments from "@/components/MovieComments";

const { width } = Dimensions.get("window");

export default function MovieDetailScreen() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);

  // Initial Fetch
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        if (typeof slug !== "string") return;
        setLoading(true);

        const [movieData, recommendationsData] = await Promise.all([
          movieService.getMovieBySlug(slug),
          movieService.getRecommendations(slug, 12),
        ]);

        setMovie(movieData);
        setRecommendations(recommendationsData);

        // Set initial episode if series
        if (movieData?.episodes?.length) {
          setCurrentEpisode(movieData.episodes[0]);
        }

        // Check favorite status if logged in
        if (isAuthenticated && movieData?.id) {
          const { isFavorite } = await movieService.checkIsFavorite(
            movieData.id
          );
          setIsFavorite(isFavorite);
        }
      } catch (error) {
        console.error("Failed to fetch movie details", error);
        Toast.show({
          type: "error",
          text1: "Lỗi loading",
          text2: "Không thể tải thông tin phim.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [slug, isAuthenticated]);

  // Derived State
  const streamUrl = useMemo(() => {
    const target = currentEpisode || (movie?.episodes?.[0] ?? null);
    if (!target) return null;
    return (
      target.masterM3u8Minio ||
      target.masterM3u8S3 ||
      target.qualitiesMinio?.[0]?.url ||
      target.qualitiesS3?.[0]?.url
    );
  }, [currentEpisode, movie]);

  const ratingValue = movie?.averageRating
    ? Number(Number(movie.averageRating).toFixed(1))
    : null;

  const runtimeLabel = useMemo(() => {
    if (!movie?.durationMinutes) return "???";
    const hours = Math.floor(movie.durationMinutes / 60);
    const minutes = movie.durationMinutes % 60;
    if (!hours) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  }, [movie]);

  const genres = movie?.genres?.map((g) => g.name).join(" • ") || "";
  const directors =
    movie?.directors?.map((d) => d.name).join(", ") || "Đang cập nhật";
  const actors =
    movie?.actors?.map((a) => a.name).join(", ") || "Đang cập nhật";

  // Handlers
  const handlePlay = () => {
    if (!streamUrl) {
      Toast.show({
        type: "info",
        text1: "Chưa có link",
        text2: "Phim này chưa có link xem.",
      });
      return;
    }
    setIsPlaying(true);
  };

  const handleEpisodeSelect = (episode: Episode) => {
    setCurrentEpisode(episode);
    setIsPlaying(true);
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      Toast.show({
        type: "info",
        text1: "Yêu cầu đăng nhập",
        text2: "Vui lòng đăng nhập để thêm vào danh sách.",
      });
      router.push("/login");
      return;
    }
    if (!movie?.id) return;

    try {
      // Optimistic update
      const loggedState = !isFavorite;
      setIsFavorite(loggedState);

      await movieService.toggleFavorite(movie.id);

      Toast.show({
        type: "success",
        text1: loggedState ? "Đã thêm vào danh sách" : "Đã xóa khỏi danh sách",
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error("Toggle favorite error", error);
      setIsFavorite(!isFavorite); // Revert
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể cập nhật danh sách.",
      });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Xem phim ${movie?.title || "hay"} tại WatchParty!`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View
        style={[styles.container, styles.center, { paddingTop: insets.top }]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>Không tìm thấy phim</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  // Determine if it's a series to show specific UI
  const isSeries = movie.contentType === "series";
  const hasEpisodes = (movie.episodes?.length ?? 0) > 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <Stack.Screen options={{ headerShown: false }} />

      {isPlaying && streamUrl ? (
        <View style={[styles.playerContainer, { paddingTop: insets.top }]}>
          <Pressable
            style={styles.closeButton}
            onPress={() => setIsPlaying(false)}
          >
            <Ionicons name="close" size={28} color="white" />
          </Pressable>
          <VideoPlayer
            uri={streamUrl}
            poster={movie.backdropUrl || movie.posterUrl || undefined}
          />
          {/* Simple Episode Selector overlay or distinct view could go here, 
              but for now keeping it simple: close to change ep */}
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Back Button */}
          <View style={[styles.header, { top: insets.top + 10 }]}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.iconButtonBlur,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
          </View>

          {/* Hero Section */}
          <View style={styles.heroContainer}>
            <Image
              source={{ uri: movie.backdropUrl || movie.posterUrl || "" }}
              style={styles.backdrop}
              contentFit="cover"
              transition={500}
            />
            <LinearGradient
              colors={["transparent", "rgba(14,15,20,0.2)", "#0e0f14"]}
              style={styles.gradientOverlay}
            />

            {/* Play Button Overlay (Optional, but using standard buttons below) */}
          </View>

          {/* Content Body */}
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{movie.title}</Text>

            {/* Metadata Row */}
            <View style={styles.metaRow}>
              {ratingValue !== null && (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={14} color="#eab308" />
                  <Text style={styles.ratingText}>{ratingValue}</Text>
                </View>
              )}
              <Text style={styles.metaText}>{movie.releaseYear}</Text>
              <View style={styles.dot} />
              <Text style={styles.metaText}>{runtimeLabel}</Text>
              <View style={styles.dot} />
              <View style={styles.qualityBadge}>
                <Text style={styles.qualityText}>HD</Text>
              </View>
            </View>

            <Text style={styles.genresText}>{genres}</Text>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.playButton,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
                onPress={handlePlay}
              >
                <Ionicons name="play" size={22} color="black" />
                <Text style={styles.playButtonText}>
                  {isSeries && currentEpisode
                    ? `Xem tập ${currentEpisode.episodeNumber}`
                    : "Chiếu phát"}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && { backgroundColor: "rgba(255,255,255,0.15)" },
                ]}
                onPress={handleToggleFavorite}
              >
                <Ionicons
                  name={isFavorite ? "checkmark" : "add"}
                  size={24}
                  color={isFavorite ? "#ef4444" : "white"}
                />
                <Text
                  style={[
                    styles.secondaryButtonText,
                    isFavorite && { color: "#ef4444" },
                  ]}
                >
                  {isFavorite ? "Đã lưu" : "DS của tôi"}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && { backgroundColor: "rgba(255,255,255,0.15)" },
                ]}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={24} color="white" />
                <Text style={styles.secondaryButtonText}>Chia sẻ</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && { backgroundColor: "rgba(255,255,255,0.15)" },
                ]}
                onPress={async () => {
                  if (!isAuthenticated) {
                    Toast.show({
                      type: "info",
                      text1: "Yêu cầu đăng nhập",
                      text2: "Vui lòng đăng nhập để tạo phòng.",
                    });
                    router.push("/login");
                    return;
                  }

                  try {
                    Toast.show({
                      type: "info",
                      text1: "Đang tạo phòng...",
                      autoHide: false,
                    });

                    const response = await roomService.createRoom({
                      name: `Phòng của tôi - ${movie.title}`,
                      type: RoomType.PUBLIC,
                    } as any);

                    Toast.hide();

                    if (response.data?.code) {
                      router.push(`/room/${response.data.code}`);
                    }
                  } catch (error) {
                    Toast.hide();
                    Toast.show({
                      type: "error",
                      text1: "Lỗi",
                      text2: "Không thể tạo phòng xem chung.",
                    });
                  }
                }}
              >
                <Ionicons name="people-outline" size={24} color="white" />
                <Text style={styles.secondaryButtonText}>Xem chung</Text>
              </Pressable>
            </View>

            {/* Description */}
            <Pressable onPress={() => setExpandedDesc(!expandedDesc)}>
              <Text
                style={styles.description}
                numberOfLines={expandedDesc ? undefined : 3}
              >
                {movie.description || "Chưa có mô tả."}
              </Text>
              {movie.description && movie.description.length > 150 && (
                <Text style={styles.moreText}>
                  {expandedDesc ? "Thu gọn" : "Xem thêm"}
                </Text>
              )}
            </Pressable>

            {/* Cast & Crew */}
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>
                Đạo diễn: <Text style={styles.infoValue}>{directors}</Text>
              </Text>
              <Text style={styles.infoLabel}>
                Diễn viên: <Text style={styles.infoValue}>{actors}</Text>
              </Text>
            </View>

            {/* Episodes List (for Series) */}
            {isSeries && hasEpisodes && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Danh sách tập</Text>
                  <Text style={styles.episodeCount}>
                    {movie.episodes!.length} tập
                  </Text>
                </View>

                <View style={styles.episodeVerticalList}>
                  {movie.episodes!.map((ep) => {
                    const isSelected = currentEpisode?.id === ep.id;
                    const durationText = ep.durationMinutes
                      ? `${ep.durationMinutes}m`
                      : "";

                    return (
                      <Pressable
                        key={ep.id}
                        style={[
                          styles.episodeItem,
                          isSelected && styles.episodeItemActive,
                        ]}
                        onPress={() => handleEpisodeSelect(ep)}
                      >
                        <View style={styles.episodeMainInfo}>
                          <View
                            style={[
                              styles.episodeNumberBox,
                              isSelected && styles.episodeNumberBoxActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.episodeNumberText,
                                isSelected && styles.episodeNumberTextActive,
                              ]}
                            >
                              {ep.episodeNumber}
                            </Text>
                          </View>
                          <View style={styles.episodeTexts}>
                            <Text
                              style={[
                                styles.episodeTitle,
                                isSelected && styles.episodeTitleActive,
                              ]}
                              numberOfLines={1}
                            >
                              {ep.title || `Tập ${ep.episodeNumber}`}
                            </Text>
                            {durationText ? (
                              <Text style={styles.episodeDuration}>
                                {durationText}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                        {isSelected && (
                          <Ionicons
                            name="play-circle"
                            size={24}
                            color="#ef4444"
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Phim tương tự</Text>
                <MovieSwiper movies={recommendations} />
              </View>
            )}

            {/* Comments Section */}
            {movie?.id && <MovieComments movieId={movie.id} />}

            {/* Bottom Padding */}
            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0f14",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0e0f14",
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  playerContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 20,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    position: "absolute",
    left: 20,
    zIndex: 10,
  },
  iconButtonBlur: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  heroContainer: {
    width: width,
    height: 450, // Tall hero
    position: "relative",
  },
  backdrop: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%",
    justifyContent: "flex-end",
  },
  contentContainer: {
    marginTop: -120, // Pull up Content to overlap gradient
    paddingHorizontal: 20,
  },
  title: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    color: "#eab308",
    fontSize: 14,
    fontWeight: "700",
  },
  metaText: {
    color: "#d1d5db",
    fontSize: 14,
    fontWeight: "500",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#6b7280",
  },
  qualityBadge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  qualityText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  genresText: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  playButton: {
    flex: 2,
    backgroundColor: "white", // Primary color (white for high contrast on dark)
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  playButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 4,
  },
  secondaryButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  description: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  moreText: {
    color: "#cbd5e1", // or primary brand color
    fontWeight: "600",
    marginBottom: 16,
  },
  infoSection: {
    marginTop: 12,
    gap: 4,
    marginBottom: 24,
  },
  infoLabel: {
    color: "#9ca3af",
    fontSize: 14,
  },
  infoValue: {
    color: "#e5e7eb",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  episodeCount: {
    color: "#9ca3af",
    fontSize: 14,
  },
  episodeVerticalList: {
    gap: 12,
  },
  episodeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  episodeItemActive: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "#ef4444",
  },
  episodeMainInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  episodeNumberBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  episodeNumberBoxActive: {
    backgroundColor: "#ef4444",
  },
  episodeNumberText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  episodeNumberTextActive: {
    color: "white",
  },
  episodeTexts: {
    flex: 1,
  },
  episodeTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  episodeTitleActive: {
    color: "#ef4444",
  },
  episodeDuration: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    color: "white",
    fontSize: 18,
    marginBottom: 12,
  },
  backLink: {
    color: "#ef4444",
    fontSize: 16,
  },
});
