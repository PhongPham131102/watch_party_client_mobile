import {
  StyleSheet,
  ScrollView,
  View,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useHeroSections } from "@/hooks/useHeroSections";
import HeroSection from "@/components/HeroSection";
import MovieSwiper from "@/components/MovieSwiper";
import ContinueWatching from "@/components/ContinueWatching";
import TrendingMovies from "@/components/TrendingMovies";
import React, { useCallback, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const {
    data: heroSections,
    isLoading: isHeroLoading,
    refetch: refetchHero,
  } = useHeroSections();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchHero();
    // In a real app we might want to refetch swipers too, but React Query invalidation is better
    setRefreshing(false);
  }, [refetchHero]);

  if (isHeroLoading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ef4444"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <HeroSection heroSections={heroSections || []} />

        <ContinueWatching />
        <TrendingMovies />

        <View style={styles.listsContainer}>
          <MovieSwiper
            title="Hành động"
            genreSlug="hanh-dong"
            autoFetch={true}
          />

          <MovieSwiper title="Tội phạm" genreSlug="toi-pham" autoFetch={true} />

          <MovieSwiper
            title="Phiêu lưu"
            genreSlug="phieu-luu"
            autoFetch={true}
          />

          <MovieSwiper title="Miền tây" genreSlug="mien-tay" autoFetch={true} />

          <MovieSwiper title="Kinh dị" genreSlug="kinh-di" autoFetch={true} />
        </View>
      </ScrollView>
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
  listsContainer: {
    marginTop: 20,
  },
});
