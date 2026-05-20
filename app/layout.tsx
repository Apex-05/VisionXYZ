import type { Metadata, Viewport } from 'next';
import { PWAInit } from '@/components/PWA/PWAInit';
import './globals.css';

export const metadata: Metadata = {
  title: 'VisionXYZ',
  description:
    'Real-time computational photography and AI vision system running entirely on your device. Zero cloud. Zero uploads.',
  keywords: ['AI camera', 'edge AI', 'computational photography', 'privacy', 'WebGPU', 'ONNX'],
  authors: [{ name: 'VoxVision' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
  openGraph: {
    title: 'VisionXYZ',
    description: 'Privacy-first edge AI camera. All processing on your device.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-black">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full overflow-hidden bg-black">
        {children}
        <PWAInit />
      </body>
    </html>
  );
}
