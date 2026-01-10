import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { roomService, Room } from "@/services/room.service";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/store/auth.store";

const { width } = Dimensions.get("window");

export default function WatchPartyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [roomCode, setRoomCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    fetchPublicRooms();
  }, []);

  const fetchPublicRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await roomService.getCurrentPublicRoom();
      setPublicRooms(res.data || []);
    } catch (error) {
      console.log("Failed to fetch rooms", error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleJoinRoom = async (code: string) => {
    if (!isAuthenticated) {
      Toast.show({
        type: "info",
        text1: "Yêu cầu đăng nhập",
        text2: "Vui lòng đăng nhập để tham gia phòng.",
      });
      router.push("/login");
      return;
    }

    if (!code.trim()) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng nhập mã phòng",
      });
      return;
    }

    // Navigate to room directly
    router.push(`/room/${code.trim()}`);
  };

  const handleCreateRoom = () => {
    if (!isAuthenticated) {
      Toast.show({
        type: "info",
        text1: "Yêu cầu đăng nhập",
        text2: "Vui lòng đăng nhập để tạo phòng.",
      });
      router.push("/login");
      return;
    }
    // Navigate to create room screen
    router.push("/watch-party/create");
  };

  const features = [
    {
      icon: "film-outline",
      title: "Kho phim đa dạng",
      desc: "Thư viện phim phong phú từ các thể loại khác nhau.",
    },
    {
      icon: "play-circle-outline",
      title: "Xem đồng bộ",
      desc: "Phát video đồng bộ hoàn hảo cùng bạn bè.",
    },
    {
      icon: "chatbubbles-outline",
      title: "Trò chuyện",
      desc: "Chat thời gian thực, chia sẻ cảm xúc.",
    },
    {
      icon: "list-outline",
      title: "Playlist",
      desc: "Tạo và quản lý danh sách phát riêng.",
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Xem phim cùng nhau{"\n"}
            <Text style={styles.highlightText}>mọi lúc, mọi nơi</Text>
          </Text>
          <Text style={styles.heroDesc}>
            Kết nối và xem video đồng thời với bạn bè, chia sẻ khoảnh khắc giải
            trí theo thời gian thực.
          </Text>

          {/* Action Card */}
          <View style={styles.actionCard}>
            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                pressed && { opacity: 0.9 },
              ]}
              onPress={handleCreateRoom}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.createButtonText}>Tạo Phòng Ngay</Text>
            </Pressable>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>HOẶC</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.joinContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nhập mã phòng..."
                placeholderTextColor="#9ca3af"
                value={roomCode}
                onChangeText={setRoomCode}
                autoCapitalize="none"
              />
              <Pressable
                style={({ pressed }) => [
                  styles.joinButton,
                  pressed && { opacity: 0.9 },
                  (!roomCode.trim() || joining) && styles.disabledButton,
                ]}
                onPress={() => handleJoinRoom(roomCode)}
                disabled={!roomCode.trim() || joining}
              >
                {joining ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="enter-outline" size={20} color="white" />
                    <Text style={styles.joinButtonText}>Vào</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <View style={styles.featuresGrid}>
            {features.map((f, i) => (
              <View key={i} style={styles.featureItem}>
                <View style={styles.iconCircle}>
                  <Ionicons name={f.icon as any} size={24} color="#ef4444" />
                </View>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Public Rooms */}
        <View style={styles.roomsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Phòng đang hoạt động</Text>
            <Pressable onPress={fetchPublicRooms}>
              <Ionicons name="refresh" size={20} color="#ef4444" />
            </Pressable>
          </View>

          {loadingRooms ? (
            <ActivityIndicator
              color="#ef4444"
              size="large"
              style={{ marginTop: 20 }}
            />
          ) : publicRooms.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="planet-outline" size={48} color="#4b5563" />
              <Text style={styles.emptyText}>Chưa có phòng nào hoạt động.</Text>
              <Pressable onPress={handleCreateRoom}>
                <Text style={styles.emptyLink}>Tạo phòng đầu tiên!</Text>
              </Pressable>
            </View>
          ) : (
            publicRooms.map((room) => (
              <View key={room.id} style={styles.roomCard}>
                <View style={styles.roomInfo}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <View style={styles.roomMeta}>
                    <View style={styles.metaBadge}>
                      <Ionicons name="person" size={12} color="#9ca3af" />
                      <Text style={styles.metaText}>
                        {room.owner?.profile?.fullName || "Ẩn danh"}
                      </Text>
                    </View>
                    <View style={styles.metaBadge}>
                      <Ionicons name="people" size={12} color="#9ca3af" />
                      <Text style={styles.metaText}>
                        {room.currentViewers} đang xem
                      </Text>
                    </View>
                  </View>
                </View>
                <Pressable
                  style={styles.joinRoomBtn}
                  onPress={() => handleJoinRoom(room.code)}
                >
                  <Text style={styles.joinRoomText}>Tham gia</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0f14",
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  heroSection: {
    marginBottom: 40,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 12,
  },
  highlightText: {
    color: "#ef4444",
  },
  heroDesc: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  actionCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  createButton: {
    backgroundColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  dividerText: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
  },
  joinContainer: {
    flexDirection: "row",
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    color: "white",
    height: 48,
  },
  joinButton: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  disabledButton: {
    opacity: 0.5,
  },
  joinButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  featuresSection: {
    marginBottom: 40,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  featureItem: {
    width: (width - 40 - 12) / 2, // 2 columns
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  featureTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  featureDesc: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 18,
  },
  roomsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  roomCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
  },
  roomMeta: {
    flexDirection: "row",
    gap: 12,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: "#9ca3af",
    fontSize: 12,
  },
  joinRoomBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  joinRoomText: {
    color: "#ef4444",
    fontWeight: "600",
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 14,
  },
  emptyLink: {
    color: "#ef4444",
    fontWeight: "600",
  },
});
