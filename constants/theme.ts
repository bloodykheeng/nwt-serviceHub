import { ThemeColors } from '@/types';

export const NWTColors = {
  primary: '#0057A8',
  primaryDark: '#003F7A',
  primaryLight: '#1E88E5',
  accent: '#00B4D8',
  accentDark: '#0096C7',
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  white: '#FFFFFF',
  black: '#000000',
};

export const LightColors: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  tabBar: '#FFFFFF',
  primary: NWTColors.primary,
  accent: NWTColors.accent,
  success: NWTColors.success,
  warning: NWTColors.warning,
  danger: NWTColors.danger,
  placeholder: '#94A3B8',
  inputBg: '#F1F5F9',
  overlay: 'rgba(0,0,0,0.5)',
};

export const DarkColors: ThemeColors = {
  background: '#0A0F1E',
  surface: '#111827',
  card: '#1E293B',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  border: '#1E293B',
  tabBar: '#111827',
  primary: NWTColors.primaryLight,
  accent: NWTColors.accent,
  success: NWTColors.success,
  warning: NWTColors.warning,
  danger: NWTColors.danger,
  placeholder: '#64748B',
  inputBg: '#1E293B',
  overlay: 'rgba(0,0,0,0.7)',
};

// Legacy Colors kept for existing components
export const Colors = {
  light: {
    text: LightColors.text,
    background: LightColors.background,
    tint: NWTColors.primary,
    icon: LightColors.textSecondary,
    tabIconDefault: LightColors.textSecondary,
    tabIconSelected: NWTColors.primary,
  },
  dark: {
    text: DarkColors.text,
    background: DarkColors.background,
    tint: NWTColors.accent,
    icon: DarkColors.textSecondary,
    tabIconDefault: DarkColors.textSecondary,
    tabIconSelected: NWTColors.accent,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};
