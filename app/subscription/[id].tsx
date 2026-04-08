import { QUERY_KEYS } from '@/constants/queryKeys';
import { FontSize, FontWeight, NWTColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { getSubscription, updateSubscription, deleteSubscription } from '@/lib/services/subscriptions.service';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import moment from 'moment';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const { isAdmin } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: sub, isLoading } = useQuery({
    queryKey: QUERY_KEYS.subscription(id),
    queryFn: () => getSubscription(id),
  });

  const { mutate: toggle, isPending: isToggling } = useMutation({
    mutationFn: () =>
      updateSubscription(id, { status: sub?.status === 'active' ? 'inactive' : 'active' }),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEYS.subscription(id), updated);
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.stats() });
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteSubscription(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.stats() });
      router.back();
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const isActive = sub?.status === 'active';
  const clientInitials = (sub?.client?.full_name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isExpiringSoon =
    sub?.end_date &&
    isActive &&
    moment(sub.end_date).diff(moment(), 'days') <= 7 &&
    moment(sub.end_date).isAfter(moment());

  const isExpired = sub?.end_date && moment(sub.end_date).isBefore(moment());

  const confirmToggle = () =>
    Alert.alert(
      'Change Status',
      `Set subscription as ${isActive ? 'inactive' : 'active'}?`,
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: () => toggle() }]
    );

  const confirmDelete = () =>
    Alert.alert(
      'Delete Subscription',
      'This will permanently delete this subscription. Continue?',
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => remove() }]
    );

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
        <Text style={[s.headerTitle, { color: colors.text }]}>Subscription</Text>
        {isAdmin && (
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Options', undefined, [
                { text: isActive ? 'Deactivate' : 'Activate', onPress: confirmToggle },
                { text: 'Delete', style: 'destructive', onPress: confirmDelete },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
          >
            <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Status banner */}
        {(isExpiringSoon || isExpired) && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={[s.banner, { backgroundColor: isExpired ? NWTColors.danger + '18' : NWTColors.warning + '18' }]}
          >
            <Ionicons
              name={isExpired ? 'alert-circle-outline' : 'time-outline'}
              size={18}
              color={isExpired ? NWTColors.danger : NWTColors.warning}
            />
            <Text style={{ color: isExpired ? NWTColors.danger : NWTColors.warning, fontSize: FontSize.sm, fontWeight: FontWeight.semibold }}>
              {isExpired
                ? `Expired ${moment(sub!.end_date).fromNow()}`
                : `Expires in ${moment(sub!.end_date).diff(moment(), 'days')} days`}
            </Text>
          </Animated.View>
        )}

        {/* Client card */}
        <Animated.View entering={FadeInDown.duration(400).springify()} style={[s.clientCard, { backgroundColor: colors.card }]}>
          <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>CLIENT</Text>
          <View style={s.clientRow}>
            {sub?.client?.photo_url ? (
              <Image source={{ uri: sub.client.photo_url }} style={s.avatar} />
            ) : (
              <View style={[s.avatarPlaceholder, { backgroundColor: NWTColors.primary }]}>
                <Text style={s.initials}>{clientInitials}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[s.clientName, { color: colors.text }]}>{sub?.client?.full_name ?? '–'}</Text>
              <Text style={[s.clientEmail, { color: colors.textSecondary }]}>{sub?.client?.email}</Text>
              {sub?.client?.phone && (
                <Text style={[s.clientEmail, { color: colors.textSecondary }]}>{sub.client.phone}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => router.push(`/client/${sub?.client_id}` as any)}>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Service & details */}
        <Animated.View entering={FadeInDown.duration(400).delay(60).springify()} style={[s.infoCard, { backgroundColor: colors.card }]}>
          <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>SERVICE</Text>
          <Text style={[s.bigServiceName, { color: colors.text }]}>{sub?.service?.name ?? '–'}</Text>
          {sub?.service?.category && (
            <View style={[s.categoryChip, { backgroundColor: NWTColors.primary + '15' }]}>
              <Text style={[s.categoryText, { color: NWTColors.primary }]}>{sub.service.category}</Text>
            </View>
          )}

          <View style={[s.divider, { backgroundColor: colors.border }]} />

          <Row icon="pricetag-outline" label="Price" value={`UGX ${sub?.price?.toLocaleString() ?? '0'}`} colors={colors} accent={NWTColors.primary} />
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <Row
            icon="ellipse"
            label="Status"
            value={sub?.status?.toUpperCase() ?? '–'}
            colors={colors}
            accent={isActive ? NWTColors.success : NWTColors.danger}
          />
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <Row
            icon="calendar-outline"
            label="Start date"
            value={moment(sub?.start_date).format('DD MMM YYYY  HH:mm')}
            colors={colors}
          />
          {sub?.end_date && (
            <>
              <View style={[s.divider, { backgroundColor: colors.border }]} />
              <Row
                icon="calendar-outline"
                label="End date"
                value={moment(sub.end_date).format('DD MMM YYYY  HH:mm')}
                colors={colors}
                accent={isExpired ? NWTColors.danger : isExpiringSoon ? NWTColors.warning : undefined}
              />
            </>
          )}
          {!sub?.end_date && (
            <>
              <View style={[s.divider, { backgroundColor: colors.border }]} />
              <Row icon="infinite-outline" label="End date" value="Ongoing" colors={colors} />
            </>
          )}
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <Row icon="time-outline" label="Created" value={moment(sub?.created_at).format('DD MMM YYYY')} colors={colors} />
        </Animated.View>

        {/* Description */}
        {sub?.description && (
          <Animated.View entering={FadeInDown.duration(400).delay(120).springify()} style={[s.infoCard, { backgroundColor: colors.card }]}>
            <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>NOTES</Text>
            <Text style={[s.description, { color: colors.text }]}>{sub.description}</Text>
          </Animated.View>
        )}

        {/* Admin actions */}
        {isAdmin && (
          <Animated.View entering={FadeInDown.duration(400).delay(180).springify()} style={s.actions}>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: isActive ? NWTColors.warning + '18' : NWTColors.success + '18' }]}
              onPress={confirmToggle}
              disabled={isToggling}
            >
              <Ionicons name={isActive ? 'pause-circle-outline' : 'play-circle-outline'} size={20} color={isActive ? NWTColors.warning : NWTColors.success} />
              <Text style={{ color: isActive ? NWTColors.warning : NWTColors.success, fontWeight: FontWeight.semibold, fontSize: FontSize.base }}>
                {isActive ? 'Deactivate' : 'Activate'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: NWTColors.danger + '18' }]}
              onPress={confirmDelete}
              disabled={isDeleting}
            >
              <Ionicons name="trash-outline" size={20} color={NWTColors.danger} />
              <Text style={{ color: NWTColors.danger, fontWeight: FontWeight.semibold, fontSize: FontSize.base }}>
                Delete
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ icon, label, value, colors, accent }: { icon: any; label: string; value: string; colors: any; accent?: string }) {
  return (
    <View style={s.row}>
      <Ionicons name={icon} size={16} color={accent ?? colors.textSecondary} />
      <Text style={[s.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[s.rowValue, { color: accent ?? colors.text }]} numberOfLines={1}>{value}</Text>
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
  scroll: { padding: 16, paddingBottom: 48, gap: 12 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  clientCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontSize: 16, fontWeight: FontWeight.bold },
  clientName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  clientEmail: { fontSize: FontSize.sm, marginTop: 2 },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: 4,
  },
  sectionLabel: { fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8, marginBottom: 8 },
  bigServiceName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  categoryChip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 4 },
  categoryText: { fontSize: 12, fontWeight: FontWeight.medium },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { fontSize: FontSize.sm, flex: 1 },
  rowValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  description: { fontSize: FontSize.base, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 14,
    borderRadius: 14,
  },
});
