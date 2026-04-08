import { FontSize, FontWeight, NWTColors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { createClient } from '@/lib/services/profiles.service';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { z } from 'zod';

const schema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().check(z.email({ error: 'Enter a valid email address' })),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || v.length >= 7, 'Enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function CreateClientScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', email: '', phone: '', password: '' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) =>
      createClient({
        full_name: data.full_name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || undefined,
        password: data.password,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles'] });
      router.back();
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const s = styles(colors);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Register Client</Text>
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
        {/* Photo */}
        <TouchableOpacity style={s.photoPicker} onPress={pickPhoto} activeOpacity={0.8}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={s.photo} />
          ) : (
            <View style={[s.photoPlaceholder, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Ionicons name="camera" size={28} color={colors.textSecondary} />
              <Text style={[s.photoText, { color: colors.textSecondary }]}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Full Name */}
        <Controller
          control={control}
          name="full_name"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={s.field}>
              <Text style={[s.label, { color: colors.textSecondary }]}>Full Name *</Text>
              <TextInput
                style={[
                  s.input,
                  { backgroundColor: colors.inputBg, color: colors.text },
                  errors.full_name ? s.inputError : { borderColor: colors.border },
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Jane Doe"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {errors.full_name && <Text style={s.errorText}>{errors.full_name.message}</Text>}
            </View>
          )}
        />

        {/* Email */}
        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={s.field}>
              <Text style={[s.label, { color: colors.textSecondary }]}>Email *</Text>
              <TextInput
                style={[
                  s.input,
                  { backgroundColor: colors.inputBg, color: colors.text },
                  errors.email ? s.inputError : { borderColor: colors.border },
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="client@example.com"
                placeholderTextColor={colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && <Text style={s.errorText}>{errors.email.message}</Text>}
            </View>
          )}
        />

        {/* Phone */}
        <Controller
          control={control}
          name="phone"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={s.field}>
              <Text style={[s.label, { color: colors.textSecondary }]}>Phone</Text>
              <TextInput
                style={[
                  s.input,
                  { backgroundColor: colors.inputBg, color: colors.text },
                  errors.phone ? s.inputError : { borderColor: colors.border },
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="+256 700 000 000"
                placeholderTextColor={colors.placeholder}
                keyboardType="phone-pad"
              />
              {errors.phone && <Text style={s.errorText}>{errors.phone.message}</Text>}
            </View>
          )}
        />

        {/* Password */}
        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={s.field}>
              <Text style={[s.label, { color: colors.textSecondary }]}>Password *</Text>
              <TextInput
                style={[
                  s.input,
                  { backgroundColor: colors.inputBg, color: colors.text },
                  errors.password ? s.inputError : { borderColor: colors.border },
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Min. 6 characters"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                autoCapitalize="none"
              />
              {errors.password && <Text style={s.errorText}>{errors.password.message}</Text>}
            </View>
          )}
        />
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
    photoPicker: { alignItems: 'center', marginBottom: 24 },
    photo: { width: 88, height: 88, borderRadius: 44 },
    photoPlaceholder: {
      width: 88,
      height: 88,
      borderRadius: 44,
      borderWidth: 2,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    photoText: { fontSize: 12 },
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
  });
