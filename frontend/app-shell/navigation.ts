import type { IconName } from '@/design-system/icons/Icon';
import type { ShellSection } from './types';

export type NavigationItem = { id: ShellSection; label: string; icon: IconName; href?: string; children?: NavigationItem[] };
export const navigationSections: { label: string; items: NavigationItem[] }[] = [
  { label: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/' }] },
  { label: 'Learn', items: [
    { id: 'learning', label: 'My Learning', icon: 'courses' }, { id: 'courses', label: 'Courses', icon: 'courses' },
    { id: 'reader', label: 'Reader', icon: 'reader' }, { id: 'assignments', label: 'Assignments', icon: 'quiz' },
    { id: 'certificates', label: 'Certificates', icon: 'certificates' },
  ] },
  { label: 'Workspace', items: [
    { id: 'community', label: 'Community', icon: 'community' }, { id: 'career', label: 'Career', icon: 'career' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics' }, { id: 'bookmarks', label: 'Bookmarks', icon: 'star' },
    { id: 'notes', label: 'Notes', icon: 'lesson' }, { id: 'history', label: 'History', icon: 'reader' },
  ] },
  { label: 'System', items: [{ id: 'settings', label: 'Settings', icon: 'settings' }, { id: 'admin', label: 'Admin', icon: 'admin' }, { id: 'instructor', label: 'Instructor', icon: 'teacher' }] },
];
