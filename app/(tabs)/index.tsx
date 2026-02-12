import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/AuthContext";
import {
  getItems,
  getUserById,
  Item,
  ItemCategory,
  CATEGORY_LABELS,
} from "@/lib/storage";
import { ItemCard } from "@/components/ItemCard";
import { useFocusEffect } from "expo-router";

const CATEGORIES: { key: ItemCategory | "all"; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "grid-outline" },
  { key: "electronics", label: "Electronics", icon: "laptop-outline" },
  { key: "furniture", label: "Furniture", icon: "bed-outline" },
  { key: "clothing", label: "Clothing", icon: "shirt-outline" },
  { key: "books", label: "Books", icon: "book-outline" },
  { key: "kitchen", label: "Kitchen", icon: "restaurant-outline" },
  { key: "toys", label: "Toys", icon: "game-controller-outline" },
  { key: "sports", label: "Sports", icon: "bicycle-outline" },
  { key: "garden", label: "Garden", icon: "leaf-outline" },
  { key: "other", label: "Other", icon: "ellipsis-horizontal-outline" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [items, setItems] = useState<(Item & { ownerName: string; ownerLocation: string })[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ItemCategory | "all">("all");
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(async () => {
    const filters: any = { status: "available" as const };
    if (category !== "all") filters.category = category;
    if (search.trim()) filters.search = search.trim();

    const raw = await getItems(filters);
    const withOwner = await Promise.all(
      raw.map(async (item) => {
        const owner = await getUserById(item.userId);
        return {
          ...item,
          ownerName: owner?.name || "Unknown",
          ownerLocation: owner?.location || "",
        };
      })
    );
    setItems(withOwner);
  }, [category, search]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const renderItem = useCallback(
    ({ item }: { item: (typeof items)[0] }) => (
      <View style={styles.cardWrapper}>
        <ItemCard
          item={item}
          ownerName={item.ownerName}
          ownerLocation={item.ownerLocation}
        />
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "web" ? 67 : insets.top + 8 },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hi, {user?.name?.split(" ")[0]}</Text>
            <Text style={styles.subtitle}>Find something you need</Text>
          </View>
          <View style={styles.locationPill}>
            <Ionicons name="location" size={14} color={Colors.light.tint} />
            <Text style={styles.locationText}>{user?.location || "Set location"}</Text>
          </View>
        </View>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={Colors.light.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search items..."
            placeholderTextColor={Colors.light.textSecondary}
            returnKeyType="search"
            onSubmitEditing={loadItems}
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => {
                setSearch("");
              }}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color={Colors.light.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 100,
          paddingTop: 8,
        }}
        ListHeaderComponent={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.catScroll}
            contentContainerStyle={styles.catContainer}
          >
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.key}
                onPress={() => setCategory(cat.key)}
                style={[
                  styles.catPill,
                  category === cat.key && styles.catPillActive,
                ]}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={
                    category === cat.key ? "#fff" : Colors.light.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.catPillText,
                    category === cat.key && styles.catPillTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search" size={48} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptyText}>
              {search
                ? "Try different keywords"
                : "Be the first to give something away!"}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
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
  header: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  greeting: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  catScroll: {
    marginBottom: 8,
  },
  catContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  catPillActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  catPillText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
  },
  catPillTextActive: {
    color: "#fff",
  },
  row: {
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  cardWrapper: {
    flex: 1,
    maxWidth: "48.5%",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 8,
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
  },
});
