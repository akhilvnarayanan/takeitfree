import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  Image,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/AuthContext";
import {
  getItemById,
  getUserById,
  getRequestsForItem,
  createRequest,
  deleteItem,
  markItemGiven,
  reportItem,
  Item,
  User,
  ItemRequest,
  CATEGORY_LABELS,
  CONDITION_LABELS,
} from "@/lib/storage";

const conditionColors: Record<string, string> = {
  new: "#10B981",
  used_good: "#3B82F6",
  used_fair: "#F59E0B",
  needs_repair: "#EF4444",
};

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

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [imageIndex, setImageIndex] = useState(0);

  const isOwner = user?.id === item?.userId;
  const myRequest = requests.find((r) => r.requesterId === user?.id);

  const loadData = useCallback(async () => {
    if (!id) return;
    const i = await getItemById(id);
    setItem(i);
    if (i) {
      const o = await getUserById(i.userId);
      setOwner(o);
      const r = await getRequestsForItem(i.id);
      setRequests(r);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRequest = async () => {
    if (!user || !item) return;
    try {
      await createRequest(item.id, user.id, requestMessage.trim());
      setShowRequestModal(false);
      setRequestMessage("");
      Alert.alert("Request Sent!", "The owner will review your request.");
      loadData();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Listing", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (item) {
            await deleteItem(item.id);
            router.back();
          }
        },
      },
    ]);
  };

  const handleMarkGiven = () => {
    Alert.alert(
      "Mark as Given Away",
      "This will finalize the handover and award reputation points.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            if (item) {
              await markItemGiven(item.id);
              loadData();
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    if (!user || !item) return;
    Alert.prompt
      ? Alert.prompt("Report Listing", "Why are you reporting this?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Report",
            onPress: async (reason) => {
              if (reason) {
                await reportItem(user.id, "item", item.id, reason);
                Alert.alert("Reported", "Thank you. We'll review this listing.");
              }
            },
          },
        ])
      : (async () => {
          await reportItem(user.id, "item", item.id, "Inappropriate listing");
          Alert.alert("Reported", "Thank you. We'll review this listing.");
        })();
  };

  if (!item) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={styles.emptyText}>Item not found</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={styles.container}>
      <View style={[styles.backBar, { top: Platform.OS === "web" ? 67 : insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={Colors.light.text} />
        </Pressable>
        {isOwner && (
          <View style={styles.ownerActions}>
            <Pressable onPress={handleDelete} hitSlop={8}>
              <Ionicons name="trash-outline" size={22} color={Colors.light.danger} />
            </Pressable>
          </View>
        )}
        {!isOwner && (
          <Pressable onPress={handleReport} hitSlop={8} style={styles.backBtn}>
            <Ionicons name="flag-outline" size={20} color={Colors.light.textSecondary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageSection}>
          {item.images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                setImageIndex(idx);
              }}
            >
              {item.images.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={[styles.heroImage, { width: screenWidth }]}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={56} color={Colors.light.tabIconDefault} />
            </View>
          )}
          {item.images.length > 1 && (
            <View style={styles.dots}>
              {item.images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, imageIndex === i && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.conditionBadge,
                { backgroundColor: conditionColors[item.condition] || Colors.light.tint },
              ]}
            >
              <Text style={styles.conditionText}>{CONDITION_LABELS[item.condition]}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{CATEGORY_LABELS[item.category]}</Text>
            </View>
            {item.status !== "available" && (
              <View
                style={[
                  styles.statusBadge,
                  item.status === "given_away" && { backgroundColor: Colors.light.tint },
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {item.status === "reserved" ? "Reserved" : "Given Away"}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>

          {item.description ? (
            <Text style={styles.description}>{item.description}</Text>
          ) : null}

          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color={Colors.light.tint} />
            <Text style={styles.infoText}>{item.pickupArea}</Text>
          </View>

          {owner && (
            <Pressable
              onPress={() => router.push(`/user/${owner.id}`)}
              style={styles.ownerCard}
            >
              <View style={styles.ownerAvatar}>
                <Text style={styles.ownerAvatarText}>
                  {owner.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerName}>{owner.name}</Text>
                <View style={styles.ownerMeta}>
                  <Ionicons name="star" size={12} color={Colors.light.accent} />
                  <Text style={styles.ownerMetaText}>
                    {owner.reputationScore} rep · {owner.itemsGivenCount} given
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
            </Pressable>
          )}

          {isOwner && requests.length > 0 && (
            <Pressable
              onPress={() => router.push(`/item/requests/${item.id}`)}
              style={styles.requestsCard}
            >
              <View style={styles.requestsInfo}>
                <Ionicons name="people" size={20} color={Colors.light.tint} />
                <Text style={styles.requestsText}>
                  {requests.filter((r) => r.status === "pending").length} pending requests
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
            </Pressable>
          )}

          {isOwner && item.status === "reserved" && (
            <Pressable onPress={handleMarkGiven} style={styles.givenBtn}>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.givenBtnText}>Mark as Given Away</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {!isOwner && item.status === "available" && !myRequest && (
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 12 },
          ]}
        >
          <Pressable
            onPress={() => setShowRequestModal(true)}
            style={styles.requestBtn}
          >
            <Ionicons name="hand-left" size={20} color="#fff" />
            <Text style={styles.requestBtnText}>Request This Item</Text>
          </Pressable>
        </View>
      )}

      {!isOwner && myRequest && (
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 12 },
          ]}
        >
          <View
            style={[
              styles.requestStatusBar,
              myRequest.status === "accepted" && { backgroundColor: Colors.light.tint + "15" },
              myRequest.status === "rejected" && { backgroundColor: Colors.light.danger + "15" },
            ]}
          >
            <Ionicons
              name={
                myRequest.status === "accepted"
                  ? "checkmark-circle"
                  : myRequest.status === "rejected"
                    ? "close-circle"
                    : "time"
              }
              size={22}
              color={
                myRequest.status === "accepted"
                  ? Colors.light.tint
                  : myRequest.status === "rejected"
                    ? Colors.light.danger
                    : Colors.light.accent
              }
            />
            <Text
              style={[
                styles.requestStatusText,
                myRequest.status === "accepted" && { color: Colors.light.tint },
                myRequest.status === "rejected" && { color: Colors.light.danger },
              ]}
            >
              {myRequest.status === "pending"
                ? "Request Pending"
                : myRequest.status === "accepted"
                  ? "Request Accepted!"
                  : "Request Declined"}
            </Text>
            {myRequest.status === "accepted" && (
              <Pressable
                onPress={() => router.push(`/chat/${myRequest.id}`)}
                style={styles.chatLinkBtn}
              >
                <Ionicons name="chatbubble" size={16} color="#fff" />
                <Text style={styles.chatLinkText}>Chat</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      <Modal visible={showRequestModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Item</Text>
              <Pressable onPress={() => setShowRequestModal(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>
              Add a message to the owner (optional)
            </Text>
            <TextInput
              style={styles.modalInput}
              value={requestMessage}
              onChangeText={setRequestMessage}
              placeholder="Hi! I'd love to take this item. When can I pick it up?"
              placeholderTextColor={Colors.light.textSecondary}
              multiline
              textAlignVertical="top"
              maxLength={300}
            />
            <Pressable onPress={handleRequest} style={styles.modalSubmitBtn}>
              <Text style={styles.modalSubmitText}>Send Request</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  backBar: {
    position: "absolute",
    zIndex: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  ownerActions: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 19,
    paddingHorizontal: 12,
    height: 38,
  },
  imageSection: { position: "relative" },
  heroImage: { height: 280, resizeMode: "cover" },
  imagePlaceholder: {
    height: 280,
    backgroundColor: Colors.light.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: { backgroundColor: "#fff", width: 16 },
  content: { padding: 20, gap: 12 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  conditionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  conditionText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.light.accent,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    lineHeight: 30,
  },
  timeText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  description: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  ownerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
  },
  ownerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  ownerAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  ownerInfo: { flex: 1, gap: 2 },
  ownerName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  ownerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ownerMetaText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  requestsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.tint + "10",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.tint + "30",
  },
  requestsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requestsText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
  },
  givenBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    height: 48,
  },
  givenBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  requestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    height: 52,
  },
  requestBtnText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  requestStatusBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 14,
    padding: 14,
  },
  requestStatusText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.accent,
  },
  chatLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chatLinkText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginBottom: 14,
  },
  modalInput: {
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    minHeight: 100,
    marginBottom: 14,
  },
  modalSubmitBtn: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
