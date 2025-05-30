import type { LucideIcon } from 'lucide-react';
import { Home, QrCode, ScanSearch, ListFilter, History, Heart, LayoutGrid } from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  tooltip?: string;
}

export const mainNavLinks: NavLink[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutGrid,
    tooltip: 'Dashboard',
  },
  {
    href: '/scan-barcode',
    label: 'Scan Barcode',
    icon: QrCode,
    tooltip: 'Scan Barcode',
  },
  {
    href: '/scan-declaration',
    label: 'Scan Declaration',
    icon: ScanSearch,
    tooltip: 'Scan Declaration',
  },
  {
    href: '/products',
    label: 'Filter Products',
    icon: ListFilter,
    tooltip: 'Filter Products',
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
