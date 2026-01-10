import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Pressable,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { movieService } from "@/services/movie.service";
import { Movie } from "@/types/movie.types";
import MovieCard from "@/components/MovieCard";
import { Colors } from "@/constants/theme";
import { StatusBar } from "expo-status-bar";

export default function MyListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await movieService.getFavoriteMovies();
      // The backend returns favorites in data.data or data based on structure
      setMovies(response.data.data || []);
    } catch (error) {
      console.error("Fetch favorites error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Movie }) => (
    <View style={styles.gridItem}>
      <MovieCard movie={item} width={180} height={200} />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Danh sách của tôi</Text>
          {movies.length > 0 && (
            <Text style={styles.headerSubtitle}>{movies.length} nội dung</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#ef4444" />
        </View>
      ) : (
        <FlatList
          data={movies}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons
                name="heart-dislike-outline"
                size={64}
                color="#374151"
                style={{ marginBottom: 16 }}
              />
              <Text style={styles.emptyText}>
                Bạn chưa thêm phim nào vào danh sách
              </Text>
              <Pressable
                style={styles.exploreButton}
                onPress={() => router.push("/explore")}
              >
                <Text style={styles.exploreButtonText}>Khám phá ngay</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0f14",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  gridItem: {
    width: "48%",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
