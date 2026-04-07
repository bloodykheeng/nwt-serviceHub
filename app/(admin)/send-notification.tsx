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
import { useMutation } from '@tanstack/react-query';
import { sendNotification } from '@/lib/services/notifications.service';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { NWTColors, FontSize, FontWeight } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SendNotificationScreen() {
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sendToAll, setSendToAll] = useState(true);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      sendNotification(
        { title: title.trim(), body: body.trim(), target: sendToAll ? 'all' : 'specific' },
        profile!.id
      ),
    onSuccess: () => {
      Alert.alert('Sent!', 'Notification has been sent successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const handleSend = () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Validation', 'Title and message are required');
      return;
    }
    Alert.alert(
      'Send Notification',
      `Send "${title}" to ${sendToAll ? 'all clients' : 'selected clients'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: () => mutate() },
      ]
    );
  };

  const s = styles(colors);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Send Notification</Text>
        <TouchableOpacity onPress={handleSend} disabled={isPending}>
          {isPending ? (
            <ActivityIndicator color={NWTColors.primary} size="small" />
          ) : (
            <Text style={[s.sendBtn, { color: NWTColors.primary }]}>Send</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Preview Card */}
        <View style={[s.previewCard, { backgroundColor: NWTColors.primary }]}>
          <View style={s.previewHeader}>
            <Ionicons name="notifications" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={s.previewApp}>NWT ServiceHub</Text>
          </View>
          <Text style={s.previewTitle}>{title || 'Notification Title'}</Text>
          <Text style={s.previewBody} numberOfLines={2}>
            {body || 'Your message will appear here...'}
          </Text>
        </View>

        {/* Title */}
        <View style={s.field}>
          <Text style={[s.label, { color: colors.textSecondary }]}>Title *</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Notification title"
            placeholderTextColor={colors.placeholder}
            maxLength={100}
          />
          <Text style={[s.charCount, { color: colors.textSecondary }]}>{title.length}/100</Text>
        </View>

        {/* Body */}
        <View style={s.field}>
          <Text style={[s.label, { color: colors.textSecondary }]}>Message *</Text>
          <TextInput
            style={[s.input, s.textarea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            value={body}
            onChangeText={setBody}
            placeholder="Write your message here..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={[s.charCount, { color: colors.textSecondary }]}>{body.length}/500</Text>
        </View>

        {/* Target */}
        <View style={[s.switchRow, { backgroundColor: colors.card }]}>
          <View>
            <Text style={[s.switchLabel, { color: colors.text }]}>Send to All Clients</Text>
            <Text style={[s.switchSub, { color: colors.textSecondary }]}>
              {sendToAll ? 'All active clients will receive this' : 'Select specific clients'}
            </Text>
          </View>
          <Switch
            value={sendToAll}
            onValueChange={setSendToAll}
            trackColor={{ false: colors.border, true: NWTColors.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[s.sendButton, { opacity: isPending ? 0.7 : 1 }]}
          onPress={handleSend}
          disabled={isPending}
          activeOpacity={0.85}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={s.sendButtonText}>Send Notification</Text>
            </>
          )}
        </TouchableOpacity>
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
    sendBtn: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
    scroll: { padding: 16, gap: 4, paddingBottom: 48 },
    previewCard: {
      borderRadius: 14,
      padding: 16,
      marginBottom: 24,
    },
    previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    previewApp: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
    previewTitle: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
    previewBody: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.sm, marginTop: 4 },
    field: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: FontWeight.medium, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: FontSize.base,
    },
    textarea: { height: 100, textAlignVertical: 'top' },
    charCount: { fontSize: 11, textAlign: 'right', marginTop: 4 },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
    },
    switchLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
    switchSub: { fontSize: FontSize.sm, marginTop: 2 },
    sendButton: {
      backgroundColor: NWTColors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 15,
      borderRadius: 14,
    },
    sendButtonText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  });
