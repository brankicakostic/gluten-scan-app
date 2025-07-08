'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, usePathname } from 'next/navigation'; // Added useParams
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { mainNavLinks, type NavLink } from './main-nav-links';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams(); // Get route params
  const locale = params.locale as string || 'sr'; // Default to 'sr' if locale is not in params

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href={`/${locale}`} className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          {/* Light Mode Logo */}
          <Image src="/logo-light.svg" alt="Gluten Scan Logo" width={150} height={38} className="w-auto h-10 dark:hidden" />
          {/* Dark Mode Logo */}
          <Image src="/logo-dark.svg" alt="Gluten Scan Logo" width={150} height={38} className="w-auto h-10 hidden dark:block" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {mainNavLinks.map((link: NavLink) => {
            // Ensure link hrefs are prefixed with the current locale
            const localizedHref = `/${locale}${link.href === '/' ? '' : link.href}`;
            // Check if current pathname matches the localized link href
            // For the homepage, a simple check against `/${locale}` is needed if link.href is '/'
            const isActive = link.href === '/' ? pathname === `/${locale}` : pathname.startsWith(localizedHref) && (link.href !== '/' || pathname === `/${locale}`);
            
            return (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={{ children: link.tooltip || link.label, className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                  className={cn(
                    isActive ? 
                    "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" :
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Link href={localizedHref}>
                    <link.icon />
                    <span>{link.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">
        <p className="text-xs text-sidebar-foreground/70">
          &copy; {new Date().getFullYear()} Gluten Scan
          <span className="mx-1">-</span>
          <Link href={`/${locale}/terms`} className="hover:underline">
            Uslovi korišćenja
          </Link>
          <span className="mx-1">-</span>
          <Link href={`/${locale}/privacy`} className="hover:underline">
            Privatnost
          </Link>
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
