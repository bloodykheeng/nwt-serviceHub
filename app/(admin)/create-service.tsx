import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
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
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { z } from 'zod';
import { NWTColors, FontSize, FontWeight } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { createService } from '@/lib/services/services.service';

const CATEGORIES = ['Hosting', 'Domain', 'Software', 'E-Commerce', 'Network', 'Branding', 'Consulting', 'Other'];

const schema = z.object({
  name: z.string().min(2, 'Service name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Enter a valid price'),
  status: z.enum(['active', 'inactive']),
});

type FormData = z.infer<typeof schema>;

export default function CreateServiceScreen() {
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
    defaultValues: { name: '', description: '', category: '', price: '', status: 'active' },
  });

  const selectedCategory = watch('category');
  const status = watch('status');

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) =>
      createService(
        {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          category: data.category || undefined,
          price: parseFloat(data.price) || 0,
          status: data.status,
        },
        profile!.id
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      router.back();
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const s = styles(colors);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>New Service</Text>
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
        {/* Name */}
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={s.field}>
              <Text style={[s.label, { color: colors.textSecondary }]}>Service Name *</Text>
              <TextInput
                style={[
                  s.input,
                  { backgroundColor: colors.inputBg, color: colors.text },
                  errors.name ? s.inputError : { borderColor: colors.border },
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g. Web Hosting Basic"
                placeholderTextColor={colors.placeholder}
              />
              {errors.name && <Text style={s.errorText}>{errors.name.message}</Text>}
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
                placeholder="Brief description of the service..."
                placeholderTextColor={colors.placeholder}
                multiline
                numberOfLines={3}
              />
              {errors.description && <Text style={s.errorText}>{errors.description.message}</Text>}
            </View>
          )}
        />

        {/* Category */}
        <View style={s.field}>
          <Text style={[s.label, { color: colors.textSecondary }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  s.chip,
                  {
                    backgroundColor: selectedCategory === cat ? NWTColors.primary : colors.inputBg,
                    borderColor: selectedCategory === cat ? NWTColors.primary : colors.border,
                  },
                ]}
                onPress={() => setValue('category', selectedCategory === cat ? '' : cat)}
              >
                <Text style={{ color: selectedCategory === cat ? '#fff' : colors.text, fontSize: 13, fontWeight: '500' }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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

        {/* Status */}
        <View style={[s.switchRow, { backgroundColor: colors.card }]}>
          <View>
            <Text style={[s.switchLabel, { color: colors.text }]}>Active</Text>
            <Text style={[s.switchSub, { color: colors.textSecondary }]}>Clients can see this service</Text>
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

const styles = (_colors: any) =>
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
    field: { marginBottom: 18 },
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
    chips: { gap: 8, paddingVertical: 4 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 12,
      marginTop: 4,
    },
    switchLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
    switchSub: { fontSize: FontSize.sm, marginTop: 2 },
  });
