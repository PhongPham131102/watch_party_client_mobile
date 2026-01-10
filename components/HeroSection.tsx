import React from "react";
import { View, Text, StyleSheet, Dimensions, Pressable } from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { HeroSection as HeroSectionType } from "../types/hero-section.types";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface HeroSectionProps {
  heroSections: HeroSectionType[];
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function HeroSection({ heroSections }: HeroSectionProps) {
  const router = useRouter();

  if (!heroSections || heroSections.length === 0) return null;

  return (
    <View style={styles.container}>
      <Carousel
        loop
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT * 0.6}
        autoPlay={true}
        data={heroSections}
        scrollAnimationDuration={1000}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/movies/${item.movie.slug}`)}
            style={styles.itemContainer}
          >
            <Image
              source={{
                uri: item.movie.posterUrl || item.movie.backdropUrl || "",
              }}
              style={styles.backgroundImage}
              contentFit="cover"
            />
            <LinearGradient
              colors={[
                "transparent",
                "rgba(14, 15, 20, 0.2)",
                "rgba(14, 15, 20, 0.9)",
                "#0e0f14",
              ]}
              style={styles.gradient}
            />

            <View style={styles.contentContainer}>
              {item.movie.titleImageUrl ? (
                <Image
                  source={{ uri: item.movie.titleImageUrl }}
                  style={styles.titleImage}
                  contentFit="contain"
                />
              ) : (
                <Text style={styles.title}>
                  {item.title || item.movie.title}
                </Text>
              )}

              <Text style={styles.description} numberOfLines={3}>
                {item.description || item.movie.description}
              </Text>

              <View style={styles.buttonContainer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.playButton,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={() => router.push(`/movies/${item.movie.slug}`)}
                >
                  <Ionicons name="play" size={22} color="black" />
                  <Text style={styles.playButtonText}>Phát</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.myListButton,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => {
                    // TODO: Implement add to favorites/my list functionality
                    console.log("Add to My List:", item.movie.id);
                  }}
                >
                  <Ionicons name="add" size={22} color="white" />
                  <Text style={styles.myListButtonText}>Danh sách</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: SCREEN_HEIGHT * 0.6,
  },
  itemContainer: {
    flex: 1,
    position: "relative",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%",
  },
  contentContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  title: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  titleImage: {
    width: 250,
    height: 80,
    marginBottom: 12,
  },
  description: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  playButton: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
  myListButton: {
    backgroundColor: "rgba(109, 109, 110, 0.7)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  myListButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
