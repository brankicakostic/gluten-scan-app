import { SidebarTrigger } from '@/components/ui/sidebar';
import { ScanLine } from 'lucide-react'; // Changed from Wheat to ScanLine
import { ThemeToggle } from '@/components/theme-toggle';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
           <ScanLine className="h-6 w-6 mr-2 text-primary-foreground bg-primary p-1 rounded-md" />
          <span className="font-bold">Gluten Scan</span>
        </div>
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {/* Placeholder for potential user nav or other header items */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
