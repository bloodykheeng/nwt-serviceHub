import { QUERY_KEYS } from '@/constants/queryKeys';
import { FontSize, FontWeight, NWTColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { getService, toggleServiceStatus, deleteService } from '@/lib/services/services.service';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import moment from 'moment';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const CATEGORY_ICONS: Record<string, string> = {
  Hosting: 'server-outline',
  Domain: 'globe-outline',
  Software: 'code-slash-outline',
  'E-Commerce': 'cart-outline',
  Network: 'wifi-outline',
  Branding: 'brush-outline',
  Consulting: 'chatbubble-ellipses-outline',
  Other: 'cube-outline',
};

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const { isAdmin } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: service, isLoading } = useQuery({
    queryKey: QUERY_KEYS.service(id),
    queryFn: () => getService(id),
  });

  const { mutate: toggle, isPending: isToggling } = useMutation({
    mutationFn: () =>
      toggleServiceStatus(id, service?.status === 'active' ? 'inactive' : 'active'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.service(id) });
      qc.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      router.back();
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const isActive = service?.status === 'active';
  const iconName = (CATEGORY_ICONS[service?.category ?? ''] ?? 'cube-outline') as any;

  const confirmToggle = () =>
    Alert.alert(
      'Change Status',
      `Set service as ${isActive ? 'inactive' : 'active'}?`,
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: () => toggle() }]
    );

  const confirmDelete = () =>
    Alert.alert(
      'Delete Service',
      'This will permanently delete the service. Continue?',
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
        <Text style={[s.headerTitle, { color: colors.text }]}>Service Detail</Text>
        {isAdmin && (
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Options', undefined, [
                { text: isActive ? 'Set Inactive' : 'Set Active', onPress: confirmToggle },
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
        {/* Hero card */}
        <Animated.View entering={FadeInDown.duration(400).springify()} style={[s.heroCard, { backgroundColor: colors.card }]}>
          <View style={[s.iconCircle, { backgroundColor: NWTColors.primary + '18' }]}>
            <Ionicons name={iconName} size={36} color={NWTColors.primary} />
          </View>
          <Text style={[s.serviceName, { color: colors.text }]}>{service?.name}</Text>
          {service?.category && (
            <View style={[s.categoryChip, { backgroundColor: NWTColors.primary + '15' }]}>
              <Text style={[s.categoryText, { color: NWTColors.primary }]}>{service.category}</Text>
            </View>
          )}
          <View style={[s.statusChip, {
            backgroundColor: isActive ? NWTColors.success + '20' : NWTColors.danger + '20',
          }]}>
            <Text style={{ color: isActive ? NWTColors.success : NWTColors.danger, fontSize: 12, fontWeight: FontWeight.bold }}>
              {service?.status?.toUpperCase()}
            </Text>
          </View>
        </Animated.View>

        {/* Price */}
        <Animated.View entering={FadeInDown.duration(400).delay(60).springify()} style={[s.infoCard, { backgroundColor: colors.card }]}>
          <Row icon="pricetag-outline" label="Price" value={`UGX ${service?.price?.toLocaleString() ?? '0'}`} colors={colors} accent={NWTColors.primary} />
          <Divider colors={colors} />
          <Row icon="calendar-outline" label="Created" value={moment(service?.created_at).format('DD MMM YYYY')} colors={colors} />
          {service?.creator && (
            <>
              <Divider colors={colors} />
              <Row
                icon="person-outline"
                label="Created by"
                value={service.creator.full_name ?? service.creator.email ?? '–'}
                colors={colors}
              />
            </>
          )}
        </Animated.View>

        {/* Description */}
        {service?.description && (
          <Animated.View entering={FadeInDown.duration(400).delay(120).springify()} style={[s.infoCard, { backgroundColor: colors.card }]}>
            <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>Description</Text>
            <Text style={[s.description, { color: colors.text }]}>{service.description}</Text>
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
      <Ionicons name={icon} size={18} color={accent ?? colors.textSecondary} />
      <Text style={[s.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[s.rowValue, { color: accent ?? colors.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function Divider({ colors }: { colors: any }) {
  return <View style={[s.divider, { backgroundColor: colors.border }]} />;
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
  heroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'center' },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  categoryText: { fontSize: 13, fontWeight: FontWeight.medium },
  statusChip: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { fontSize: FontSize.sm, flex: 1 },
  rowValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  sectionLabel: { fontSize: 12, fontWeight: FontWeight.medium, marginBottom: 6 },
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
