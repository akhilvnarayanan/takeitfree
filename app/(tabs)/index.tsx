import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import PostCard from "@/components/PostCard";
import { usePosts } from "@/lib/PostsContext";

export default function FeedScreen() {
  const { posts, loading, refreshPosts, toggleLike } = usePosts();
  const insets = useSafeAreaInsets();

  const handleLike = useCallback(
    (id: string) => {
      toggleLike(id);
    },
    [toggleLike]
  );

  const handleComment = useCallback((id: string) => {
    router.push({ pathname: "/post/[id]", params: { id } });
  }, []);

  const handlePress = useCallback((id: string) => {
    router.push({ pathname: "/post/[id]", params: { id } });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: (typeof posts)[0] }) => (
      <PostCard
        post={item}
        onLike={handleLike}
        onComment={handleComment}
        onPress={handlePress}
      />
    ),
    [handleLike, handleComment, handlePress]
  );

  const ListHeader = () => (
    <View
      style={[
        styles.headerContainer,
        { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 },
      ]}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>TakeItFree</Text>
          <Text style={styles.headerSubtitle}>Share freely, live lightly</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="leaf" size={24} color={Colors.light.tint} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{posts.length}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {posts.filter((p) => p.postType === "giving").length}
          </Text>
          <Text style={styles.statLabel}>Giving</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {posts.reduce((acc, p) => acc + p.likeCount, 0)}
          </Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
      </View>
    </View>
  );

  const ListEmpty = () =>
    !loading ? (
      <View style={styles.emptyContainer}>
        <Ionicons name="leaf-outline" size={48} color={Colors.light.textSecondary} />
        <Text style={styles.emptyTitle}>No posts yet</Text>
        <Text style={styles.emptyText}>
          Be the first to share something with the community
        </Text>
      </View>
    ) : null;

  if (loading && posts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 118 : 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshPosts}
            tintColor={Colors.light.tint}
          />
        }
      />
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
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.tint + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
