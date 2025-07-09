
import { getProducts } from '@/lib/services/product-service';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert, AlertTriangle, ListChecks, CalendarDays, SearchCheck, CircleAlert, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function RecallsPage({ params }: { params: { locale: string } }) {
  const allProducts = await getProducts();
  const recalledProducts = allProducts.filter(product => product.warning === true);

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="Opozvani Proizvodi"
          description="Lista proizvoda koji su povučeni sa tržišta zbog problema sa glutenom."
          icon={ShieldAlert}
        />
        {recalledProducts.length > 0 ? (
          <div className="space-y-6">
            {recalledProducts.map((product) => (
              <Card key={product.id} className="border-destructive border-2 overflow-hidden shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row items-start gap-4">
                        <Link href={`/${params.locale}/products/${product.id}`} className="block flex-shrink-0">
                          {product.imageUrl && product.imageUrl !== '/placeholder.svg' ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              width={120}
                              height={120}
                              className="rounded-md object-cover aspect-square"
                              data-ai-hint={product.dataAiHint || 'product image'}
                            />
                          ) : (
                            <div className="h-[120px] w-[120px] flex items-center justify-center bg-secondary text-muted-foreground rounded-md">
                              <Image
                                src="/placeholder.svg"
                                alt="Slika nije dostupna"
                                width={56}
                                height={56}
                                className="opacity-50"
                              />
                            </div>
                          )}
                        </Link>
                        <div className="flex-grow">
                            <CardTitle className="text-xl mb-1">
                                <Link href={`/${params.locale}/products/${product.id}`} className="hover:underline">
                                    {product.name}
                                </Link>
                            </CardTitle>
                            <CardDescription>{product.brand}</CardDescription>
                             <div className="mt-2 text-sm text-destructive font-semibold flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                <span>UPOZORENJE O POVLAČENJU</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-destructive/10 rounded-md space-y-2 text-sm">
                        <p><strong>Napomena:</strong> {product.note}</p>
                        {product.seriesAffected && (
                            <>
                                <p><ListChecks className="inline h-4 w-4 mr-1.5"/><strong>Pogođena serija:</strong> {product.seriesAffected.lotNumbers.join(', ')}</p>
                                <p><CalendarDays className="inline h-4 w-4 mr-1.5"/><strong>Rok upotrebe:</strong> {product.seriesAffected.expiry}</p>
                                <p><SearchCheck className="inline h-4 w-4 mr-1.5"/><strong>Nalaz:</strong> {product.seriesAffected.finding}</p>
                                <p><CircleAlert className="inline h-4 w-4 mr-1.5"/><strong>Status:</strong> {product.seriesAffected.status}</p>
                                {product.seriesAffected.sourceLink && (
                                    <p>
                                    <ExternalLink className="inline h-4 w-4 mr-1.5"/>
                                    <strong>Izvor:</strong>{' '}
                                    <a href={product.seriesAffected.sourceLink} target="_blank" rel="noopener noreferrer" className="underline hover:text-destructive/80 font-semibold">
                                        Zvanično obaveštenje
                                    </a>
                                    </p>
                                )}
                            </>
                        )}
                        <p className="mt-3 font-semibold">Molimo Vas da ne konzumirate proizvod iz navedene serije ako ga posedujete.</p>
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <ShieldAlert className="mx-auto h-16 w-16 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nema aktivnih opoziva</h3>
            <p>Trenutno nema proizvoda na listi za opoziv. Proverite uskoro ponovo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
