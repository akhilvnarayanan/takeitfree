import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';

export function StoryStrip({ stories }: { stories: any[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wrap}>
      {stories.map((s) => (
        <View key={s.id} style={styles.bubble}>
          <Text style={styles.initial}>{(s.profiles?.username || '?')[0]?.toUpperCase()}</Text>
          <Text numberOfLines={1} style={styles.name}>{s.profiles?.username || 'user'}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { maxHeight: 84, marginVertical: 8 },
  bubble: { width: 64, marginHorizontal: 6, alignItems: 'center' },
  initial: { width: 48, height: 48, borderRadius: 24, textAlign: 'center', textAlignVertical: 'center', backgroundColor: '#E5E7EB', fontWeight: '700' },
  name: { fontSize: 11, marginTop: 4 },
});
