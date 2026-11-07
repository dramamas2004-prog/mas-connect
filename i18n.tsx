import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const ar = {
  tagline: 'Connect Beyond Messages',
  email: 'البريد الإلكتروني',
  password: 'كلمة المرور',
  login: 'تسجيل الدخول',
  signup: 'إنشاء حساب',
  forgot: 'نسيت كلمة المرور؟',
  sendReset: 'إرسال رابط الاستعادة',
  resetSent: 'إن كان البريد مسجلًا لدينا فقد أرسلنا إليه رابط الاستعادة.',
  backToLogin: 'العودة لتسجيل الدخول',
  haveAccount: 'لديك حساب؟',
  noAccount: 'ليس لديك حساب؟',
  displayName: 'الاسم الظاهر',
  username: 'اسم المستخدم',
  usernameHint: 'حروف إنجليزية صغيرة وأرقام و _ (من 3 إلى 24)',
  usernameInvalid: 'اسم المستخدم غير صالح',
  usernameTaken: 'اسم المستخدم مستخدم بالفعل',
  confirmEmail: 'أرسلنا رابط تأكيد إلى بريدك. أكّد الحساب ثم سجّل الدخول.',
  passwordMin: 'كلمة المرور 8 أحرف على الأقل',
  passwordMismatch: 'كلمتا المرور غير متطابقتين',
  newPassword: 'كلمة المرور الجديدة',
  confirmPassword: 'تأكيد كلمة المرور',
  savePassword: 'حفظ كلمة المرور',
  passwordChanged: 'تم تغيير كلمة المرور',
  badCredentials: 'البريد أو كلمة المرور غير صحيحة',
  emailTaken: 'هذا البريد مسجّل بالفعل',
  emailNotConfirmed: 'أكّد بريدك الإلكتروني أولًا',
  genericError: 'حدث خطأ. حاول مرة أخرى.',
  offline: 'لا يوجد اتصال بالإنترنت. سنعيد المحاولة عند عودته.',
  loading: 'جارٍ التحميل…',
  retry: 'إعادة المحاولة',
  setupTitle: 'المشروع غير مربوط بـ Supabase',
  setupBody: 'أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY (ملف .env.local محليًا، أو GitHub Secrets عند البناء).',
  profileLoadFailed: 'تعذّر تحميل حسابك',

  deactivatedTitle: 'حسابك معطّل مؤقتًا',
  deactivatedBody: 'أعد تفعيل الحساب للعودة، أو سجّل الخروج.',
  reactivate: 'إعادة تفعيل الحساب',

  navChats: 'المحادثات',
  navCommunities: 'المجتمعات',
  navCalls: 'المكالمات',
  navStories: 'القصص',
  navDiscover: 'اكتشف',
  navAi: 'MAS AI',
  navCloud: 'MAS Cloud',
  navSettings: 'الإعدادات',
  soon: 'قريبًا',
  soonTitle: 'هذا القسم لم يُنفَّذ بعد',
  soonBody: 'سيتم بناؤه في المرحلة {n}. لا توجد بيانات تجريبية هنا.',

  profile: 'الملف الشخصي',
  masId: 'MAS ID',
  bio: 'نبذة تعريفية',
  statusText: 'الحالة',
  changePhoto: 'تغيير الصورة',
  photoFailed: 'تعذّر رفع الصورة. تأكد أنها صورة صالحة.',
  saveProfile: 'حفظ الملف الشخصي',
  saved: 'تم الحفظ',
  memberSince: 'تاريخ إنشاء الحساب',

  privacy: 'الخصوصية',
  privacyNote: 'تُحفظ هذه الإعدادات الآن، وتُطبَّق على المحادثات والقصص عند تفعيلها في المراحل القادمة.',
  lastSeen: 'من يرى آخر ظهور',
  readReceipts: 'إظهار حالة القراءة',
  whoCanMessage: 'من يستطيع مراسلتي',
  storyVisibility: 'من يرى قصصي',
  profileVisibility: 'من يرى ملفي الشخصي',
  everyone: 'الجميع',
  contacts: 'جهات اتصالي',
  nobody: 'لا أحد',
  phone: 'رقم الهاتف (اختياري)',
  phoneInvalid: 'رقم الهاتف غير صالح',

  notifications: 'الإشعارات',
  notifMessages: 'الرسائل',
  notifCalls: 'المكالمات',
  notifCommunities: 'المجتمعات والقنوات',
  notifStories: 'القصص',
  notifSocial: 'التفاعلات والتعليقات',

  appearance: 'المظهر',
  language: 'اللغة',
  theme: 'السمة',
  themeSystem: 'حسب الجهاز',
  themeLight: 'فاتح',
  themeDark: 'داكن',

  account: 'الحساب',
  changePassword: 'تغيير كلمة المرور',
  logout: 'تسجيل الخروج',
  logoutOthers: 'تسجيل الخروج من الأجهزة الأخرى',
  logoutOthersDone: 'تم تسجيل الخروج من الأجهزة الأخرى',
  deactivate: 'تعطيل الحساب مؤقتًا',
  deactivateConfirm: 'سيختفي حسابك من البحث حتى تعيد تفعيله. متابعة؟',
  deleteAccount: 'حذف الحساب نهائيًا',
  deleteConfirm: 'سيتم حذف حسابك وبياناتك نهائيًا ولا يمكن التراجع. اكتب DELETE للتأكيد:',
  cancel: 'إلغاء',
  confirm: 'تأكيد',
};

type Dict = typeof ar;

const en: Dict = {
  tagline: 'Connect Beyond Messages',
  email: 'Email',
  password: 'Password',
  login: 'Log in',
  signup: 'Create account',
  forgot: 'Forgot your password?',
  sendReset: 'Send reset link',
  resetSent: 'If that email is registered, we sent it a reset link.',
  backToLogin: 'Back to log in',
  haveAccount: 'Already have an account?',
  noAccount: "Don't have an account?",
  displayName: 'Display name',
  username: 'Username',
  usernameHint: 'Lowercase English letters, numbers and _ (3–24)',
  usernameInvalid: 'Invalid username',
  usernameTaken: 'That username is already taken',
  confirmEmail: 'We sent a confirmation link to your email. Confirm it, then log in.',
  passwordMin: 'Password must be at least 8 characters',
  passwordMismatch: "Passwords don't match",
  newPassword: 'New password',
  confirmPassword: 'Confirm password',
  savePassword: 'Save password',
  passwordChanged: 'Password changed',
  badCredentials: 'Wrong email or password',
  emailTaken: 'This email is already registered',
  emailNotConfirmed: 'Confirm your email first',
  genericError: 'Something went wrong. Try again.',
  offline: "You're offline. We'll retry when you're back.",
  loading: 'Loading…',
  retry: 'Try again',
  setupTitle: 'Project is not connected to Supabase',
  setupBody: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (.env.local locally, or GitHub Secrets for builds).',
  profileLoadFailed: "Couldn't load your account",

  deactivatedTitle: 'Your account is deactivated',
  deactivatedBody: 'Reactivate it to come back, or log out.',
  reactivate: 'Reactivate account',

  navChats: 'Chats',
  navCommunities: 'Communities',
  navCalls: 'Calls',
  navStories: 'Stories',
  navDiscover: 'Discover',
  navAi: 'MAS AI',
  navCloud: 'MAS Cloud',
  navSettings: 'Settings',
  soon: 'Soon',
  soonTitle: 'This section is not built yet',
  soonBody: 'It will be built in phase {n}. No demo data here.',

  profile: 'Profile',
  masId: 'MAS ID',
  bio: 'Bio',
  statusText: 'Status',
  changePhoto: 'Change photo',
  photoFailed: "Couldn't upload the photo. Make sure it's a valid image.",
  saveProfile: 'Save profile',
  saved: 'Saved',
  memberSince: 'Member since',

  privacy: 'Privacy',
  privacyNote: 'These are saved now and will apply to chats and stories once those phases ship.',
  lastSeen: 'Who sees my last seen',
  readReceipts: 'Show read receipts',
  whoCanMessage: 'Who can message me',
  storyVisibility: 'Who sees my stories',
  profileVisibility: 'Who sees my profile',
  everyone: 'Everyone',
  contacts: 'My contacts',
  nobody: 'Nobody',
  phone: 'Phone number (optional)',
  phoneInvalid: 'Invalid phone number',

  notifications: 'Notifications',
  notifMessages: 'Messages',
  notifCalls: 'Calls',
  notifCommunities: 'Communities and channels',
  notifStories: 'Stories',
  notifSocial: 'Reactions and comments',

  appearance: 'Appearance',
  language: 'Language',
  theme: 'Theme',
  themeSystem: 'System',
  themeLight: 'Light',
  themeDark: 'Dark',

  account: 'Account',
  changePassword: 'Change password',
  logout: 'Log out',
  logoutOthers: 'Log out of other devices',
  logoutOthersDone: 'Logged out of other devices',
  deactivate: 'Deactivate account',
  deactivateConfirm: "Your account will be hidden from search until you reactivate it. Continue?",
  deleteAccount: 'Delete account permanently',
  deleteConfirm: 'Your account and data will be deleted permanently. This cannot be undone. Type DELETE to confirm:',
  cancel: 'Cancel',
  confirm: 'Confirm',
};

export type Lang = 'ar' | 'en';
export type ThemePref = 'system' | 'light' | 'dark';
export type TKey = keyof Dict;

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: ThemePref;
  setTheme: (t: ThemePref) => void;
  t: (k: TKey, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx | null>(null);
const dicts: Record<Lang, Dict> = { ar, en };

function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return allowed.includes(v as T) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => read('mas.lang', ['ar', 'en'] as const, 'ar'));
  const [theme, setThemeState] = useState<ThemePref>(() =>
    read('mas.theme', ['system', 'light', 'dark'] as const, 'system')
  );

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('mas.lang', l); } catch { /* التخزين غير متاح */ }
  }, []);
  const setTheme = useCallback((t: ThemePref) => {
    setThemeState(t);
    try { localStorage.setItem('mas.theme', t); } catch { /* التخزين غير متاح */ }
  }, []);

  const value = useMemo<I18nCtx>(
    () => ({
      lang, setLang, theme, setTheme,
      t: (k, vars) => {
        let s: string = dicts[lang][k];
        if (vars) for (const [name, v] of Object.entries(vars)) s = s.replace(`{${name}}`, String(v));
        return s;
      },
    }),
    [lang, theme, setLang, setTheme]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useI18n outside provider');
  return c;
}
