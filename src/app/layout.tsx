
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

// This is the root layout. It must define <html> and <body>.
export const metadata: Metadata = {
  title: 'Gluten Scan', // Generic title, will be overridden by locale-specific layout
  description: 'Scan and identify gluten-free products easily.',
};

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The lang attribute is intentionally omitted here to avoid hardcoding a wrong value.
    // The dynamic locale from the URL cannot be accessed in this root layout with the current file structure.
    <html>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
