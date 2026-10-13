import localFont from 'next/font/local';

// Display face for the landing page only; the app keeps Inter throughout.
// Cabinet Grotesk is self-hosted from Fontshare (ITF Free Font License,
// commercial use allowed).
const cabinet = localFont({
  src: [
    { path: '../fonts/CabinetGrotesk-500.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/CabinetGrotesk-700.woff2', weight: '700', style: 'normal' },
    { path: '../fonts/CabinetGrotesk-800.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-cabinet',
  display: 'swap',
});

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${cabinet.variable} min-h-dvh bg-white text-lp-ink`}>{children}</div>;
}
