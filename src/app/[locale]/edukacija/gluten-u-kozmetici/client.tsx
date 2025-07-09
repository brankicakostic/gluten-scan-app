'use client'; 

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpenText, CheckCircle, AlertTriangle, Sparkles, TestTube2, Info } from 'lucide-react'; // Added relevant icons

interface GlutenUKozmeticiClientProps {
  locale: string;
}

export default function GlutenUKozmeticiClient({ locale }: GlutenUKozmeticiClientProps) {
  const router = useRouter();

  const postTitle = "Da li je kozmetika sa glutenom štetna za osobe sa celijakijom?";
  const postDescription = "Razjašnjenje o rizicima i bezbednosti upotrebe kozmetičkih proizvoda koji sadrže gluten.";

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Nazad
          </Button>
        </div>
        <PageHeader 
          title={postTitle}
          description={postDescription}
          icon={Sparkles} // Changed icon to Sparkles for cosmetics
        />
        
        <Card>
          <CardContent className="p-6 md:p-8">
            <article className="text-foreground space-y-6 prose dark:prose-invert max-w-none">
              <p className="lead text-lg">Kratko i jasno – ne, kozmetika sa glutenom nije štetna za osobe sa celijakijom, sve dok se ne unese oralno. Gluten ne može da prodre kroz kožu i ne može izazvati autoimunu reakciju koja pogađa creva kod osoba sa celijakijom.</p>
              <p>Ali hajde da pojasnimo sve detalje.</p>

              <hr className="my-6 border-border" />

              <h2 className="text-xl font-semibold flex items-center gap-2"><TestTube2 className="text-primary h-6 w-6" /> Gluten ne može proći kroz kožu</h2>
              <p>Iako se često koristi u kozmetici (kao što su pšenični proteini, hydrolyzed wheat protein), gluten je prevelik molekul da bi prošao kroz kožu. Celijakija se aktivira isključivo kada se gluten unese putem usta i dospe u digestivni trakt.</p>
              
              <hr className="my-6 border-border" />

              <h2 className="text-xl font-semibold flex items-center gap-2"><AlertTriangle className="text-destructive h-6 w-6" /> Kada kozmetika može biti rizik?</h2>
              <p>Rizik postoji samo kada postoji mogućnost slučajnog oralnog unosa. Na primer:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Karmini i sjajevi za usne</li>
                <li>Pasta za zube</li>
                <li>Kreme koje se nanose na ruke pa dođu u kontakt s hranom</li>
                <li>Dečji proizvodi (ako dete sisa prste, ruke, igračke)</li>
              </ul>
              <p>U ovim slučajevima se preporučuje korišćenje gluten-free proizvoda.</p>

              <hr className="my-6 border-border" />
              
              <h2 className="text-xl font-semibold flex items-center gap-2"><Info className="text-accent h-6 w-6" /> Zašto neki ljudi ipak reaguju na gluten u kozmetici?</h2>
              <p>Postoje dva moguća razloga za to:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>Alergija na pšenicu ili kontaktna preosetljivost</strong> –
                  Ovo nije isto što i celijakija. Osobe sa alergijom mogu imati osip, svrab ili iritaciju ako pšenični derivati dođu u kontakt sa kožom.
                </li>
                <li>
                  <strong>Slučajni unos proizvoda sa glutenom (npr. karmin, ruke, deca)</strong> –
                  Osoba s celijakijom može osetiti simptome ako se gluten iz proizvoda nehotično proguta.
                </li>
              </ol>
              <p>Dakle, reakcija nije zbog upijanja kroz kožu, već zbog alergije ili unosa na usta.</p>
              
              <hr className="my-6 border-border" />

              <h2 className="text-xl font-semibold">💸 A marketing?</h2>
              <p>Da budemo iskreni – proizvođači često koriste oznaku “gluten-free” i kada to realno nema smisla:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Na šamponima, lakovima, gelovima i kremama gde nema rizika.</li>
                <li>Podizanjem cena za “sigurnost” koja nije ni potrebna.</li>
              </ul>
              <p>Zato je važno znati šta zaista jeste rizik, a šta je marketinški trik.</p>

              <hr className="my-6 border-border" />

              <h2 className="text-xl font-semibold flex items-center gap-2"><CheckCircle className="text-green-600 dark:text-green-400 h-6 w-6" /> Zaključak:</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Ako ne dolazi u kontakt sa ustima, kozmetika sa glutenom nije opasna za osobe sa celijakijom.</li>
                <li>Obrati pažnju na proizvode koji se koriste oko usta.</li>
                <li>Ako postoji dodatna kožna reakcija – to je verovatno alergija, a ne celijakija.</li>
              </ul>
              <p className="font-semibold pt-4">Najvažnije: ne paniči, nego se informiši.</p>
            </article>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
