import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { Item, CATEGORY_LABELS, CONDITION_LABELS } from "@/lib/storage";

interface ItemCardProps {
  item: Item;
  ownerName?: string;
  ownerLocation?: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

const conditionColors: Record<string, string> = {
  new: "#10B981",
  used_good: "#3B82F6",
  used_fair: "#F59E0B",
  needs_repair: "#EF4444",
};

export function ItemCard({ item, ownerName, ownerLocation }: ItemCardProps) {
  return (
    <Pressable
      onPress={() => router.push(`/item/${item.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageContainer}>
        {item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={32} color={Colors.light.tabIconDefault} />
          </View>
        )}
        <View
          style={[
            styles.conditionBadge,
            { backgroundColor: conditionColors[item.condition] || Colors.light.tint },
          ]}
        >
          <Text style={styles.conditionText}>{CONDITION_LABELS[item.condition]}</Text>
        </View>
        {item.status === "reserved" && (
          <View style={styles.reservedOverlay}>
            <Text style={styles.reservedText}>Reserved</Text>
          </View>
        )}
        {item.status === "given_away" && (
          <View style={[styles.reservedOverlay, { backgroundColor: "rgba(16,185,129,0.85)" }]}>
            <Text style={styles.reservedText}>Given Away</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.categoryRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{CATEGORY_LABELS[item.category]}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={Colors.light.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {item.pickupArea}
          </Text>
        </View>
        {ownerName && (
          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={13} color={Colors.light.textSecondary} />
            <Text style={styles.metaText}>{ownerName}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.metaText}>{timeAgo(item.createdAt)}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    height: 150,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.light.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  conditionBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  conditionText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  reservedOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(245,158,11,0.85)",
    paddingVertical: 4,
    alignItems: "center",
  },
  reservedText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  content: {
    padding: 12,
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    lineHeight: 20,
  },
  categoryRow: {
    flexDirection: "row",
  },
  categoryPill: {
    backgroundColor: Colors.light.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    flexShrink: 1,
  },
  dot: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});
