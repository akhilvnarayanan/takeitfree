import { supabase } from './supabase';

export const communityService = {
  listStories: async () => supabase.from('stories').select('*, profiles:owner_id(username,avatar_url)').order('created_at', { ascending: false }),

  listHighlights: async () => supabase.from('highlights').select('*, profiles:owner_id(username,avatar_url)').order('created_at', { ascending: false }),

  listChallenges: async () => supabase.from('community_challenges').select('*').eq('active', true).order('created_at', { ascending: false }),

  listBadges: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user?.id) throw new Error('User not authenticated');

    return supabase
      .from('profile_badges')
      .select('awarded_at, badges(*)')
      .eq('profile_id', auth.user.id)
      .order('awarded_at', { ascending: false });
  },
};
