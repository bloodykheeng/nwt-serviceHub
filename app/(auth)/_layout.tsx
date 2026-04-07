import { useAppTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function AuthLayout() {
  const { colors } = useAppTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
    </View>
  );
}
