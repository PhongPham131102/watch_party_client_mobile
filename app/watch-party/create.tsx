import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { roomService } from "@/services/room.service";
import { RoomType } from "@/types/room.types";
import Toast from "react-native-toast-message";

export default function CreateRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState<RoomType>(RoomType.PUBLIC);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation errors
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateForm = (): boolean => {
    let isValid = true;
    setNameError("");
    setPasswordError("");

    // Validate room name
    if (!roomName.trim()) {
      setNameError("Vui lòng nhập tên phòng");
      isValid = false;
    } else if (roomName.trim().length < 3) {
      setNameError("Tên phòng phải có ít nhất 3 ký tự");
      isValid = false;
    } else if (roomName.trim().length > 100) {
      setNameError("Tên phòng không được quá 100 ký tự");
      isValid = false;
    }

    // Validate password for private rooms
    if (roomType === RoomType.PRIVATE) {
      if (!password.trim()) {
        setPasswordError("Vui lòng nhập mật khẩu cho phòng riêng tư");
        isValid = false;
      } else if (password.length < 4) {
        setPasswordError("Mật khẩu phải có ít nhất 4 ký tự");
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await roomService.createRoom({
        name: roomName.trim(),
        type: roomType,
        password: roomType === RoomType.PRIVATE ? password : undefined,
      });

      const roomCode = response.data?.code;
      if (roomCode) {
        Toast.show({
          type: "success",
          text1: "Tạo phòng thành công!",
          visibilityTime: 2000,
        });
        router.replace(`/room/${roomCode}`);
      } else {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không thể chuyển đến phòng. Thiếu mã phòng!",
        });
      }
    } catch (error: any) {
      console.error("Error creating room:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error?.message || "Không thể tạo phòng. Vui lòng thử lại!",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            disabled={isSubmitting}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Tạo Phòng Mới</Text>
        </View>

        <Text style={styles.subtitle}>
          Điền thông tin để tạo phòng xem phim cùng bạn bè
        </Text>

        {/* Room Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Tên phòng <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, nameError && styles.inputError]}
            placeholder="Nhập tên phòng..."
            placeholderTextColor="#6b7280"
            value={roomName}
            onChangeText={(text) => {
              setRoomName(text);
              setNameError("");
            }}
            editable={!isSubmitting}
            maxLength={100}
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        </View>

        {/* Room Type */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Loại phòng <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.typeContainer}>
            <Pressable
              style={[
                styles.typeButton,
                roomType === RoomType.PUBLIC && styles.typeButtonActive,
              ]}
              onPress={() => setRoomType(RoomType.PUBLIC)}
              disabled={isSubmitting}
            >
              <View
                style={[
                  styles.radio,
                  roomType === RoomType.PUBLIC && styles.radioActive,
                ]}
              >
                {roomType === RoomType.PUBLIC && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <View style={styles.typeInfo}>
                <Text style={styles.typeName}>Công khai</Text>
                <Text style={styles.typeDesc}>Mọi người có thể tham gia</Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.typeButton,
                roomType === RoomType.PRIVATE && styles.typeButtonActive,
              ]}
              onPress={() => setRoomType(RoomType.PRIVATE)}
              disabled={isSubmitting}
            >
              <View
                style={[
                  styles.radio,
                  roomType === RoomType.PRIVATE && styles.radioActive,
                ]}
              >
                {roomType === RoomType.PRIVATE && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <View style={styles.typeInfo}>
                <Text style={styles.typeName}>Riêng tư</Text>
                <Text style={styles.typeDesc}>Cần mật khẩu để vào</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Password (for private rooms) */}
        {roomType === RoomType.PRIVATE && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Mật khẩu <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  passwordError && styles.inputError,
                ]}
                placeholder="Nhập mật khẩu phòng..."
                placeholderTextColor="#6b7280"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError("");
                }}
                secureTextEntry={!showPassword}
                editable={!isSubmitting}
                maxLength={50}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#9ca3af"
                />
              </Pressable>
            </View>
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : (
              <Text style={styles.helperText}>
                Bạn bè sẽ cần mật khẩu này để tham gia phòng
              </Text>
            )}
          </View>
        )}

        {/* Submit Button */}
        <Pressable
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.submitButtonText}>Đang tạo...</Text>
            </>
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Tạo Phòng</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0f14",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 32,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    color: "#e5e7eb",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  required: {
    color: "#ef4444",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 15,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 6,
  },
  helperText: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 6,
  },
  typeContainer: {
    gap: 12,
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  typeButtonActive: {
    borderColor: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  radioActive: {
    borderColor: "#ef4444",
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ef4444",
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  typeDesc: {
    color: "#9ca3af",
    fontSize: 12,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 14,
    padding: 4,
  },
  submitButton: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
