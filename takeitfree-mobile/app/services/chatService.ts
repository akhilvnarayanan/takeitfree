import { supabase } from './supabase';

export const chatService = {
  loadMessages: async (requestId: string) => {
    return supabase
      .from('chat_messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });
  },

  sendMessage: async (requestId: string, body: string) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user?.id) throw new Error('User not authenticated');

    return supabase.from('chat_messages').insert({
      request_id: requestId,
      sender_id: auth.user.id,
      body: body.trim(),
    });
  },

  subscribeToMessages: (requestId: string, onInsert: (payload: any) => void) => {
    return supabase
      .channel(`chat-${requestId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `request_id=eq.${requestId}` },
        onInsert,
      )
      .subscribe();
  },
};
