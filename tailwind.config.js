/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0057A8',
          dark: '#003F7A',
          light: '#1E88E5',
          50: '#EFF6FF',
          100: '#DBEAFE',
          600: '#0057A8',
          700: '#003F7A',
        },
        accent: {
          DEFAULT: '#00B4D8',
          dark: '#0096C7',
        },
        success: {
          DEFAULT: '#22C55E',
          light: '#DCFCE7',
          dark: '#16A34A',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#D97706',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          dark: '#DC2626',
        },
        surface: '#1E293B',
        muted: '#94A3B8',
      },
    },
  },
  plugins: [],
};
