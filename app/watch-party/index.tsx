import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { roomService, Room } from "@/services/room.service";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";

export default function WatchPartyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicRooms();
  }, []);

  const fetchPublicRooms = async () => {
    try {
      setLoading(true);
      const response = await roomService.getCurrentPublicRoom();
      setPublicRooms(response.data || []);
    } catch (error: any) {
      console.error("Error fetching public rooms:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải danh sách phòng",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = (code: string) => {
    router.push(`/room/${code}`);
  };

  const renderRoomCard = ({ item }: { item: Room }) => (
    <Pressable
      style={({ pressed }) => [styles.roomCard, pressed && { opacity: 0.7 }]}
      onPress={() => handleJoinRoom(item.code)}
    >
      <View style={styles.roomCardHeader}>
        <View style={styles.roomIconContainer}>
          <Ionicons name="people" size={24} color="#ef4444" />
        </View>
        <View style={styles.roomInfo}>
          <Text style={styles.roomName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.roomCode}>Code: {item.code}</Text>
        </View>
      </View>
      <View style={styles.roomCardFooter}>
        <View style={styles.viewersContainer}>
          <Ionicons name="eye" size={16} color="#9ca3af" />
          <Text style={styles.viewersText}>
            {item.currentViewers || 0} đang xem
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient
        colors={["#ef4444", "#dc2626"]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Watch Party</Text>
        <Text style={styles.headerSubtitle}>
          Xem phim cùng bạn bè theo thời gian thực
        </Text>
      </LinearGradient>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.primaryAction,
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => router.push("/watch-party/create")}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Tạo phòng mới</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.secondaryAction,
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => router.push("/watch-party/join")}
        >
          <Ionicons name="enter" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Tham gia phòng</Text>
        </Pressable>
      </View>

      {/* Public Rooms List */}
      <View style={styles.roomsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Phòng công khai</Text>
          <Pressable onPress={fetchPublicRooms}>
            <Ionicons name="refresh" size={20} color="#9ca3af" />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ef4444" />
          </View>
        ) : (
          <FlatList
            data={publicRooms}
            keyExtractor={(item) => item.id}
            renderItem={renderRoomCard}
            contentContainerStyle={styles.roomsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="film-outline" size={48} color="#6b7280" />
                <Text style={styles.emptyText}>
                  Chưa có phòng công khai nào
                </Text>
                <Text style={styles.emptySubtext}>
                  Hãy tạo phòng mới để bắt đầu!
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0f14",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryAction: {
    backgroundColor: "#ef4444",
  },
  secondaryAction: {
    backgroundColor: "#374151",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  roomsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  roomsList: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtext: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 4,
  },
  roomCard: {
    backgroundColor: "#1a1b20",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  roomCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  roomIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  roomCode: {
    color: "#9ca3af",
    fontSize: 13,
  },
  roomCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewersContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  viewersText: {
    color: "#9ca3af",
    fontSize: 13,
  },
});
