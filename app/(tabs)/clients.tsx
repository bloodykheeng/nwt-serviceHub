import { APP_CONFIG } from '@/constants/config';
import { FontSize, FontWeight, NWTColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { getClients } from '@/lib/services/profiles.service';
import { Profile } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import moment from 'moment';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

function ClientRow({ item, index }: { item: Profile; index: number }) {
  const { colors } = useAppTheme();
  const router = useRouter();
  const initials = (item.full_name ?? item.email ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 40).springify()}>
      <TouchableOpacity
        style={[s.row, { backgroundColor: colors.card }]}
        onPress={() => router.push(`/client/${item.id}` as any)}
        activeOpacity={0.7}
      >
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={s.avatar} />
        ) : (
          <View style={[s.avatarPlaceholder, { backgroundColor: NWTColors.primary + '20' }]}>
            <Text style={[s.initials, { color: NWTColors.primary }]}>{initials}</Text>
          </View>
        )}

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[s.name, { color: colors.text }]} numberOfLines={1}>
            {item.full_name ?? 'No Name'}
          </Text>
          <Text style={[s.email, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.email}
          </Text>
          {item.phone && (
            <Text style={[s.phone, { color: colors.textSecondary }]}>{item.phone}</Text>
          )}
        </View>

        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View
            style={[
              s.statusBadge,
              { backgroundColor: item.status === 'active' ? NWTColors.success + '20' : NWTColors.danger + '20' },
            ]}
          >
            <Text
              style={[
                s.statusText,
                { color: item.status === 'active' ? NWTColors.success : NWTColors.danger },
              ]}
            >
              {item.status}
            </Text>
          </View>
          <Text style={[s.date, { color: colors.textSecondary }]}>
            {moment(item.created_at).format('MMM D, YYYY')}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ClientsScreen() {
  const { colors } = useAppTheme();
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  const onSearch = useCallback((text: string) => {
    setSearch(text);
    clearTimeout((onSearch as any).__timer);
    (onSearch as any).__timer = setTimeout(() => setDebouncedSearch(text), 400);
  }, []);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['profiles', { search: debouncedSearch }],
    queryFn: ({ pageParam = 1 }) =>
      getClients({ page: pageParam, pageSize: APP_CONFIG.pageSize, search: debouncedSearch }),
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  });

  const clients = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View style={[s.searchRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[s.searchBox, { backgroundColor: colors.inputBg }]}>
          <Ionicons name="search" size={16} color={colors.placeholder} />
          <TextInput
            style={[s.searchInput, { color: colors.text }]}
            value={search}
            onChangeText={onSearch}
            placeholder="Search clients..."
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setDebouncedSearch(''); }}>
              <Ionicons name="close-circle" size={16} color={colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={NWTColors.primary} size="large" />
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <ClientRow item={item} index={index} />}
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
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={{ padding: 16 }} color={NWTColors.primary} />
            ) : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
              <Text style={[s.emptyText, { color: colors.textSecondary }]}>
                {debouncedSearch ? 'No clients found' : 'No clients yet'}
              </Text>
            </View>
          }
        />
      )}

      {/* FAB – admin only */}
      {isAdmin && (
        <TouchableOpacity
          style={s.fab}
          onPress={() => router.push('/(admin)/create-client' as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  searchRow: {
    padding: 12,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: FontSize.base },
  list: { padding: 12, gap: 8, paddingBottom: 100 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 16, fontWeight: FontWeight.bold },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  email: { fontSize: FontSize.sm, marginTop: 2 },
  phone: { fontSize: FontSize.sm },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: FontWeight.bold, textTransform: 'capitalize' },
  date: { fontSize: 11 },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { fontSize: FontSize.base },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
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
