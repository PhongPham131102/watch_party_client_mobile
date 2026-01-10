import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useMoviesByGenre } from "../hooks/useMoviesByGenre";
import { useRouter } from "expo-router";
import { Movie } from "../types/movie.types";

interface TrendingMoviesProps {
  title?: string;
  genreSlug?: string;
  limit?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.45;

function TrendingCard({ movie, rank }: { movie: Movie; rank: number }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(`/movies/${movie.slug}`)}
      style={styles.cardContainer}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: movie.posterUrl || "" }}
          style={styles.image}
          contentFit="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.gradient}
        />
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>HD</Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {movie.title}
      </Text>
    </TouchableOpacity>
  );
}

export default function TrendingMovies({
  title = "Top Trending",
  genreSlug = "hanh-dong", // Fallback or specific slug for trending logic if API requires
  limit = 10,
}: TrendingMoviesProps) {
  const { data: genreData, isLoading } = useMoviesByGenre(genreSlug, {
    limit,
    sortBy: "totalViews",
    sortOrder: "DESC",
  });

  const movies = genreData?.data || [];

  if (isLoading || movies.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        data={movies}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <TrendingCard movie={item} rank={index + 1} />
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginRight: 12,
  },
  imageContainer: {
    width: "100%",
    height: CARD_WIDTH * 1.5,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    marginBottom: 8,
    backgroundColor: "#1f2937",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
  rankBadge: {
    position: "absolute",
    bottom: -10,
    left: 8,
  },
  rankText: {
    color: "white",
    fontSize: 60,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    fontStyle: "italic",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  cardTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
});
