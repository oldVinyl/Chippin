import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Header, Footer } from '../components/shell';
import { RegisterWorker } from '../components/worker';
import './globals.css';
const fredoka = localFont({
  src: '../../node_modules/@fontsource/fredoka/files/fredoka-latin-500-normal.woff2',
  variable: '--font-heading',
  display: 'swap',
});
const nunito = localFont({
  src: '../../node_modules/@fontsource/nunito/files/nunito-latin-400-normal.woff2',
  variable: '--font-body',
  display: 'swap',
});
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000',
  ),
  title: {
    default: 'Chippin — good things happen together',
    template: '%s | Chippin',
  },
  description: 'Bring your people together, one MoMo contribution at a time.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/images/brand/favicon.svg',
    apple: '/images/brand/apple-touch-icon-180.png',
  },
  openGraph: {
    title: 'Good things happen when we chip in.',
    images: ['/images/brand/og-image.png'],
  },
};
export const viewport: Viewport = {
  themeColor: '#743014',
  width: 'device-width',
  initialScale: 1,
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <RegisterWorker />
      </body>
    </html>
  );
}
