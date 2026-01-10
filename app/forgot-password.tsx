import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { authService } from "../services/auth.service";
import {
  forgotPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
} from "../schemas/auth.schema";
import Toast from "react-native-toast-message";
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  KeyRound,
  RefreshCcw,
  CheckCircle2,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ErrorCode, ErrorCodeMessage } from "../types/error.types";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Refs for OTP inputs
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const startCountdown = () => setCountdown(60);

  const handleSendCode = async () => {
    setErrors({});
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setErrors({ email: result.error.issues[0].message });
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword({ email });
      setStep(2);
      startCountdown();
      Toast.show({
        type: "success",
        text1: "Đã gửi mã",
        text2: "Vui lòng kiểm tra email của bạn",
      });
    } catch (error: any) {
      const errorCode = error?.errorCode as ErrorCode;
      let msg = "Không thể gửi mã xác nhận";

      if (errorCode === ErrorCode.AUTH_EMAIL_NOT_FOUND) {
        msg = "Email này chưa được đăng ký tài khoản.";
      } else if (errorCode === ErrorCode.VALIDATION_ERROR) {
        msg = "Vui lòng nhập đúng định dạng email.";
      } else if (errorCode === ErrorCode.INTERNAL_SERVER_ERROR) {
        msg = "Lỗi khi gửi mail hoặc lỗi server";
      }

      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setErrors({});
    const result = verifyResetCodeSchema.safeParse({ email, code });
    if (!result.success) {
      setErrors({ code: result.error.issues[0].message });
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyResetCode({ email, code });
      if (response.success) {
        setStep(3);
      }
    } catch (error: any) {
      const errorCode = error?.errorCode as ErrorCode;
      let msg = "Mã xác nhận không hợp lệ";

      if (errorCode === ErrorCode.BAD_REQUEST) {
        msg = "Mã OTP không khớp hoặc đã quá 10 phút";
      } else if (errorCode === ErrorCode.VALIDATION_ERROR) {
        msg = "Dữ liệu không hợp lệ";
      }

      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrors({});
    const result = resetPasswordSchema.safeParse({
      email,
      code,
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword({
        email,
        code,
        newPassword,
        confirmPassword,
      });
      if (response.success) {
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Mật khẩu của bạn đã được đặt lại",
        });
        router.replace("/login");
      }
    } catch (error: any) {
      const errorCode = error?.errorCode as ErrorCode;
      let msg = "Đã xảy ra lỗi";

      if (errorCode === ErrorCode.BAD_REQUEST) {
        msg = "Mật khẩu không khớp hoặc mã xác nhận đã hết hạn";
      } else if (errorCode === ErrorCode.VALIDATION_ERROR) {
        msg = "Dữ liệu không hợp lệ";
      } else if (errorCode === ErrorCode.AUTH_ACCOUNT_NOT_FOUND) {
        msg = "Email không còn tồn tại trong hệ thống";
      }

      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    try {
      await authService.forgotPassword({ email });
      startCountdown();
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã gửi lại mã xác nhận",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể gửi lại mã",
      });
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const newCode = code.split("");
    newCode[index] = text;
    const finalCode = newCode.join("");
    setCode(finalCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              step === 1 ? router.back() : setStep((prev) => (prev - 1) as any)
            }
          >
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 1
                ? "Quên mật khẩu"
                : step === 2
                ? "Xác thực OTP"
                : "Đặt lại mật khẩu"}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? "Nhập email của bạn để nhận mã khôi phục"
                : step === 2
                ? `Mã xác nhận đã được gửi đến ${email}`
                : "Vui lòng nhập mật khẩu mới cho tài khoản của bạn"}
            </Text>
          </View>

          {step === 1 && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.email && styles.inputError,
                  ]}
                >
                  <Mail
                    color="rgba(255,255,255,0.4)"
                    size={20}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="example@gmail.com"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSendCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Gửi mã xác nhận</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.form}>
              <View style={styles.otpContainer}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.otpBox,
                      code.length === index && styles.otpBoxActive,
                      errors.code && styles.otpBoxError,
                    ]}
                  >
                    <TextInput
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={styles.otpInput}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={code[index] || ""}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleOtpKeyPress(e, index)}
                      selectTextOnFocus
                    />
                  </View>
                ))}
              </View>
              {errors.code && (
                <Text style={[styles.errorText, { textAlign: "center" }]}>
                  {errors.code}
                </Text>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 32 }]}
                onPress={handleVerifyCode}
                disabled={loading || code.length !== 6}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Xác nhận mã</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendCode}
                disabled={countdown > 0}
              >
                <RefreshCcw
                  size={16}
                  color={countdown > 0 ? "rgba(255,255,255,0.3)" : "#E50914"}
                />
                <Text
                  style={[
                    styles.resendText,
                    countdown > 0 && styles.resendTextDisabled,
                  ]}
                >
                  {countdown > 0
                    ? `Gửi lại mã (${countdown}s)`
                    : "Gửi lại mã OTP"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View style={styles.form}>
              <View style={styles.successBadge}>
                <CheckCircle2 color="#22c55e" size={20} />
                <Text style={styles.successBadgeText}>
                  Mã OTP đã được xác thực
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mật khẩu mới</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.newPassword && styles.inputError,
                  ]}
                >
                  <KeyRound
                    color="rgba(255,255,255,0.4)"
                    size={20}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                </View>
                {errors.newPassword && (
                  <Text style={styles.errorText}>{errors.newPassword}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Xác nhận mật khẩu</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.confirmPassword && styles.inputError,
                  ]}
                >
                  <KeyRound
                    color="rgba(255,255,255,0.4)"
                    size={20}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
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
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 22,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },
  inputError: {
    borderColor: "#E50914",
  },
  errorText: {
    color: "#E50914",
    fontSize: 12,
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: "#E50914",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#E50914",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  otpBoxActive: {
    borderColor: "#E50914",
    backgroundColor: "rgba(229, 9, 20, 0.05)",
  },
  otpBoxError: {
    borderColor: "#E50914",
  },
  otpInput: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    width: "100%",
  },
  resendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    padding: 8,
  },
  resendText: {
    color: "#E50914",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  resendTextDisabled: {
    color: "rgba(255,255,255,0.3)",
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
    marginBottom: 24,
  },
  successBadgeText: {
    color: "#22c55e",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },
});
