import React, { useState } from "react";
import Toast from "react-native-toast-message";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../store/auth.store";
import { LoginRequest } from "../types/auth.types";
import { loginSchema } from "../schemas/login.schema";

export default function LoginScreen() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const handleLogin = async () => {
    // Clear previous errors
    setErrors({});

    // Validate with Zod schema
    const result = loginSchema.safeParse({ username, password });

    if (!result.success) {
      const fieldErrors: { username?: string; password?: string } = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as "username" | "password"] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const data: LoginRequest = { username, password };
      const response = await authService.login(data);

      if (response.success) {
        // Save tokens and user
        await setTokens(response.data.accessToken, response.data.refreshToken);
        setUser(response.data.user);

        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Đăng nhập thành công!",
        });
        router.replace("/(tabs)");
      } else {
        Toast.show({
          type: "error",
          text1: "Thất bại",
          text2: response.message || "Đăng nhập thất bại",
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const msg = error?.message || "Có lỗi xảy ra khi đăng nhập";
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <Text style={styles.title}>Đăng Nhập</Text>
            <Text style={styles.subtitle}>Chào mừng bạn quay trở lại!</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên đăng nhập</Text>
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                placeholder="Nhập tên đăng nhập"
                placeholderTextColor="#666"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (errors.username)
                    setErrors({ ...errors, username: undefined });
                }}
                autoCapitalize="none"
              />
              {errors.username && (
                <Text style={styles.errorText}>{errors.username}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật khẩu</Text>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#666"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password)
                    setErrors({ ...errors, password: undefined });
                }}
                secureTextEntry
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
              <TouchableOpacity
                onPress={() => router.push("/forgot-password")}
                style={styles.forgotPasswordContainer}
              >
                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text style={styles.link}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0f14",
    justifyContent: "center",
    padding: 24,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 32,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: "#fff",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 16,
  },
  inputError: {
    borderColor: "#E50914",
    borderWidth: 2,
  },
  errorText: {
    color: "#E50914",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    backgroundColor: "#E50914", // Netflix Red
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  link: {
    color: "#E50914",
    fontWeight: "bold",
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
  forgotPasswordText: {
    color: "#E50914",
    fontSize: 14,
    fontWeight: "500",
  },
});
