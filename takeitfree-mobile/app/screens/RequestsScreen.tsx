import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { requestService } from '../services/requestService';

export function RequestsScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const navigation = useNavigation<any>();

  const load = useCallback(async () => {
    const res = await requestService.getMyRequests();
    if (!res.error) setRequests(res.data || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#E5E7EB', gap: 6 }}>
          <Text>{item.posts?.title}</Text>
          <Text>Status: {item.status}</Text>
          {item.status === 'pending' ? (
            <Button
              title="Approve"
              onPress={async () => {
                await requestService.approveRequest(item.id, item.post_id, item.requester_id);
                load();
              }}
            />
          ) : null}
          <Button title="Open Chat" onPress={() => navigation.navigate('Chat', { requestId: item.id })} />
        </View>
      )}
    />
  );
}
