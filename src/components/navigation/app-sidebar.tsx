'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScanLine } from 'lucide-react'; // Changed from Wheat to ScanLine
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

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <ScanLine className="h-8 w-8 text-primary-foreground bg-primary p-1.5 rounded-lg" />
          <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">
            Gluten Scan
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {mainNavLinks.map((link: NavLink) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === link.href}
                tooltip={{ children: link.tooltip || link.label, className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                className={cn(
                  pathname === link.href ? 
                  "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" :
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Link href={link.href}>
                  <link.icon />
                  <span>{link.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">
        <p className="text-xs text-sidebar-foreground/70">
          &copy; {new Date().getFullYear()} Gluten Scan
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
