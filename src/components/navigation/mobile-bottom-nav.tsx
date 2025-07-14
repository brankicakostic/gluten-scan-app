

'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { bottomNavLinks } from './bottom-nav-links';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string || 'sr';

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border md:hidden">
      <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
        {bottomNavLinks.map((link) => {
          const localizedHref = `/${locale}${link.href === '/' ? '' : link.href}`;
          
          const isActive = link.href === '/' 
            ? pathname === `/${locale}` 
            : pathname.startsWith(localizedHref);

          return (
            <Link
              key={link.href}
              href={localizedHref}
              className={cn(
                'inline-flex flex-col items-center justify-center px-5 hover:bg-muted group transition-colors duration-150',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <link.icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
