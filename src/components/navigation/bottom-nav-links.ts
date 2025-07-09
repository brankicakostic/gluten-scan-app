
import type { LucideIcon } from 'lucide-react';
import { Home, ShoppingBag, CalendarDays, ShieldAlert } from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

// A curated list of essential links for the mobile bottom navigation.
// The hrefs should be relative to the locale.
export const bottomNavLinks: NavLink[] = [
  {
    href: '/',
    label: 'Početna',
    icon: Home,
  },
  {
    href: '/products',
    label: 'Proizvodi',
    icon: ShoppingBag,
  },
  {
    href: '/recalls',
    label: 'Opozivi',
    icon: ShieldAlert,
  },
  {
    href: '/events',
    label: 'Događaji',
    icon: CalendarDays,
  },
];
