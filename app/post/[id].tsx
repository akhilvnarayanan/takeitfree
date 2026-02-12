import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { usePosts } from "@/lib/PostsContext";
import CommentItem from "@/components/CommentItem";
import type { Comment } from "@/lib/storage";

const POST_TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  giving: { label: "Giving Away", color: "#10B981", icon: "gift" },
  looking: { label: "Looking For", color: "#3B82F6", icon: "search" },
  community: { label: "Community", color: "#F59E0B", icon: "people" },
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

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { posts, toggleLike, loadComments, addComment } = usePosts();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const post = posts.find((p) => p.id === id);
  const typeConfig = post ? POST_TYPE_CONFIG[post.postType] : null;

  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const fetchComments = useCallback(async () => {
    if (!id) return;
    setLoadingComments(true);
    const data = await loadComments(id);
    setComments(data);
    setLoadingComments(false);
  }, [id, loadComments]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleLike = () => {
    if (!post) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    heartScale.value = withSpring(1.3, { damping: 4 }, () => {
      heartScale.value = withSpring(1);
    });
    toggleLike(post.id);
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !id || sending) return;
    setSending(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const comment = await addComment(id, commentText.trim());
    setComments((prev) => [...prev, comment]);
    setCommentText("");
    setSending(false);
    inputRef.current?.focus();
  };

  if (!post) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Post not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const PostHeader = () => (
    <View style={styles.postContent}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {post.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.time}>{formatTime(post.createdAt)}</Text>
        </View>
        {typeConfig && (
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: typeConfig.color + "18" },
            ]}
          >
            <Ionicons
              name={typeConfig.icon as any}
              size={12}
              color={typeConfig.color}
            />
            <Text style={[styles.typeLabel, { color: typeConfig.color }]}>
              {typeConfig.label}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.caption}>{post.caption}</Text>

      <View style={styles.actions}>
        <Pressable onPress={handleLike} style={styles.actionBtn} hitSlop={8}>
          <Animated.View style={heartStyle}>
            <Ionicons
              name={post.liked ? "heart" : "heart-outline"}
              size={24}
              color={post.liked ? "#EF4444" : Colors.light.textSecondary}
            />
          </Animated.View>
          <Text
            style={[styles.actionText, post.liked && { color: "#EF4444" }]}
          >
            {post.likeCount} likes
          </Text>
        </Pressable>

        <View style={styles.actionBtn}>
          <Feather
            name="message-circle"
            size={22}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.actionText}>
            {post.commentCount} comments
          </Text>
        </View>
      </View>

      <View style={styles.commentsDivider}>
        <Text style={styles.commentsTitle}>Comments</Text>
      </View>

      {loadingComments && (
        <ActivityIndicator
          size="small"
          color={Colors.light.tint}
          style={{ paddingVertical: 20 }}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.nav,
          { paddingTop: Platform.OS === "web" ? 67 : insets.top + 4 },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.navTitle}>Post</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={PostHeader}
          renderItem={({ item }) => <CommentItem comment={item} />}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            !loadingComments ? (
              <View style={styles.emptyComments}>
                <Text style={styles.emptyCommentsText}>
                  No comments yet. Be the first!
                </Text>
              </View>
            ) : null
          }
        />

        <View
          style={[
            styles.inputBar,
            { paddingBottom: Platform.OS === "web" ? 34 : Math.max(insets.bottom, 12) },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={styles.commentInput}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
            placeholderTextColor={Colors.light.textSecondary}
            maxLength={300}
            multiline
          />
          <Pressable
            onPress={handleSendComment}
            disabled={!commentText.trim() || sending}
            hitSlop={8}
            style={[
              styles.sendBtn,
              (!commentText.trim() || sending) && styles.sendBtnDisabled,
            ]}
          >
            <Ionicons
              name="send"
              size={20}
              color={commentText.trim() && !sending ? "#fff" : Colors.light.textSecondary}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  backLink: {},
  backLinkText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  postContent: {
    paddingTop: 8,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  username: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  time: {
    fontSize: 13,
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
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.text,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  commentsDivider: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 6,
    borderTopColor: Colors.light.surfaceSecondary,
  },
  commentsTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  emptyComments: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyCommentsText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.light.surfaceSecondary,
  },
});
