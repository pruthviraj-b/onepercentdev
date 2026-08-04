'use client';

import { Icon } from '@/design-system/icons/Icon';
import { useNavigation } from './NavigationProvider';
import { navigationSections } from './navigation';
import type { ShellSection } from './types';

export function Sidebar({ activeSection, onNavigate }: { activeSection?: ShellSection; onNavigate?: (section: ShellSection) => void }) {
  const { sidebarOpen, sidebarPinned, setSidebarPinned, setSidebarOpen } = useNavigation();
  return <><aside className={`shell-sidebar ${sidebarOpen ? 'is-open' : 'is-collapsed'}`} aria-label="Primary navigation"><div className="shell-sidebar__scroll">{navigationSections.map((section) => <section className="shell-nav-section" key={section.label}><h2>{section.label}</h2>{section.items.map((item) => <button className={`shell-nav-item ${activeSection === item.id ? 'is-active' : ''}`} key={item.id} type="button" aria-current={activeSection === item.id ? 'page' : undefined} title={!sidebarOpen ? item.label : undefined} onClick={() => onNavigate?.(item.id)}><Icon name={item.icon} /><span>{item.label}</span>{item.id === 'learning' && <small>3</small>}</button>)}</section>)}</div><div className="shell-sidebar__footer"><button className="shell-nav-item" type="button" onClick={() => setSidebarPinned(!sidebarPinned)}><Icon name="lock" /><span>{sidebarPinned ? 'Pinned' : 'Pin sidebar'}</span></button><button className="shell-nav-item shell-mobile-close" type="button" onClick={() => setSidebarOpen(false)}><Icon name="close" /><span>Close</span></button></div></aside>{sidebarOpen && <button className="shell-sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}</>;
}
