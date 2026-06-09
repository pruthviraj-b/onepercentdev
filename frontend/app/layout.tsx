import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '1% Developer Academy — Python in Kannada',
  description: 'Beginner to 1% Developer Python series by shyamiscoding. Complete notes, code, and video for all 35 parts.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No Google Fonts — system fonts only (1997 style) */}
      </head>
      <body>{children}</body>
    </html>
  );
}
