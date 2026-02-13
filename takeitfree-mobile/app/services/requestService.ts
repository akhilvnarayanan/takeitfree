import { supabase } from './supabase';

export const requestService = {
  createRequest: async (postId: string, ownerId: string, message: string) => {
    const { data: auth } = await supabase.auth.getUser();
    const requesterId = auth.user?.id;
    if (!requesterId) throw new Error('User not authenticated');

    return supabase.from('requests').insert({
      post_id: postId,
      owner_id: ownerId,
      requester_id: requesterId,
      message,
      status: 'pending',
    });
  },

  getMyRequests: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user?.id) throw new Error('User not authenticated');

    return supabase
      .from('requests')
      .select('*, posts(title, image_url), requester:requester_id(username), owner:owner_id(username)')
      .or(`owner_id.eq.${auth.user.id},requester_id.eq.${auth.user.id}`)
      .order('created_at', { ascending: false });
  },

  approveRequest: async (requestId: string, postId: string, requesterId: string) => {
    const { error: reqErr } = await supabase.from('requests').update({ status: 'approved' }).eq('id', requestId);
    if (reqErr) return { error: reqErr };

    const { error: postErr } = await supabase.from('posts').update({ status: 'reserved' }).eq('id', postId);
    if (postErr) return { error: postErr };

    await supabase.from('notifications').insert({
      user_id: requesterId,
      event_type: 'request_approved',
      payload: { requestId, postId },
    });

    return { error: null };
  },
};
