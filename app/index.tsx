import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuthStore } from "../store/auth.store";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "../services/auth.service";

export default function Index() {
  const { isAuthenticated, setUser, setTokens } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        const refreshToken = await AsyncStorage.getItem("refreshToken");

        if (token && refreshToken) {
          // Verify token by fetching user profile
          // We can optimisticly set tokens first to allow API call
          await setTokens(token, refreshToken);
          try {
            const response = await authService.getMe();
            if (response.success) {
              setUser(response.data.user);
            } else {
              // Token invalid
              await useAuthStore.getState().logout();
            }
          } catch (error) {
            console.log("Token validation failed", error);
            await useAuthStore.getState().logout();
          }
        }
      } catch (e) {
        console.error("Auth check failed", e);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthenticated) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0e0f14",
        }}
      >
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/login" />;
}
