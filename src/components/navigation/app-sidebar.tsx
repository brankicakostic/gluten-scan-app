
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { mainNavLinks, type NavLink } from './main-nav-links';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { ThemeToggle } from '../theme-toggle';
import { UserCircle, LogIn, LogOut } from 'lucide-react';

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string || 'sr';
  
  // Example: assuming no user is logged in for now
  const isLoggedIn = false; 

  const mainLinks = mainNavLinks.filter(link => !['/admin', '/history', '/favorites'].includes(link.href));
  const secondaryLinks = mainNavLinks.filter(link => ['/history', '/favorites'].includes(link.href));
  const adminLink = mainNavLinks.find(link => link.href === '/admin');

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4 flex justify-between items-center">
        <Link href={`/${locale}`} className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          {/* Light Mode Logo */}
          <Image src="/logo-light.svg" alt="Gluten Scan Logo" width={180} height={46} className="w-auto h-12 dark:hidden" />
          {/* Dark Mode Logo */}
          <Image src="/logo-dark.svg" alt="Gluten Scan Logo" width={180} height={46} className="w-auto h-12 hidden dark:block" />
        </Link>
         <div className="group-data-[collapsible=icon]:hidden">
           <ThemeToggle />
         </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {mainLinks.map((link: NavLink) => {
            const localizedHref = `/${locale}${link.href === '/' ? '' : link.href}`;
            const isActive = 
                (link.href === '/' && pathname === `/${locale}`) || 
                (link.href !== '/' && pathname.startsWith(localizedHref));
            
            return (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={{ children: link.tooltip || link.label, className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                  className={cn(
                    "text-base font-medium h-12", 
                    isActive ? 
                    "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" :
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

        <SidebarSeparator />

        <SidebarMenu>
          {secondaryLinks.map((link: NavLink) => {
            const localizedHref = `/${locale}${link.href}`;
            const isActive = pathname.startsWith(localizedHref);
            
            return (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={{ children: link.tooltip || link.label, className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                   className={cn(
                    "text-base font-medium h-12",
                    isActive ? "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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

      <SidebarFooter className="mt-auto space-y-2">
         {adminLink && (
           <>
            <SidebarSeparator />
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(`/${locale}${adminLink.href}`)}
                      tooltip={{ children: adminLink.tooltip || adminLink.label, className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                      className={cn(
                        "text-base font-medium h-12",
                        pathname.startsWith(`/${locale}${adminLink.href}`) ? "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Link href={`/${locale}${adminLink.href}`}>
                        <adminLink.icon />
                        <span>{adminLink.label}</span>
                      </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
           </>
         )}

         <SidebarSeparator />

         <div className="p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:py-2">
            {isLoggedIn ? (
                 <SidebarMenuButton tooltip={{children: "Podešavanja profila"}} className="h-12 w-full justify-start text-base font-medium">
                    <UserCircle /> <span>Moj Profil</span>
                </SidebarMenuButton>
            ) : (
                <SidebarMenuButton tooltip={{children: "Prijavi se"}} className="h-12 w-full justify-start text-base font-medium">
                    <LogIn /> <span>Prijavi se</span>
                </SidebarMenuButton>
            )}
         </div>

      </SidebarFooter>
    </Sidebar>
  );
}
