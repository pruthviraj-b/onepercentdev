'use client';

import type { ReactNode } from 'react';
import { CommandPalette } from './CommandPalette';
import { GlobalSearch } from './GlobalSearch';
import { NavigationProvider, useNavigation } from './NavigationProvider';
import { NotificationCenter } from './NotificationCenter';
import { QuickActions } from './QuickActions';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { TopNavigation } from './TopNavigation';
import { Breadcrumbs } from './Breadcrumbs';
import type { BreadcrumbItem, ShellRole, ShellSection } from './types';

function ShellFrame({ children, role, breadcrumbs, activeSection, currentCourse, currentLesson }: { children: ReactNode; role: ShellRole; breadcrumbs?: BreadcrumbItem[]; activeSection?: ShellSection; currentCourse?: string; currentLesson?: string }) { const navigation = useNavigation(); return <div className={`app-shell-frame app-shell-frame--${role}`}><TopNavigation currentCourse={currentCourse} currentLesson={currentLesson} /><Sidebar activeSection={activeSection} onNavigate={(section) => navigation.setActiveSection(section)} /><NotificationCenter /><main className="app-shell-frame__main" id="main-content" tabIndex={-1}>{breadcrumbs && <Breadcrumbs items={breadcrumbs} />} {children}</main><QuickActions /><StatusBar /><GlobalSearch /><CommandPalette /></div>; }
export function AppShell({ children, role = 'authenticated', breadcrumbs, activeSection, currentCourse, currentLesson }: { children: ReactNode; role?: ShellRole; breadcrumbs?: BreadcrumbItem[]; activeSection?: ShellSection; currentCourse?: string; currentLesson?: string }) { return <NavigationProvider><ShellFrame role={role} breadcrumbs={breadcrumbs} activeSection={activeSection} currentCourse={currentCourse} currentLesson={currentLesson}>{children}</ShellFrame></NavigationProvider>; }
