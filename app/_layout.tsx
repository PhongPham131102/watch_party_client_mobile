import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { QueryProvider } from "@/providers/query-provider";

import { useColorScheme } from "@/hooks/use-color-scheme";

// export const unstable_settings = {
//   anchor: "(tabs)",
// };

import { GestureHandlerRootView } from "react-native-gesture-handler";

import Toast from "react-native-toast-message";
import { toastConfig } from "@/components/ui/ToastConfig";
import { useEffect } from "react";
import { DeviceEventEmitter } from "react-native";
import { useAuthStore } from "@/store/auth.store";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener("unauthorized", () => {
      logout();
      Toast.show({
        type: "error",
        text1: "Session expired",
        text2: "Please login again",
      });
      router.replace("/login");
    });

    return () => {
      subscription.remove();
    };
  }, [logout, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen
              name="forgot-password"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="movies" options={{ headerShown: false }} />
            <Stack.Screen name="my-list" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="light" />
          <Toast config={toastConfig} />
        </ThemeProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
