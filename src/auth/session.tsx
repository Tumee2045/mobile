import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, httpAuth, onUnauthorized, type MembershipView, type Permission, type User } from '@/api';
import { subscribeInvalidate } from '@/shared/api/useApi';

interface StoredSession {
  userId: string;
  /** Company the worker is acting for as an employee; null = job-seeker mode. */
  companyId: string | null;
}

interface SessionValue {
  ready: boolean;
  user: User | null;
  memberships: MembershipView[];
  /** Employee memberships only — the mobile app is for workers. */
  employeeMemberships: MembershipView[];
  active: MembershipView | null;
  companyId: string | null;
  can: (p: Permission) => boolean;
  isEmployee: boolean;
  signIn: (userId: string, companyId: string | null) => Promise<void>;
  signOut: () => Promise<void>;
  switchCompany: (companyId: string | null) => void;
}

const KEY = 'hrp.session';
const SessionContext = createContext<SessionValue | null>(null);

async function readStored(): Promise<StoredSession | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function writeStored(s: StoredSession | null) {
  void (s ? AsyncStorage.setItem(KEY, JSON.stringify(s)) : AsyncStorage.removeItem(KEY)).catch(() => {});
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredSession | null | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<MembershipView[]>([]);
  const [ready, setReady] = useState(false);

  const load = useCallback(async (s: StoredSession | null) => {
    if (!s) {
      setUser(null);
      setMemberships([]);
      setReady(true);
      return;
    }
    try {
      const [u, ms] = await Promise.all([api.getUser(s.userId), api.getMemberships(s.userId)]);
      setUser(u);
      setMemberships(ms);
    } catch {
      writeStored(null);
      setStored(null);
      setUser(null);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    void readStored().then(setStored);
  }, []);

  useEffect(() => {
    if (stored !== undefined) void load(stored);
  }, [stored, load]);

  useEffect(
    () =>
      onUnauthorized(() => {
        httpAuth.logout();
        writeStored(null);
        setStored(null);
      }),
    [],
  );

  // e.g. "hired" grants a new membership — keep it fresh after mutations.
  useEffect(() => subscribeInvalidate(() => void load(stored ?? null)), [stored, load]);

  const value = useMemo<SessionValue>(() => {
    const companyId = stored?.companyId ?? null;
    const employeeMemberships = memberships.filter((m) => m.role.permissions.includes('self.attendance'));
    const active = memberships.find((m) => m.company.id === companyId) ?? null;
    const perms = new Set(active?.role.permissions ?? []);
    return {
      ready,
      user,
      memberships,
      employeeMemberships,
      active,
      companyId,
      can: (p) => perms.has(p),
      isEmployee: perms.has('self.attendance'),
      signIn: async (userId, cid) => {
        const s = { userId, companyId: cid };
        writeStored(s);
        setReady(false);
        await load(s);
        setStored(s);
      },
      signOut: async () => {
        httpAuth.logout();
        writeStored(null);
        setStored(null);
      },
      switchCompany: (cid) => {
        if (!stored) return;
        const s = { ...stored, companyId: cid };
        writeStored(s);
        setStored(s);
      },
    };
  }, [stored, user, memberships, ready, load]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}

export function useAuthed() {
  const s = useSession();
  if (!s.user) throw new Error('Not signed in');
  return { ...s, user: s.user };
}

/** Where a signed-in worker lands. */
export function homeFor(isEmployee: boolean) {
  return isEmployee ? '/employee/home' : '/seeker/jobs';
}
