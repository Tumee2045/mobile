/**
 * Geofence helpers for clock-in. With "demo location" on (default, so a demo
 * works away from the branch) the device pretends to be 45 m from the branch;
 * otherwise the real GPS position is used.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import type { Branch } from '@/api';

const SIMULATE_KEY = 'hrp.simulateLocation';
const DEMO_DISTANCE_M = 45;
let simulate = true;

export async function initDevSettings() {
  try {
    simulate = (await AsyncStorage.getItem(SIMULATE_KEY)) !== 'off';
  } catch {
    /* keep default */
  }
}

export const isSimulatingLocation = () => simulate;

export function setSimulatingLocation(on: boolean) {
  simulate = on;
  void AsyncStorage.setItem(SIMULATE_KEY, on ? 'on' : 'off').catch(() => {});
}

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const rad = (x: number) => (x * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

export interface Fix {
  distanceM: number;
  coords: { lat: number; lng: number } | null;
  simulated: boolean;
}

export type LocationState =
  | { status: 'loading' }
  | { status: 'denied' }
  | { status: 'error' }
  | ({ status: 'ok' } & Fix);

/** Distance from the device to a branch, re-checked on demand. */
export function useBranchDistance(branch: Pick<Branch, 'lat' | 'lng'> | null | undefined) {
  const [state, setState] = useState<LocationState>({ status: 'loading' });

  const check = useCallback(async () => {
    if (!branch) return;
    if (simulate) {
      setState({ status: 'ok', distanceM: DEMO_DISTANCE_M, coords: null, simulated: true });
      return;
    }
    setState({ status: 'loading' });
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') return setState({ status: 'denied' });
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude: lat, longitude: lng } = pos.coords;
      setState({ status: 'ok', distanceM: haversine(lat, lng, branch.lat, branch.lng), coords: { lat, lng }, simulated: false });
    } catch {
      setState({ status: 'error' });
    }
  }, [branch]);

  useEffect(() => {
    void check();
  }, [check]);

  return { state, recheck: check };
}
