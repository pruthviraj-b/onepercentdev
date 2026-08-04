import type { ReactNode } from 'react';
import { AppShell } from './AppShell';
import type { ShellLayoutProps } from './types';

export function AuthenticatedLayout({ children, ...props }: ShellLayoutProps) { return <AppShell role="authenticated" {...props}>{children}</AppShell>; }
export function GuestLayout({ children, ...props }: ShellLayoutProps) { return <AppShell role="guest" {...props}>{children}</AppShell>; }
export function AdminLayout({ children, ...props }: ShellLayoutProps) { return <AppShell role="admin" activeSection="admin" {...props}>{children}</AppShell>; }
export function InstructorLayout({ children, ...props }: ShellLayoutProps) { return <AppShell role="instructor" activeSection="instructor" {...props}>{children}</AppShell>; }
export function StudentLayout({ children, ...props }: ShellLayoutProps) { return <AppShell role="student" {...props}>{children}</AppShell>; }
export function EnterpriseLayout({ children, ...props }: ShellLayoutProps) { return <AppShell role="enterprise" {...props}>{children}</AppShell>; }
export function LandingLayout({ children, ...props }: ShellLayoutProps) { return <AppShell role="landing" {...props}>{children}</AppShell>; }

export function DashboardLayout({ children, ...props }: ShellLayoutProps) { return <AuthenticatedLayout activeSection="dashboard" {...props}>{children}</AuthenticatedLayout>; }
export function ReaderLayout({ children, ...props }: ShellLayoutProps) { return <AuthenticatedLayout activeSection="reader" {...props}>{children}</AuthenticatedLayout>; }
export function MarketplaceLayout({ children, ...props }: ShellLayoutProps) { return <AuthenticatedLayout activeSection="courses" {...props}>{children}</AuthenticatedLayout>; }
export function CheckoutLayout({ children, ...props }: ShellLayoutProps) { return <AuthenticatedLayout {...props}>{children}</AuthenticatedLayout>; }
export function ProfileLayout({ children, ...props }: ShellLayoutProps) { return <AuthenticatedLayout activeSection="settings" {...props}>{children}</AuthenticatedLayout>; }
export function AnalyticsLayout({ children, ...props }: ShellLayoutProps) { return <AuthenticatedLayout activeSection="analytics" {...props}>{children}</AuthenticatedLayout>; }
export function CareerLayout({ children, ...props }: ShellLayoutProps) { return <AuthenticatedLayout activeSection="career" {...props}>{children}</AuthenticatedLayout>; }
export function CommunityLayout({ children, ...props }: ShellLayoutProps) { return <AuthenticatedLayout activeSection="community" {...props}>{children}</AuthenticatedLayout>; }
export function SettingsLayout({ children, ...props }: ShellLayoutProps) { return <AuthenticatedLayout activeSection="settings" {...props}>{children}</AuthenticatedLayout>; }
