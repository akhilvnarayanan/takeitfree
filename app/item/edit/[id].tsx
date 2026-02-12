import React, { useState, useEffect } from "react";
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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Colors from "@/constants/colors";
import {
  getItemById,
  updateItem,
  ItemCategory,
  ItemCondition,
  CATEGORY_LABELS,
  CONDITION_LABELS,
} from "@/lib/storage";

const categories = Object.entries(CATEGORY_LABELS) as [ItemCategory, string][];
const conditions = Object.entries(CONDITION_LABELS) as [ItemCondition, string][];

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ItemCategory>("other");
  const [condition, setCondition] = useState<ItemCondition>("used_good");
  const [pickupArea, setPickupArea] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      getItemById(id).then((item) => {
        if (item) {
          setTitle(item.title);
          setDescription(item.description);
          setCategory(item.category);
          setCondition(item.condition);
          setPickupArea(item.pickupArea);
          setImages(item.images);
        }
      });
    }
  }, [id]);

  const pickImage = async () => {
    if (images.length >= 5) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      selectionLimit: 5 - images.length,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri).slice(0, 5 - prev.length)]);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !id) return;
    setLoading(true);
    try {
      await updateItem(id, {
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        pickupArea: pickupArea.trim(),
        images,
      });
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.headerTitle}>Edit Listing</Text>
        <Pressable onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.light.tint} />
          ) : (
            <Ionicons name="checkmark" size={26} color={Colors.light.tint} />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={pickImage} style={styles.imagePickerRow}>
          {images.map((uri, i) => (
            <View key={i} style={styles.imageThumb}>
              <Image source={{ uri }} style={styles.imageThumbImg} />
              <Pressable
                onPress={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                style={styles.removeImg}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={20} color={Colors.light.danger} />
              </Pressable>
            </View>
          ))}
          {images.length < 5 && (
            <View style={styles.addImageBtn}>
              <Ionicons name="camera-outline" size={28} color={Colors.light.tint} />
            </View>
          )}
        </Pressable>

        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { minHeight: 100 }]}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.chipGrid}>
            {categories.map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => setCategory(key)}
                style={[styles.chip, category === key && styles.chipActive]}
              >
                <Text style={[styles.chipText, category === key && styles.chipTextActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Condition</Text>
          <View style={styles.chipGrid}>
            {conditions.map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => setCondition(key)}
                style={[styles.chip, condition === key && styles.chipActive]}
              >
                <Text style={[styles.chipText, condition === key && styles.chipTextActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Pickup Area</Text>
          <TextInput
            style={styles.input}
            value={pickupArea}
            onChangeText={setPickupArea}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  imagePickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  imageThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  imageThumbImg: { width: "100%", height: "100%" },
  removeImg: { position: "absolute", top: 2, right: 2 },
  addImageBtn: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surfaceSecondary,
  },
  field: { marginBottom: 18 },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  chipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
  },
  chipTextActive: { color: "#fff" },
});
