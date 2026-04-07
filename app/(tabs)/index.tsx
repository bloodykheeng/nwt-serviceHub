import { APP_CONFIG } from '@/constants/config';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { FontSize, FontWeight, NWTColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { getDashboardStats } from '@/lib/services/stats.service';
import { getExpiringSoon } from '@/lib/services/subscriptions.service';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import moment from 'moment';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  iconColor: string;
  bgColor: string;
  delay?: number;
}

function StatCard({ label, value, icon, iconColor, bgColor, delay = 0 }: StatCardProps) {
  const { colors } = useAppTheme();
  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(delay).springify()}
      style={[s.statCard, { backgroundColor: colors.card }]}
    >
      <View style={[s.statIconBox, { backgroundColor: bgColor }]}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      <Text style={[s.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[s.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const { profile, isAdmin } = useAuth();
  const router = useRouter();

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
    isRefetching,
  } = useQuery({
    queryKey: QUERY_KEYS.stats(),
    queryFn: getDashboardStats,
  });

  const { data: expiring = [] } = useQuery({
    queryKey: ['expiring-soon'],
    queryFn: () => getExpiringSoon(),
  });

  const formatCurrency = (amount: number) => `UGX ${amount.toLocaleString()}`;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetchStats}
          tintColor={NWTColors.primary}
          colors={[NWTColors.primary]}
        />
      }
    >
      {/* Greeting */}
      <Animated.View entering={FadeInDown.duration(400).springify()} style={s.greeting}>
        <View>
          <Text style={[s.greetText, { color: colors.textSecondary }]}>Good day,</Text>
          <Text style={[s.greetName, { color: colors.text }]}>
            {profile?.full_name ?? 'Welcome'}
          </Text>
        </View>
        <View style={[s.roleBadge, { backgroundColor: isAdmin ? NWTColors.primary + '20' : NWTColors.accent + '20' }]}>
          <Text style={[s.roleText, { color: isAdmin ? NWTColors.primary : NWTColors.accent }]}>
            {isAdmin ? 'Admin' : 'Client'}
          </Text>
        </View>
      </Animated.View>

      {/* Stats Grid */}
      <Text style={[s.sectionTitle, { color: colors.text }]}>Overview</Text>

      {statsLoading ? (
        <View style={s.statsGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[s.statCard, s.skeleton, { backgroundColor: colors.card }]} />
          ))}
        </View>
      ) : (
        <View style={s.statsGrid}>
          <StatCard
            label="Active Clients"
            value={stats?.total_clients ?? 0}
            icon="people"
            iconColor={NWTColors.primary}
            bgColor={NWTColors.primary + '20'}
            delay={0}
          />
          <StatCard
            label="Active Services"
            value={stats?.total_services ?? 0}
            icon="briefcase"
            iconColor={NWTColors.accent}
            bgColor={NWTColors.accent + '20'}
            delay={100}
          />
          <StatCard
            label="Subscriptions"
            value={stats?.active_subscriptions ?? 0}
            icon="checkmark-circle"
            iconColor={NWTColors.success}
            bgColor={NWTColors.success + '20'}
            delay={200}
          />
          <StatCard
            label="Revenue"
            value={stats?.total_revenue ? (stats.total_revenue / 1000).toFixed(0) + 'K' : '0'}
            icon="cash"
            iconColor={NWTColors.warning}
            bgColor={NWTColors.warning + '20'}
            delay={300}
          />
        </View>
      )}

      {/* Revenue Banner */}
      {stats && (
        <Animated.View
          entering={FadeInDown.duration(500).delay(400).springify()}
          style={s.revenueBanner}
        >
          <View>
            <Text style={s.revenueLabel}>Total Active Revenue</Text>
            <Text style={s.revenueValue}>{formatCurrency(stats.total_revenue)}</Text>
          </View>
          <Ionicons name="trending-up" size={32} color="rgba(255,255,255,0.4)" />
        </Animated.View>
      )}

      {/* Expiring Soon */}
      {expiring.length > 0 && (
        <Animated.View entering={FadeInDown.duration(500).delay(500).springify()}>
          <View style={s.sectionRow}>
            <Text style={[s.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
              Expiring Soon
            </Text>
            <View style={[s.chip, { backgroundColor: NWTColors.warning + '20' }]}>
              <Text style={[s.chipText, { color: NWTColors.warning }]}>
                {expiring.length} in {APP_CONFIG.expiringThresholdDays}d
              </Text>
            </View>
          </View>

          {expiring.slice(0, 5).map((sub) => (
            <TouchableOpacity
              key={sub.id}
              style={[s.expiringRow, { backgroundColor: colors.card, borderLeftColor: NWTColors.warning }]}
              onPress={() => router.push(`/client/${sub.client_id}` as any)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.expiringName, { color: colors.text }]}>
                  {sub.client?.full_name ?? 'Unknown'}
                </Text>
                <Text style={[s.expiringService, { color: colors.textSecondary }]}>
                  {sub.service?.name}
                </Text>
              </View>
              <Text style={[s.expiringDate, { color: NWTColors.warning }]}>
                {sub.end_date ? moment(sub.end_date).format('MMM D, YYYY') : '–'}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {/* Inactive note */}
      {stats && stats.inactive_subscriptions > 0 && (
        <Animated.View
          entering={FadeInDown.duration(500).delay(600).springify()}
          style={[s.inactiveNote, { backgroundColor: colors.card }]}
        >
          <Ionicons name="warning-outline" size={18} color={NWTColors.danger} />
          <Text style={[s.inactiveText, { color: colors.textSecondary }]}>
            {stats.inactive_subscriptions} inactive subscription
            {stats.inactive_subscriptions !== 1 ? 's' : ''}
          </Text>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetText: { fontSize: FontSize.sm },
  greetName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginTop: 2 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  roleText: { fontSize: 12, fontWeight: FontWeight.bold },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: 12 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 12,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  skeleton: { height: 110, opacity: 0.4 },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  statLabel: { fontSize: FontSize.xs, marginTop: 2 },
  revenueBanner: {
    backgroundColor: NWTColors.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  revenueLabel: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm },
  revenueValue: { color: '#fff', fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginTop: 4 },
  expiringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  expiringName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  expiringService: { fontSize: FontSize.sm, marginTop: 2 },
  expiringDate: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  chipText: { fontSize: 12, fontWeight: FontWeight.bold },
  inactiveNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  inactiveText: { fontSize: FontSize.sm },
});
