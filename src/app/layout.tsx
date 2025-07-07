
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

// This is the root layout. It must define <html> and <body>.
export const metadata: Metadata = {
  title: 'Gluten Scan', // Generic title, will be overridden by locale-specific layout
  description: 'Scan and identify gluten-free products easily.',
  manifest: '/manifest.json', // Added for PWA support
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
    // The lang attribute is hardcoded to "en" for now to ensure a valid HTML structure.
    // suppressHydrationWarning is crucial for next-themes to work without errors.
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
