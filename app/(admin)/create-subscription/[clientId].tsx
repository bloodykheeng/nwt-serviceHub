import { QUERY_KEYS } from '@/constants/queryKeys';
import { FontSize, FontWeight, NWTColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { getProfile } from '@/lib/services/profiles.service';
import { getServices } from '@/lib/services/services.service';
import { createSubscription } from '@/lib/services/subscriptions.service';
import { ActiveStatus, Service } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import moment from 'moment';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CreateSubscriptionScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [startDate, setStartDate] = useState(moment().format('YYYY-MM-DD'));;
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<ActiveStatus>('active');

  const { data: client } = useQuery({
    queryKey: QUERY_KEYS.profile(clientId),
    queryFn: () => getProfile(clientId),
  });

  const { data: servicesData } = useInfiniteQuery({
    queryKey: ['services', { status: 'active' }],
    queryFn: ({ pageParam = 1 }) => getServices({ page: pageParam, pageSize: 50, status: 'active' }),
    getNextPageParam: (last) => (last.hasNextPage ? last.page + 1 : undefined),
    initialPageParam: 1,
  });

  const services = servicesData?.pages.flatMap((p) => p.data) ?? [];

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      createSubscription(
        {
          client_id: clientId,
          service_id: selectedService!.id,
          start_date: startDate,
          end_date: endDate || undefined,
          description: description || undefined,
          price: parseFloat(price) || selectedService?.price || 0,
          status,
        },
        profile!.id
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.clientSubscriptions(clientId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.stats() });
      router.back();
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const handleSubmit = () => {
    if (!selectedService) {
      Alert.alert('Validation', 'Please select a service');
      return;
    }
    if (!startDate) {
      Alert.alert('Validation', 'Start date is required');
      return;
    }
    mutate();
  };

  const s = styles(colors);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Add Subscription</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={isPending}>
          {isPending ? (
            <ActivityIndicator color={NWTColors.primary} size="small" />
          ) : (
            <Text style={[s.saveBtn, { color: NWTColors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Client Info */}
        <View style={[s.clientBanner, { backgroundColor: NWTColors.primary + '15', borderColor: NWTColors.primary + '30' }]}>
          <Ionicons name="person-circle" size={20} color={NWTColors.primary} />
          <Text style={[s.clientName, { color: NWTColors.primary }]}>
            {client?.full_name ?? client?.email ?? 'Client'}
          </Text>
        </View>

        {/* Service Selection */}
        <View style={s.field}>
          <Text style={[s.label, { color: colors.textSecondary }]}>Select Service *</Text>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                s.serviceOption,
                {
                  backgroundColor: selectedService?.id === service.id ? NWTColors.primary + '10' : colors.card,
                  borderColor: selectedService?.id === service.id ? NWTColors.primary : colors.border,
                },
              ]}
              onPress={() => {
                setSelectedService(service);
                setPrice(service.price.toString());
              }}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.serviceName, { color: colors.text }]}>{service.name}</Text>
                <Text style={[s.servicePrice, { color: colors.textSecondary }]}>
                  UGX {service.price.toLocaleString()}
                </Text>
              </View>
              {selectedService?.id === service.id && (
                <Ionicons name="checkmark-circle" size={22} color={NWTColors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Dates */}
        <View style={s.dateRow}>
          <View style={[s.field, { flex: 1 }]}>
            <Text style={[s.label, { color: colors.textSecondary }]}>Start Date *</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.placeholder}
            />
          </View>
          <View style={[s.field, { flex: 1 }]}>
            <Text style={[s.label, { color: colors.textSecondary }]}>End Date</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.placeholder}
            />
          </View>
        </View>

        {/* Price override */}
        <View style={s.field}>
          <Text style={[s.label, { color: colors.textSecondary }]}>Price (UGX)</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            value={price}
            onChangeText={setPrice}
            placeholder="0"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
          />
        </View>

        {/* Description */}
        <View style={s.field}>
          <Text style={[s.label, { color: colors.textSecondary }]}>Description</Text>
          <TextInput
            style={[s.input, s.textarea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Additional notes..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Status */}
        <View style={[s.switchRow, { backgroundColor: colors.card }]}>
          <View>
            <Text style={[s.switchLabel, { color: colors.text }]}>Active</Text>
            <Text style={[s.switchSub, { color: colors.textSecondary }]}>
              Subscription is currently active
            </Text>
          </View>
          <Switch
            value={status === 'active'}
            onValueChange={(v) => setStatus(v ? 'active' : 'inactive')}
            trackColor={{ false: colors.border, true: NWTColors.success }}
            thumbColor="#fff"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
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
    saveBtn: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
    scroll: { padding: 16, paddingBottom: 48 },
    clientBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      marginBottom: 20,
    },
    clientName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
    field: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: FontWeight.medium, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: FontSize.base,
    },
    textarea: { height: 80, textAlignVertical: 'top' },
    dateRow: { flexDirection: 'row', gap: 12 },
    serviceOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      marginBottom: 8,
    },
    serviceName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
    servicePrice: { fontSize: FontSize.sm, marginTop: 2 },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 12,
    },
    switchLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
    switchSub: { fontSize: FontSize.sm, marginTop: 2 },
  });
