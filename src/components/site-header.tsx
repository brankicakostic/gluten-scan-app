'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { mainNavLinks } from '@/components/navigation/main-nav-links';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params.locale as string) || 'sr';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-auto items-center py-3">
        
        {/* --- MOBILE HEADER --- */}
        <div className="relative flex w-full items-center justify-between md:hidden">
          <SidebarTrigger />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
             <Link href={`/${locale}`} className="inline-block">
              <Image src="/logo-light.svg" alt="Gluten Scan Logo" width={120} height={30} className="h-8 w-auto dark:hidden" />
              <Image src="/logo-dark.svg" alt="Gluten Scan Logo" width={120} height={30} className="h-8 w-auto hidden dark:block" />
            </Link>
          </div>
          <ThemeToggle />
        </div>

        {/* --- DESKTOP HEADER (Absolute Centering for Nav) --- */}
        <div className="hidden w-full items-center justify-between relative md:flex">
          {/* Left section for Logo */}
          <Link href={`/${locale}`} className="flex items-center">
            <Image src="/logo-light.svg" alt="Gluten Scan Logo" width={150} height={38} className="h-10 w-auto dark:hidden" />
            <Image src="/logo-dark.svg" alt="Gluten Scan Logo" width={150} height={38} className="h-10 w-auto hidden dark:block" />
          </Link>

          {/* Center section for Navigation */}
          <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
             <div className="flex items-center gap-4 text-sm lg:gap-6">
              {mainNavLinks.map((link) => {
                if (link.href === '/admin') return null;

                const localizedHref = `/${locale}${link.href === '/' ? '' : link.href}`;
                const isActive = (link.href === '/' && pathname === `/${locale}`) || (link.href !== '/' && pathname.startsWith(localizedHref) && link.href !== '/');
                
                return (
                  <Link
                    key={link.href}
                    href={localizedHref}
                    className={cn(
                      "transition-colors hover:text-foreground/80",
                      isActive ? "text-foreground font-semibold underline underline-offset-4 decoration-primary decoration-2" : "text-muted-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Right section for Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
