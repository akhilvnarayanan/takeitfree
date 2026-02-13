import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  registerPushToken: async () => {
    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) return null;

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user?.id) return token;

    await supabase.from('push_tokens').upsert({
      user_id: auth.user.id,
      token,
      platform: 'expo',
    });

    return token;
  },

  triggerInAppNotification: async (userId: string, eventType: string, payload: Record<string, unknown>) => {
    return supabase.from('notifications').insert({
      user_id: userId,
      event_type: eventType,
      payload,
    });
  },
};
