
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css'; // Adjusted path
import 'leaflet/dist/leaflet.css'; // Added Leaflet CSS
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import { FavoritesProvider } from '@/contexts/favorites-context';
import { ScanLimiterProvider } from '@/contexts/scan-limiter-context'; 

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
  const title = params.locale === 'sr' ? 'Gluten Detektiv' : 'Gluten Detective'; // Updated app name
  return {
    title: title,
    description: params.locale === 'sr' ? 'Lako skenirajte i identifikujte proizvode bez glutena.' : 'Scan and identify gluten-free products easily.',
    viewport: {
      width: 'device-width',
      initialScale: 1,
    },
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
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SidebarProvider defaultOpen={true}>
          <FavoritesProvider>
            <ScanLimiterProvider> 
              {children}
            </ScanLimiterProvider>
          </FavoritesProvider>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
