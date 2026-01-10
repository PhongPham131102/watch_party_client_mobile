import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRoomStore } from "@/store/room.store";
import { useAuthStore } from "@/store/auth.store";
import { roomSocketService } from "@/services/room-socket.service";
import Toast from "react-native-toast-message";
import { useLocalSearchParams } from "expo-router";

interface User {
  id?: string;
  username?: string;
}

interface Member {
  id: string;
  user: User | string | null;
  role: string;
}

export default function MembersTab() {
  const { id: roomCode } = useLocalSearchParams<{ id: string }>();
  const { members, currentRoom, isOwner } = useRoomStore();
  const { user: currentUser } = useAuthStore();
  const currentUserId =
    typeof currentUser === "string" ? currentUser : currentUser?.id;
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const isOwnerLocal = useMemo(() => {
    if (isOwner) return true;
    if (
      currentRoom?.ownerId &&
      currentUserId &&
      currentRoom.ownerId === currentUserId
    )
      return true;

    // Check in members list as a fallback
    const myMember = members.find((m) => {
      const mid = typeof m.user === "object" ? m.user?.id : m.user;
      return mid === currentUserId;
    });
    return myMember?.role === "owner";
  }, [isOwner, currentRoom, currentUserId, members]);

  const groupedMembers = useMemo(() => {
    const roles = ["owner", "admin", "moderator", "member"];
    return roles
      .map((role) => ({
        role,
        items: members.filter((m) => m.role === role),
      }))
      .filter((group) => group.items.length > 0);
  }, [members]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return "Chủ phòng";
      case "moderator":
        return "Quản trị viên";
      case "admin":
        return "Quản trị viên hệ thống";
      default:
        return "Thành viên";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "#ef4444"; // primary-like red
      case "moderator":
        return "#fb923c"; // orange-400
      default:
        return "#60a5fa"; // blue-400
    }
  };

  const handleKickUser = async (userId: string) => {
    if (!roomCode || actionLoading) return;
    setActionLoading(true);
    try {
      await roomSocketService.kickUser(roomCode, userId);
      Toast.show({
        type: "success",
        text1: "Đã kick người dùng",
        visibilityTime: 2000,
      });
      setSelectedMember(null);
    } catch (error: any) {
      console.error("Kick user error:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể kick người dùng",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!roomCode || actionLoading) return;
    setActionLoading(true);
    try {
      await roomSocketService.changeUserRole(roomCode, userId, newRole);
      Toast.show({
        type: "success",
        text1: `Đã thay đổi quyền thành ${newRole}`,
        visibilityTime: 2000,
      });
      setSelectedMember(null);
    } catch (error: any) {
      console.error("Change role error:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể thay đổi quyền",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const renderMemberItem = (member: Member) => {
    const memberUser =
      typeof member.user === "object" && member.user ? member.user : null;
    const username = memberUser?.username || "Unknown";
    const userId =
      memberUser?.id || (typeof member.user === "string" ? member.user : null);
    const roleColor = getRoleColor(member.role);
    const isMe = userId === currentUserId;

    // Visibility of management button matches web logic (lines 98-110)
    const canShowMenu = isOwnerLocal && member.role !== "owner" && !isMe;

    return (
      <View key={member.id} style={styles.memberRow}>
        <View style={styles.memberLeft}>
          <View style={[styles.avatar, { backgroundColor: `${roleColor}20` }]}>
            <Text style={[styles.avatarText, { color: roleColor }]}>
              {username.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View>
            <View style={styles.nameContainer}>
              <Text style={styles.username}>{username}</Text>
              {member.role === "owner" && (
                <FontAwesome5
                  name="crown"
                  size={10}
                  color="#ef4444"
                  style={styles.roleIcon}
                />
              )}
              {member.role === "moderator" && (
                <MaterialCommunityIcons
                  name="account-cog"
                  size={12}
                  color="#fb923c"
                  style={styles.roleIcon}
                />
              )}
            </View>
            <Text style={styles.roleLabel}>{getRoleLabel(member.role)}</Text>
          </View>
        </View>

        {canShowMenu && (
          <Pressable
            onPress={() => setSelectedMember(member)}
            style={({ pressed }) => [
              styles.moreButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={18}
              color="rgba(255,255,255,0.6)"
            />
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {members.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có thành viên nào</Text>
          </View>
        ) : (
          groupedMembers.map((group) => (
            <View key={group.role} style={styles.groupContainer}>
              <Text style={styles.groupHeader}>
                {getRoleLabel(group.role).toUpperCase()} - {group.items.length}
              </Text>
              {group.items.map(renderMemberItem)}
            </View>
          ))
        )}
      </ScrollView>

      {/* Member Management Modal (Mirror Web MemberManagementDialog) */}
      <Modal
        visible={!!selectedMember}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !actionLoading && setSelectedMember(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !actionLoading && setSelectedMember(null)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quản lý thành viên</Text>
              <Text style={styles.modalSubtitle}>
                Hành động với{" "}
                {(selectedMember?.user as any)?.username || "thành viên"}
              </Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.sectionLabel}>Thay đổi quyền hạn</Text>
              <View style={styles.roleButtonsRow}>
                <Pressable
                  onPress={() => {
                    const userId = (selectedMember?.user as any)?.id;
                    if (userId) handleChangeRole(userId, "moderator");
                  }}
                  disabled={
                    actionLoading || selectedMember?.role === "moderator"
                  }
                  style={[
                    styles.roleButton,
                    styles.modButton,
                    (actionLoading || selectedMember?.role === "moderator") &&
                      styles.disabledButton,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account-cog"
                    size={18}
                    color="#fb923c"
                  />
                  <Text style={[styles.roleButtonText, { color: "#fb923c" }]}>
                    Moderator
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    const userId = (selectedMember?.user as any)?.id;
                    if (userId) handleChangeRole(userId, "member");
                  }}
                  disabled={actionLoading || selectedMember?.role === "member"}
                  style={[
                    styles.roleButton,
                    styles.memberButton,
                    (actionLoading || selectedMember?.role === "member") &&
                      styles.disabledButton,
                  ]}
                >
                  <Ionicons name="person" size={18} color="#60a5fa" />
                  <Text style={[styles.roleButtonText, { color: "#60a5fa" }]}>
                    Member
                  </Text>
                </Pressable>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionLabel}>Hành động nguy hiểm</Text>
              <Pressable
                onPress={() => {
                  const userId = (selectedMember?.user as any)?.id;
                  if (userId) handleKickUser(userId);
                }}
                disabled={actionLoading}
                style={[
                  styles.kickFullButton,
                  actionLoading && styles.disabledButton,
                ]}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#f87171" />
                ) : (
                  <Text style={styles.kickButtonText}>Kick khỏi phòng</Text>
                )}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f", // Match web
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
  },
  groupContainer: {
    marginBottom: 16,
  },
  groupHeader: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 4,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderRadius: 8,
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  username: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  roleIcon: {
    marginLeft: 2,
  },
  roleLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 1,
  },
  moreButton: {
    padding: 8,
    marginRight: -8,
  },
  pressed: {
    opacity: 0.7,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#0a0a0f",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 20,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  modalSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  modalBody: {
    gap: 12,
  },
  sectionLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  roleButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  roleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  modButton: {
    backgroundColor: "rgba(251,146,60,0.1)",
    borderColor: "rgba(251,146,60,0.3)",
  },
  memberButton: {
    backgroundColor: "rgba(96,165,250,0.1)",
    borderColor: "rgba(96,165,250,0.3)",
  },
  roleButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 8,
  },
  kickFullButton: {
    width: "100%",
    height: 44,
    backgroundColor: "rgba(248,113,113,0.1)",
    borderColor: "rgba(248,113,113,0.3)",
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  kickButtonText: {
    color: "#f87171",
    fontSize: 13,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.4,
  },
});
