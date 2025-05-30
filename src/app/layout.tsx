
import type { Metadata } from 'next';

// This is the root layout. It must define <html> and <body>.
// The lang attribute here is a fallback. src/app/[locale]/layout.tsx will set the specific lang.
export const metadata: Metadata = {
  title: 'Gluten Scan', // Generic title, will be overridden by locale-specific layout
  description: 'Scan and identify gluten-free products easily.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr"> {/* Default to 'sr' here, [locale]/layout.tsx will override */}
      <body>
        {children}
      </body>
    </html>
  );
}
