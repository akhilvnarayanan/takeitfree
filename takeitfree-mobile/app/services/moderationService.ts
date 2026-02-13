import { supabase } from './supabase';

const SALE_TERMS = [/\$\d+/, /sell/i, /price/i, /cash/i, /venmo/i, /paypal/i];

export const moderationService = {
  localNoSellingCheck: (text: string): boolean => {
    return !SALE_TERMS.some((term) => term.test(text));
  },

  aiModerationHook: async (payload: { title: string; description: string }) => {
    // Optional secure server-side moderation function.
    const { data, error } = await supabase.functions.invoke('ai-moderation', {
      body: payload,
    });
    return { data, error };
  },
};
