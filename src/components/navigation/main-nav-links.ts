import type { LucideIcon } from 'lucide-react';
import { Home, History, Heart, ShoppingBag } from 'lucide-react'; // Added ShoppingBag

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
    tooltip: 'Home / Scan & Search',
  },
  {
    href: '/products',
    label: 'Browse Products',
    icon: ShoppingBag,
    tooltip: 'Browse All Products',
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
