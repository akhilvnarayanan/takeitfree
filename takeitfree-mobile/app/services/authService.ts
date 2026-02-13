import { supabase } from './supabase';

export const authService = {
  signInWithEmailOtp: async (email: string) => {
    return supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: undefined },
    });
  },

  signInWithPhoneOtp: async (phone: string) => {
    return supabase.auth.signInWithOtp({
      phone: phone.trim(),
      options: { channel: 'sms' },
    });
  },

  verifyPhoneOtp: async (phone: string, token: string) => {
    return supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  },

  verifyEmailOtp: async (email: string, token: string) => {
    return supabase.auth.verifyOtp({ email, token, type: 'email' });
  },

  signOut: async () => supabase.auth.signOut(),
};
