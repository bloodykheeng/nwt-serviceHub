import { APP_CONFIG } from '@/constants/config';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { FontSize, FontWeight, NWTColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { getProfile, setClientStatus } from '@/lib/services/profiles.service';
import { getClientSubscriptions } from '@/lib/services/subscriptions.service';
import { Subscription } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import moment from 'moment';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

function SubscriptionCard({ sub }: { sub: Subscription }) {
  const { colors } = useAppTheme();
  const isActive = sub.status === 'active';
  return (
    <View style={[s.subCard, { backgroundColor: colors.card, borderLeftColor: isActive ? NWTColors.success : NWTColors.danger }]}>
      <View style={s.subRow}>
        <View style={{ flex: 1 }}>
          <Text style={[s.subName, { color: colors.text }]}>{sub.service?.name ?? '–'}</Text>
          {sub.description && (
            <Text style={[s.subDesc, { color: colors.textSecondary }]} numberOfLines={2}>
              {sub.description}
            </Text>
          )}
        </View>
        <View style={[s.statusBadge, { backgroundColor: isActive ? NWTColors.success + '20' : NWTColors.danger + '20' }]}>
          <Text style={[s.statusText, { color: isActive ? NWTColors.success : NWTColors.danger }]}>
            {sub.status}
          </Text>
        </View>
      </View>
      <View style={s.subMeta}>
        <Text style={[s.metaText, { color: colors.textSecondary }]}>
          {moment(sub.start_date).format('MMM D, YYYY')}
          {sub.end_date ? ` → ${moment(sub.end_date).format('MMM D, YYYY')}` : ' (ongoing)'}
        </Text>
        <Text style={[s.priceText, { color: NWTColors.primary }]}>
          UGX {sub.price.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const { isAdmin } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: client, isLoading } = useQuery({
    queryKey: QUERY_KEYS.profile(id),
    queryFn: () => getProfile(id),
  });

  const {
    data: subsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: QUERY_KEYS.clientSubscriptions(id),
    queryFn: ({ pageParam = 1 }) =>
      getClientSubscriptions(id, { page: pageParam, pageSize: APP_CONFIG.pageSize }),
    getNextPageParam: (last) => (last.hasNextPage ? last.page + 1 : undefined),
    initialPageParam: 1,
  });

  const { mutate: toggleStatus } = useMutation({
    mutationFn: () =>
      setClientStatus(id, client?.status === 'active' ? 'inactive' : 'active'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.profile(id) });
      qc.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const subscriptions = subsData?.pages.flatMap((p) => p.data) ?? [];
  const initials = (client?.full_name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (isLoading) {
    return (
      <View style={[s.root, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={NWTColors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Client Profile</Text>
        {isAdmin && (
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Toggle Status',
                `Set client as ${client?.status === 'active' ? 'inactive' : 'active'}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Confirm', onPress: () => toggleStatus() },
                ]
              )
            }
          >
            <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={NWTColors.primary} colors={[NWTColors.primary]} />
        }
        onScrollEndDrag={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
      >
        {/* Client Info */}
        <Animated.View entering={FadeInDown.duration(400).springify()} style={[s.profileCard, { backgroundColor: colors.card }]}>
          {client?.photo_url ? (
            <Image source={{ uri: client.photo_url }} style={s.avatar} />
          ) : (
            <View style={[s.avatarPlaceholder, { backgroundColor: NWTColors.primary }]}>
              <Text style={s.initials}>{initials}</Text>
            </View>
          )}
          <Text style={[s.name, { color: colors.text }]}>{client?.full_name ?? '–'}</Text>
          <Text style={[s.email, { color: colors.textSecondary }]}>{client?.email}</Text>
          {client?.phone && (
            <Text style={[s.phone, { color: colors.textSecondary }]}>{client.phone}</Text>
          )}
          <View style={[s.statusChip, {
            backgroundColor: client?.status === 'active' ? NWTColors.success + '20' : NWTColors.danger + '20'
          }]}>
            <Text style={{ color: client?.status === 'active' ? NWTColors.success : NWTColors.danger, fontSize: 13, fontWeight: FontWeight.bold }}>
              {client?.status?.toUpperCase()}
            </Text>
          </View>
        </Animated.View>

        {/* Subscriptions Header */}
        <View style={s.subSection}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>
            Subscriptions ({subsData?.pages[0]?.count ?? 0})
          </Text>
          {isAdmin && (
            <TouchableOpacity
              style={[s.addSubBtn, { backgroundColor: NWTColors.primary }]}
              onPress={() => router.push(`/(admin)/create-subscription/${id}` as any)}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={s.addSubText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {subscriptions.map((sub) => (
          <SubscriptionCard key={sub.id} sub={sub} />
        ))}

        {isFetchingNextPage && (
          <ActivityIndicator style={{ padding: 16 }} color={NWTColors.primary} />
        )}

        {subscriptions.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="receipt-outline" size={40} color={colors.textSecondary} />
            <Text style={[s.emptyText, { color: colors.textSecondary }]}>No subscriptions yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 56,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  scroll: { padding: 16, paddingBottom: 48 },
  profileCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  initials: { color: '#fff', fontSize: 24, fontWeight: FontWeight.bold },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: 4 },
  email: { fontSize: FontSize.sm },
  phone: { fontSize: FontSize.sm, marginTop: 2 },
  statusChip: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  subSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  addSubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addSubText: { color: '#fff', fontSize: 13, fontWeight: FontWeight.bold },
  subCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  subRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  subName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  subDesc: { fontSize: FontSize.sm, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginLeft: 8 },
  statusText: { fontSize: 11, fontWeight: FontWeight.bold, textTransform: 'capitalize' },
  subMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { fontSize: FontSize.xs },
  priceText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyText: { fontSize: FontSize.base },
});
