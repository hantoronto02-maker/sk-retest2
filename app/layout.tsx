import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SK 온라인 응시 시스템',
  description: 'SK선경어학원 온라인 응시 시스템',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
