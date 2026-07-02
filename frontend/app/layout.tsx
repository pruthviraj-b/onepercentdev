import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '1% Developer Academy',
  description: 'Companion app for courses by shyamiscoding. Notes, code, and video all in one dashboard.',
  openGraph: {
    title: '1% Developer Academy',
    description: 'Master specialized technology disciplines from fundamentals up to real-world cloud architectures.',
    type: 'website',
    locale: 'en_IN',
    siteName: '1% Developer Academy',
  },
  twitter: {
    card: 'summary_large_image',
    title: '1% Developer Academy',
    description: 'Master specialized technology disciplines from fundamentals up to real-world cloud architectures.',
  }
};

import { AuthProvider } from '@/components/AuthProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Viewport meta for proper mobile scaling */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        {/* Theme color for mobile browser chrome */}
        <meta name="theme-color" content="#f1be3e" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
