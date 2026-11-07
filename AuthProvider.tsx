import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isConfigured, supabase } from './lib/supabase';
import { useOnline } from './lib/online';
import type { Profile, Settings } from './types';

type DataState = 'idle' | 'loading' | 'ready' | 'error';

interface AuthCtx {
  booting: boolean;
  session: Session | null;
  profile: Profile | null;
  settings: Settings | null;
  dataState: DataState;
  recovery: boolean;
  clearRecovery: () => void;
  reload: () => Promise<void>;
  setProfile: (p: Profile) => void;
  setSettings: (s: Settings) => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const online = useOnline();
  const [booting, setBooting] = useState(isConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [dataState, setDataState] = useState<DataState>('idle');
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    if (!isConfigured) return;
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))
      .finally(() => setBooting(false));

    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  const reload = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setSettings(null);
      setDataState('idle');
      return;
    }
    setDataState('loading');
    try {
      const [p, s] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_settings').select('*').eq('id', userId).maybeSingle(),
      ]);
      if (p.error || s.error || !p.data || !s.data) {
        setDataState('error');
        return;
      }
      setProfile(p.data as Profile);
      setSettings(s.data as Settings);
      setDataState('ready');
    } catch {
      setDataState('error');
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // إعادة المحاولة تلقائيًا عند عودة الاتصال بعد فشل التحميل
  useEffect(() => {
    if (online && dataState === 'error') void reload();
  }, [online, dataState, reload]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut({ scope: 'local' });
    setRecovery(false);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      booting, session, profile, settings, dataState, recovery,
      clearRecovery: () => setRecovery(false),
      reload, setProfile, setSettings, signOut,
    }),
    [booting, session, profile, settings, dataState, recovery, reload, signOut]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth outside provider');
  return c;
}
