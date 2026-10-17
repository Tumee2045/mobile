import { useEffect } from 'react';
import { Redirect, Tabs } from 'expo-router';
import { useSession } from '@/auth/session';
import { Loading } from '@/components/ui';
import { tabIcon } from '@/components/TabIcon';
import { tabScreenOptions } from '@/components/tabs';

/** Employee area: Нүүр · Хуваарь · Цалин · Чат · Профайл */
export default function EmployeeTabs() {
  const { ready, user, isEmployee, employeeMemberships, active, switchCompany } = useSession();
  const fallback = employeeMemberships[0];

  // Arriving here (e.g. right after being hired) while in job-seeker mode.
  useEffect(() => {
    if (ready && !isEmployee && fallback) switchCompany(fallback.company.id);
  }, [ready, isEmployee, fallback, switchCompany]);

  if (!ready) return <Loading />;
  if (!user) return <Redirect href="/login" />;
  if (!isEmployee && !fallback) return <Redirect href="/seeker/jobs" />;
  if (!isEmployee) return <Loading />;

  const isShift = active?.membership.scheduleType === 'shift';

  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="home" options={{ title: 'Нүүр', tabBarIcon: tabIcon('home-outline', 'home') }} />
      {/* Fixed-schedule employees don't see shift screens. */}
      <Tabs.Screen
        name="schedule"
        options={{ title: 'Хуваарь', href: isShift ? undefined : null, tabBarIcon: tabIcon('calendar-outline', 'calendar') }}
      />
      <Tabs.Screen name="earnings" options={{ title: 'Цалин', tabBarIcon: tabIcon('wallet-outline', 'wallet') }} />
      <Tabs.Screen name="chat" options={{ title: 'Чат', tabBarIcon: tabIcon('chatbubbles-outline', 'chatbubbles') }} />
      <Tabs.Screen name="profile" options={{ title: 'Профайл', tabBarIcon: tabIcon('person-outline', 'person') }} />
    </Tabs>
  );
}
