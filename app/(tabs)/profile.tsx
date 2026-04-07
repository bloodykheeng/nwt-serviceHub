import { FontSize, FontWeight, NWTColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import moment from 'moment';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const { profile, isAdmin, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const initials = (profile?.full_name ?? profile?.email ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar + Info */}
      <Animated.View entering={FadeInDown.duration(500).springify()} style={s.heroSection}>
        <View style={[s.avatarRing, { borderColor: NWTColors.primary }]}>
          {profile?.photo_url ? (
            <Image source={{ uri: profile.photo_url }} style={s.avatar} />
          ) : (
            <View style={[s.avatarPlaceholder, { backgroundColor: NWTColors.primary }]}>
              <Text style={s.initials}>{initials}</Text>
            </View>
          )}
        </View>

        <Text style={[s.name, { color: colors.text }]}>{profile?.full_name ?? '–'}</Text>
        <Text style={[s.email, { color: colors.textSecondary }]}>{profile?.email ?? '–'}</Text>

        <View
          style={[
            s.roleBadge,
            { backgroundColor: isAdmin ? NWTColors.primary : NWTColors.accent },
          ]}
        >
          <Ionicons
            name={isAdmin ? 'shield-checkmark' : 'person'}
            size={13}
            color="#fff"
          />
          <Text style={s.roleText}>{isAdmin ? 'Administrator' : 'Client'}</Text>
        </View>
      </Animated.View>

      {/* Details Card */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(100).springify()}
        style={[s.card, { backgroundColor: colors.card }]}
      >
        {[
          { icon: 'call-outline', label: 'Phone', value: profile?.phone ?? '–' },
          {
            icon: 'calendar-outline',
            label: 'Member since',
            value: profile?.created_at ? moment(profile.created_at).format('MMM D, YYYY') : '–',
          },
          {
            icon: 'ellipse',
            label: 'Status',
            value: profile?.status ?? '–',
            valueColor: profile?.status === 'active' ? NWTColors.success : NWTColors.danger,
          },
        ].map((item) => (
          <View
            key={item.label}
            style={[s.detailRow, { borderBottomColor: colors.border }]}
          >
            <View style={[s.detailIconBox, { backgroundColor: colors.inputBg }]}>
              <Ionicons name={item.icon as any} size={16} color={colors.textSecondary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[s.detailLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              <Text
                style={[
                  s.detailValue,
                  { color: (item as any).valueColor ?? colors.text },
                ]}
              >
                {item.value}
              </Text>
            </View>
          </View>
        ))}
      </Animated.View>

      {/* Sign Out */}
      <Animated.View entering={FadeInDown.duration(500).delay(200).springify()}>
        <TouchableOpacity
          style={[s.signOutBtn, { backgroundColor: NWTColors.danger + '15', borderColor: NWTColors.danger + '40' }]}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={NWTColors.danger} />
          <Text style={[s.signOutText, { color: NWTColors.danger }]}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* NWT Footer */}
      <Text style={[s.footer, { color: colors.textSecondary }]}>
        NWT ServiceHub · New Wave Technologies
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  heroSection: { alignItems: 'center', marginBottom: 28 },
  avatarRing: {
    borderWidth: 3,
    borderRadius: 52,
    padding: 3,
    marginBottom: 14,
  },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: '#fff', fontSize: 28, fontWeight: FontWeight.bold },
  name: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: 4 },
  email: { fontSize: FontSize.sm, marginBottom: 12 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: { color: '#fff', fontSize: 13, fontWeight: FontWeight.bold },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  detailIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: { fontSize: FontSize.xs, marginBottom: 2 },
  detailValue: { fontSize: FontSize.base, fontWeight: FontWeight.medium },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 28,
  },
  signOutText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  footer: { fontSize: 12, textAlign: 'center', opacity: 0.6 },
});
