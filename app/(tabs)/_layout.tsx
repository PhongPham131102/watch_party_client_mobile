import { Tabs } from "expo-router";
import React from "react";
import { View, Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Home, User } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingTop: Platform.OS === "ios" ? 0 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                top: Platform.OS === "ios" ? 10 : 0,
              }}
            >
              <Home size={28} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                top: Platform.OS === "ios" ? 10 : 0,
              }}
            >
              <Ionicons
                name="search"
                size={28}
                color={color}
                style={{ fontWeight: focused ? "bold" : "normal" }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="watch-party"
        options={{
          title: "Watch Party",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                top: Platform.OS === "ios" ? 10 : 0,
              }}
            >
              <Ionicons
                name="people"
                size={28}
                color={color}
                style={{ fontWeight: focused ? "bold" : "normal" }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                top: Platform.OS === "ios" ? 10 : 0,
              }}
            >
              <User size={28} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
