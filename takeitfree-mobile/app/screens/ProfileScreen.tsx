import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { supabase } from '../services/supabase';
import { authService } from '../services/authService';
import { communityService } from '../services/communityService';
import { notificationService } from '../services/notificationService';

export function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user?.id) return;

      const [p, b, c, h] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', auth.user.id).single(),
        communityService.listBadges(),
        communityService.listChallenges(),
        communityService.listHighlights(),
      ]);

      if (!p.error) setProfile(p.data);
      if (!b.error) setBadges(b.data || []);
      if (!c.error) setChallenges(c.data || []);
      if (!h.error) setHighlights((h.data || []).filter((x: any) => x.owner_id === auth.user?.id));

      await notificationService.registerPushToken();
    })();
  }, []);

  return (
    <View style={{ flex: 1, padding: 16, gap: 8 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>{profile?.username || 'Profile'}</Text>
      <Text>{profile?.bio || 'No bio yet'}</Text>
      <Text>Reputation: {profile?.reputation_points || 0}</Text>
      <Text style={{ marginTop: 12, fontWeight: '700' }}>Badges</Text>
      <FlatList data={badges} horizontal keyExtractor={(item, idx) => `${item.badges?.id || idx}`} renderItem={({ item }) => <Text style={{ marginRight: 10 }}>🏅 {item.badges?.name}</Text>} />
      <Text style={{ marginTop: 12, fontWeight: '700' }}>Active Challenges</Text>
      <FlatList data={challenges} keyExtractor={(item) => item.id} renderItem={({ item }) => <Text>• {item.title}</Text>} />
      <Text style={{ marginTop: 12, fontWeight: '700' }}>Highlights</Text>
      <FlatList data={highlights} keyExtractor={(item) => item.id} renderItem={({ item }) => <Text>⭐ {item.title}</Text>} />
      <Button title="Sign out" onPress={() => authService.signOut()} />
    </View>
  );
}
