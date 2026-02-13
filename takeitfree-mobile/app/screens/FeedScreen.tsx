import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, Text, RefreshControl } from 'react-native';
import { PostCard } from '../components/PostCard';
import { postService } from '../services/postService';
import { requestService } from '../services/requestService';
import { communityService } from '../services/communityService';
import { StoryStrip } from '../components/StoryStrip';

export function FeedScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const [feed, storyRes] = await Promise.all([postService.fetchFeed(), communityService.listStories()]);
    if (!feed.error) setPosts(feed.data || []);
    if (!storyRes.error) setStories(storyRes.data || []);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      ListHeaderComponent={<StoryStrip stories={stories} />}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onRequest={() => requestService.createRequest(item.id, item.owner_id, 'Interested in this item')}
        />
      )}
      ListEmptyComponent={<View><Text>No posts yet.</Text></View>}
    />
  );
}
