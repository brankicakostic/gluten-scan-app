import type { LucideIcon } from 'lucide-react';
import { Home, History, Heart, ScanLine } from 'lucide-react'; // Added Home, ScanLine

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  tooltip?: string;
}

export const mainNavLinks: NavLink[] = [
  {
    href: '/',
    label: 'Home',
    icon: Home, 
    tooltip: 'Home / Scan',
  },
  {
    href: '/history',
    label: 'Scan History',
    icon: History,
    tooltip: 'Scan History',
  },
  {
    href: '/favorites',
    label: 'Favorite Products',
    icon: Heart,
    tooltip: 'Favorite Products',
  },
];
