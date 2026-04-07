import '../global.css';

import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useAppTheme } from '@/contexts/ThemeContext';
import { queryClient } from '@/lib/queryClient';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useRealtimeNotifications, useRealtimeSubscriptions } from '@/hooks/useRealtime';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Handles auth-gated navigation
function AuthGate() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Register push token + realtime
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
  const { isDark } = useAppTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
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
