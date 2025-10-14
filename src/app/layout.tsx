import type { ReactNode } from 'react';
import { Suspense } from 'react';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='zh-Hant'>
      <body>
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  );
}

