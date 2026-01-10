import React, { useEffect } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useWatchHistoryStore } from "../store/watch-history.store";
import { useAuthStore } from "../store/auth.store";
import MovieCard from "./MovieCard";

export default function ContinueWatching() {
  const { history, isLoading, fetchHistory } = useWatchHistoryStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory(1, 10);
    }
  }, [isAuthenticated, fetchHistory]);

  if (!isAuthenticated || (!isLoading && history.length === 0)) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Continue Watching</Text>
      <FlatList
        data={history}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <MovieCard movie={item.movie} />}
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
