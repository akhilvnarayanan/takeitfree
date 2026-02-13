import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export const storageService = {
  pickImage: async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) throw new Error('Media library permission denied');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (result.canceled) return null;
    return result.assets[0];
  },

  uploadPostImage: async (userId: string, uri: string) => {
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const filePath = `${userId}/${Date.now()}.jpg`;

    const { error } = await supabase.storage.from('post-images').upload(filePath, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

    if (error) throw error;

    const { data } = supabase.storage.from('post-images').getPublicUrl(filePath);
    return data.publicUrl;
  },
};
