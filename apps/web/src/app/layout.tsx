import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  // Avoid eager preload for monospace; it is not needed for first paint and triggers
  // Chrome "preloaded but not used" when the home shell is mostly `font-sans`.
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: 'Leucent · Synchronous technical interviews',
    template: '%s · Leucent',
  },
  description:
    'Leucent runs synchronous, observable technical interviews — a real IDE and system-design canvas for the candidate, a live console for the interviewer, and perfect playback after the fact.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-surface-950 font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
