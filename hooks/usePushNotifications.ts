import { useAuth } from '@/contexts/AuthContext';
import { registerPushToken, removePushToken } from '@/lib/services/notifications.service';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!user) return;

    let currentToken: string | null = null;

    registerForPushNotificationsAsync().then(async (token) => {
      if (token) {
        currentToken = token;
        setExpoPushToken(token);
        await registerPushToken(user.id, token, Platform.OS).catch(console.warn);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        // Handle foreground notification
        console.log('Notification received:', notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        // Handle tap on notification
        console.log('Notification tapped:', response);
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();

      if (currentToken) {
        removePushToken(currentToken).catch(console.warn);
      }
    };
  }, [user?.id]);

  return { expoPushToken };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0057A8',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null;

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  return token;
}