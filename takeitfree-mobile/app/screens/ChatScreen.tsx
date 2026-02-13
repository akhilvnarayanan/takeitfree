import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TextInput, Button } from 'react-native';
import { chatService } from '../services/chatService';

export function ChatScreen({ route }: any) {
  const { requestId } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    chatService.loadMessages(requestId).then((res) => {
      if (!res.error) setMessages(res.data || []);
    });

    const channel = chatService.subscribeToMessages(requestId, (payload) => {
      setMessages((prev) => [...prev, payload.new]);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [requestId]);

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text style={{ marginVertical: 4 }}>{item.body}</Text>}
      />
      <TextInput value={text} onChangeText={setText} placeholder="Message" style={{ borderWidth: 1, borderColor: '#ddd', padding: 10 }} />
      <Button
        title="Send"
        onPress={async () => {
          if (!text.trim()) return;
          await chatService.sendMessage(requestId, text);
          setText('');
        }}
      />
    </View>
  );
}
