import '../global.css';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useAppTheme } from '@/contexts/ThemeContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useRealtimeNotifications, useRealtimeSubscriptions } from '@/hooks/useRealtime';
import { queryClient } from '@/lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Register FCM background handler — skipped in Expo Go since Firebase is a native module
if (Constants.executionEnvironment !== 'storeClient') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const messaging = require('@react-native-firebase/messaging').default;
  messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
    console.log('FCM background message:', remoteMessage);
  });
}

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  usePushNotifications();
  useRealtimeNotifications();
  useRealtimeSubscriptions();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments, router]);

  return null;
}

function RootStack() {
  const { colors } = useAppTheme();
  const { isDark } = useAppTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthGate />
      <Stack screenOptions={{
        headerShown: false, contentStyle: {
          backgroundColor: colors.background,
        },
      }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="notifications" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="client/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="service/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="subscription/[id]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <RootStack />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
