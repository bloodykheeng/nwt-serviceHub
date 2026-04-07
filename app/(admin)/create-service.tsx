import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createService } from '@/lib/services/services.service';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { NWTColors, FontSize, FontWeight } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { ActiveStatus } from '@/types';

const CATEGORIES = ['Hosting', 'Domain', 'Software', 'E-Commerce', 'Network', 'Branding', 'Consulting', 'Other'];

export default function CreateServiceScreen() {
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<ActiveStatus>('active');

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      createService(
        { name, description, category, price: parseFloat(price) || 0, status },
        profile!.id
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      router.back();
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Service name is required');
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
        <Text style={[s.headerTitle, { color: colors.text }]}>New Service</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={isPending}>
          {isPending ? (
            <ActivityIndicator color={NWTColors.primary} size="small" />
          ) : (
            <Text style={[s.saveBtn, { color: NWTColors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Name */}
        <View style={s.field}>
          <Text style={[s.label, { color: colors.textSecondary }]}>Service Name *</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Web Hosting Basic"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        {/* Description */}
        <View style={s.field}>
          <Text style={[s.label, { color: colors.textSecondary }]}>Description</Text>
          <TextInput
            style={[s.input, s.textarea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description of the service..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={3}
          />
        </View>

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
                    backgroundColor: category === cat ? NWTColors.primary : colors.inputBg,
                    borderColor: category === cat ? NWTColors.primary : colors.border,
                  },
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text style={{ color: category === cat ? '#fff' : colors.text, fontSize: 13, fontWeight: '500' }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Price */}
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

        {/* Status */}
        <View style={[s.switchRow, { backgroundColor: colors.card }]}>
          <View>
            <Text style={[s.switchLabel, { color: colors.text }]}>Active</Text>
            <Text style={[s.switchSub, { color: colors.textSecondary }]}>
              Clients can see this service
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
    scroll: { padding: 16, gap: 4, paddingBottom: 48 },
    field: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: FontWeight.medium, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: FontSize.base,
    },
    textarea: { height: 80, textAlignVertical: 'top' },
    chips: { gap: 8, paddingVertical: 4 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
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
