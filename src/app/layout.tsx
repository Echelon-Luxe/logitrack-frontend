import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { Providers } from '@/components/providers';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });

// Headings. Cabinet Grotesk is self-hosted from Fontshare (ITF Free Font
// License, commercial use allowed).
const cabinet = localFont({
  src: [
    { path: './fonts/CabinetGrotesk-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/CabinetGrotesk-700.woff2', weight: '700', style: 'normal' },
    { path: './fonts/CabinetGrotesk-800.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-cabinet',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'LogiTrack', template: '%s · LogiTrack' },
  description: 'Delivery tracking and logistics operations',
};

export const viewport: Viewport = { themeColor: '#f4f4f4', colorScheme: 'light' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${cabinet.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
