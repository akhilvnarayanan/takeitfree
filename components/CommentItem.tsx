import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import type { Comment } from "@/lib/storage";

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function CommentItem({ comment }: { comment: Comment }) {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {comment.username.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.body}>
        <View style={styles.bubble}>
          <Text style={styles.username}>{comment.username}</Text>
          <Text style={styles.content}>{comment.content}</Text>
        </View>
        <Text style={styles.time}>{formatTime(comment.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  avatarText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
  },
  body: {
    flex: 1,
  },
  bubble: {
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  username: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 2,
  },
  content: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    lineHeight: 20,
  },
  time: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    marginLeft: 12,
  },
});
