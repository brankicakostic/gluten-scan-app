// This file uses client-side rendering for locale detection, but content is static.
'use client';

import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, ArrowLeft } from 'lucide-react'; // Using ShieldCheck for privacy
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicyPage() {
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
                <span>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Nazad
                </span>
              </Button>
            </div>
            <PageHeader 
              title="Izjava o privatnosti – GlutenScan"
              description="Molimo vas da pažljivo pročitate ovu izjavu o privatnosti."
              icon={ShieldCheck}
            />
            
            <Card>
              <CardContent className="p-6 space-y-6 text-sm text-muted-foreground">
                <section>
                  <p>
                    Ova izjava o privatnosti odnosi se na korišćenje GlutenScan aplikacije i sajta gluten-scan.com.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-2">1. Podaci koje prikupljamo</h2>
                  <p>
                    U trenutnoj fazi razvoja aplikacija ne zahteva registraciju korisnika niti aktivno prikuplja lične podatke (ime, email, lozinka). Međutim, aplikacija može lokalno čuvati tehničke informacije kao što su broj skeniranih deklaracija radi poboljšanja korisničkog iskustva i potencijalnog uvođenja ograničenja po korisniku.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-2">2. Kolačići i lokalna memorija</h2>
                  <p>
                    Aplikacija može koristiti lokalnu memoriju pretraživača (localStorage) za privremeno čuvanje podataka o sesiji, broju skeniranja i podešavanjima jezika. Ovi podaci nisu dostupni trećim licima i ne napuštaju uređaj korisnika.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-2">3. Treće strane</h2>
                  <p>
                    Trenutno ne koristimo alate kao što su Google Analytics ili slični servisi. U slučaju da se kasnije uvedu, ova politika privatnosti će biti ažurirana u skladu sa tim.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-2">4. Budući razvoj</h2>
                  <p>
                    Planirana je mogućnost registracije korisnika i personalizovane pretrage. U tom slučaju, korisnici će biti jasno obavešteni o vrsti podataka koji se prikupljaju i načinu na koji se čuvaju i obrađuju.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-2">5. Prava korisnika</h2>
                  <p>
                    Korisnici imaju pravo da u svakom trenutku zatraže informacije o podacima koji se čuvaju, kao i da zatraže njihovo brisanje, ukoliko se uvede sistem za čuvanje podataka.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-2">6. Kontakt</h2>
                  <p>
                    Za sva pitanja u vezi sa privatnošću možete nas kontaktirati putem email adrese: kontakt@gluten-scan.com
                  </p>
                </section>

                <section>
                  <p className="text-foreground">
                    Zadržavamo pravo da ovu izjavu ažuriramo u skladu sa promenama u zakonodavstvu ili funkcionalnosti aplikacije.
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
