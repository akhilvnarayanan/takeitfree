import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/AuthContext";
import {
  getChatMessages,
  sendMessage,
  getRequestById,
  getItemById,
  getUserById,
  ChatMessage,
  Item,
  User,
} from "@/lib/storage";

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [item, setItem] = useState<Item | null>(null);

  const loadData = useCallback(async () => {
    if (!requestId || !user) return;
    const msgs = await getChatMessages(requestId);
    setMessages(msgs.reverse());

    const req = await getRequestById(requestId);
    if (req) {
      const itm = await getItemById(req.itemId);
      setItem(itm);
      if (itm) {
        const otherId = req.requesterId === user.id ? itm.userId : req.requesterId;
        const other = await getUserById(otherId);
        setOtherUser(other);
      }
    }
  }, [requestId, user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      const interval = setInterval(loadData, 3000);
      return () => clearInterval(interval);
    }, [loadData])
  );

  const handleSend = async () => {
    if (!inputText.trim() || !user || !requestId) return;
    const text = inputText.trim();
    setInputText("");
    await sendMessage(requestId, user.id, text);
    loadData();
  };

  const renderMessage = ({ item: msg }: { item: ChatMessage }) => {
    if (msg.isSystem) {
      return (
        <View style={styles.systemMsg}>
          <Text style={styles.systemMsgText}>{msg.message}</Text>
        </View>
      );
    }
    const isMine = msg.senderId === user?.id;
    return (
      <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
        <Text style={[styles.bubbleText, isMine && styles.myBubbleText]}>
          {msg.message}
        </Text>
        <Text style={[styles.bubbleTime, isMine && styles.myBubbleTime]}>
          {formatTime(msg.timestamp)}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "web" ? 67 : insets.top + 8 },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={Colors.light.text} />
        </Pressable>
        <View style={styles.headerInfo}>
          {otherUser && (
            <Text style={styles.headerName}>{otherUser.name}</Text>
          )}
          {item && (
            <Text style={styles.headerItem} numberOfLines={1}>
              {item.title}
            </Text>
          )}
        </View>
        <View style={{ width: 26 }} />
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(m) => m.id}
        inverted
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 8,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <View
        style={[
          styles.inputBar,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 8 },
        ]}
      >
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor={Colors.light.textSecondary}
          multiline
          maxLength={500}
        />
        <Pressable
          onPress={handleSend}
          disabled={!inputText.trim()}
          style={[
            styles.sendBtn,
            !inputText.trim() && { opacity: 0.4 },
          ]}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: 10,
  },
  headerInfo: { flex: 1, alignItems: "center" },
  headerName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  headerItem: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.tint,
  },
  systemMsg: {
    alignSelf: "center",
    backgroundColor: Colors.light.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginVertical: 8,
  },
  systemMsgText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginVertical: 2,
  },
  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.light.tint,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  bubbleText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    lineHeight: 20,
  },
  myBubbleText: { color: "#fff" },
  bubbleTime: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  myBubbleTime: { color: "rgba(255,255,255,0.7)" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
});
