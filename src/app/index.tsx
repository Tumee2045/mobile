import { Redirect } from 'expo-router';
import { homeFor, useSession } from '@/auth/session';
import { Loading } from '@/components/ui';

/** Entry: send the user to login or to their home. */
export default function Index() {
  const { ready, user, isEmployee } = useSession();
  if (!ready) return <Loading />;
  if (!user) return <Redirect href="/login" />;
  return <Redirect href={homeFor(isEmployee)} />;
}
