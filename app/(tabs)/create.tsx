import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Colors from "@/constants/colors";
import { usePosts } from "@/lib/PostsContext";
import type { Post } from "@/lib/storage";

const POST_TYPES: { key: Post["postType"]; label: string; icon: string; color: string }[] = [
  { key: "giving", label: "Giving Away", icon: "gift", color: "#10B981" },
  { key: "looking", label: "Looking For", icon: "search", color: "#3B82F6" },
  { key: "community", label: "Community", icon: "people", color: "#F59E0B" },
];

export default function CreateScreen() {
  const { createPost, username } = usePosts();
  const insets = useSafeAreaInsets();
  const [caption, setCaption] = useState("");
  const [postType, setPostType] = useState<Post["postType"]>("giving");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 4,
    });
    if (!result.canceled && result.assets) {
      setImages((prev) => [
        ...prev,
        ...result.assets.map((a) => a.uri),
      ].slice(0, 4));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!caption.trim()) {
      Alert.alert("Missing info", "Please write a caption for your post.");
      return;
    }
    setSubmitting(true);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await createPost({
      username,
      caption: caption.trim(),
      postType,
      images,
    });
    setCaption("");
    setImages([]);
    setPostType("giving");
    setSubmitting(false);
    router.navigate("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "web" ? 67 : insets.top + 8 },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>New Post</Text>
        <Pressable
          onPress={handleSubmit}
          disabled={submitting || !caption.trim()}
          style={[
            styles.postBtn,
            (!caption.trim() || submitting) && styles.postBtnDisabled,
          ]}
        >
          <Text
            style={[
              styles.postBtnText,
              (!caption.trim() || submitting) && styles.postBtnTextDisabled,
            ]}
          >
            Post
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 118 : 100 }}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.typeSelector}>
          <Text style={styles.sectionLabel}>What type of post?</Text>
          <View style={styles.typeRow}>
            {POST_TYPES.map((type) => (
              <Pressable
                key={type.key}
                onPress={() => {
                  setPostType(type.key);
                  if (Platform.OS !== "web") {
                    Haptics.selectionAsync();
                  }
                }}
                style={[
                  styles.typeChip,
                  postType === type.key && {
                    backgroundColor: type.color + "18",
                    borderColor: type.color,
                  },
                ]}
              >
                <Ionicons
                  name={type.icon as any}
                  size={16}
                  color={postType === type.key ? type.color : Colors.light.textSecondary}
                />
                <Text
                  style={[
                    styles.typeChipText,
                    postType === type.key && { color: type.color },
                  ]}
                >
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.inputSection}>
          <TextInput
            ref={inputRef}
            style={styles.captionInput}
            value={caption}
            onChangeText={setCaption}
            placeholder={
              postType === "giving"
                ? "What are you giving away? Describe the item, condition, and pickup details..."
                : postType === "looking"
                  ? "What are you looking for? Be specific so people can help..."
                  : "Share something with the community..."
            }
            placeholderTextColor={Colors.light.textSecondary}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {caption.length}/500
          </Text>
        </View>

        {images.length > 0 && (
          <View style={styles.imageGrid}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageThumb}>
                <Image source={{ uri }} style={styles.thumbImage} />
                <Pressable
                  onPress={() => removeImage(index)}
                  style={styles.removeImageBtn}
                >
                  <Ionicons name="close-circle" size={22} color="#fff" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Pressable onPress={pickImage} style={styles.addImageBtn}>
          <Feather name="camera" size={20} color={Colors.light.tint} />
          <Text style={styles.addImageText}>Add Photos</Text>
          <Text style={styles.addImageHint}>{images.length}/4</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  postBtn: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postBtnDisabled: {
    backgroundColor: Colors.light.surfaceSecondary,
  },
  postBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  postBtnTextDisabled: {
    color: Colors.light.textSecondary,
  },
  scrollContent: {
    flex: 1,
  },
  typeSelector: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  typeChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
  },
  inputSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  captionInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    minHeight: 150,
    lineHeight: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  charCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "right",
    marginTop: 6,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  imageThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  removeImageBtn: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  addImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.tint + "40",
    borderStyle: "dashed",
    backgroundColor: Colors.light.tint + "08",
  },
  addImageText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
    flex: 1,
  },
  addImageHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
});
