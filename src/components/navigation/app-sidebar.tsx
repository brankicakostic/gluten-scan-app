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
          <Image src="/logo-light.svg" alt="Gluten Scan Logo" width={180} height={46} className="w-auto h-12 dark:hidden" />
          {/* Dark Mode Logo */}
          <Image src="/logo-dark.svg" alt="Gluten Scan Logo" width={180} height={46} className="w-auto h-12 hidden dark:block" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {mainNavLinks.map((link: NavLink) => {
            const localizedHref = `/${locale}${link.href === '/' ? '' : link.href}`;
            const isActive = (link.href === '/' && pathname === localizedHref) || (link.href !== '/' && pathname.startsWith(localizedHref));
            
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
