
import type { Metadata, Viewport } from 'next';
import '../globals.css';
import 'leaflet/dist/leaflet.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import { FavoritesProvider } from '@/contexts/favorites-context';
import { ScanLimiterProvider } from '@/contexts/scan-limiter-context'; 
import { ThemeProvider } from '@/components/theme-provider';

// This function is needed for static site generation (SSG) if you plan to pre-render locales.
export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'sr' }];
}

// Metadata can be dynamic based on locale if needed
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const title = params.locale === 'sr' ? 'Gluten Detektiv' : 'Gluten Detective';
  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description: params.locale === 'sr' ? 'Lako skenirajte i identifikujte proizvode bez glutena.' : 'Scan and identify gluten-free products easily.',
  };
}

// Export viewport settings separately
export async function generateViewport({ params }: { params: { locale: string } }): Promise<Viewport> {
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: 'white' },
        { media: '(prefers-color-scheme: dark)', color: 'black' },
      ],
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
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider defaultOpen={true}>
        <FavoritesProvider>
          <ScanLimiterProvider> 
            {children}
          </ScanLimiterProvider>
        </FavoritesProvider>
      </SidebarProvider>
      <Toaster />
    </ThemeProvider>
  );
}
