import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { usePosts } from "@/lib/PostsContext";
import PostCard from "@/components/PostCard";
import { router } from "expo-router";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { posts, username, setUsername, toggleLike, deletePost } = usePosts();
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(username);

  const myPosts = posts.filter((p) => p.username === username);
  const totalLikes = myPosts.reduce((acc, p) => acc + p.likeCount, 0);

  const saveUsername = async () => {
    if (!nameInput.trim()) return;
    await setUsername(nameInput.trim());
    setEditing(false);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deletePost(id),
      },
    ]);
  };

  const ListHeader = () => (
    <View
      style={[
        styles.profileSection,
        { paddingTop: Platform.OS === "web" ? 67 : insets.top + 16 },
      ]}
    >
      <View style={styles.avatarLarge}>
        <Text style={styles.avatarLargeText}>
          {username.charAt(0).toUpperCase()}
        </Text>
      </View>

      {editing ? (
        <View style={styles.editRow}>
          <TextInput
            style={styles.nameInput}
            value={nameInput}
            onChangeText={setNameInput}
            autoFocus
            maxLength={20}
            onSubmitEditing={saveUsername}
          />
          <Pressable onPress={saveUsername} hitSlop={8}>
            <Ionicons name="checkmark-circle" size={28} color={Colors.light.tint} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => {
            setNameInput(username);
            setEditing(true);
          }}
          style={styles.nameRow}
        >
          <Text style={styles.usernameText}>{username}</Text>
          <Feather name="edit-2" size={14} color={Colors.light.textSecondary} />
        </Pressable>
      )}

      <View style={styles.profileStats}>
        <View style={styles.profileStatItem}>
          <Text style={styles.profileStatNumber}>{myPosts.length}</Text>
          <Text style={styles.profileStatLabel}>Posts</Text>
        </View>
        <View style={styles.profileStatDivider} />
        <View style={styles.profileStatItem}>
          <Text style={styles.profileStatNumber}>{totalLikes}</Text>
          <Text style={styles.profileStatLabel}>Likes</Text>
        </View>
        <View style={styles.profileStatDivider} />
        <View style={styles.profileStatItem}>
          <Text style={styles.profileStatNumber}>
            {myPosts.filter((p) => p.postType === "giving").length}
          </Text>
          <Text style={styles.profileStatLabel}>Given</Text>
        </View>
      </View>

      <Text style={styles.myPostsTitle}>My Posts</Text>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={40} color={Colors.light.textSecondary} />
      <Text style={styles.emptyText}>You haven't posted anything yet</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={myPosts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        renderItem={({ item }) => (
          <Pressable onLongPress={() => handleDelete(item.id)}>
            <PostCard
              post={item}
              onLike={(id) => toggleLike(id)}
              onComment={(id) =>
                router.push({ pathname: "/post/[id]", params: { id } })
              }
              onPress={(id) =>
                router.push({ pathname: "/post/[id]", params: { id } })
              }
            />
          </Pressable>
        )}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 118 : 100,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarLargeText: {
    color: "#fff",
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  usernameText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  nameInput: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.tint,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 120,
    textAlign: "center",
  },
  profileStats: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 24,
  },
  profileStatItem: {
    flex: 1,
    alignItems: "center",
  },
  profileStatNumber: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  profileStatLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  profileStatDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
  },
  myPostsTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
});
