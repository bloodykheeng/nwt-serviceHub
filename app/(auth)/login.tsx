import { NWTColors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { signIn } from '@/lib/services/auth.service';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
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

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleLogin = async (data: any) => {
    setLoading(true);
    try {
      await signIn({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
      // AuthGate in _layout.tsx handles redirect
    } catch (err: any) {
      alert(err.message ?? 'Invalid credentials');
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
          {/* Header */}
          <Animated.View entering={FadeInUp.duration(600).springify()} style={s.header}>
            <View style={s.logoBox}>
              <Text style={s.logoText}>NWT</Text>
            </View>
            <Text style={[s.title, { color: colors.text }]}>ServiceHub f</Text>
            <Text style={[s.subtitle, { color: colors.textSecondary }]}>
              New Wave Technologies
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.duration(600).delay(200).springify()} style={s.form}>
            <Text style={[s.formTitle, { color: colors.text }]}>Sign In ff</Text>

            <View style={s.fieldGroup}>
              <Text style={[s.label, { color: colors.textSecondary }]}>Email ddff</Text>

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
                    autoCorrect={false}
                  />
                )}
              />

              {errors.email && <Text style={s.error}>{errors.email.message}</Text>}
            </View>

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
                  <View
                    style={[
                      s.passwordRow,
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: errors.password ? 'red' : colors.border,
                      },
                    ]}
                  >
                    <TextInput
                      style={[s.passwordInput, { color: colors.text }]}
                      value={value}
                      onChangeText={onChange}
                      placeholder="••••••••"
                      placeholderTextColor={colors.placeholder}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={s.eyeBtn}
                    >
                      <Text style={{ color: colors.textSecondary }}>
                        {showPassword ? 'Hide' : 'Show'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              />

              {errors.password && <Text style={s.error}>{errors.password.message}</Text>}
            </View>

            <TouchableOpacity
              style={[s.loginBtn, { opacity: loading ? 0.7 : 1 }]}
              onPress={handleSubmit(handleLogin)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={s.footer}>
              <Text style={[s.footerText, { color: colors.textSecondary }]}>
                Don&apos;t have an account?{' '}
              </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={[s.footerLink, { color: NWTColors.primary }]}>
                    Register
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

    header: { alignItems: 'center', marginBottom: 40 },

    logoBox: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: NWTColors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },

    logoText: { color: '#fff', fontWeight: '800', fontSize: 22 },

    title: { fontSize: 26, fontWeight: '700' },

    subtitle: { fontSize: 13, marginTop: 4 },

    form: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
    },

    formTitle: { fontSize: 20, fontWeight: '700', marginBottom: 24 },

    fieldGroup: { marginBottom: 16 },

    label: { fontSize: 13, marginBottom: 6 },

    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },

    passwordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
    },

    passwordInput: { flex: 1, paddingVertical: 12 },

    eyeBtn: { paddingLeft: 8 },

    loginBtn: {
      backgroundColor: NWTColors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },

    loginBtnText: { color: '#fff', fontWeight: '700' },

    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
    },

    footerText: { fontSize: 14 }, // ✅ FIX HERE

    footerLink: { fontWeight: '600' },

    error: { color: 'red', fontSize: 12, marginTop: 4 },
  });