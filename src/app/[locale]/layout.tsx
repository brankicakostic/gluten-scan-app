
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css'; // Adjusted path
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// This function is needed for static site generation (SSG) if you plan to pre-render locales.
export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'sr' }];
}

// Metadata can be dynamic based on locale if needed
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  // Example: Dynamically set title based on locale
  // You would typically fetch translations for this
  const title = params.locale === 'sr' ? 'Gluten Sken' : 'Gluten Scan';
  return {
    title: title,
    description: params.locale === 'sr' ? 'Lako skenirajte i identifikujte proizvode bez glutena.' : 'Scan and identify gluten-free products easily.',
  };
}


export default function LocaleLayout({
  children,
  params: { locale }
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  return (
    <html lang={locale} suppressHydrationWarning> {/* suppressHydrationWarning might be needed if lang mismatch causes issues initially */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SidebarProvider defaultOpen={true}>
          {children}
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
