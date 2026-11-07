import { useState } from 'react';
import { useI18n, type TKey } from '../i18n';
import { useOnline } from '../lib/online';
import { Settings } from './Settings';

type NavId = 'chats' | 'communities' | 'calls' | 'stories' | 'discover' | 'ai' | 'cloud' | 'settings';

interface NavItem {
  id: NavId;
  label: TKey;
  icon: string;
  phase?: number; // المرحلة التي سيُبنى فيها القسم؛ بدون قيمة = يعمل الآن
}

const NAV: NavItem[] = [
  { id: 'chats', label: 'navChats', icon: 'M4 5h16v11H9l-5 4V5z', phase: 2 },
  { id: 'communities', label: 'navCommunities', icon: 'M8 11a3 3 0 100-6 3 3 0 000 6zm8 0a3 3 0 100-6 3 3 0 000 6zM2 20c0-3 3-5 6-5s6 2 6 5M14 15c3 0 8 1 8 5', phase: 4 },
  { id: 'calls', label: 'navCalls', icon: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z', phase: 5 },
  { id: 'stories', label: 'navStories', icon: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 5v8M8 12h8', phase: 6 },
  { id: 'discover', label: 'navDiscover', icon: 'M12 3a9 9 0 100 18 9 9 0 000-18zm3.5 5.5l-2 5-5 2 2-5 5-2z', phase: 6 },
  { id: 'ai', label: 'navAi', icon: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z', phase: 7 },
  { id: 'cloud', label: 'navCloud', icon: 'M7 18a4 4 0 01-.5-8A6 6 0 0118 11a3.5 3.5 0 010 7H7z', phase: 3 },
  { id: 'settings', label: 'navSettings', icon: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M6 15v4' },
];

function Icon({ d }: { d: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function ComingSoon({ item }: { item: NavItem }) {
  const { t } = useI18n();
  return (
    <section className="page">
      <h2>{t(item.label)}</h2>
      <div className="card empty">
        <span className="badge">{t('soon')}</span>
        <h3>{t('soonTitle')}</h3>
        <p>{t('soonBody', { n: item.phase ?? 0 })}</p>
      </div>
    </section>
  );
}

export function Shell() {
  const { t } = useI18n();
  const online = useOnline();
  const [active, setActive] = useState<NavId>('settings');
  const item = NAV.find((n) => n.id === active) ?? NAV[NAV.length - 1];

  const button = (n: NavItem) => (
    <button
      key={n.id}
      className={`nav-btn${n.id === active ? ' active' : ''}`}
      aria-current={n.id === active ? 'page' : undefined}
      onClick={() => setActive(n.id)}
    >
      <Icon d={n.icon} />
      <span>{t(n.label)}</span>
      {n.phase ? <i className="dot" aria-label={t('soon')} /> : null}
    </button>
  );

  return (
    <div className="app">
      <nav className="rail" aria-label="MAS CONNECT">
        <div className="rail-title">MAS CONNECT</div>
        {NAV.map(button)}
      </nav>

      <div className="content">
        {!online && <div className="banner" role="status">{t('offline')}</div>}
        {item.id === 'settings' ? <Settings /> : <ComingSoon item={item} />}
      </div>

      <nav className="tabbar" aria-label="MAS CONNECT">
        {NAV.map(button)}
      </nav>
    </div>
  );
}
