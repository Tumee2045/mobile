import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/auth/session';
import { Loading } from '@/components/ui';
import { color } from '@/theme/tokens';

/**
 * Every signed-in screen lives in this group, so none of them can render
 * before the session has loaded (cold start, deep link, notification tap).
 */
export default function AppLayout() {
  const { ready, user } = useSession();
  if (!ready) return <Loading />;
  if (!user) return <Redirect href="/login" />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
      <Stack.Screen name="qr" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
      <Stack.Screen name="qr-result" options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="withdraw-done" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      <Stack.Screen name="leave-new" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
