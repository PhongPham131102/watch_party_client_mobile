import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoomStore } from "@/store/room.store";
import { roomSocketService } from "@/services/room-socket.service";
import { RoomType, IRoomSetting } from "@/types/room.types";
import Toast from "react-native-toast-message";

interface SettingsTabProps {
  isOwner: boolean;
}

export default function SettingsTab({ isOwner }: SettingsTabProps) {
  const { currentRoom, settings } = useRoomStore();
  const [form, setForm] = useState<IRoomSetting | null>(settings);
  const [isChanged, setIsChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const prevType = useRef<RoomType | null>(settings?.type || null);

  useEffect(() => {
    setForm(settings);
    setIsChanged(false);
    prevType.current = settings?.type || null;
    setShowPassword(false);
    setPassword("");
  }, [settings]);

  const handleChange = (key: keyof IRoomSetting, value: any) => {
    if (!form) return;
    const newForm = { ...form, [key]: value };
    setForm(newForm);
    setIsChanged(JSON.stringify(newForm) !== JSON.stringify(settings));

    if (
      key === "type" &&
      value === RoomType.PRIVATE &&
      prevType.current === RoomType.PUBLIC
    ) {
      setShowPassword(true);
    } else if (key === "type" && value === RoomType.PUBLIC) {
      setShowPassword(false);
      setPassword("");
    }
  };

  const handleSave = async () => {
    if (!currentRoom?.code || !form) return;
    setIsLoading(true);
    try {
      const payload: any = {
        type: form.type,
        max_users: form.max_users,
        max_video_in_playlist: form.max_video_in_playlist,
        max_video: form.max_video,
      };
      if (showPassword && password) {
        payload.password = password;
      }
      await roomSocketService.editRoomSettings(currentRoom.code, payload);

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã cập nhật cài đặt phòng",
      });

      setIsChanged(false);
      setShowPassword(false);
      setPassword("");
      prevType.current = form.type;
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể cập nhật cài đặt",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!form) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={styles.loadingText}>Đang tải cài đặt...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chế độ phòng</Text>
        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons
                name={
                  form.type === RoomType.PUBLIC
                    ? "globe-outline"
                    : "lock-closed-outline"
                }
                size={24}
                color="#ef4444"
              />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>
                  {form.type === RoomType.PRIVATE
                    ? "Phòng Riêng tư"
                    : "Phòng Công khai"}
                </Text>
                <Text style={styles.settingDescription}>
                  {form.type === RoomType.PRIVATE
                    ? "Chỉ những người có mật khẩu mới có thể tham gia"
                    : "Mọi người đều có thể tham gia phòng này"}
                </Text>
              </View>
            </View>
            <Switch
              value={form.type === RoomType.PRIVATE}
              onValueChange={(value) =>
                handleChange("type", value ? RoomType.PRIVATE : RoomType.PUBLIC)
              }
              disabled={!isOwner}
              trackColor={{ false: "#374151", true: "#ef4444" }}
              thumbColor={
                Platform.OS === "ios"
                  ? "#fff"
                  : form.type === RoomType.PRIVATE
                  ? "#fff"
                  : "#9ca3af"
              }
            />
          </View>

          {showPassword && (
            <View style={styles.passwordContainer}>
              <Text style={styles.inputLabel}>Mật khẩu phòng mới</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="key-outline"
                  size={20}
                  color="#6b7280"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="#6b7280"
                  secureTextEntry
                />
              </View>
              <Text style={styles.helperText}>
                Mật khẩu này sẽ được áp dụng khi bạn lưu thay đổi.
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Giới hạn phòng</Text>
        <View style={styles.card}>
          <View style={styles.fieldItem}>
            <View style={styles.fieldLabelContainer}>
              <Ionicons name="people-outline" size={20} color="#9ca3af" />
              <Text style={styles.fieldLabel}>Số người tối đa</Text>
            </View>
            <TextInput
              style={[styles.fieldInput, !isOwner && styles.disabledInput]}
              value={form.max_users.toString()}
              onChangeText={(val) =>
                handleChange("max_users", parseInt(val) || 0)
              }
              keyboardType="number-pad"
              editable={isOwner}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldItem}>
            <View style={styles.fieldLabelContainer}>
              <Ionicons name="list-outline" size={20} color="#9ca3af" />
              <Text style={styles.fieldLabel}>Video tối đa trong DS phát</Text>
            </View>
            <TextInput
              style={[styles.fieldInput, !isOwner && styles.disabledInput]}
              value={form.max_video_in_playlist.toString()}
              onChangeText={(val) =>
                handleChange("max_video_in_playlist", parseInt(val) || 0)
              }
              keyboardType="number-pad"
              editable={isOwner}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldItem}>
            <View style={styles.fieldLabelContainer}>
              <Ionicons name="person-outline" size={20} color="#9ca3af" />
              <Text style={styles.fieldLabel}>Video tối đa mỗi người</Text>
            </View>
            <TextInput
              style={[styles.fieldInput, !isOwner && styles.disabledInput]}
              value={form.max_video.toString()}
              onChangeText={(val) =>
                handleChange("max_video", parseInt(val) || 0)
              }
              keyboardType="number-pad"
              editable={isOwner}
            />
          </View>
        </View>
      </View>

      {isOwner && (
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!isChanged || isLoading) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!isChanged || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {!isOwner && (
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#3b82f6"
          />
          <Text style={styles.infoText}>
            Chỉ chủ phòng mới có quyền thay đổi cài đặt.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0f14",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0e0f14",
  },
  loadingText: {
    color: "#9ca3af",
    marginTop: 12,
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: "#1a1b20",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  settingTextContainer: {
    marginLeft: 12,
  },
  settingLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  settingDescription: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  passwordContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  inputLabel: {
    color: "#e5e7eb",
    fontSize: 14,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0e0f14",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    color: "#fff",
    fontSize: 15,
  },
  helperText: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 6,
    fontStyle: "italic",
  },
  fieldItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  fieldLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  fieldLabel: {
    color: "#e5e7eb",
    fontSize: 15,
    marginLeft: 12,
  },
  fieldInput: {
    backgroundColor: "#0e0f14",
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "700",
    width: 60,
    height: 40,
    borderRadius: 8,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  disabledInput: {
    opacity: 0.5,
    color: "#9ca3af",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginVertical: 4,
  },
  saveButton: {
    backgroundColor: "#ef4444",
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 10,
  },
  saveButtonDisabled: {
    backgroundColor: "#374151",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 10,
  },
  infoText: {
    color: "#93c5fd",
    fontSize: 13,
    flex: 1,
  },
});
