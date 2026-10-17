/**
 * MOBILE-SPECIFIC (not synced from front-end). Same exports as
 * front-end/src/api/mode.ts so the shared HTTP client works unchanged.
 *
 * Reads are synchronous from an in-memory cache filled by `initStorage()`
 * at app start; writes go through to AsyncStorage / SecureStore.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type DataMode = 'mock' | 'api';

const MODE_KEY = 'hrp.mode';
const TOKEN_KEY = 'hrp.token';

/**
 * A phone can't reach "localhost" on your PC. Unless EXPO_PUBLIC_API_URL is set,
 * use the dev machine's LAN IP that Expo is already serving from, port 3000.
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') return `http://${host}:3000/api`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';
}

export const API_URL: string = resolveApiUrl();

let mode: DataMode = 'mock';
let token: string | null = null;

const secure = Platform.OS !== 'web';

/** Load persisted mode + token. Call once before rendering the app. */
export async function initStorage(): Promise<void> {
  try {
    mode = (await AsyncStorage.getItem(MODE_KEY)) === 'api' ? 'api' : 'mock';
    token = secure ? await SecureStore.getItemAsync(TOKEN_KEY) : await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    /* storage unavailable — keep defaults */
  }
}

export function getMode(): DataMode {
  return mode;
}

export function setMode(next: DataMode) {
  mode = next;
  void AsyncStorage.setItem(MODE_KEY, next).catch(() => {});
}

export const getToken = () => token;

export function setToken(next: string | null) {
  token = next;
  const op = next
    ? secure
      ? SecureStore.setItemAsync(TOKEN_KEY, next)
      : AsyncStorage.setItem(TOKEN_KEY, next)
    : secure
      ? SecureStore.deleteItemAsync(TOKEN_KEY)
      : AsyncStorage.removeItem(TOKEN_KEY);
  void op.catch(() => {});
}

const unauthorizedListeners = new Set<() => void>();
export function onUnauthorized(fn: () => void) {
  unauthorizedListeners.add(fn);
  return () => void unauthorizedListeners.delete(fn);
}
export function notifyUnauthorized() {
  for (const fn of unauthorizedListeners) fn();
}
