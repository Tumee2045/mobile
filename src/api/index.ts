/**
 * The only module screens import data access from — same contract as the web app.
 * `api` routes to the in-app mock or the NestJS backend, chosen at login.
 */
import { api as mockApi, type Api } from '@/shared/api/mock/server';
import { httpApi } from '@/shared/api/http/client';
import { getMode } from '@/shared/api/mode';

export const api: Api = new Proxy({} as Api, {
  get: (_target, key: keyof Api) => (getMode() === 'api' ? httpApi : mockApi)[key],
});

export { ApiError } from '@/shared/api/mock/server';
export type { Api, Persona, PersonaKey, MembershipView } from '@/shared/api/mock/server';
export { resetDb } from '@/shared/api/mock/db';
export { httpAuth } from '@/shared/api/http/client';
export { getMode, setMode, initStorage, API_URL, onUnauthorized, type DataMode } from '@/shared/api/mode';
export { useApi, useMutation } from '@/shared/api/useApi';
export * from '@/shared/api/types';
