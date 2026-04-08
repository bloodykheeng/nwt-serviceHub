import { FontSize, FontWeight, NWTColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { getServices } from '@/lib/services/services.service';
import { Service } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

function SectionHeader({ title }: { title: string }) {
  const { colors } = useAppTheme();
  return (
    <Text style={[s.sectionHeader, { color: colors.textSecondary }]}>{title.toUpperCase()}</Text>
  );
}

interface RowProps {
  icon: string;
  iconColor?: string;
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
}

function SettingsRow({ icon, iconColor, label, onPress, right, destructive }: RowProps) {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      style={[s.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[s.rowIcon, { backgroundColor: (iconColor ?? NWTColors.primary) + '20' }]}>
        <Ionicons name={icon as any} size={18} color={iconColor ?? NWTColors.primary} />
      </View>
      <Text style={[s.rowLabel, { color: destructive ? NWTColors.danger : colors.text }]}>
        {label}
      </Text>
      <View style={{ marginLeft: 'auto' }}>
        {right ?? <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />}
      </View>
    </TouchableOpacity>
  );
}

function ServiceItem({ service }: { service: Service }) {
  const { colors } = useAppTheme();
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[s.serviceRow, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/(admin)/edit-service/${service.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <Text style={[s.serviceName, { color: colors.text }]}>{service.name}</Text>
        <Text style={[s.serviceCategory, { color: colors.textSecondary }]}>
          {service.category ?? 'Uncategorized'} · UGX {service.price.toLocaleString()}
        </Text>
      </View>
      <View
        style={[
          s.statusDot,
          { backgroundColor: service.status === 'active' ? NWTColors.success : NWTColors.danger },
        ]}
      />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const { isAdmin } = useAuth();
  const router = useRouter();

  const { data: servicesData } = useInfiniteQuery({
    queryKey: ['services', {}],
    queryFn: ({ pageParam = 1 }) => getServices({ page: pageParam, pageSize: 20 }),
    getNextPageParam: (last) => (last.hasNextPage ? last.page + 1 : undefined),
    initialPageParam: 1,
    enabled: isAdmin,
  });

  const services = servicesData?.pages.flatMap((p) => p.data) ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Appearance */}
      <Animated.View entering={FadeInDown.duration(400).springify()}>
        <SectionHeader title="Appearance" />
        <SettingsRow
          icon={isDark ? 'moon' : 'sunny'}
          iconColor={isDark ? '#818CF8' : NWTColors.warning}
          label="Dark Mode"
          right={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: NWTColors.primary }}
              thumbColor="#fff"
            />
          }
        />
      </Animated.View>

      {/* Services – admin only */}
      {/* Services – admin only */}
      {isAdmin && (
        <Animated.View
          entering={FadeInDown.duration(400).delay(100).springify()}
        >
          <SectionHeader title="Services" />

          <SettingsRow
            icon="construct"
            iconColor={NWTColors.primary}
            label="Manage Services"
            onPress={() =>
              router.push("/(admin)/services" as any)
            }
          />
        </Animated.View>
      )}

      {/* Notifications – admin only */}
      {isAdmin && (
        <Animated.View entering={FadeInDown.duration(400).delay(200).springify()}>
          <SectionHeader title="Notifications" />
          <SettingsRow
            icon="send"
            iconColor={NWTColors.accent}
            label="Send Push Notification"
            onPress={() => router.push('/(admin)/send-notification' as any)}
          />
        </Animated.View>
      )}

      {/* App Info */}
      <Animated.View entering={FadeInDown.duration(400).delay(300).springify()}>
        <SectionHeader title="About" />
        <SettingsRow
          icon="information-circle"
          label="NWT ServiceHub v1.0.0"
          right={<Text style={{ color: colors.textSecondary, fontSize: 13 }}>nwt.ug</Text>}
        />
      </Animated.View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: { fontSize: FontSize.base, fontWeight: FontWeight.medium },
  addServiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  addServiceText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  serviceName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  serviceCategory: { fontSize: FontSize.sm, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 12 },
  emptyText: { fontSize: FontSize.sm, textAlign: 'center', marginTop: 8 },
});
