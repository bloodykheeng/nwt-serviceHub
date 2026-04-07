import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { createClient, uploadAvatar } from '@/lib/services/profiles.service';
import { useAppTheme } from '@/contexts/ThemeContext';
import { NWTColors, FontSize, FontWeight } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CreateClientScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const qc = useQueryClient();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      let photo_url: string | undefined;
      if (photoUri) {
        setUploading(true);
        // We need the user id first – createClient returns profile
        // We'll upload after creation using a temp approach
      }
      return createClient({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles'] });
      router.back();
    },
    onError: (err: any) => Alert.alert('Error', err.message),
    onSettled: () => setUploading(false),
  });

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Validation', 'Full name, email and password are required');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Validation', 'Password must be at least 6 characters');
      return;
    }
    mutate();
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
        <TouchableOpacity onPress={handleSubmit} disabled={isPending || uploading}>
          {isPending || uploading ? (
            <ActivityIndicator color={NWTColors.primary} size="small" />
          ) : (
            <Text style={[s.saveBtn, { color: NWTColors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
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

        {[
          { label: 'Full Name *', value: fullName, onChange: setFullName, placeholder: 'Jane Doe', type: 'default' },
          { label: 'Email *', value: email, onChange: setEmail, placeholder: 'client@example.com', type: 'email-address' },
          { label: 'Phone', value: phone, onChange: setPhone, placeholder: '+256 700 000 000', type: 'phone-pad' },
        ].map((field) => (
          <View key={field.label} style={s.field}>
            <Text style={[s.label, { color: colors.textSecondary }]}>{field.label}</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              value={field.value}
              onChangeText={field.onChange}
              placeholder={field.placeholder}
              placeholderTextColor={colors.placeholder}
              keyboardType={field.type as any}
              autoCapitalize={field.type === 'default' ? 'words' : 'none'}
              autoCorrect={false}
            />
          </View>
        ))}

        <View style={s.field}>
          <Text style={[s.label, { color: colors.textSecondary }]}>Password *</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 6 characters"
            placeholderTextColor={colors.placeholder}
            secureTextEntry
            autoCapitalize="none"
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
  });
