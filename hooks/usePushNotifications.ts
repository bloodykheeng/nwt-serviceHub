import { useAuth } from '@/contexts/AuthContext';
import { registerPushToken, removePushToken } from '@/lib/services/notifications.service';
import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Firebase is a native module — not available in Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';

export function usePushNotifications() {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const currentTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || isExpoGo) return;

    const userId = user.id;
    const unsubscribers: (() => void)[] = [];

    // Lazy require — top-level import would execute Firebase at module load time and crash Expo Go
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const messaging = require('@react-native-firebase/messaging').default;

    async function setup() {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) return;

      const token = await messaging().getToken();
      if (token) {
        currentTokenRef.current = token;
        setFcmToken(token);
        await registerPushToken(userId, token, Platform.OS).catch(console.warn);
      }

      const unsubRefresh = messaging().onTokenRefresh(async (newToken: string) => {
        if (currentTokenRef.current) {
          await removePushToken(currentTokenRef.current).catch(console.warn);
        }
        currentTokenRef.current = newToken;
        setFcmToken(newToken);
        await registerPushToken(userId, newToken, Platform.OS).catch(console.warn);
      });
      unsubscribers.push(unsubRefresh);
    }

    setup();

    unsubscribers.push(
      messaging().onMessage(async (remoteMessage: any) => {
        console.log('FCM foreground message:', remoteMessage);
      })
    );

    messaging().onNotificationOpenedApp((remoteMessage: any) => {
      console.log('Notification opened from background:', remoteMessage);
    });

    messaging()
      .getInitialNotification()
      .then((remoteMessage: any) => {
        if (remoteMessage) {
          console.log('App opened from quit state via notification:', remoteMessage);
        }
      });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      if (currentTokenRef.current) {
        removePushToken(currentTokenRef.current).catch(console.warn);
        currentTokenRef.current = null;
      }
    };
  }, [user?.id]);

  return { fcmToken };
}
