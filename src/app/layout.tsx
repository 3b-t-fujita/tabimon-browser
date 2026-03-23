import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'タビモン',
  description: 'スマホブラウザゲーム タビモン',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
