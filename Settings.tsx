import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { resizeAvatar } from '../lib/image';
import { useAuth } from '../AuthProvider';
import { useI18n, type Lang, type TKey, type ThemePref } from '../i18n';
import { Field, Message, PasswordForm } from './Common';
import type { Settings as SettingsRow, Visibility } from '../types';

const USERNAME_RE = /^[a-z0-9_]{3,24}$/;
const PHONE_RE = /^\+?[0-9]{6,15}$/;

function Card({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="card stack">
      <h3>{title}</h3>
      {note ? <p className="note">{note}</p> : null}
      {children}
    </section>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="row toggle">
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function Choice<T extends string>(props: { label: string; value: T; options: { value: T; text: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="row">
      <span>{props.label}</span>
      <select value={props.value} onChange={(e) => props.onChange(e.target.value as T)}>
        {props.options.map((o) => <option key={o.value} value={o.value}>{o.text}</option>)}
      </select>
    </div>
  );
}

export function Settings() {
  const { t, lang, setLang, theme, setTheme } = useI18n();
  const { profile, settings, setProfile, setSettings, reload, signOut } = useAuth();

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number>();
  const say = (m: string) => {
    setToast(m);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  };
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  // ───── الملف الشخصي ─────
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [statusText, setStatusText] = useState(profile?.status_text ?? '');
  const [profileErr, setProfileErr] = useState<TKey | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ───── الهاتف ─────
  const [phone, setPhone] = useState(settings?.phone ?? '');
  const [phoneErr, setPhoneErr] = useState<TKey | null>(null);

  // ───── الحساب ─────
  const [showPw, setShowPw] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [busyAccount, setBusyAccount] = useState(false);

  if (!profile || !settings) return null;

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setProfileErr(null);
    if (!displayName.trim()) return setProfileErr('genericError');
    if (!USERNAME_RE.test(username)) return setProfileErr('usernameInvalid');
    setSavingProfile(true);
    const { data, error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim(), username, bio: bio.trim(), status_text: statusText.trim() })
      .eq('id', profile.id)
      .select('*')
      .single();
    setSavingProfile(false);
    if (error) {
      if (error.code === '23505') return setProfileErr('usernameTaken');
      if (error.code === '23514') return setProfileErr('usernameInvalid');
      return setProfileErr('genericError');
    }
    setProfile(data);
    say(t('saved'));
  }

  async function changePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !profile) return;
    setUploading(true);
    try {
      const blob = await resizeAvatar(file);
      const path = `${profile.id}/${Date.now()}.webp`;
      const up = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/webp' });
      if (up.error) throw up.error;
      const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      const { data, error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id).select('*').single();
      if (error) throw error;
      const old = profile.avatar_url?.split('/avatars/')[1];
      setProfile(data);
      if (old) void supabase.storage.from('avatars').remove([old]);
      say(t('saved'));
    } catch {
      say(t('photoFailed'));
    } finally {
      setUploading(false);
    }
  }

  async function saveSetting(patch: Partial<SettingsRow>) {
    if (!settings) return;
    const previous = settings;
    setSettings({ ...settings, ...patch });
    const { error } = await supabase.from('user_settings').update(patch).eq('id', settings.id);
    if (error) {
      setSettings(previous);
      say(t('genericError'));
    }
  }

  async function savePhone(e: FormEvent) {
    e.preventDefault();
    setPhoneErr(null);
    const value = phone.trim();
    if (value && !PHONE_RE.test(value)) return setPhoneErr('phoneInvalid');
    await saveSetting({ phone: value || null });
    say(t('saved'));
  }

  async function logoutOthers() {
    const { error } = await supabase.auth.signOut({ scope: 'others' });
    say(error ? t('genericError') : t('logoutOthersDone'));
  }

  async function deactivate() {
    if (!window.confirm(t('deactivateConfirm'))) return;
    setBusyAccount(true);
    const { error } = await supabase.rpc('set_account_deactivated', { p_value: true });
    setBusyAccount(false);
    if (error) return say(t('genericError'));
    await reload();
  }

  async function deleteAccount() {
    if (!profile || deleteText !== 'DELETE') return;
    setBusyAccount(true);
    try {
      const files = await supabase.storage.from('avatars').list(profile.id);
      if (files.data && files.data.length > 0) {
        await supabase.storage.from('avatars').remove(files.data.map((f) => `${profile.id}/${f.name}`));
      }
      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw error;
      await signOut();
    } catch {
      setBusyAccount(false);
      say(t('genericError'));
    }
  }

  const vis = (v: Visibility) => v;
  const visOptions: { value: Visibility; text: string }[] = [
    { value: 'everyone', text: t('everyone') },
    { value: 'contacts', text: t('contacts') },
    { value: 'nobody', text: t('nobody') },
  ];
  const joined = new Date(profile.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <section className="page">
      <h2>{t('navSettings')}</h2>

      <Card title={t('profile')}>
        <div className="profile-head">
          <div className="avatar" aria-hidden="true">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{profile.display_name.slice(0, 1).toUpperCase()}</span>}
          </div>
          <div>
            <div className="mas-id" dir="ltr">{profile.mas_id}</div>
            <small>{t('memberSince')}: {joined}</small>
            <label className="btn small">
              {uploading ? t('loading') : t('changePhoto')}
              <input type="file" accept="image/*" hidden disabled={uploading} onChange={changePhoto} />
            </label>
          </div>
        </div>

        <form className="stack" onSubmit={saveProfile} noValidate>
          <Field label={t('displayName')} htmlFor="s-dn">
            <input id="s-dn" value={displayName} maxLength={60} onChange={(e) => setDisplayName(e.target.value)} />
          </Field>
          <Field label={t('username')} htmlFor="s-un" hint={t('usernameHint')}>
            <input id="s-un" dir="ltr" value={username} maxLength={24} autoCapitalize="none" onChange={(e) => setUsername(e.target.value.toLowerCase())} />
          </Field>
          <Field label={t('statusText')} htmlFor="s-st">
            <input id="s-st" value={statusText} maxLength={80} onChange={(e) => setStatusText(e.target.value)} />
          </Field>
          <Field label={t('bio')} htmlFor="s-bio">
            <textarea id="s-bio" rows={3} value={bio} maxLength={200} onChange={(e) => setBio(e.target.value)} />
          </Field>
          {profileErr ? <Message kind="error">{t(profileErr)}</Message> : null}
          <button className="btn primary" disabled={savingProfile}>{t('saveProfile')}</button>
        </form>
      </Card>

      <Card title={t('privacy')} note={t('privacyNote')}>
        <Choice label={t('lastSeen')} value={vis(settings.last_seen)} options={visOptions} onChange={(v) => saveSetting({ last_seen: v })} />
        <Toggle label={t('readReceipts')} checked={settings.read_receipts} onChange={(v) => saveSetting({ read_receipts: v })} />
        <Choice label={t('whoCanMessage')} value={vis(settings.who_can_message)} options={visOptions} onChange={(v) => saveSetting({ who_can_message: v })} />
        <Choice label={t('storyVisibility')} value={vis(settings.story_visibility)} options={visOptions} onChange={(v) => saveSetting({ story_visibility: v })} />
        <Choice label={t('profileVisibility')} value={vis(settings.profile_visibility)} options={visOptions} onChange={(v) => saveSetting({ profile_visibility: v })} />
        <form className="stack" onSubmit={savePhone} noValidate>
          <Field label={t('phone')} htmlFor="s-ph">
            <input id="s-ph" dir="ltr" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          {phoneErr ? <Message kind="error">{t(phoneErr)}</Message> : null}
          <button className="btn">{t('saveProfile')}</button>
        </form>
      </Card>

      <Card title={t('notifications')}>
        <Toggle label={t('notifMessages')} checked={settings.notify_messages} onChange={(v) => saveSetting({ notify_messages: v })} />
        <Toggle label={t('notifCalls')} checked={settings.notify_calls} onChange={(v) => saveSetting({ notify_calls: v })} />
        <Toggle label={t('notifCommunities')} checked={settings.notify_communities} onChange={(v) => saveSetting({ notify_communities: v })} />
        <Toggle label={t('notifStories')} checked={settings.notify_stories} onChange={(v) => saveSetting({ notify_stories: v })} />
        <Toggle label={t('notifSocial')} checked={settings.notify_social} onChange={(v) => saveSetting({ notify_social: v })} />
      </Card>

      <Card title={t('appearance')}>
        <Choice<Lang> label={t('language')} value={lang} onChange={setLang} options={[{ value: 'ar', text: 'العربية' }, { value: 'en', text: 'English' }]} />
        <Choice<ThemePref> label={t('theme')} value={theme} onChange={setTheme} options={[
          { value: 'system', text: t('themeSystem') }, { value: 'light', text: t('themeLight') }, { value: 'dark', text: t('themeDark') },
        ]} />
      </Card>

      <Card title={t('account')}>
        <button className="btn" onClick={() => setShowPw((v) => !v)}>{t('changePassword')}</button>
        {showPw ? <PasswordForm onDone={() => { setShowPw(false); say(t('passwordChanged')); }} /> : null}
        <button className="btn" onClick={logoutOthers}>{t('logoutOthers')}</button>
        <button className="btn" onClick={() => void signOut()}>{t('logout')}</button>
        <hr />
        <button className="btn danger-outline" disabled={busyAccount} onClick={deactivate}>{t('deactivate')}</button>
        {!confirmingDelete ? (
          <button className="btn danger" onClick={() => setConfirmingDelete(true)}>{t('deleteAccount')}</button>
        ) : (
          <div className="stack">
            <p className="note">{t('deleteConfirm')}</p>
            <input dir="ltr" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} aria-label="DELETE" />
            <div className="row-actions">
              <button className="btn danger" disabled={deleteText !== 'DELETE' || busyAccount} onClick={deleteAccount}>{t('confirm')}</button>
              <button className="btn" onClick={() => { setConfirmingDelete(false); setDeleteText(''); }}>{t('cancel')}</button>
            </div>
          </div>
        )}
      </Card>

      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </section>
  );
}
