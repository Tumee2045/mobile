import type { Href } from 'expo-router';

/**
 * Notifications carry web paths (shared backend). Map them to mobile routes;
 * links to management screens return null (stay on the list).
 */
export function mobileRoute(webLink: string, isEmployee: boolean): Href | null {
  const contract = webLink.match(/^\/my\/contracts\/(.+)$/);
  if (contract) return `/contract/${contract[1]}`;
  if (webLink.startsWith('/my/applications')) return '/seeker/applications';
  if (webLink === '/me/leave') return '/leave';
  if (webLink === '/me/schedule') return '/employee/schedule';
  if (webLink === '/me/earnings') return '/employee/earnings';
  if (webLink === '/me') return '/employee/home';
  if (webLink === '/profile') return isEmployee ? '/employee/profile' : '/seeker/profile';
  if (webLink.startsWith('/jobs/')) return `/job/${webLink.slice(6)}`;
  return null;
}
