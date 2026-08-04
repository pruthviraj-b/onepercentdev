'use client';
import { Icon } from '@/design-system/icons/Icon';
import { useState } from 'react';
const actions = [{ label: 'Open AI', icon: 'ai' as const }, { label: 'New note', icon: 'lesson' as const }, { label: 'Quick search', icon: 'search' as const }, { label: 'Resume lesson', icon: 'play' as const }];
export function QuickActions() { const [open, setOpen] = useState(false); return <div className={`shell-quick-actions ${open ? 'is-open' : ''}`}><div className="shell-quick-actions__menu">{actions.map((action) => <button type="button" key={action.label} onClick={() => setOpen(false)}><Icon name={action.icon} /><span>{action.label}</span></button>)}</div><button className="shell-quick-actions__trigger" type="button" aria-label="Open quick actions" aria-expanded={open} onClick={() => setOpen(!open)}><Icon name={open ? 'close' : 'ai'} /></button></div>; }
