import React, { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { PostCard } from '../components/PostCard';
import { postService } from '../services/postService';

export function ExploreScreen() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    postService.fetchExplore().then((res) => {
      if (!res.error) setPosts(res.data || []);
    });
  }, []);

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostCard post={item} />}
      ListEmptyComponent={<View><Text>No explore content.</Text></View>}
    />
  );
}
