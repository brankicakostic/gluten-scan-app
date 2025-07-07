// This file uses client-side rendering for locale detection, but content is static.
'use client';

import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';


export default function TermsAndConditionsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarRail />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6">
              <Button asChild variant="outline" size="sm" onClick={() => router.back()}>
                {/* Using router.back() as a simple way to go to the previous page */}
                <span>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Nazad
                </span>
              </Button>
            </div>
            <PageHeader 
              title="Uslovi korišćenja – GlutenScan"
              description="Molimo vas da pažljivo pročitate ove uslove korišćenja."
              icon={FileText}
            />
            
            <Card>
              <CardContent className="p-6 space-y-6 text-sm text-muted-foreground">
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Dobrodošli na GlutenScan</h2>
                  <p>
                    Dobrodošli na GlutenScan aplikaciju i sajt gluten-scan.com.
                  </p>
                  <p>
                    Molimo vas da pažljivo pročitate ove uslove korišćenja pre upotrebe aplikacije. Korišćenjem aplikacije potvrđujete da ste saglasni sa navedenim uslovima.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-2">1. Opšti uslovi</h2>
                  <p>
                    GlutenScan je informativna aplikacija u beta fazi koja pomaže korisnicima da lakše identifikuju bezglutenske proizvode putem skeniranja deklaracija i analize sastojaka.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-2">2. Ograničenje odgovornosti</h2>
                  <p>
                    Informacije koje pruža aplikacija nisu zamena za laboratorijska ispitivanja, medicinski savet niti zvanične sertifikate proizvođača. Iako činimo napore da obezbedimo tačnost podataka, ne garantujemo potpunu ispravnost i ne preuzimamo odgovornost za bilo kakve posledice upotrebe.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-2">3. Prava intelektualne svojine</h2>
                  <p>
                    Svi tekstovi, analize, dizajn i logo su vlasništvo autora i ne mogu se koristiti bez izričite dozvole.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-2">4. Ograničenja korišćenja</h2>
                  <p>
                    Aplikacija trenutno ne zahteva prijavu korisnika. Kasnijim razvojem biće uvedena personalizovana pretraga i ograničenje na broj skeniranih deklaracija (npr. nakon 3 skeniranja bez naloga skeniranje se privremeno onemogućava).
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-2">5. Promene uslova</h2>
                  <p>
                    Zadržavamo pravo da izmenimo ove uslove bez prethodne najave. Najnovija verzija će uvek biti dostupna na našem sajtu.
                  </p>
                </section>

                <section>
                  <p className="font-medium text-foreground">
                    Ukoliko se ne slažete sa uslovima korišćenja, molimo vas da ne koristite GlutenScan.
                  </p>
                </section>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}
