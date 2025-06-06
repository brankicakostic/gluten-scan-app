
'use client'; // Ova komponenta je sada klijentska

import { useRouter } from 'next/navigation'; // useParams nije potreban ako locale dolazi kao prop
import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpenText } from 'lucide-react';

interface MojaCelijakijaSvesnoZivljenjeClientProps {
  locale: string;
}

export default function MojaCelijakijaSvesnoZivljenjeClient({ locale }: MojaCelijakijaSvesnoZivljenjeClientProps) {
  const router = useRouter();

  const postTitle = "Moja celijakija: Nije me uništila – naučila me je da živim svesno";
  const postDescription = "Lična priča o dijagnozi celijakije i putu ka svesnijem životu.";

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarRail />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-6 md:p-8">
          <div className="mb-6">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Nazad
            </Button>
          </div>
          <PageHeader 
            title={postTitle}
            description={postDescription}
            icon={BookOpenText}
          />
          
          <Card>
            <CardContent className="p-6 md:p-8">
              <article className="text-foreground space-y-4 prose dark:prose-invert max-w-none">
                <p>Godinama sam mislila da imam samo "brz metabolizam". Imala sam čestu stolicu, slabost, izmaglicu u glavi, gvožđe koje je padalo na 3. Svi su mi govorili „blago tebi, mršava si, jedeš sve“, a ja sam sve više sumnjala da nešto nije u redu.</p>
                <p>U pubertetu, dok su se druge devojke razvijale, ja sam ostajala mršava, sitna, bleda. Dok su mi govorili „blago tebi“, ja sam sebe gledala u ogledalu i mislila:</p>
                <blockquote className="border-l-4 border-primary pl-4 italic my-4">
                  <p>Zašto ja izgledam ovako? Zašto se ne menjam kao druge? Zašto sam stalno umorna, bez energije, bez samopouzdanja?</p>
                </blockquote>
                <p>Bila sam nesrećna, iskompleksirana i zbunjena – i niko nije znao da je uzrok nešto fizičko, stvarno, ne dijeta ni psiha – već neotkrivena celijakija.</p>

                <h2 className="text-xl font-semibold pt-4 pb-2">Sa 33 godine, nakon što sam smršala 3 kg za mesec dana i krenule su dijareje, stigla je dijagnoza – celijakija.</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Biopsija: potpuno zaravnjene crevne resice</li>
                  <li>Antitela: 100x viša od normale</li>
                  <li>Težina: 51–53 kg na visinu 177 cm</li>
                  <li>Ishrana: obilna, ali telo nije upijalo ništa</li>
                </ul>
                
                <h2 className="text-xl font-semibold pt-4 pb-2">Posle dijagnoze – potpuni preokret</h2>
                <p>U roku od godinu dana na strogoj bezglutenskoj dijeti:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Gvožđe se normalizovalo</li>
                  <li>Više nema anemije</li>
                  <li>Imala sam zdravu trudnoću bez problema sa hemoglobinom</li>
                  <li>Energija mi se vratila – po prvi put sam osećala da imam snagu</li>
                </ul>

                <h2 className="text-xl font-semibold pt-4 pb-2">3 godine kasnije – i dalje učim, ali živim bolje</h2>
                <p>Danas nemam luksuz da pojedem burek na brzinu ili uzmem pecivo s kioska. Ali imam luksuz da znam šta jedem. Da jedem s razlogom. Da slušam svoje telo.</p>
                <p>Celijakija me je naterala da usporim, naučim, pazim. I iako još učim – prvi put u životu osećam se zdravo.</p>

                <h2 className="text-xl font-semibold pt-4 pb-2">Sada sam i mama – i borim se za više od sebe</h2>
                <p>Danas sam i mama jedne male devojčice. Kod nje pažljivo posmatram sve signale jer postoji mogućnost da i ona ima celijakiju. Po preporuci lekara, čekamo da napuni dve godine kako bismo uradili tTG-IgA i IgG antitela, a ako budu negativna – nastavićemo sa genetskim testiranjem.</p>
                <p>Ne želim da patetišem, ali zato što sam prošla kroz sve to – dodatno sam motivisana da pomognem i drugim roditeljima koji se bore s istim sumnjama, nedoumicama i strahovima.</p>

                <h2 className="text-xl font-semibold pt-4 pb-2">Život bez glutena – i van kuće</h2>
                <p>Od kad sam na bezglutenskoj ishrani, više ne ulazim u pekaru „na brzaka“. Restorani? U Beogradu ih ima par koji nude zaista bezglutenske obroke – i to zna svako ko ih traži kao Sveti gral. A online dostava? 😅 Pa… recimo da mi je bezbednije da uzmem jabuku i nasmejem se.</p>

                <hr className="my-8 border-border" />

                <p><em>Ova priča nije da te uplaši. Nego da znaš da nisi sam/a, i da i iza ozbiljne dijagnoze može da stoji jedan potpuno novi – bolji – početak.</em></p>
              </article>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </div>
  );
}
