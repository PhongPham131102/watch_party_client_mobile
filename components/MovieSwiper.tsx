import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Movie } from "../types/movie.types";
import MovieCard from "./MovieCard";
import { useMoviesByGenre } from "../hooks/useMoviesByGenre";

interface MovieSwiperProps {
  movies?: Movie[];
  title?: string;
  genreSlug?: string;
  autoFetch?: boolean;
}

export default function MovieSwiper({
  movies: propMovies,
  title,
  genreSlug,
  autoFetch = false,
}: MovieSwiperProps) {
  const { data: genreData, isLoading } = useMoviesByGenre(
    autoFetch && genreSlug ? genreSlug : ""
  );

  const movies = propMovies || genreData?.data || [];

  if (isLoading && autoFetch) {
    return (
      <View style={styles.skeletonContainer}>
        <ActivityIndicator color="#ef4444" />
      </View>
    );
  }

  if (!movies.length) return null;

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <FlatList
        data={movies}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <MovieCard movie={item} />}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  skeletonContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingLeft: 16,
    paddingRight: 4,
  },
});
