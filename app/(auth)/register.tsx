import { NWTColors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { signUp } from '@/lib/services/auth.service';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function RegisterScreen() {
  const { colors } = useAppTheme();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  const handleRegister = async (data: any) => {
    // keep your validation logic
    if (!data.fullName.trim() || !data.email.trim() || !data.password.trim()) {
      Alert.alert('Error', 'Full name, email and password are required');
      return;
    }
    if (data.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp({
        full_name: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        phone: data.phone.trim() || undefined,
      });

      Alert.alert(
        'Account Created',
        'Please check your email to verify your account, then sign in.',
      );
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const s = styles(colors);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            { backgroundColor: colors.background }, // ✅ FIX flicker
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.duration(600).springify()} style={s.header}>
            <View style={s.logoBox}>
              <Text style={s.logoText}>NWT</Text>
            </View>
            <Text style={[s.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[s.subtitle, { color: colors.textSecondary }]}>
              New Wave Technologies ServiceHub
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(600).delay(200).springify()}
            style={[s.form, { backgroundColor: colors.surface }]}
          >
            {/* FULL NAME */}
            <View style={s.fieldGroup}>
              <Text style={[s.label, { color: colors.textSecondary }]}>Full Name</Text>
              <Controller
                control={control}
                name="fullName"
                rules={{ required: 'Full name is required' }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[
                      s.input,
                      {
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        borderColor: errors.fullName ? 'red' : colors.border,
                      },
                    ]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="John Doe"
                    placeholderTextColor={colors.placeholder}
                    autoCapitalize="words"
                  />
                )}
              />
              {errors.fullName && <Text style={s.error}>{errors.fullName.message}</Text>}
            </View>

            {/* EMAIL */}
            <View style={s.fieldGroup}>
              <Text style={[s.label, { color: colors.textSecondary }]}>Email</Text>
              <Controller
                control={control}
                name="email"
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: 'Enter a valid email',
                  },
                }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[
                      s.input,
                      {
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        borderColor: errors.email ? 'red' : colors.border,
                      },
                    ]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />
              {errors.email && <Text style={s.error}>{errors.email.message}</Text>}
            </View>

            {/* PHONE */}
            <View style={s.fieldGroup}>
              <Text style={[s.label, { color: colors.textSecondary }]}>
                Phone (optional)
              </Text>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[
                      s.input,
                      {
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="+256 700 000 000"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="phone-pad"
                  />
                )}
              />
            </View>

            {/* PASSWORD */}
            <View style={s.fieldGroup}>
              <Text style={[s.label, { color: colors.textSecondary }]}>Password</Text>
              <Controller
                control={control}
                name="password"
                rules={{
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' },
                }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[
                      s.input,
                      {
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        borderColor: errors.password ? 'red' : colors.border,
                      },
                    ]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Min. 6 characters"
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                )}
              />
              {errors.password && <Text style={s.error}>{errors.password.message}</Text>}
            </View>

            <TouchableOpacity
              style={[s.btn, { opacity: loading ? 0.7 : 1 }]}
              onPress={handleSubmit(handleRegister)}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.btnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={s.footer}>
              <Text style={[s.footerText, { color: colors.textSecondary }]}>
                Already have an account?{' '}
              </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={[s.footerLink, { color: NWTColors.primary }]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    root: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    header: { alignItems: 'center', marginBottom: 32 },

    logoBox: {
      width: 64,
      height: 64,
      borderRadius: 18,
      backgroundColor: NWTColors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },

    logoText: { color: '#fff', fontWeight: '800', fontSize: 20 },

    title: { fontSize: 24, fontWeight: '700' },
    subtitle: { fontSize: 13, marginTop: 4 },

    form: {
      borderRadius: 20,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },

    fieldGroup: { marginBottom: 14 },

    label: { fontSize: 13, fontWeight: '500', marginBottom: 6 },

    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
    },

    btn: {
      backgroundColor: NWTColors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },

    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },

    footerText: { fontSize: 14 },

    footerLink: { fontSize: 14, fontWeight: '600' },

    error: { color: 'red', fontSize: 12, marginTop: 4 },
  });