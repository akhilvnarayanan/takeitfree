import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { supabase } from '../services/supabase';
import { postService } from '../services/postService';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';

export function CreatePostScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [status, setStatus] = useState('');

  const pickAndUpload = async () => {
    try {
      const asset = await storageService.pickImage();
      if (!asset) return;
      const { data } = await supabase.auth.getUser();
      if (!data.user?.id) throw new Error('Not authenticated');
      const url = await storageService.uploadPostImage(data.user.id, asset.uri);
      setImageUrl(url);
      setStatus('Image uploaded');
    } catch (e: any) {
      setStatus(e.message);
    }
  };

  const create = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user?.id) throw new Error('Not authenticated');
      const res = await postService.createPost(data.user.id, { title, description, location, imageUrl });
      if (res.error) throw res.error;
      await notificationService.triggerInAppNotification(data.user.id, 'post_created', { title });
      setTitle('');
      setDescription('');
      setLocation('');
      setImageUrl(undefined);
      setStatus('Post created');
    } catch (e: any) {
      setStatus(e.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Item title" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} multiline />
      <TextInput style={styles.input} placeholder="Location" value={location} onChangeText={setLocation} />
      <Button title="Pick image" onPress={pickAndUpload} />
      <Button title="Create free post" onPress={create} />
      <Text>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10 },
});
