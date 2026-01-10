import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAuthStore } from "@/store/auth.store";
import { userService } from "@/services/user.service";
import { Colors } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  User,
  Mail,
  ChevronRight,
  LogOut,
  Shield,
} from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { authService } from "@/services/auth.service";
import { ErrorCode, ErrorCodeMessage } from "@/types/error.types";
import { ApiResponse } from "@/types/api.types";
import { changePasswordSchema } from "@/schemas/auth.schema";

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.profile?.fullName || "");
      setAvatarPreview(user.profile?.avatarUrl || null);
    }
  }, [user]);

  const uploadAvatarMutation = useMutation({
    mutationFn: async (uri: string) => {
      // Default to jpeg if type not detected, simpler for this context
      return await userService.uploadAvatar(uri, "image/jpeg");
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        setUser(response.data);
        setAvatarPreview(response.data.profile.avatarUrl);
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Đã tải ảnh đại diện lên thành công",
        });
      }
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error?.message || "Lỗi khi tải ảnh đại diện",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { fullName: string }) => userService.updateProfile(data),
    onSuccess: (response) => {
      if (response.success && response.data) {
        setUser(response.data);
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Cập nhật thông tin thành công",
        });
      }
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error?.message || "Lỗi khi cập nhật thông tin",
      });
    },
  });

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: "Quyền truy cập",
        text2: "Cần quyền truy cập thư viện ảnh để thay đổi avatar.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadAvatarMutation.mutate(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!fullName.trim()) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Họ và tên không được để trống",
      });
      return;
    }
    updateProfileMutation.mutate({ fullName });
  };

  const handleLogout = async () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Đăng xuất",
        onPress: () => {
          logout();
          router.replace("/login");
        },
        style: "destructive",
      },
    ]);
  };

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.text}>Vui lòng đăng nhập để xem thông tin.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20 },
        ]}
      >
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
        <Text style={styles.headerSubtitle}>
          Quản lý thông tin cá nhân của bạn
        </Text>

        {/* Avatar Section */}
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              {avatarPreview ? (
                <Image
                  key={avatarPreview} // Force re-mount on URL change
                  source={{
                    uri: `${avatarPreview}?t=${Date.now()}`, // Cache busting
                    cache: "reload",
                  }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>
                    {user.username?.charAt(0).toUpperCase() || "U"}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={handlePickImage}
                disabled={uploadAvatarMutation.isPending}
              >
                {uploadAvatarMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Camera size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.role}>{user.role?.name || "Thành viên"}</Text>

            {user.profile?.isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>PREMIUM</Text>
              </View>
            )}
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <View style={[styles.inputContainer, styles.inputContainerActive]}>
              <User
                size={20}
                color="rgba(255,255,255,0.5)"
                style={styles.inputIcon}
              />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
                placeholderTextColor="rgba(255,255,255,0.3)"
                placeholder="Nhập họ và tên"
              />
            </View>
          </View>

          <View style={[styles.inputGroup, styles.disabledGroup]}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputContainer}>
              <Shield
                size={20}
                color="rgba(255,255,255,0.3)"
                style={styles.inputIcon}
              />
              <TextInput
                value={user.username}
                editable={false}
                style={[styles.input, styles.disabledInput]}
              />
            </View>
          </View>

          <View style={[styles.inputGroup, styles.disabledGroup]}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Mail
                size={20}
                color="rgba(255,255,255,0.3)"
                style={styles.inputIcon}
              />
              <TextInput
                value={user.email}
                editable={false}
                style={[styles.input, styles.disabledInput]}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/my-list")}
          >
            <View style={styles.menuItemLeft}>
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: "rgba(239, 68, 68, 0.1)" },
                ]}
              >
                <Ionicons name="heart" size={20} color="#ef4444" />
              </View>
              <Text style={styles.menuItemText}>Danh sách của tôi</Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              updateProfileMutation.isPending && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.saveButtonText}>Đang lưu...</Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Change Password Section */}
        <ChangePasswordSection />

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.dark.text} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ChangePasswordSection() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => authService.changePassword(data),
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Thay đổi mật khẩu thành công",
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    },
    onError: (error: ApiResponse) => {
      const errorCode = error.errorCode;

      if (
        errorCode === ErrorCode.USER_INVALID_PASSWORD ||
        errorCode === ErrorCode.AUTH_INVALID_CREDENTIALS
      ) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Mật khẩu hiện tại không chính xác",
        });
      } else if (errorCode === ErrorCode.AUTH_ACCOUNT_NOT_FOUND) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Tài khoản không tồn tại hoặc đã bị đăng xuất",
        });
      } else if (errorCode && ErrorCodeMessage[errorCode]) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: ErrorCodeMessage[errorCode],
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: error?.message || "Lỗi khi thay đổi mật khẩu",
        });
      }
    },
  });

  const handlePasswordSubmit = () => {
    // Clear previous errors
    setErrors({});

    // Validate with Zod
    const result = changePasswordSchema.safeParse({
      oldPassword,
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    changePasswordMutation.mutate({
      oldPassword,
      newPassword,
      confirmPassword,
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Đổi mật khẩu</Text>
      <Text style={styles.sectionSubtitle}>
        Bảo mật tài khoản của bạn bằng cách thay đổi mật khẩu định kỳ.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Mật khẩu hiện tại</Text>
        <View
          style={[
            styles.inputContainer,
            errors.oldPassword && styles.inputErrorBorder,
          ]}
        >
          <Shield
            size={20}
            color="rgba(255,255,255,0.5)"
            style={styles.inputIcon}
          />
          <TextInput
            value={oldPassword}
            onChangeText={(text) => {
              setOldPassword(text);
              if (errors.oldPassword) setErrors({ ...errors, oldPassword: "" });
            }}
            placeholder="••••••••"
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.input}
            secureTextEntry={!showOldPassword}
          />
          <TouchableOpacity
            onPress={() => setShowOldPassword(!showOldPassword)}
          >
            <Ionicons
              name={showOldPassword ? "eye-off" : "eye"}
              size={20}
              color="rgba(255,255,255,0.5)"
            />
          </TouchableOpacity>
        </View>
        {errors.oldPassword ? (
          <Text style={styles.errorText}>{errors.oldPassword}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Mật khẩu mới</Text>
        <View
          style={[
            styles.inputContainer,
            errors.newPassword && styles.inputErrorBorder,
          ]}
        >
          <Shield
            size={20}
            color="rgba(255,255,255,0.5)"
            style={styles.inputIcon}
          />
          <TextInput
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              if (errors.newPassword) setErrors({ ...errors, newPassword: "" });
            }}
            placeholder="••••••••"
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.input}
            secureTextEntry={!showNewPassword}
          />
          <TouchableOpacity
            onPress={() => setShowNewPassword(!showNewPassword)}
          >
            <Ionicons
              name={showNewPassword ? "eye-off" : "eye"}
              size={20}
              color="rgba(255,255,255,0.5)"
            />
          </TouchableOpacity>
        </View>
        {errors.newPassword ? (
          <Text style={styles.errorText}>{errors.newPassword}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
        <View
          style={[
            styles.inputContainer,
            errors.confirmPassword && styles.inputErrorBorder,
          ]}
        >
          <Shield
            size={20}
            color="rgba(255,255,255,0.5)"
            style={styles.inputIcon}
          />
          <TextInput
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword)
                setErrors({ ...errors, confirmPassword: "" });
            }}
            placeholder="••••••••"
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.input}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off" : "eye"}
              size={20}
              color="rgba(255,255,255,0.5)"
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword ? (
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        ) : null}
      </View>

      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: "rgba(255,255,255,0.1)", shadowOpacity: 0 },
          changePasswordMutation.isPending && styles.saveButtonDisabled,
        ]}
        onPress={handlePasswordSubmit}
        disabled={changePasswordMutation.isPending}
      >
        {changePasswordMutation.isPending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Đổi mật khẩu</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  text: {
    color: Colors.dark.text,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 24,
  },
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  avatarContainer: {
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.dark.card,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.05)",
  },
  avatarPlaceholderText: {
    fontSize: 40,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "bold",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.dark.tint,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.dark.card,
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 12,
  },
  premiumBadge: {
    backgroundColor: "rgba(234, 179, 8, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.2)",
  },
  premiumText: {
    color: "#eab308",
    fontSize: 10,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 8,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inputContainerActive: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  inputErrorBorder: {
    borderColor: "rgba(239, 68, 68, 0.5)",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  disabledGroup: {
    opacity: 0.7,
  },
  disabledInput: {
    color: "rgba(255,255,255,0.5)",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    color: Colors.dark.text,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: Colors.dark.tint,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: Colors.dark.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    marginBottom: 20,
  },
  logoutText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
