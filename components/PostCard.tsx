import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import type { Post } from "@/lib/storage";

interface PostCardProps {
  post: Post;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onPress: (id: string) => void;
}

const POST_TYPE_CONFIG = {
  giving: { label: "Giving Away", color: "#10B981", icon: "gift" as const },
  looking: { label: "Looking For", color: "#3B82F6", icon: "search" as const },
  community: { label: "Community", color: "#F59E0B", icon: "people" as const },
};

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function PostCard({ post, onLike, onComment, onPress }: PostCardProps) {
  const heartScale = useSharedValue(1);
  const typeConfig = POST_TYPE_CONFIG[post.postType];

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleLike = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    heartScale.value = withSpring(1.3, { damping: 4 }, () => {
      heartScale.value = withSpring(1);
    });
    onLike(post.id);
  };

  return (
    <Pressable
      onPress={() => onPress(post.id)}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {post.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.time}>{formatTime(post.createdAt)}</Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + "18" }]}>
          <Ionicons name={typeConfig.icon} size={12} color={typeConfig.color} />
          <Text style={[styles.typeLabel, { color: typeConfig.color }]}>
            {typeConfig.label}
          </Text>
        </View>
      </View>

      <Text style={styles.caption}>{post.caption}</Text>

      <View style={styles.actions}>
        <Pressable onPress={handleLike} style={styles.actionBtn} hitSlop={8}>
          <Animated.View style={[styles.actionInner, heartStyle]}>
            <Ionicons
              name={post.liked ? "heart" : "heart-outline"}
              size={22}
              color={post.liked ? "#EF4444" : Colors.light.textSecondary}
            />
          </Animated.View>
          <Text
            style={[
              styles.actionText,
              post.liked && { color: "#EF4444" },
            ]}
          >
            {post.likeCount}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onComment(post.id)}
          style={styles.actionBtn}
          hitSlop={8}
        >
          <Feather
            name="message-circle"
            size={20}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.actionText}>{post.commentCount}</Text>
        </Pressable>

        <Pressable style={styles.actionBtn} hitSlop={8}>
          <Feather
            name="share-2"
            size={18}
            color={Colors.light.textSecondary}
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  username: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  time: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  typeLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  caption: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.text,
    fontFamily: "Inter_400Regular",
    marginBottom: 14,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionInner: {},
  actionText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontFamily: "Inter_400Regular",
  },
});
