import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from '@/lib/services/notifications.service';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { NWTColors, FontSize, FontWeight } from '@/constants/theme';
import { APP_CONFIG } from '@/constants/config';
import { PushNotification } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';

function NotificationItem({
  item,
  index,
  userId,
}: {
  item: PushNotification;
  index: number;
  userId: string;
}) {
  const { colors } = useAppTheme();
  const qc = useQueryClient();

  const { mutate: read } = useMutation({
    mutationFn: () => markAsRead(item.id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications(userId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount(userId) });
    },
  });

  const isUnread = !item.is_read;

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 40).springify()}>
      <TouchableOpacity
        style={[
          s.item,
          {
            backgroundColor: colors.card,
            borderLeftColor: isUnread ? NWTColors.primary : colors.border,
          },
        ]}
        onPress={() => { if (isUnread) read(); }}
        activeOpacity={0.7}
      >
        <View style={[s.iconBox, { backgroundColor: NWTColors.primary + '15' }]}>
          <Ionicons name="notifications" size={20} color={NWTColors.primary} />
          {isUnread && <View style={s.unreadDot} />}
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={s.titleRow}>
            <Text style={[s.title, { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            {isUnread && (
              <View style={[s.newBadge, { backgroundColor: NWTColors.primary }]}>
                <Text style={s.newBadgeText}>NEW</Text>
              </View>
            )}
          </View>
          <Text style={[s.body, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={[s.time, { color: colors.textSecondary }]}>
            {moment(new Date(item.created_at)).fromNow()}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const { colors } = useAppTheme();
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: QUERY_KEYS.notifications(user?.id ?? ''),
    queryFn: ({ pageParam = 1 }) =>
      getMyNotifications(user!.id, { page: pageParam, pageSize: APP_CONFIG.pageSize }),
    getNextPageParam: (last) => (last.hasNextPage ? last.page + 1 : undefined),
    initialPageParam: 1,
    enabled: !!user,
  });

  const { mutate: readAll } = useMutation({
    mutationFn: () => markAllAsRead(user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications(user!.id) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount(user!.id) });
    },
  });

  const notifications = data?.pages.flatMap((p) => p.data) ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => readAll()}>
            <Text style={[s.markAll, { color: NWTColors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={NWTColors.primary} size="large" />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <NotificationItem item={item} index={index} userId={user!.id} />
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={NWTColors.primary}
              colors={[NWTColors.primary]}
            />
          }
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage
              ? <ActivityIndicator style={{ padding: 16 }} color={NWTColors.primary} />
              : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
              <Text style={[s.emptyText, { color: colors.textSecondary }]}>No notifications yet</Text>
            </View>
          }
        />
      )}

      {/* Admin send FAB */}
      {isAdmin && (
        <TouchableOpacity
          style={s.fab}
          onPress={() => router.push('/(admin)/send-notification' as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    paddingTop: 56,
    gap: 12,
  },
  headerTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  markAll: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  list: { padding: 12, gap: 8, paddingBottom: 100 },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: NWTColors.danger,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { fontSize: FontSize.base, fontWeight: FontWeight.bold, flex: 1 },
  newBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  newBadgeText: { color: '#fff', fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  body: { fontSize: FontSize.sm, lineHeight: 18 },
  time: { fontSize: 11, marginTop: 6 },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { fontSize: FontSize.base },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: NWTColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: NWTColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
