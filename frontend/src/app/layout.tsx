import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import '../styles/globals.css';
import { AuthProvider } from '@/lib/auth';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['500', '600', '700']
});
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Voyage — Travel Companion',
  description: 'Plan, explore, and remember every trip with an AI-powered travel companion.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Voyage'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#14213D'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-body text-navy antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
