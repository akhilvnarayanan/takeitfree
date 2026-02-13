import React from 'react';
import { View, Text, StyleSheet, Image, Button } from 'react-native';

type Props = {
  post: any;
  onRequest?: () => void;
};

export function PostCard({ post, onRequest }: Props) {
  return (
    <View style={styles.card}>
      {post.image_url ? <Image source={{ uri: post.image_url }} style={styles.image} /> : null}
      <Text style={styles.title}>{post.title}</Text>
      <Text>{post.description}</Text>
      <Text style={styles.meta}>{post.location || 'No location'} • {post.status}</Text>
      {onRequest ? <Button title="Request item" onPress={onRequest} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', margin: 8, padding: 12, borderRadius: 8, gap: 8 },
  image: { width: '100%', height: 180, borderRadius: 8 },
  title: { fontWeight: '700', fontSize: 16 },
  meta: { color: '#6B7280', fontSize: 12 },
});
