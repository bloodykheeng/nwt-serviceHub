import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUnreadCount } from '@/lib/services/notifications.service';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { NWTColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

function NotificationBell() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const router = useRouter();

  const { data: count = 0 } = useQuery({
    queryKey: QUERY_KEYS.unreadCount(user?.id ?? ''),
    queryFn: () => getUnreadCount(user!.id),
    enabled: !!user,
    refetchInterval: 30000,
  });

  return (
    <TouchableOpacity
      onPress={() => router.push('/notifications')}
      style={styles.bellBtn}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="notifications-outline" size={24} color={colors.text} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: NWTColors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
        },
        headerRight: () => <NotificationBell />,
        headerRightContainerStyle: { paddingRight: 16 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      {/* Hide old explore tab */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bellBtn: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: NWTColors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
