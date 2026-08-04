import type { ReactNode } from 'react';

export type ShellRole = 'authenticated' | 'guest' | 'admin' | 'instructor' | 'student' | 'enterprise' | 'landing';
export type ShellSection = 'dashboard' | 'marketplace' | 'learning' | 'courses' | 'reader' | 'assignments' | 'certificates' | 'community' | 'career' | 'analytics' | 'downloads' | 'bookmarks' | 'notes' | 'history' | 'settings' | 'admin' | 'instructor';
export type BreadcrumbItem = { label: string; href?: string };
export type ShellLayoutProps = { children: ReactNode; breadcrumbs?: BreadcrumbItem[]; title?: string; activeSection?: ShellSection; currentCourse?: string; currentLesson?: string };
