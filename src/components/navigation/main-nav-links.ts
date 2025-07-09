
import type { LucideIcon } from 'lucide-react';
import { Home, History, Heart, ShoppingBag, CalendarDays, Shield, ShieldAlert } from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  tooltip?: string;
}

// Ensure base hrefs don't start with a locale prefix, as it will be added dynamically.
// The root path '/' should correctly map to the localized homepage.
export const mainNavLinks: NavLink[] = [
  {
    href: '/', // Base path for homepage
    label: 'Početna',
    icon: Home, 
    tooltip: 'Početna / Skeniranje i Pretraga',
  },
  {
    href: '/products', // Relative to locale
    label: 'Proizvodi',
    icon: ShoppingBag,
    tooltip: 'Pretražite sve proizvode',
  },
  {
    href: '/events', // The path remains /recalls, but the label and icon change
    label: 'Događaji',
    icon: CalendarDays,
    tooltip: 'Radionice i Događaji',
  },
  {
    href: '/recalls',
    label: 'Opozivi',
    icon: ShieldAlert,
    tooltip: 'Povučeni proizvodi',
  },
  {
    href: '/history', // Relative to locale
    label: 'Istorija',
    icon: History,
    tooltip: 'Istorija skeniranja',
  },
  {
    href: '/favorites', // Relative to locale
    label: 'Omiljeni',
    icon: Heart,
    tooltip: 'Omiljeni proizvodi',
  },
  {
    href: '/admin', // Relative to locale
    label: 'Admin',
    icon: Shield,
    tooltip: 'Admin Panel',
  },
];
