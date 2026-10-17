/**
 * Design tokens — mirror of front-end/src/styles/tokens.css (blue primary).
 * Screens use these names, never raw hex values, so the mobile design can
 * re-theme the app from this file alone.
 */
export const palette = {
  blue50: '#F3F7FE',
  blue100: '#E6EEFC',
  blue200: '#C9D8F5',
  blue300: '#8DB8FF',
  blue600: '#1D4ED8',
  blue700: '#1A3FAE',
  blue800: '#183C7A',
  blue850: '#24498C',
  blue900: '#0F2557',
  blue950: '#0A1F45',
  gray0: '#FFFFFF',
  gray25: '#FAFBFC',
  gray50: '#F5F6F8',
  gray100: '#F0F2F5',
  gray150: '#EEF0F3',
  gray200: '#E3E6EB',
  gray300: '#CDD2DA',
  gray400: '#A8B0BC',
  gray600: '#5B6170',
  gray700: '#3F4553',
  gray800: '#2A2F3A',
  gray900: '#14171F',
} as const;

export const color = {
  primary: palette.blue600,
  primaryPressed: palette.blue700,
  primarySoft: palette.blue100,
  primaryTint: palette.blue50,
  onPrimary: '#FFFFFF',
  primaryText: palette.blue700,

  inverse: palette.blue900,
  inverseRaised: palette.blue800,
  inverseTrack: palette.blue850,
  onInverse: '#FFFFFF',
  onInverseMuted: palette.blue200,
  accent: palette.blue300,
  onAccent: palette.blue950,

  bg: palette.gray50,
  surface: palette.gray0,
  surfaceMuted: palette.gray50,
  surfaceSunken: palette.gray100,
  border: palette.gray200,
  borderStrong: palette.gray300,
  divider: palette.gray150,
  text: palette.gray900,
  textSecondary: palette.gray700,
  textMuted: palette.gray600,

  success: '#146C43',
  successSoft: '#E3F5EC',
  warning: '#8A4F00',
  warningSoft: '#FCF1DC',
  warningStrong: '#E8A33D',
  danger: '#B42318',
  dangerSoft: '#FDECEA',
  info: '#5B3BB5',
  infoSoft: '#F0EBFD',
} as const;

/** HirERP logo colours (brand guide). */
export const brand = {
  navy: '#0F2557',
  blue: '#1D4ED8',
  blueMid: '#4A7BF0',
  blueLight: '#8FB0FF',
  blueSoft: '#A3BBFF',
  orange: '#F5A524',
} as const;

/** Wordmark font (Sora ExtraBold). */
export const fontBrand = 'Sora_800ExtraBold';

export const font = {
  regular: 'Onest_400Regular',
  medium: 'Onest_500Medium',
  semibold: 'Onest_600SemiBold',
  bold: 'Onest_700Bold',
} as const;

export const text = {
  xs: 12,
  sm: 13,
  md: 14,
  base: 15,
  lg: 16,
  xl: 17,
  '2xl': 19,
  '3xl': 20,
  '4xl': 26,
  '5xl': 28,
} as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48 } as const;

export const radius = { sm: 6, md: 10, lg: 12, xl: 14, '2xl': 16, '3xl': 20, full: 999 } as const;

/** Minimum touch target. */
export const touch = 44;

export const shadow = {
  sm: { shadowColor: '#14171F', shadowOpacity: 0.06, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  md: { shadowColor: '#14171F', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
} as const;
