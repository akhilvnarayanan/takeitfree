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
import {
  getRequestsForItem,
  getUserById,
  acceptRequest,
  rejectRequest,
  ItemRequest,
  User,
} from "@/lib/storage";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface RequestWithUser {
  request: ItemRequest;
  user: User;
}

export default function ItemRequestsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<RequestWithUser[]>([]);

  const loadData = useCallback(async () => {
    if (!id) return;
    const reqs = await getRequestsForItem(id);
    const withUsers = await Promise.all(
      reqs.map(async (r) => {
        const u = await getUserById(r.requesterId);
        return { request: r, user: u! };
      })
    );
    setRequests(withUsers.filter((r) => r.user));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAccept = (reqId: string, userName: string) => {
    Alert.alert(
      "Accept Request",
      `Accept ${userName}'s request? Other pending requests will be declined.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            await acceptRequest(reqId);
            loadData();
          },
        },
      ]
    );
  };

  const handleReject = async (reqId: string) => {
    await rejectRequest(reqId);
    loadData();
  };

  const statusColors: Record<string, string> = {
    pending: Colors.light.accent,
    accepted: Colors.light.tint,
    rejected: Colors.light.danger,
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
          <Ionicons name="chevron-back" size={26} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Requests</Text>
        <View style={{ width: 26 }} />
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.request.id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 40,
        }}
        renderItem={({ item: { request: req, user: u } }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {u.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{u.name}</Text>
                <View style={styles.cardMeta}>
                  <Ionicons name="star" size={12} color={Colors.light.accent} />
                  <Text style={styles.cardMetaText}>
                    {u.reputationScore} rep · {timeAgo(req.createdAt)}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: (statusColors[req.status] || Colors.light.tint) + "20" },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: statusColors[req.status] || Colors.light.tint },
                  ]}
                >
                  {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                </Text>
              </View>
            </View>
            {req.message ? (
              <Text style={styles.message}>{req.message}</Text>
            ) : null}
            {req.status === "pending" && (
              <View style={styles.actions}>
                <Pressable
                  onPress={() => handleAccept(req.id, u.name)}
                  style={styles.acceptBtn}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.actionText}>Accept</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleReject(req.id)}
                  style={styles.rejectBtn}
                >
                  <Ionicons name="close" size={18} color={Colors.light.danger} />
                  <Text style={[styles.actionText, { color: Colors.light.danger }]}>Decline</Text>
                </Pressable>
              </View>
            )}
            {req.status === "accepted" && (
              <Pressable
                onPress={() => router.push(`/chat/${req.id}`)}
                style={styles.chatBtn}
              >
                <Ionicons name="chatbubble" size={16} color={Colors.light.tint} />
                <Text style={styles.chatBtnText}>Open Chat</Text>
              </Pressable>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No requests yet</Text>
          </View>
        }
      />
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
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    fontFamily: "Inter_700Bold",
  },
  cardInfo: { flex: 1, gap: 2 },
  cardName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardMetaText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  message: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    backgroundColor: Colors.light.surfaceSecondary,
    padding: 12,
    borderRadius: 10,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    height: 42,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.danger + "10",
    borderRadius: 12,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.light.danger + "30",
  },
  actionText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.tint + "10",
    borderRadius: 12,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.light.tint + "30",
  },
  chatBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
});
