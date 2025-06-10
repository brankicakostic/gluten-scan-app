
// This file uses client-side rendering.
'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert as ShadcnAlert, AlertDescription as ShadcnAlertDescription, AlertTitle as ShadcnAlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, ShoppingBag, AlertTriangle, CheckCircle, Heart, Leaf, Info, ShieldCheck, FileText, GitBranch, Tag, Barcode, CircleAlert, Store, MapPin, ExternalLink, ListChecks, CalendarDays, SearchCheck } from 'lucide-react';
import { placeholderProducts } from '@/app/[locale]/products/page';
import { Badge } from '@/components/ui/badge';
import { useFavorites } from '@/contexts/favorites-context';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


// Updated Product interface to align with schema including recall info
export interface Product {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  category: string;
  imageUrl: string;
  description: string;
  ingredientsText?: string;
  labelText?: string;
  hasAOECSLicense?: boolean;
  hasManufacturerStatement?: boolean;
  isVerifiedAdmin?: boolean;
  source?: string;
  tags?: string[];
  nutriScore?: string;
  isLactoseFree?: boolean;
  isSugarFree?: boolean;
  isPosno?: boolean;
  dataAiHint?: string;
  warning?: boolean;
  note?: string;
  seriesAffected?: {
    lotNumbers: string[];
    expiry: string;
    finding: string;
    status: string;
    sourceLink?: string;
  };
}

const getNutriScoreClasses = (score?: string) => {
  if (!score) return 'border-gray-300 text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500';
  switch (score.toUpperCase()) {
    case 'A': return 'border-green-500 text-green-700 dark:text-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/30';
    case 'B': return 'border-lime-500 text-lime-700 dark:text-lime-400 dark:border-lime-600 bg-lime-50 dark:bg-lime-900/30';
    case 'C': return 'border-yellow-500 text-yellow-700 dark:text-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/30';
    case 'D': return 'border-orange-500 text-orange-700 dark:text-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/30';
    case 'E': return 'border-red-500 text-red-700 dark:text-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/30';
    default: return 'border-gray-300 text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500';
  }
};

const DietaryTag = ({ label, icon: Icon, present = true }: { label: string; icon: React.ElementType; present?: boolean }) => {
  if (!present) return null;
  return (
    <div className="flex items-center text-sm text-muted-foreground">
      <Icon className="h-4 w-4 mr-2 text-primary" />
      <span>{label}</span>
    </div>
  );
};


export default function ProductDetailPage() {
  const params = useParams();
  const locale = params.locale as string;
  const productId = params.productId as string;

  const product = placeholderProducts.find(p => p.id === productId) as Product | undefined;

  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { toast } = useToast();

  if (!product) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <SidebarRail />
        <SidebarInset>
          <SiteHeader />
          <main className="flex-1 p-6 md:p-8">
            <PageHeader
              title="Product Not Found"
              description="The product you are looking for does not exist or could not be loaded."
              icon={AlertTriangle}
            />
            <div className="text-center">
              <Button asChild variant="outline">
                <Link href={`/${locale}/products`}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
                </Link>
              </Button>
            </div>
          </main>
        </SidebarInset>
      </div>
    );
  }

  const isCurrentlyFavorite = isFavorite(product.id);

  const handleToggleFavorite = () => {
    if (isCurrentlyFavorite) {
      removeFavorite(product.id);
      toast({ title: `${product.name} removed from favorites.` });
    } else {
      addFavorite(product.id);
      toast({ title: `${product.name} added to favorites!` });
    }
  };

  const isGlutenFreeTag = product.tags?.includes('gluten-free');
  const mayContainGluten = product.tags?.includes('may-contain-gluten') || product.tags?.includes('risk-of-contamination');
  const containsGluten = product.warning || product.tags?.includes('contains-gluten') || product.tags?.includes('sadrži-gluten') || product.tags?.includes('contains-wheat') || product.tags?.includes('contains-barley') || product.tags?.includes('contains-rye') || (product.tags?.includes('contains-oats') && !isGlutenFreeTag) ;

  const identifiedGlutenSources: string[] = [];
  if (product.tags?.includes('contains-wheat')) identifiedGlutenSources.push('Wheat');
  if (product.tags?.includes('contains-barley')) identifiedGlutenSources.push('Barley');
  if (product.tags?.includes('contains-rye')) identifiedGlutenSources.push('Rye');
  if (product.tags?.includes('contains-oats') && !isGlutenFreeTag) identifiedGlutenSources.push('Oats (may not be gluten-free)');

  const commonAllergenKeywords: { term: string, name: string }[] = [
    { term: 'lešnik', name: 'Hazelnuts' }, { term: 'lešnici', name: 'Hazelnuts' }, { term: 'lesnik', name: 'Hazelnuts' }, { term: 'lesnici', name: 'Hazelnuts' },
    { term: 'kikiriki', name: 'Peanuts' },
    { term: 'soja', name: 'Soy' }, { term: 'sojin', name: 'Soy' },
    { term: 'mleko', name: 'Milk' }, { term: 'mlijeko', name: 'Milk' }, { term: 'mlečni', name: 'Milk' }, { term: 'mleko u prahu', name: 'Milk' }, { term: 'obrano mleko u prahu', name: 'Milk' }, { term: 'surutka', name: 'Whey (Milk)' }, { term: 'surutka u prahu', name: 'Whey (Milk)' },
    { term: 'jaja', name: 'Eggs' }, { term: 'jaje', name: 'Eggs' }, { term: 'jaja u prahu', name: 'Eggs'}, {"term": "belance u prahu", "name": "Eggs"},
    { term: 'badem', name: 'Almonds' },
    { term: 'orah', name: 'Walnuts' },
    { term: 'susam', name: 'Sesame' },
  ];

  let mentionedNonGlutenAllergens: string[] = [];
  if (product.ingredientsText && typeof product.ingredientsText === 'string') {
    const ingredientsLower = product.ingredientsText.toLowerCase();
    const foundAllergenNames = new Set<string>();
    commonAllergenKeywords.forEach(allergen => {
      if (ingredientsLower.includes(allergen.term.toLowerCase())) {
        foundAllergenNames.add(allergen.name);
      }
    });
    mentionedNonGlutenAllergens = Array.from(foundAllergenNames);
  }


  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarRail />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-6 md:p-8">
          <div className="mb-6">
            <Button asChild variant="outline" size="sm">
              <Link href={`/${locale}/products`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Products
              </Link>
            </Button>
          </div>
          <PageHeader
            title={product.name}
            description={product.brand ? `${product.brand} - Details for ${product.name}` : `Details for ${product.name}`}
            icon={Package}
          />

          {product.warning && product.seriesAffected && (
            <ShadcnAlert variant="destructive" className="mb-6">
              <AlertTriangle className="h-5 w-5" />
              <ShadcnAlertTitle className="text-lg font-semibold">Upozorenje o Povlačenju Proizvoda!</ShadcnAlertTitle>
              <ShadcnAlertDescription className="mt-2 space-y-1 text-sm">
                <p><strong>Napomena:</strong> {product.note}</p>
                <p><ListChecks className="inline h-4 w-4 mr-1.5"/><strong>Serija(e) pogođene:</strong> {product.seriesAffected.lotNumbers.join(', ')}</p>
                <p><CalendarDays className="inline h-4 w-4 mr-1.5"/><strong>Rok upotrebe pogođene serije:</strong> {product.seriesAffected.expiry}</p>
                <p><SearchCheck className="inline h-4 w-4 mr-1.5"/><strong>Nalaz:</strong> {product.seriesAffected.finding}</p>
                <p><CircleAlert className="inline h-4 w-4 mr-1.5"/><strong>Status:</strong> {product.seriesAffected.status}</p>
                {product.seriesAffected.sourceLink && (
                  <p>
                    <ExternalLink className="inline h-4 w-4 mr-1.5"/>
                    <strong>Izvor:</strong>{' '}
                    <a href={product.seriesAffected.sourceLink} target="_blank" rel="noopener noreferrer" className="underline hover:text-destructive-foreground/80">
                      Zvanično obaveštenje
                    </a>
                  </p>
                )}
                 <p className="mt-3 font-semibold">Molimo Vas da ne konzumirate proizvod iz navedene serije ako ga posedujete.</p>
              </ShadcnAlertDescription>
            </ShadcnAlert>
          )}

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <Card className={`overflow-hidden shadow-lg ${product.warning ? 'border-2 border-destructive' : ''}`}>
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover aspect-square"
                  data-ai-hint={product.dataAiHint}
                />
              </Card>
               {product.barcode && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center"><Barcode className="h-5 w-5 mr-2 text-primary"/> Barcode</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{product.barcode}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-3xl">{product.name}</CardTitle>
                      {product.brand && <CardDescription className="text-lg text-muted-foreground">{product.brand}</CardDescription>}
                      <CardDescription className="text-md text-muted-foreground">{product.category}</CardDescription>
                    </div>
                    <Button variant="outline" size="icon" className="ml-auto flex-shrink-0" onClick={handleToggleFavorite}>
                      <Heart className="h-5 w-5" fill={isCurrentlyFavorite ? 'hsl(var(--primary))' : 'none'} />
                      <span className="sr-only">{isCurrentlyFavorite ? 'Remove from favorites' : 'Add to favorites'}</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-md font-semibold mb-1">Description</h3>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-md font-semibold mb-2">Gluten Information</h3>
                        {product.warning ? (
                            <div className="flex items-center text-red-600 font-semibold">
                                <AlertTriangle className="h-5 w-5 mr-2" />
                                <span>SADRŽI GLUTEN (Povučena serija)</span>
                            </div>
                        ) : product.hasAOECSLicense ? (
                          <div className="flex items-center text-green-600">
                            <ShieldCheck className="h-5 w-5 mr-2" />
                            <span>AOECS Licensed Gluten-Free</span>
                          </div>
                        ) : product.hasManufacturerStatement && isGlutenFreeTag ? (
                          <div className="flex items-center text-green-600">
                            <FileText className="h-5 w-5 mr-2" />
                            <span>Manufacturer Declares Gluten-Free</span>
                          </div>
                        ) : isGlutenFreeTag ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            <span>Considered Gluten-Free</span>
                          </div>
                        ) : containsGluten ? (
                          <div className="flex items-center text-red-600">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            <span>Contains Gluten</span>
                          </div>
                        ) : mayContainGluten ? (
                          <div className="flex items-center text-orange-500">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            <span>May Contain Gluten Traces</span>
                          </div>
                        ) : (
                           <div className="flex items-center text-muted-foreground">
                             <Info className="h-5 w-5 mr-2" />
                             <span>Gluten status unknown or not specified</span>
                           </div>
                        )}
                    </div>

                    {product.nutriScore && (
                      <div>
                        <h3 className="text-md font-semibold mb-2">Nutri-Score</h3>
                        <span className={`px-3 py-1 rounded-lg text-lg font-bold border-2 ${getNutriScoreClasses(product.nutriScore)}`}>
                          {product.nutriScore}
                        </span>
                      </div>
                    )}
                  </div>

                  {(product.isLactoseFree || product.isSugarFree || product.isPosno) && (
                    <div>
                      <h3 className="text-md font-semibold mb-2">Other Dietary Information</h3>
                      <div className="space-y-2">
                        <DietaryTag label="Lactose-Free" icon={CheckCircle} present={product.isLactoseFree} />
                        <DietaryTag label="Sugar-Free" icon={CheckCircle} present={product.isSugarFree} />
                        <DietaryTag label="Posno (Lenten)" icon={Leaf} present={product.isPosno} />
                      </div>
                    </div>
                  )}

                  {!product.warning && ( // Don't show regular certifications if product is recalled
                    <div>
                      <h3 className="text-md font-semibold mb-2">Certifications &amp; Verifications</h3>
                      <div className="space-y-2">
                        {product.hasAOECSLicense && (
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center text-sm text-foreground cursor-help">
                                  <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                                  <span>AOECS Licensed</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="w-64 text-sm bg-popover text-popover-foreground border-border shadow-md p-2 rounded-md">
                                <p>✅ AOECS sertifikat potvrđuje da je proizvod prošao strogu kontrolu i laboratorijska testiranja. Siguran je za osobe sa celijakijom i označen je simbolom prekriženog klasja pšenice.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {product.hasManufacturerStatement && (
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center text-sm text-foreground cursor-help">
                                  <FileText className="h-4 w-4 mr-2 text-primary" />
                                  <span>Manufacturer Statement (Gluten-Free)</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="w-64 text-sm bg-popover text-popover-foreground border-border shadow-md p-2 rounded-md">
                                <p>ℹ️ Proizvođač tvrdi da ovaj proizvod ne sadrži gluten i da se pakuje na način koji sprečava kontaminaciju. Iako je ovo korisna informacija, bez zvaničnog sertifikata ili laboratorijskog testa, ovo se tretira kao izjava poverenja, a ne kao apsolutna garancija bezglutenskog statusa.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <DietaryTag label="Admin Verified" icon={CheckCircle} present={product.isVerifiedAdmin} />
                      </div>
                    </div>
                  )}


                  {product.brand === "Aleksandrija Fruška Gora" && (
                    <div>
                      <div className="flex items-center mb-1">
                        <Store className="h-4 w-4 mr-2 text-primary"/>
                        <h3 className="text-md font-semibold">Dostupno u</h3>
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">DM, Maxi, Bio Špajz, online</p>

                      <div className="flex items-center mt-2 mb-1">
                        <MapPin className="h-4 w-4 mr-2 text-primary"/>
                        <h3 className="text-md font-semibold">Zemlja porekla</h3>
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">Srbija</p>
                    </div>
                  )}

                  {product.ingredientsText && (
                    <div>
                      <h3 className="text-md font-semibold mb-1">Ingredients</h3>
                      <p className="text-xs text-muted-foreground p-3 bg-muted rounded-md whitespace-pre-wrap">{product.ingredientsText}</p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h3 className="text-md font-semibold mb-2 flex items-center">
                        <CircleAlert className="h-4 w-4 mr-2 text-primary"/> Allergen Notes
                    </h3>
                    {product.warning && identifiedGlutenSources.length === 0 && ( // If warning is generic but no specific gluten source listed in tags
                        <p className="text-sm text-red-600"><strong>Upozorenje:</strong> Ovaj proizvod (ili određena serija) može sadržati gluten. Molimo proverite detalje o povlačenju.</p>
                    )}
                    {!product.warning && identifiedGlutenSources.length > 0 && (
                        <p className="text-sm text-red-600"><strong>Contains Gluten Sources:</strong> {identifiedGlutenSources.join(', ')}.</p>
                    )}
                    {!product.warning && identifiedGlutenSources.length === 0 && mayContainGluten && !isGlutenFreeTag && (
                         <p className="text-sm text-orange-600"><strong>Advisory:</strong> May contain traces of gluten.</p>
                    )}
                    {!product.warning && identifiedGlutenSources.length === 0 && isGlutenFreeTag && (
                        <p className="text-sm text-green-600">This product is generally considered gluten-free based on available information.</p>
                    )}

                    {mentionedNonGlutenAllergens.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          <strong>Other Potential Allergens Mentioned in Ingredients:</strong> {mentionedNonGlutenAllergens.join(', ')}.
                        </p>
                      </div>
                    )}

                    {!product.warning && identifiedGlutenSources.length === 0 && !isGlutenFreeTag && !mayContainGluten && mentionedNonGlutenAllergens.length === 0 && (
                        <p className="text-sm text-muted-foreground">For specific allergen information, please refer to the ingredients list.</p>
                    )}
                     <p className="text-xs text-muted-foreground mt-3 italic">Always check the product packaging for the most accurate and complete allergen details. Allergen information provided here is for guidance and is based on available data.</p>
                  </div>


                  {product.labelText && !product.warning && ( // Don't show labelText if recalled, note is more important
                    <div>
                      <h3 className="text-md font-semibold mb-1">Label Text</h3>
                      <p className="text-xs text-muted-foreground p-3 bg-muted rounded-md">{product.labelText}</p>
                    </div>
                  )}

                  {product.tags && product.tags.length > 0 && (
                    <div>
                      <h3 className="text-md font-semibold mb-1 flex items-center"><Tag className="h-4 w-4 mr-2 text-primary"/> Tags</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {product.tags.map(tag => (
                          <Badge key={tag} variant={tag === 'povučeno' || tag === 'sadrži-gluten' || tag === 'upozorenje' ? 'destructive' : 'secondary'}>{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.source && (
                     <div>
                      <h3 className="text-md font-semibold mb-1 flex items-center"><GitBranch className="h-4 w-4 mr-2 text-primary"/> Source</h3>
                      <p className="text-sm text-muted-foreground">{product.source}</p>
                    </div>
                  )}

                  <Button size="lg" className="w-full mt-4" disabled={product.warning}>
                    <ShoppingBag className="mr-2 h-5 w-5" /> {product.warning ? "Product Recalled" : "Add to Shopping List (Example)"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}

