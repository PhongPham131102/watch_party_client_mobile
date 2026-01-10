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
import { RegisterRequest } from "../types/auth.types";
import { registerSchema } from "../schemas/register.schema";

export default function RegisterScreen() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    username?: string;
    fullName?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleRegister = async () => {
    // Clear previous errors
    setErrors({});

    // Validate with Zod schema
    const result = registerSchema.safeParse({
      email,
      username,
      fullName,
      password,
      confirmPassword,
    });

    if (!result.success) {
      const fieldErrors: { [key: string]: string } = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const data: RegisterRequest = { email, username, fullName, password };
      const response = await authService.register(data);

      if (response.success) {
        // Save tokens and user
        await setTokens(response.data.accessToken, response.data.refreshToken);
        setUser(response.data.user);

        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Đăng ký thành công!",
        });
        router.replace("/(tabs)");
      } else {
        Toast.show({
          type: "error",
          text1: "Thất bại",
          text2: response.message || "Đăng ký thất bại",
        });
      }
    } catch (error: any) {
      console.error("Register error:", error);
      const msg = error?.message || "Có lỗi xảy ra khi đăng ký";
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
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Đăng Ký</Text>
            <Text style={styles.subtitle}>Tạo tài khoản mới</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Nhập email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

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
              <Text style={styles.label}>Họ và tên</Text>
              <TextInput
                style={[styles.input, errors.fullName && styles.inputError]}
                placeholder="Nhập họ tên đầy đủ"
                placeholderTextColor="#666"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName)
                    setErrors({ ...errors, fullName: undefined });
                }}
              />
              {errors.fullName && (
                <Text style={styles.errorText}>{errors.fullName}</Text>
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
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Xác nhận mật khẩu</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.confirmPassword && styles.inputError,
                ]}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor="#666"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword)
                    setErrors({ ...errors, confirmPassword: undefined });
                }}
                secureTextEntry
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Đăng ký</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={styles.link}>Đăng nhập</Text>
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
  },
  scrollContent: {
    flexGrow: 1,
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
});
