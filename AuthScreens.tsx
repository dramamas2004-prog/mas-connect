import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useI18n, type TKey } from '../i18n';
import { Field, Logo, Message, PasswordForm, mapAuthError } from './Common';
import { useAuth } from '../AuthProvider';

type Mode = 'login' | 'signup' | 'forgot';
const USERNAME_RE = /^[a-z0-9_]{3,24}$/;

export function AuthScreens() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameState, setUsernameState] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<TKey | null>(null);
  const [info, setInfo] = useState<TKey | null>(null);

  // فحص توفر اسم المستخدم أثناء الكتابة (مؤجل 400ms)
  useEffect(() => {
    if (mode !== 'signup' || username === '') return setUsernameState('idle');
    if (!USERNAME_RE.test(username)) return setUsernameState('invalid');
    setUsernameState('checking');
    const id = setTimeout(async () => {
      const { data, error } = await supabase.rpc('is_username_available', { p_username: username });
      if (error) return setUsernameState('idle');
      setUsernameState(data ? 'ok' : 'taken');
    }, 400);
    return () => clearTimeout(id);
  }, [username, mode]);

  function switchMode(m: Mode) {
    setMode(m);
    setErr(null);
    setInfo(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    const redirect = window.location.origin + window.location.pathname;

    if (mode === 'forgot') {
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirect });
      setBusy(false);
      if (error && mapAuthError(error.message) === 'offline') return setErr('offline');
      return setInfo('resetSent');
    }

    if (mode === 'signup') {
      if (!displayName.trim()) return setErr('genericError');
      if (!USERNAME_RE.test(username)) return setErr('usernameInvalid');
      if (usernameState === 'taken') return setErr('usernameTaken');
      if (password.length < 8) return setErr('passwordMin');
      setBusy(true);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { username, display_name: displayName.trim() }, emailRedirectTo: redirect },
      });
      setBusy(false);
      if (error) return setErr(mapAuthError(error.message));
      // بريد مسجل مسبقًا مع تفعيل تأكيد البريد: Supabase يعيد مستخدمًا بدون هويات
      if (data.user && data.user.identities && data.user.identities.length === 0) return setErr('emailTaken');
      if (!data.session) return setInfo('confirmEmail');
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setErr(mapAuthError(error.message));
  }

  const usernameHint =
    usernameState === 'taken' ? t('usernameTaken')
    : usernameState === 'invalid' ? t('usernameInvalid')
    : usernameState === 'ok' ? '✓'
    : t('usernameHint');

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand">
          <Logo />
          <h1>MAS CONNECT</h1>
          <p>{t('tagline')}</p>
        </div>

        <form onSubmit={submit} className="stack" noValidate>
          {mode === 'signup' && (
            <>
              <Field label={t('displayName')} htmlFor="dn">
                <input id="dn" value={displayName} maxLength={60} autoComplete="name" onChange={(e) => setDisplayName(e.target.value)} />
              </Field>
              <Field label={t('username')} htmlFor="un" hint={usernameHint}>
                <input
                  id="un" dir="ltr" value={username} autoCapitalize="none" autoComplete="username" maxLength={24}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                />
              </Field>
            </>
          )}

          <Field label={t('email')} htmlFor="em">
            <input id="em" type="email" dir="ltr" value={email} autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
          </Field>

          {mode !== 'forgot' && (
            <Field label={t('password')} htmlFor="pw">
              <input
                id="pw" type="password" dir="ltr" value={password}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          )}

          {err ? <Message kind="error">{t(err)}</Message> : null}
          {info ? <Message kind="ok">{t(info)}</Message> : null}

          <button className="btn primary" disabled={busy}>
            {mode === 'login' ? t('login') : mode === 'signup' ? t('signup') : t('sendReset')}
          </button>
        </form>

        <div className="auth-links">
          {mode === 'login' && (
            <>
              <button className="link" onClick={() => switchMode('forgot')}>{t('forgot')}</button>
              <span>{t('noAccount')} <button className="link" onClick={() => switchMode('signup')}>{t('signup')}</button></span>
            </>
          )}
          {mode === 'signup' && (
            <span>{t('haveAccount')} <button className="link" onClick={() => switchMode('login')}>{t('login')}</button></span>
          )}
          {mode === 'forgot' && (
            <button className="link" onClick={() => switchMode('login')}>{t('backToLogin')}</button>
          )}
        </div>
      </section>
    </main>
  );
}

// تظهر بعد الضغط على رابط استعادة كلمة المرور من البريد
export function RecoveryScreen() {
  const { t } = useI18n();
  const { clearRecovery } = useAuth();
  const [done, setDone] = useState(false);

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand">
          <Logo />
          <h1>{t('newPassword')}</h1>
        </div>
        {done ? (
          <>
            <Message kind="ok">{t('passwordChanged')}</Message>
            <button className="btn primary" onClick={clearRecovery}>{t('login')}</button>
          </>
        ) : (
          <PasswordForm onDone={() => setDone(true)} />
        )}
      </section>
    </main>
  );
}
