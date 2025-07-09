
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export function SiteFooter() {
  const params = useParams();
  const locale = (params.locale as string) || 'sr';

  return (
    <footer className="w-full border-t border-border bg-background mt-auto">
      <div className="mx-auto max-w-6xl p-6 text-center text-xs text-muted-foreground md:p-8">
        <p>
          &copy; {new Date().getFullYear()} Gluten Scan
          <span className="mx-1.5">-</span>
          <Link href={`/${locale}/terms`} className="hover:underline">
            Uslovi korišćenja
          </Link>
          <span className="mx-1.5">-</span>
          <Link href={`/${locale}/privacy`} className="hover:underline">
            Privatnost
          </Link>
        </p>
        <p className="mt-2">Napravljeno sa 💛 u GlutenScan-u</p>
      </div>
    </footer>
  );
}
