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
      <div className="container flex h-16 items-center">
        {/* Mobile hamburger menu */}
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        
        {/* Desktop Logo and Nav */}
        <div className="mr-4 hidden md:flex items-center">
           <Link href={`/${locale}`} className="mr-6 flex items-center">
             <Image src="/logo-light.svg" alt="Gluten Scan Logo" width={150} height={38} className="h-10 w-auto dark:hidden" />
             <Image src="/logo-dark.svg" alt="Gluten Scan Logo" width={150} height={38} className="h-10 w-auto hidden dark:block" />
           </Link>
           <nav className="flex items-center gap-4 text-sm lg:gap-6">
             {mainNavLinks.map((link: NavLink) => {
               // Hide Admin link from the main top nav, it can stay in the sidebar for mobile
               if (link.href === '/admin') return null;

               const localizedHref = `/${locale}${link.href === '/' ? '' : link.href}`;
               const isActive = link.href === '/' ? pathname === `/${locale}` : pathname.startsWith(localizedHref);
               
               return (
                 <Link
                   key={link.href}
                   href={localizedHref}
                   className={cn(
                     "transition-colors hover:text-foreground/80",
                     isActive ? "text-foreground font-semibold" : "text-foreground/60"
                   )}
                 >
                   {link.label}
                 </Link>
               );
             })}
           </nav>
        </div>

        {/* Mobile Logo */}
        <div className="flex justify-center md:hidden flex-1">
             <Link href={`/${locale}`}>
                <Image src="/logo-light.svg" alt="Gluten Scan Logo" width={120} height={30} className="h-8 w-auto dark:hidden" />
                <Image src="/logo-dark.svg" alt="Gluten Scan Logo" width={120} height={30} className="h-8 w-auto hidden dark:block" />
             </Link>
        </div>

        <div className="flex items-center justify-end space-x-2 md:flex-1">
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            {/* You could add a user menu here in the future */}
          </div>
        </div>
      </div>
    </header>
  );
}
