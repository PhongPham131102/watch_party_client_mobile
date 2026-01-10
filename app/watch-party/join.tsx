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
import Toast from "react-native-toast-message";

export default function JoinRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [roomCode, setRoomCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);

  const [codeError, setCodeError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleCheckRoom = async () => {
    if (!roomCode.trim()) {
      setCodeError("Vui lòng nhập mã phòng");
      return;
    }

    setIsChecking(true);
    setCodeError("");
    setPasswordError("");

    try {
      const response = await roomService.checkRoom(roomCode.trim());

      if (response.success && response.data) {
        // Room exists, check if it needs password
        const roomData = response.data as any;
        if (roomData.type === "private") {
          setNeedsPassword(true);
        } else {
          // Public room, join directly
          handleJoinRoom();
        }
      } else {
        setCodeError("Không tìm thấy phòng với mã này");
      }
    } catch (error: any) {
      console.error("Error checking room:", error);
      setCodeError(error?.message || "Không thể kiểm tra phòng");
    } finally {
      setIsChecking(false);
    }
  };

  const handleJoinRoom = async () => {
    if (needsPassword && !password.trim()) {
      setPasswordError("Vui lòng nhập mật khẩu");
      return;
    }

    setIsJoining(true);
    setPasswordError("");

    try {
      // If room needs password, verify it first
      if (needsPassword) {
        const verifyResponse = await roomService.verifyRoomPassword(
          roomCode.trim(),
          password
        );

        if (!verifyResponse.data?.isAuthenticated) {
          setPasswordError("Mật khẩu không đúng");
          setIsJoining(false);
          return;
        }
      }

      // Navigate to room
      Toast.show({
        type: "success",
        text1: "Tham gia phòng thành công!",
        visibilityTime: 2000,
      });
      router.replace(`/room/${roomCode.trim()}`);
    } catch (error: any) {
      console.error("Error joining room:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error?.message || "Không thể tham gia phòng",
      });
    } finally {
      setIsJoining(false);
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
            disabled={isChecking || isJoining}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Tham Gia Phòng</Text>
        </View>

        <Text style={styles.subtitle}>
          Nhập mã phòng để tham gia xem phim cùng bạn bè
        </Text>

        {/* Room Code */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Mã phòng <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, codeError && styles.inputError]}
            placeholder="Nhập mã phòng..."
            placeholderTextColor="#6b7280"
            value={roomCode}
            onChangeText={(text) => {
              setRoomCode(text);
              setCodeError("");
              setNeedsPassword(false);
              setPassword("");
            }}
            editable={!isChecking && !isJoining}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}
        </View>

        {/* Password (if needed) */}
        {needsPassword && (
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
                editable={!isJoining}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isJoining}
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
            ) : null}
          </View>
        )}

        {/* Submit Button */}
        <Pressable
          style={[
            styles.submitButton,
            (isChecking || isJoining) && styles.submitButtonDisabled,
          ]}
          onPress={needsPassword ? handleJoinRoom : handleCheckRoom}
          disabled={isChecking || isJoining}
        >
          {isChecking || isJoining ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.submitButtonText}>
                {isChecking ? "Đang kiểm tra..." : "Đang tham gia..."}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="enter" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>
                {needsPassword ? "Tham Gia" : "Tiếp Tục"}
              </Text>
            </>
          )}
        </Pressable>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>
            Bạn có thể lấy mã phòng từ người tạo phòng hoặc từ link chia sẻ
          </Text>
        </View>
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
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  infoText: {
    flex: 1,
    color: "#93c5fd",
    fontSize: 13,
    lineHeight: 18,
  },
});
