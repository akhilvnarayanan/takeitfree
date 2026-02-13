import { moderationService } from './moderationService';
import { supabase } from './supabase';

type CreatePostInput = {
  title: string;
  description: string;
  location?: string;
  imageUrl?: string;
};

export const postService = {
  fetchFeed: async () => {
    return supabase
      .from('posts')
      .select('id,title,description,image_url,location,status,created_at,owner_id,profiles:owner_id(username,avatar_url)')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(50);
  },

  fetchExplore: async () => {
    return supabase
      .from('posts')
      .select('id,title,description,image_url,location,created_at')
      .order('created_at', { ascending: false })
      .limit(100);
  },

  createPost: async (userId: string, input: CreatePostInput) => {
    const combined = `${input.title}\n${input.description}`;
    if (!moderationService.localNoSellingCheck(combined)) {
      throw new Error('Selling language is not allowed.');
    }

    const aiResult = await moderationService.aiModerationHook({
      title: input.title,
      description: input.description,
    });

    if (aiResult.error) {
      console.warn('AI moderation fallback to local only', aiResult.error.message);
    }

    return supabase.from('posts').insert({
      owner_id: userId,
      title: input.title.trim(),
      description: input.description.trim(),
      location: input.location?.trim() || null,
      image_url: input.imageUrl || null,
      status: 'available',
    });
  },
};
