import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Onest_400Regular, Onest_500Medium, Onest_600SemiBold, Onest_700Bold } from '@expo-google-fonts/onest';
import { Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { initStorage } from '@/api';
import { SessionProvider } from '@/auth/session';
import { Loading } from '@/components/ui';
import { initDevSettings } from '@/lib/location';
import { color } from '@/theme/tokens';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Onest_400Regular, Onest_500Medium, Onest_600SemiBold, Onest_700Bold, Sora_800ExtraBold });
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    void Promise.all([initStorage(), initDevSettings()]).finally(() => setStorageReady(true));
  }, []);

  if (!fontsLoaded || !storageReady) return <Loading />;

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }} />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
