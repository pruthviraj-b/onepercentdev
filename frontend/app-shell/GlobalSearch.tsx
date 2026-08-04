'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/design-system/icons/Icon';
import { useNavigation } from './NavigationProvider';

const searchTypes = ['Courses', 'Lessons', 'Modules', 'PDFs', 'Videos', 'Assignments', 'Certificates', 'Bookmarks', 'AI Chats', 'Community', 'Settings'];
export function GlobalSearch() { const { searchOpen, setSearchOpen } = useNavigation(); const [query, setQuery] = useState(''); const inputRef = useRef<HTMLInputElement>(null); useEffect(() => { if (searchOpen) inputRef.current?.focus(); }, [searchOpen]); if (!searchOpen) return null; return <div className="shell-overlay" role="dialog" aria-modal="true" aria-label="Global search" onMouseDown={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}><div className="shell-search-panel"><div className="shell-modal-search"><Icon name="search" /><input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search courses, lessons, notes..." aria-label="Search" /><kbd>ESC</kbd></div><p className="shell-panel-label">Search across your workspace</p><div className="shell-search-types">{searchTypes.map((type) => <button type="button" key={type} onClick={() => setQuery(`${type}: `)}><Icon name={type === 'Courses' ? 'courses' : 'search'} />{type}</button>)}</div><div className="shell-search-empty">{query ? <>No results yet for <strong>{query}</strong></> : 'Start typing to search your learning workspace.'}</div></div></div>; }
