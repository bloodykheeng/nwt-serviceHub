import { useAppTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';

export default function AdminLayout() {
  const { colors } = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
