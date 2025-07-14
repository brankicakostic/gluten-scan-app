

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
  useSidebar,
} from '@/components/ui/sidebar';
import { mainNavLinks, type NavLink } from './main-nav-links';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { ThemeToggle } from '../theme-toggle';
import { UserCircle, LogIn, LogOut, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';


export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { setOpenMobile } = useSidebar();
  const locale = params.locale as string || 'sr';
  
  const isLoggedIn = false; 

  const mainLinks = mainNavLinks.filter(link => ['/', '/products', '/events', '/recalls'].includes(link.href));
  const secondaryLinks = mainNavLinks.filter(link => ['/favorites', '/history'].includes(link.href));
  const adminLink = mainNavLinks.find(link => link.href === '/admin');

  const renderLink = (link: NavLink, isPrimary: boolean) => {
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
            "h-12 justify-start text-base font-medium relative",
            isActive ? 
            "bg-primary/10 text-primary font-semibold border-l-4 border-primary hover:bg-primary/20" :
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
          onClick={() => setOpenMobile(false)} // Close on link click
        >
          <Link href={localizedHref}>
            <link.icon className="h-5 w-5" />
            <span>{link.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4 flex justify-between items-center relative">
        <Link href={`/${locale}`} className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <Image src="/logo-light.svg" alt="Gluten Scan Logo" width={180} height={46} className="w-auto h-12 dark:hidden" />
          <Image src="/logo-dark.svg" alt="Gluten Scan Logo" width={180} height={46} className="w-auto h-12 hidden dark:block" />
        </Link>
         <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setOpenMobile(false)} aria-label="Zatvori meni">
                <X className="h-6 w-6" />
            </Button>
         </div>
      </SidebarHeader>

      <SidebarContent className="p-4 flex flex-col gap-2">
        <SidebarMenu className="flex flex-col gap-2">
          {mainLinks.map(link => renderLink(link, true))}
        </SidebarMenu>

        <SidebarSeparator />

        <SidebarMenu className="flex flex-col gap-2">
          {secondaryLinks.map(link => renderLink(link, false))}
        </SidebarMenu>

        {adminLink && (
           <>
            <SidebarSeparator />
            <SidebarMenu className="mt-2">
                {renderLink(adminLink, false)}
            </SidebarMenu>
           </>
        )}
      </SidebarContent>

      <SidebarFooter className="mt-auto space-y-2 p-4">
         <SidebarSeparator />
         <div className="group-data-[collapsible=icon]:hidden mt-2">
             {isLoggedIn ? (
                 <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                        <AvatarFallback>BG</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">Brankica G.</span>
                      <span className="text-xs text-muted-foreground">brankica@email.com</span>
                    </div>
                     <Button variant="ghost" size="icon" className="ml-auto">
                        <LogOut className="h-5 w-5" />
                    </Button>
                 </div>
             ) : (
                <SidebarMenuButton className="h-12 w-full justify-start text-base font-medium mt-4 hover:bg-sidebar-accent">
                    <LogIn className="h-5 w-5" /> <span>Prijavi se</span>
                </SidebarMenuButton>
            )}
         </div>

         <div className="group-data-[collapsible=icon]:hidden">
           <TooltipProvider>
             <Tooltip>
               <TooltipTrigger asChild>
                 <ThemeToggle />
               </TooltipTrigger>
               <TooltipContent side="right" align="center">
                 <p>Prebaci temu</p>
               </TooltipContent>
             </Tooltip>
           </TooltipProvider>
         </div>
         <div className="hidden group-data-[collapsible=icon]:block mx-auto">
            <ThemeToggle />
         </div>
      </SidebarFooter>
    </Sidebar>
  );
}
