import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/AuthContext";
import {
  getUserById,
  getItems,
  blockUser,
  unblockUser,
  reportItem,
  User,
  Item,
} from "@/lib/storage";
import { ItemCard } from "@/components/ItemCard";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      (async () => {
        const u = await getUserById(id);
        setProfileUser(u);
        const itms = await getItems({ userId: id, status: "available" });
        setItems(itms);
        if (user) {
          setIsBlocked(user.blockedUsers?.includes(id) || false);
        }
      })();
    }, [id, user])
  );

  const handleBlock = async () => {
    if (!user || !id) return;
    if (isBlocked) {
      await unblockUser(user.id, id);
      setIsBlocked(false);
      await refreshUser();
    } else {
      Alert.alert("Block User", "They won't be able to see your listings.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            await blockUser(user.id, id);
            setIsBlocked(true);
            await refreshUser();
          },
        },
      ]);
    }
  };

  const handleReport = async () => {
    if (!user || !id) return;
    await reportItem(user.id, "user", id, "Reported by user");
    Alert.alert("Reported", "Thank you. We'll review this account.");
  };

  if (!profileUser) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <Text>User not found</Text>
      </View>
    );
  }

  const ListHeader = () => (
    <View
      style={[
        styles.profileSection,
        { paddingTop: Platform.OS === "web" ? 67 : insets.top + 16 },
      ]}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={Colors.light.text} />
        </Pressable>
        <View style={styles.headerActions}>
          {user?.id !== id && (
            <>
              <Pressable onPress={handleReport} hitSlop={8}>
                <Ionicons name="flag-outline" size={20} color={Colors.light.textSecondary} />
              </Pressable>
              <Pressable onPress={handleBlock} hitSlop={8}>
                <Ionicons
                  name={isBlocked ? "person-add" : "ban"}
                  size={20}
                  color={isBlocked ? Colors.light.tint : Colors.light.danger}
                />
              </Pressable>
            </>
          )}
        </View>
      </View>

      <View style={styles.avatarLarge}>
        <Text style={styles.avatarLargeText}>
          {profileUser.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.userName}>{profileUser.name}</Text>
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={14} color={Colors.light.textSecondary} />
        <Text style={styles.locationText}>{profileUser.location}</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{profileUser.reputationScore}</Text>
          <Text style={styles.statLabel}>Reputation</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{profileUser.itemsGivenCount}</Text>
          <Text style={styles.statLabel}>Given</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{profileUser.itemsReceivedCount}</Text>
          <Text style={styles.statLabel}>Received</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Available Items</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No available items</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ItemCard item={item} />
          </View>
        )}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  profileSection: {
    alignItems: "center",
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: "row",
    gap: 16,
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
  userName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 24,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: {
    fontSize: 22,
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
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    alignSelf: "flex-start",
    marginBottom: 4,
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
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
});
