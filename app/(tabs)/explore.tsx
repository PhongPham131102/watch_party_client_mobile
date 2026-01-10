import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  FlatList,
  Pressable,
  Platform,
  ScrollView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { movieService } from "@/services/movie.service";
import { Movie } from "@/types/movie.types";
import MovieCard from "@/components/MovieCard";
import { StatusBar } from "expo-status-bar";

const genres = [
  { label: "Tất cả thể loại", slug: "" },
  { label: "Hành động", slug: "hanh-dong" },
  { label: "Kinh dị", slug: "kinh-di" },
  { label: "Viễn tưởng", slug: "vien-tuong" },
  { label: "Lãng mạn", slug: "lang-man" },
  { label: "Hoạt hình", slug: "hoat-hinh" },
  { label: "Chính kịch", slug: "chinh-kich" },
];

const countries = [
  { label: "Tất cả quốc gia", slug: "" },
  { label: "Việt Nam", slug: "viet-nam" },
  { label: "Hàn Quốc", slug: "han-quoc" },
  { label: "Hoa Kỳ", slug: "hoa-ky" },
  { label: "Trung Quốc", slug: "trung-quoc" },
];

const contentTypes = [
  { label: "Tất cả loại hình", slug: "" },
  { label: "Phim lẻ", slug: "movie" },
  { label: "Phim bộ", slug: "series" },
];

const sortOptions = [
  { label: "Mới nhất", sortBy: "createdAt", sortOrder: "DESC" },
  { label: "Cũ nhất", sortBy: "createdAt", sortOrder: "ASC" },
  { label: "Xem nhiều nhất", sortBy: "totalViews", sortOrder: "DESC" },
  { label: "Đánh giá cao", sortBy: "averageRating", sortOrder: "DESC" },
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedContentType, setSelectedContentType] = useState<
    "movie" | "series" | ""
  >("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const [movies, setMovies] = useState<Movie[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Initial load or filter change
  useEffect(() => {
    setPage(1);
    setMovies([]);
    setHasMore(true);
    performSearch(
      query,
      selectedGenre,
      selectedCountry,
      selectedContentType,
      sortBy,
      sortOrder,
      1,
      false
    );
  }, [selectedGenre, selectedCountry, selectedContentType, sortBy, sortOrder]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        setPage(1);
        setMovies([]);
        performSearch(
          query,
          selectedGenre,
          selectedCountry,
          selectedContentType,
          sortBy,
          sortOrder,
          1,
          false
        );
      } else if (hasSearched) {
        setPage(1);
        setMovies([]);
        performSearch(
          "",
          selectedGenre,
          selectedCountry,
          selectedContentType,
          sortBy,
          sortOrder,
          1,
          false
        );
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (
    searchTerm: string,
    genreSlug: string,
    countrySlug: string,
    contentType: string,
    sortField: string,
    order: "ASC" | "DESC",
    pageNum: number,
    isLoadMore: boolean
  ) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const response = await movieService.getPublicMovies({
        search: searchTerm,
        genreSlugs: genreSlug ? [genreSlug] : [],
        countrySlugs: countrySlug ? [countrySlug] : [],
        contentType: (contentType as any) || undefined,
        sortBy: sortField as any,
        sortOrder: order,
        page: pageNum,
        limit: 20,
      });

      const newMovies = response.data.data;
      if (isLoadMore) {
        setMovies((prev) => [...prev, ...newMovies]);
      } else {
        setMovies(newMovies);
      }

      setTotal(response.data.meta.total);
      setHasMore(newMovies.length === 20);
      setHasSearched(
        !!searchTerm || !!genreSlug || !!countrySlug || !!contentType
      );
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    performSearch(
      query,
      selectedGenre,
      selectedCountry,
      selectedContentType,
      sortBy,
      sortOrder,
      nextPage,
      true
    );
    setPage(nextPage);
  };

  const renderItem = ({ item }: { item: Movie }) => (
    <View style={styles.gridItem}>
      <MovieCard movie={item} width={180} height={200} />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.input}
            placeholder="Tìm kiếm phim..."
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Multi-Filters Scroll */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {/* Genre Selection */}
          <View style={styles.filterGroup}>
            {genres.map((g) => (
              <Pressable
                key={g.slug}
                style={[
                  styles.filterChip,
                  selectedGenre === g.slug && styles.filterChipActive,
                ]}
                onPress={() => setSelectedGenre(g.slug)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedGenre === g.slug && styles.filterTextActive,
                  ]}
                >
                  {g.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Type Selection */}
          <View style={styles.filterGroup}>
            {contentTypes.map((c) => (
              <Pressable
                key={c.slug}
                style={[
                  styles.filterChip,
                  selectedContentType === c.slug && styles.filterChipActive,
                ]}
                onPress={() => setSelectedContentType(c.slug as any)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedContentType === c.slug && styles.filterTextActive,
                  ]}
                >
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Country Selection */}
          <View style={styles.filterGroup}>
            {countries.map((c) => (
              <Pressable
                key={c.slug}
                style={[
                  styles.filterChip,
                  selectedCountry === c.slug && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCountry(c.slug)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedCountry === c.slug && styles.filterTextActive,
                  ]}
                >
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Sort Selection */}
          <View style={styles.filterGroup}>
            {sortOptions.map((s) => (
              <Pressable
                key={`${s.sortBy}-${s.sortOrder}`}
                style={[
                  styles.filterChip,
                  sortBy === s.sortBy &&
                    sortOrder === s.sortOrder &&
                    styles.filterChipActive,
                ]}
                onPress={() => {
                  setSortBy(s.sortBy);
                  setSortOrder(s.sortOrder as any);
                }}
              >
                <Text
                  style={[
                    styles.filterText,
                    sortBy === s.sortBy &&
                      sortOrder === s.sortOrder &&
                      styles.filterTextActive,
                  ]}
                >
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Result Count */}
      {hasSearched && !loading && movies.length > 0 && (
        <View style={styles.resultSummary}>
          <Text style={styles.resultText}>
            Tìm thấy {total} kết quả{query ? ` cho “${query}”` : ""}
          </Text>
        </View>
      )}

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
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color="#ef4444"
                style={{ marginVertical: 20 }}
              />
            ) : null
          }
          ListEmptyComponent={
            hasSearched ? (
              <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>
                  Không tìm thấy phim nào phù hợp
                </Text>
              </View>
            ) : (
              <View style={styles.centerContainer}>
                <Ionicons
                  name="film-outline"
                  size={48}
                  color="#374151"
                  style={{ marginBottom: 12 }}
                />
                <Text style={styles.emptyText}>
                  Khám phá kho phim của chúng tôi
                </Text>
              </View>
            )
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
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  input: {
    flex: 1,
    color: "white",
    marginLeft: 10,
    fontSize: 16,
    height: "100%",
  },
  filterSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  filterScroll: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  filterGroup: {
    flexDirection: "row",
    gap: 8,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  filterChipActive: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "#ef4444",
  },
  filterText: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#ef4444",
  },
  resultSummary: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  resultText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
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
    marginTop: 60,
  },
  emptyText: {
    color: "#4b5563",
    fontSize: 15,
    textAlign: "center",
  },
});
