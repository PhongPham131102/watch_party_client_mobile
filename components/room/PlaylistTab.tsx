import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { useRoomStore } from "@/store/room.store";
import { useAuthStore } from "@/store/auth.store";
import { roomSocketService } from "@/services/room-socket.service";
import { episodeService } from "@/services/episode.service";
import { Episode } from "@/types/episode.types";
import Toast from "react-native-toast-message";
import { useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";

export default function PlaylistTab() {
  const { id: roomCode } = useLocalSearchParams<{ id: string }>();
  const {
    playlistItems,
    currentPlayingItem,
    members,
    reorderPlaylistOptimistic,
    removePlaylistItem,
  } = useRoomStore();
  const { user } = useAuthStore();

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Episode[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  // Get current user role
  const userRole = useMemo(() => {
    if (!user || !members.length) return null;
    const currentUserId = typeof user === "string" ? user : user.id;
    const member = members.find((m) => {
      const memberUserId = typeof m.user === "string" ? m.user : m.user?.id;
      return memberUserId === currentUserId;
    });
    return member?.role || null;
  }, [user, members]);

  const canManagePlaylist = userRole === "owner" || userRole === "moderator";

  // Sorted playlist for rendering
  const sortedPlaylist = useMemo(() => {
    return [...playlistItems].sort((a, b) => a.position - b.position);
  }, [playlistItems]);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        setShowResults(true);
        try {
          const response = await episodeService.searchEpisode({
            query: searchQuery,
            page: 1,
            limit: 10,
          });
          setSearchResults(response.data.episodes);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        if (searchQuery.trim().length === 0) setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleAddToPlaylist = async (episode: Episode) => {
    if (!roomCode || addingId) return;

    setAddingId(episode.id);
    try {
      const response = await roomSocketService.addToPlaylist(
        roomCode,
        episode.id
      );

      if (response.isDuplicate) {
        Toast.show({
          type: "info",
          text1: "Thông báo",
          text2: response.message,
        });
      } else {
        Toast.show({
          type: "success",
          text1: "Đã thêm vào danh sách phát",
          text2: episode.title,
        });
      }

      setSearchQuery("");
      setShowResults(false);
      Keyboard.dismiss();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể thêm vào danh sách",
      });
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!roomCode || removingId) return;

    setRemovingId(itemId);
    try {
      await roomSocketService.removeFromPlaylist(roomCode, itemId);
      Toast.show({
        type: "success",
        text1: "Đã xóa khỏi danh sách phát",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể xóa video",
      });
    } finally {
      setRemovingId(null);
    }
  };

  const handlePlayItem = async (itemId: string) => {
    if (!roomCode || !canManagePlaylist) return;

    try {
      await roomSocketService.playVideoFromPlaylist({
        roomCode,
        playlistItemId: itemId,
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể phát video",
      });
    }
  };

  const handleDragEnd = async ({ from, to }: { from: number; to: number }) => {
    if (from === to || !roomCode) return;

    // Optimistic update
    reorderPlaylistOptimistic(from, to);

    const items = sortedPlaylist;
    let newPosition: number;

    if (to === 0) {
      newPosition = items[0].position / 2;
    } else if (to === items.length - 1) {
      newPosition = items[items.length - 1].position + 1000;
    } else {
      if (to > from) {
        const itemBefore = items[to];
        const itemAfter = items[to + 1];
        newPosition = itemAfter
          ? (itemBefore.position + itemAfter.position) / 2
          : itemBefore.position + 1000;
      } else {
        const itemBefore = items[to - 1];
        const itemAfter = items[to];
        newPosition = (itemBefore.position + itemAfter.position) / 2;
      }
    }

    const movedItem = items[from];
    const itemId = movedItem.id || (movedItem as any)._id;

    try {
      await roomSocketService.reorderPlaylist(roomCode, itemId, newPosition);
    } catch (error: any) {
      console.error("Reorder failed:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể thay đổi vị trí",
      });
    }
  };

  const renderPlaylistItem = ({
    item,
    getIndex,
    drag,
    isActive,
  }: RenderItemParams<any>) => {
    const index = getIndex() ?? 0;
    const video = typeof item.video === "object" ? item.video : null;
    const itemId = item.id || (item as any)._id;
    const playingId =
      currentPlayingItem?.id || (currentPlayingItem as any)?._id;
    const isPlaying = playingId === itemId;
    const isRemoving = removingId === itemId;

    return (
      <ScaleDecorator>
        <Pressable
          style={[
            styles.itemContainer,
            isPlaying && styles.playingItem,
            isActive && styles.activeItem,
          ]}
          onPress={() => handlePlayItem(itemId)}
          onLongPress={canManagePlaylist ? drag : undefined}
          disabled={isRemoving || isActive}
        >
          <View style={styles.itemLeft}>
            {canManagePlaylist ? (
              <TouchableOpacity
                onLongPress={drag}
                delayLongPress={0}
                style={styles.dragHandle}
              >
                <Ionicons
                  name="menu"
                  size={20}
                  color={isPlaying ? "#ef4444" : "#4b5563"}
                />
              </TouchableOpacity>
            ) : (
              <Text
                style={[styles.itemNumber, isPlaying && styles.playingText]}
              >
                {index + 1}
              </Text>
            )}

            {video?.thumbnailUrl ? (
              <Image
                source={{ uri: video.thumbnailUrl }}
                style={[styles.thumbnail, isPlaying && styles.playingThumbnail]}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.thumbnail,
                  styles.thumbnailPlaceholder,
                  isPlaying && styles.playingThumbnail,
                ]}
              >
                <Ionicons
                  name="film-outline"
                  size={20}
                  color={isPlaying ? "#ef4444" : "#4b5563"}
                />
              </View>
            )}

            <View style={styles.itemInfo}>
              <Text
                style={[styles.itemTitle, isPlaying && styles.playingText]}
                numberOfLines={2}
              >
                {video?.title || "Video không xác định"}
              </Text>
              <Text
                style={[
                  styles.itemSubtitle,
                  isPlaying && styles.playingSubtext,
                ]}
              >
                {video?.movie?.title ? `${video.movie.title} - ` : ""}
                Tập {video?.episodeNumber || index + 1}
              </Text>
            </View>
          </View>

          <View style={styles.itemRight}>
            {isPlaying && (
              <View style={styles.playingIndicator}>
                <Ionicons name="stats-chart" size={16} color="#ef4444" />
                <Text style={styles.nowPlayingLabel}>Đang phát</Text>
              </View>
            )}

            {canManagePlaylist &&
              !isPlaying &&
              (isRemoving ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <TouchableOpacity
                  onPress={() => handleRemoveItem(itemId)}
                  style={styles.removeButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#6b7280" />
                </TouchableOpacity>
              ))}
          </View>
        </Pressable>
      </ScaleDecorator>
    );
  };

  const renderSearchResult = ({ item }: { item: Episode }) => {
    const isAdding = addingId === item.id;

    return (
      <View style={styles.resultItem}>
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={styles.resultThumbnail}
          contentFit="cover"
        />
        <View style={styles.resultInfo}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.resultSubtitle}>
            {item.movie?.title || "Phim lẻ"}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, isAdding && styles.addButtonDisabled]}
          onPress={() => handleAddToPlaylist(item)}
          disabled={isAdding}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>Thêm</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Section */}
      {canManagePlaylist && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm phim, video..."
              placeholderTextColor="#6b7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setShowResults(true)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          {showResults && searchQuery.length >= 2 && (
            <View style={styles.resultsOverlay}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitleLabel}>Kết quả tìm kiếm</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowResults(false);
                    Keyboard.dismiss();
                  }}
                >
                  <Text style={styles.closeText}>Đóng</Text>
                </TouchableOpacity>
              </View>

              {isSearching ? (
                <View style={styles.centerLoading}>
                  <ActivityIndicator size="large" color="#ef4444" />
                </View>
              ) : searchResults.length > 0 ? (
                <DraggableFlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }: RenderItemParams<Episode>) =>
                    renderSearchResult({ item })
                  }
                  containerStyle={styles.resultsList}
                  keyboardShouldPersistTaps="handled"
                />
              ) : (
                <View style={styles.centerLoading}>
                  <Text style={styles.noResultsText}>
                    Không tìm thấy kết quả
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Playlist Section */}
      {playlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="film-outline" size={64} color="#1f2937" />
          <Text style={styles.emptyText}>Playlist trống</Text>
          <Text style={styles.emptySubtext}>
            {canManagePlaylist
              ? "Hãy tìm và thêm video bạn yêu thích"
              : "Chủ phòng chưa thêm video nào"}
          </Text>
        </View>
      ) : (
        <DraggableFlatList
          data={sortedPlaylist}
          onDragEnd={handleDragEnd}
          keyExtractor={(item) => (item.id || (item as any)._id).toString()}
          renderItem={renderPlaylistItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: "#0e0f14",
    zIndex: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1b20",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    marginLeft: 10,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyText: {
    color: "#e5e7eb",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  emptySubtext: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1b20",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  activeItem: {
    backgroundColor: "#2a2b30",
    borderColor: "rgba(255,255,255,0.2)",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  playingItem: {
    borderColor: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  playingText: {
    color: "#ef4444",
  },
  playingSubtext: {
    color: "rgba(239, 68, 68, 0.7)",
  },
  playingThumbnail: {
    borderColor: "#ef4444",
    borderWidth: 2,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  dragHandle: {
    padding: 4,
    marginRight: -4,
  },
  itemNumber: {
    color: "#4b5563",
    fontSize: 14,
    fontWeight: "700",
    width: 20,
    textAlign: "center",
  },
  thumbnail: {
    width: 80,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#0e0f14",
  },
  thumbnailPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  itemInfo: {
    flex: 1,
    justifyContent: "center",
  },
  itemTitle: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  itemSubtitle: {
    color: "#6b7280",
    fontSize: 12,
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingLeft: 8,
  },
  playingIndicator: {
    alignItems: "center",
    gap: 2,
  },
  nowPlayingLabel: {
    color: "#ef4444",
    fontSize: 8,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  removeButton: {
    padding: 4,
  },
  resultsOverlay: {
    position: "absolute",
    top: 70,
    left: 16,
    right: 16,
    backgroundColor: "#1a1b20",
    borderRadius: 12,
    maxHeight: 400,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  resultsTitleLabel: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  closeText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
  },
  centerLoading: {
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  noResultsText: {
    color: "#6b7280",
    fontSize: 15,
  },
  resultsList: {
    flexGrow: 0,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    gap: 12,
  },
  resultThumbnail: {
    width: 100,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#1a1b20",
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  resultSubtitle: {
    color: "#6b7280",
    fontSize: 12,
  },
  addButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#374151",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});
