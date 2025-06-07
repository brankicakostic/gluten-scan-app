
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpenText, ChevronRight } from 'lucide-react';

// Static data for articles for now
const articlesData = [
  {
    slug: 'moja-celijakija-svesno-zivljenje',
    title: "Moja celijakija: Nije me uništila – naučila me je da živim svesno",
    description: "Lična priča o dijagnozi celijakije i putu ka svesnijem životu.",
  },
  {
    slug: 'gluten-u-kozmetici',
    title: "Da li je kozmetika sa glutenom štetna za osobe sa celijakijom?",
    description: "Razjašnjenje o rizicima glutena u kozmetičkim proizvodima za osobe sa celijakijom.",
  }
  // Add more articles here in the future
];

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const title = params.locale === 'sr' ? 'Edukacija o Celijakiji | Gluten Detective' : 'Celiac Disease Education | Gluten Detective';
  const description = params.locale === 'sr' ? 'Saznajte više o celijakiji, bezglutenskoj ishrani i pročitajte lične priče.' : 'Learn more about celiac disease, gluten-free diet, and read personal stories.';
  return {
    title,
    description,
  };
}

export default function EdukacijaLandingPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarRail />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-6 md:p-8">
          <PageHeader
            title="Edukacija o Celijakiji"
            description="Pročitajte korisne članke i lične priče o životu sa celijakijom."
            icon={BookOpenText}
          />
          {articlesData.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              {articlesData.map((article) => (
                <Card key={article.slug} className="hover:shadow-lg transition-shadow duration-200 flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl">{article.title}</CardTitle>
                    <CardDescription>{article.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-end">
                    <Button asChild variant="outline" className="mt-auto">
                      <Link href={`/${locale}/edukacija/${article.slug}`} className="inline-flex items-center">
                        Pročitaj više <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Trenutno nema dostupnih članaka.</p>
          )}
        </main>
      </SidebarInset>
    </div>
  );
}
