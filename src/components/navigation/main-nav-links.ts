
import type { LucideIcon } from 'lucide-react';
import { Home, History, Heart, ShoppingBag, BookOpenText, MapPin, Siren, Shield } from 'lucide-react';

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
    label: 'Home',
    icon: Home, 
    tooltip: 'Home / Scan & Search',
  },
  {
    href: '/products', // Relative to locale
    label: 'Products',
    icon: ShoppingBag,
    tooltip: 'Browse All Products',
  },
  {
    href: '/recalls', // Relative to locale - NEW PAGE
    label: 'Recalls',
    icon: Siren,
    tooltip: 'Active product recalls',
  },
  {
    href: '/map', // Relative to locale
    label: 'Map',
    icon: MapPin,
    tooltip: 'Location Map',
  },
  {
    href: '/edukacija', // Relative to locale
    label: 'Education',
    icon: BookOpenText,
    tooltip: 'Educational Articles',
  },
  {
    href: '/history', // Relative to locale
    label: 'History',
    icon: History,
    tooltip: 'Scan History',
  },
  {
    href: '/favorites', // Relative to locale
    label: 'Favorites',
    icon: Heart,
    tooltip: 'Favorite Products',
  },
  {
    href: '/admin', // Relative to locale
    label: 'Admin',
    icon: Shield,
    tooltip: 'Admin Panel',
  },
];
