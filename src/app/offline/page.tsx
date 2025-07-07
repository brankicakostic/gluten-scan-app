
import { WifiOff, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/page-header';

export default function OfflinePage() {
  return (
    <main className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-10rem)]">
      <PageHeader
        title="Niste na mreži"
        description="Izgleda da ste izgubili internet konekciju. Neke funkcionalnosti možda neće biti dostupne dok se ponovo ne povežete."
        icon={WifiOff}
      />
      <div className="mt-4 p-6 border rounded-lg bg-muted/50 max-w-md">
        <ShieldAlert className="h-10 w-10 text-primary mx-auto mb-4" />
        <h2 className="text-lg font-semibold">Keširan sadržaj</h2>
        <p className="text-muted-foreground text-sm mt-2">
          Još uvek možete pregledati stranice koje ste nedavno posetili. Molimo vas da se povežete na internet da biste pristupili svim funkcijama Gluten Scan aplikacije.
        </p>
      </div>
    </main>
  );
}
