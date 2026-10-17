import { Redirect, Tabs } from 'expo-router';
import { useSession } from '@/auth/session';
import { Loading } from '@/components/ui';
import { tabIcon } from '@/components/TabIcon';
import { tabScreenOptions } from '@/components/tabs';

/** Job-seeker area: Ажил хайх · Өргөдөл · Чат · Профайл */
export default function SeekerTabs() {
  const { ready, user } = useSession();
  if (!ready) return <Loading />;
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="jobs" options={{ title: 'Ажил хайх', tabBarIcon: tabIcon('search-outline', 'search') }} />
      <Tabs.Screen name="applications" options={{ title: 'Өргөдөл', tabBarIcon: tabIcon('document-text-outline', 'document-text') }} />
      <Tabs.Screen name="chat" options={{ title: 'Чат', tabBarIcon: tabIcon('chatbubbles-outline', 'chatbubbles') }} />
      <Tabs.Screen name="profile" options={{ title: 'Профайл', tabBarIcon: tabIcon('person-outline', 'person') }} />
    </Tabs>
  );
}
