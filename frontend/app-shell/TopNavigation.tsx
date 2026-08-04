'use client';

import { Icon } from '@/design-system/icons/Icon';
import { useNavigation } from './NavigationProvider';

export function TopNavigation({ currentCourse, currentLesson, onProfile }: { currentCourse?: string; currentLesson?: string; onProfile?: () => void }) {
  const { sidebarOpen, setSidebarOpen, setSearchOpen, setCommandOpen, setNotificationsOpen, notificationsOpen } = useNavigation();
  return <header className="shell-topbar" role="banner">
    <div className="shell-topbar__left"><button className="shell-icon-button shell-menu-button" type="button" aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} onClick={() => setSidebarOpen(!sidebarOpen)}><Icon name="menu" /></button><a className="shell-brand" href="/" aria-label="1% Dev Academy home"><span className="shell-brand__mark">1%</span><span className="shell-brand__name">Dev Academy</span></a></div>
    <div className="shell-topbar__course" aria-live="polite">{currentCourse && <><span>{currentCourse}</span>{currentLesson && <><span className="shell-muted">/</span><span className="shell-muted">{currentLesson}</span></>}</>}</div>
    <div className="shell-topbar__actions"><button className="shell-search-trigger" type="button" onClick={() => setCommandOpen(true)}><Icon name="search" /><span>Search</span><kbd>⌘ K</kbd></button><button className="shell-icon-button" type="button" aria-label="Open global search" onClick={() => setSearchOpen(true)}><Icon name="search" /></button><button className={`shell-icon-button ${notificationsOpen ? 'is-active' : ''}`} type="button" aria-label="Open notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)}><Icon name="notifications" /><span className="shell-notification-dot" /></button><button className="shell-icon-button" type="button" aria-label="Open AI assistant"><Icon name="ai" /></button><button className="shell-avatar" type="button" aria-label="Open profile menu" onClick={onProfile}>P</button></div>
  </header>;
}
