'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { mainNavLinks, type NavLink } from '@/components/navigation/main-nav-links';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params.locale as string) || 'sr';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        
        {/* Left Section: Mobile trigger and full desktop nav */}
        <div className="flex items-center gap-6">
          <SidebarTrigger className="md:hidden" />
          <div className="hidden md:flex items-center gap-6">
            <Link href={`/${locale}`} className="flex items-center">
              <Image src="/logo-light.svg" alt="Gluten Scan Logo" width={150} height={38} className="h-10 w-auto dark:hidden" />
              <Image src="/logo-dark.svg" alt="Gluten Scan Logo" width={150} height={38} className="h-10 w-auto hidden dark:block" />
            </Link>
            <nav className="flex items-center gap-4 text-sm lg:gap-6">
              {mainNavLinks.map((link: NavLink) => {
                if (link.href === '/admin') return null;

                const localizedHref = `/${locale}${link.href === '/' ? '' : link.href}`;
                const isActive = link.href === '/' ? pathname === `/${locale}` : pathname.startsWith(localizedHref);
                
                return (
                  <Link
                    key={link.href}
                    href={localizedHref}
                    className={cn(
                      "transition-colors hover:text-foreground",
                      isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Center Section: Mobile Logo */}
        <div className="md:hidden">
          <Link href={`/${locale}`}>
            <Image src="/logo-light.svg" alt="Gluten Scan Logo" width={120} height={30} className="h-8 w-auto dark:hidden" />
            <Image src="/logo-dark.svg" alt="Gluten Scan Logo" width={120} height={30} className="h-8 w-auto hidden dark:block" />
          </Link>
        </div>
        
        {/* Right Section: Theme Toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>

      </div>
    </header>
  );
}
