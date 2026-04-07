import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SK선경어학원 재시험 시스템',
  description: 'Online Retake Test Platform',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
