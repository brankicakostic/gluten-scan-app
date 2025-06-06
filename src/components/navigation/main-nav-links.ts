
import type { LucideIcon } from 'lucide-react';
import { Home, History, Heart, ShoppingBag, BookOpenText, MapPin } from 'lucide-react'; // Added BookOpenText, MapPin

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
    label: 'Browse Products',
    icon: ShoppingBag,
    tooltip: 'Browse All Products',
  },
  {
    href: '/map', // Relative to locale
    label: 'Mapa',
    icon: MapPin,
    tooltip: 'Mapa lokacija',
  },
  {
    href: '/edukacija', // Relative to locale
    label: 'Edukacija',
    icon: BookOpenText,
    tooltip: 'Edukativni članci',
  },
  {
    href: '/history', // Relative to locale
    label: 'Scan History',
    icon: History,
    tooltip: 'Scan History',
  },
  {
    href: '/favorites', // Relative to locale
    label: 'Favorite Products',
    icon: Heart,
    tooltip: 'Favorite Products',
  },
];
