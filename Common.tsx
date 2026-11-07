import { useState, type FormEvent, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useI18n, type TKey } from '../i18n';

export function Logo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2F6BFF" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#lg)" />
      <circle cx="25" cy="32" r="12" fill="none" stroke="#fff" strokeWidth="4.5" />
      <circle cx="39" cy="32" r="12" fill="none" stroke="#fff" strokeWidth="4.5" />
    </svg>
  );
}

export function mapAuthError(message: string | undefined): TKey {
  const m = (message ?? '').toLowerCase();
  if (m.includes('invalid login')) return 'badCredentials';
  if (m.includes('already registered') || m.includes('already been registered')) return 'emailTaken';
  if (m.includes('not confirmed')) return 'emailNotConfirmed';
  if (m.includes('fetch') || m.includes('network')) return 'offline';
  if (m.includes('password') && m.includes('characters')) return 'passwordMin';
  return 'genericError';
}

export function Field(props: {
  label: string;
  hint?: string;
  children: ReactNode;
  htmlFor: string;
}) {
  return (
    <div className="field">
      <label htmlFor={props.htmlFor}>{props.label}</label>
      {props.children}
      {props.hint ? <small>{props.hint}</small> : null}
    </div>
  );
}

export function Message({ kind, children }: { kind: 'error' | 'ok'; children: ReactNode }) {
  return (
    <p className={`msg ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  );
}

// نموذج تغيير كلمة المرور — يُستخدم في الاستعادة وفي الإعدادات
export function PasswordForm({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<TKey | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (pw.length < 8) return setErr('passwordMin');
    if (pw !== pw2) return setErr('passwordMismatch');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr(mapAuthError(error.message));
    setPw('');
    setPw2('');
    onDone();
  }

  return (
    <form onSubmit={submit} className="stack">
      <Field label={t('newPassword')} htmlFor="np1">
        <input id="np1" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
      </Field>
      <Field label={t('confirmPassword')} htmlFor="np2">
        <input id="np2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
      </Field>
      {err ? <Message kind="error">{t(err)}</Message> : null}
      <button className="btn primary" disabled={busy}>{t('savePassword')}</button>
    </form>
  );
}
