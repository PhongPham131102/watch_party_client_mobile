import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types/auth.types";
import { authService } from "../services/auth.service";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setTokens: async (accessToken, refreshToken) => {
        await AsyncStorage.setItem("accessToken", accessToken);
        await AsyncStorage.setItem("refreshToken", refreshToken); // Backup in case needed
        set({ accessToken, isAuthenticated: true });
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          await AsyncStorage.removeItem("accessToken");
          await AsyncStorage.removeItem("refreshToken");
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
