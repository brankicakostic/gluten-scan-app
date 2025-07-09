
import type { LucideIcon } from 'lucide-react';
import { Home, History, Heart, ShoppingBag, BookOpenText, Siren, Shield } from 'lucide-react';

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
    href: '/recalls', // Relative to locale - NEW PAGE
    label: 'Opozivi',
    icon: Siren,
    tooltip: 'Aktivni opozivi proizvoda',
  },
  {
    href: '/edukacija', // Relative to locale
    label: 'Edukacija',
    icon: BookOpenText,
    tooltip: 'Edukativni članci',
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
