import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

type TabType = "chat" | "playlist" | "members" | "settings";

interface RoomTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function RoomTabs({ activeTab, onTabChange }: RoomTabsProps) {
  const tabs: { key: TabType; label: string }[] = [
    { key: "chat", label: "Chat" },
    { key: "playlist", label: "DS Phát" },
    { key: "members", label: "Thành viên" },
    { key: "settings", label: "Cài đặt" },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => onTabChange(tab.key)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.key && styles.activeTabText,
            ]}
          >
            {tab.label}
          </Text>
          {activeTab === tab.key && <View style={styles.indicator} />}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#0e0f14",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  activeTab: {
    // Optional active bg
  },
  tabText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#fff",
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: "#ef4444",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});
