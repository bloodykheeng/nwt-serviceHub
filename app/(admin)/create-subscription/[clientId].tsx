import { QUERY_KEYS } from '@/constants/queryKeys';
import { FontSize, FontWeight, NWTColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { getProfile } from '@/lib/services/profiles.service';
import { getServices } from '@/lib/services/services.service';
import { createSubscription } from '@/lib/services/subscriptions.service';
import { Service } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import moment from 'moment';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { z } from 'zod';

const schema = z
  .object({
    service_id: z.string().min(1, 'Please select a service'),
    start_date: z.date({ error: 'Start date is required' }),
    end_date: z.date().optional().nullable(),
    price: z
      .string()
      .min(1, 'Price is required')
      .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Enter a valid price'),
    description: z.string().optional(),
    status: z.enum(['active', 'inactive']),
  })
  .refine(
    (d) => !d.end_date || d.end_date > d.start_date,
    { message: 'End date must be after start date', path: ['end_date'] }
  );

type FormData = z.infer<typeof schema>;

// ─── Reusable DateTimePicker field ────────────────────────────────────────────

function DateTimeField({
  label,
  value,
  onChange,
  error,
  required,
  colors,
}: {
  label: string;
  value: Date | null | undefined;
  onChange: (d: Date | null) => void;
  error?: string;
  required?: boolean;
  colors: any;
}) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value ?? new Date());

  const displayValue = value ? moment(value).format('DD MMM YYYY  HH:mm') : '';

  // Android: picker shows inline as a dialog — confirm on selection
  // iOS: picker shows in a modal with explicit confirm button
  const handleChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (selected) onChange(selected);
    } else {
      if (selected) setTempDate(selected);
    }
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: FontWeight.medium, color: colors.textSecondary, marginBottom: 6 }}>
        {label}
        {required ? ' *' : ''}
      </Text>

      <TouchableOpacity
        onPress={() => { setTempDate(value ?? new Date()); setShow(true); }}
        activeOpacity={0.7}
        style={[
          dtStyles.input,
          { backgroundColor: colors.inputBg },
          error ? { borderColor: NWTColors.danger } : { borderColor: colors.border },
        ]}
      >
        <Ionicons name="calendar-outline" size={18} color={value ? colors.text : colors.placeholder} />
        <Text style={{ flex: 1, marginLeft: 8, fontSize: FontSize.base, color: value ? colors.text : colors.placeholder }}>
          {displayValue || `Select ${label.toLowerCase()}`}
        </Text>
        {value && !required && (
          <TouchableOpacity onPress={() => onChange(null)} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {error && <Text style={dtStyles.errorText}>{error}</Text>}

      {/* Android: renders inline as dialog */}
      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="datetime"
          display="default"
          onChange={handleChange}
        />
      )}

      {/* iOS: wrapped in a modal */}
      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="slide">
          <Pressable style={dtStyles.modalBackdrop} onPress={() => setShow(false)} />
          <View style={[dtStyles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={dtStyles.modalHeader}>
              <TouchableOpacity onPress={() => setShow(false)}>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.base }}>Cancel</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.text, fontWeight: FontWeight.semibold, fontSize: FontSize.base }}>
                {label}
              </Text>
              <TouchableOpacity onPress={() => { onChange(tempDate); setShow(false); }}>
                <Text style={{ color: NWTColors.primary, fontWeight: FontWeight.bold, fontSize: FontSize.base }}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="datetime"
              display="spinner"
              onChange={handleChange}
              style={{ width: '100%' }}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

const dtStyles = StyleSheet.create({
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: { color: NWTColors.danger, fontSize: 12, marginTop: 4 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CreateSubscriptionScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      service_id: '',
      start_date: new Date(),
      end_date: null,
      price: '',
      description: '',
      status: 'active',
    },
  });

  const selectedServiceId = watch('service_id');
  const status = watch('status');

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
    mutationFn: (data: FormData) =>
      createSubscription(
        {
          client_id: clientId,
          service_id: data.service_id,
          start_date: moment(data.start_date).toISOString(),
          end_date: data.end_date ? moment(data.end_date).toISOString() : undefined,
          description: data.description || undefined,
          price: parseFloat(data.price),
          status: data.status,
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

  const s = styles(colors);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Add Subscription</Text>
        <TouchableOpacity onPress={handleSubmit((d) => mutate(d))} disabled={isPending}>
          {isPending ? (
            <ActivityIndicator color={NWTColors.primary} size="small" />
          ) : (
            <Text style={[s.saveBtn, { color: NWTColors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={24}
      >
        {/* Client Banner */}
        <View style={[s.clientBanner, { backgroundColor: NWTColors.primary + '15', borderColor: NWTColors.primary + '30' }]}>
          <Ionicons name="person-circle" size={20} color={NWTColors.primary} />
          <Text style={[s.clientName, { color: NWTColors.primary }]}>
            {client?.full_name ?? client?.email ?? 'Client'}
          </Text>
        </View>

        {/* Service Selection */}
        <View style={s.field}>
          <Text style={[s.label, { color: colors.textSecondary }]}>Select Service *</Text>
          {services.map((service: Service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                s.serviceOption,
                {
                  backgroundColor: selectedServiceId === service.id ? NWTColors.primary + '10' : colors.card,
                  borderColor: selectedServiceId === service.id ? NWTColors.primary : colors.border,
                },
              ]}
              onPress={() => {
                setValue('service_id', service.id, { shouldValidate: true });
                setValue('price', service.price.toString(), { shouldValidate: true });
              }}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.serviceName, { color: colors.text }]}>{service.name}</Text>
                <Text style={[s.servicePrice, { color: colors.textSecondary }]}>
                  UGX {service.price.toLocaleString()}
                </Text>
              </View>
              {selectedServiceId === service.id && (
                <Ionicons name="checkmark-circle" size={22} color={NWTColors.primary} />
              )}
            </TouchableOpacity>
          ))}
          {errors.service_id && <Text style={s.errorText}>{errors.service_id.message}</Text>}
        </View>

        {/* Dates */}
        <View style={s.dateRow}>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="start_date"
              render={({ field: { value, onChange } }) => (
                <DateTimeField
                  label="Start Date"
                  value={value}
                  onChange={onChange}
                  error={errors.start_date?.message}
                  required
                  colors={colors}
                />
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="end_date"
              render={({ field: { value, onChange } }) => (
                <DateTimeField
                  label="End Date"
                  value={value}
                  onChange={onChange}
                  error={errors.end_date?.message}
                  colors={colors}
                />
              )}
            />
          </View>
        </View>

        {/* Price */}
        <Controller
          control={control}
          name="price"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={s.field}>
              <Text style={[s.label, { color: colors.textSecondary }]}>Price (UGX) *</Text>
              <TextInput
                style={[
                  s.input,
                  { backgroundColor: colors.inputBg, color: colors.text },
                  errors.price ? s.inputError : { borderColor: colors.border },
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="0"
                placeholderTextColor={colors.placeholder}
                keyboardType="numeric"
              />
              {errors.price && <Text style={s.errorText}>{errors.price.message}</Text>}
            </View>
          )}
        />

        {/* Description */}
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={s.field}>
              <Text style={[s.label, { color: colors.textSecondary }]}>Description</Text>
              <TextInput
                style={[
                  s.input,
                  s.textarea,
                  { backgroundColor: colors.inputBg, color: colors.text },
                  errors.description ? s.inputError : { borderColor: colors.border },
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Additional notes..."
                placeholderTextColor={colors.placeholder}
                multiline
                numberOfLines={3}
              />
              {errors.description && <Text style={s.errorText}>{errors.description.message}</Text>}
            </View>
          )}
        />

        {/* Status */}
        <View style={[s.switchRow, { backgroundColor: colors.card }]}>
          <View>
            <Text style={[s.switchLabel, { color: colors.text }]}>Active</Text>
            <Text style={[s.switchSub, { color: colors.textSecondary }]}>Subscription is currently active</Text>
          </View>
          <Switch
            value={status === 'active'}
            onValueChange={(v) => setValue('status', v ? 'active' : 'inactive')}
            trackColor={{ false: colors.border, true: NWTColors.success }}
            thumbColor="#fff"
          />
        </View>
      </KeyboardAwareScrollView>
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
    inputError: { borderColor: NWTColors.danger },
    errorText: { color: NWTColors.danger, fontSize: 12, marginTop: 4 },
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
