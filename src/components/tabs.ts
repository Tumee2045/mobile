import { Platform } from 'react-native';
import { color, font } from '@/theme/tokens';

/** Shared tab bar styling (adjust to the mobile design). */
export const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: color.primary,
  tabBarInactiveTintColor: color.textMuted,
  tabBarLabelStyle: { fontFamily: font.medium, fontSize: 11 },
  // Web preview has no home-indicator inset, so give labels breathing room there.
  tabBarStyle: { backgroundColor: color.surface, borderTopColor: color.border, ...(Platform.OS === 'web' ? { height: 64, paddingBottom: 8 } : {}) },
} as const;
