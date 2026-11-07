import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { useI18n } from './i18n';
import { isConfigured, supabase } from './lib/supabase';
import { AuthScreens, RecoveryScreen } from './screens/AuthScreens';
import { Logo } from './screens/Common';
import { Shell } from './screens/Shell';

function Center({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell">
      <section className="auth-card stack center">{children}</section>
    </main>
  );
}

export default function App() {
  const { t } = useI18n();
  const { booting, session, profile, dataState, recovery, reload, signOut } = useAuth();

  if (!isConfigured) {
    return (
      <Center>
        <Logo />
        <h1>{t('setupTitle')}</h1>
        <p>{t('setupBody')}</p>
      </Center>
    );
  }

  if (booting) return <Center><Logo /><p>{t('loading')}</p></Center>;
  if (recovery && session) return <RecoveryScreen />;
  if (!session) return <AuthScreens />;

  if (dataState === 'idle' || dataState === 'loading') return <Center><Logo /><p>{t('loading')}</p></Center>;

  if (dataState === 'error' || !profile) {
    return (
      <Center>
        <Logo />
        <h1>{t('profileLoadFailed')}</h1>
        <button className="btn primary" onClick={() => void reload()}>{t('retry')}</button>
        <button className="btn" onClick={() => void signOut()}>{t('logout')}</button>
      </Center>
    );
  }

  if (profile.is_deactivated) {
    return (
      <Center>
        <Logo />
        <h1>{t('deactivatedTitle')}</h1>
        <p>{t('deactivatedBody')}</p>
        <button
          className="btn primary"
          onClick={async () => {
            const { error } = await supabase.rpc('set_account_deactivated', { p_value: false });
            if (!error) await reload();
          }}
        >
          {t('reactivate')}
        </button>
        <button className="btn" onClick={() => void signOut()}>{t('logout')}</button>
      </Center>
    );
  }

  return <Shell />;
}
