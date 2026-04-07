import { Stack } from 'expo-router';
import { useAppTheme } from '@/contexts/ThemeContext';

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
