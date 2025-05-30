
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
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, ShoppingBag, AlertTriangle, CheckCircle, Heart, Leaf, Info, ShieldCheck, FileText, GitBranch, Tag, Barcode, CircleAlert } from 'lucide-react';
import { placeholderProducts } from '@/app/[locale]/products/page'; 
import { Badge } from '@/components/ui/badge';
import { useFavorites } from '@/contexts/favorites-context';
import { useToast } from '@/hooks/use-toast';

// Updated Product interface to align with schema
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
}

const getNutriScoreClasses = (score?: string) => {
  if (!score) return 'bg-gray-300 text-gray-700';
  switch (score.toUpperCase()) {
    case 'A': return 'bg-green-700 text-white';
    case 'B': return 'bg-lime-500 text-black';
    case 'C': return 'bg-yellow-400 text-black';
    case 'D': return 'bg-orange-500 text-white';
    case 'E': return 'bg-red-600 text-white';
    default: return 'bg-gray-300 text-gray-700';
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

  const isGlutenFree = product.tags?.includes('gluten-free');
  const mayContainGluten = product.tags?.includes('may-contain-gluten') || product.tags?.includes('risk-of-contamination');
  const containsGluten = product.tags?.includes('contains-gluten') || product.tags?.includes('contains-wheat') || product.tags?.includes('contains-barley') || product.tags?.includes('contains-rye') || (product.tags?.includes('contains-oats') && !isGlutenFree) ;

  const identifiedGlutenSources: string[] = [];
  if (product.tags?.includes('contains-wheat')) identifiedGlutenSources.push('Wheat');
  if (product.tags?.includes('contains-barley')) identifiedGlutenSources.push('Barley');
  if (product.tags?.includes('contains-rye')) identifiedGlutenSources.push('Rye');
  if (product.tags?.includes('contains-oats') && !isGlutenFree) identifiedGlutenSources.push('Oats (may not be gluten-free)');

  const commonAllergenKeywords: { term: string, name: string }[] = [
    { term: 'lešnik', name: 'Hazelnuts' }, // Lešnik
    { term: 'kikiriki', name: 'Peanuts' }, // Kikiriki
    { term: 'soja', name: 'Soy' }, // Soja
    { term: 'sojin', name: 'Soy' }, // Sojin (e.g., sojin lecitin)
    { term: 'mleko', name: 'Milk' }, // Mleko
    { term: 'mlijeko', name: 'Milk' }, // Mlijeko (alternative spelling)
    { term: 'mlečni', name: 'Milk' }, // Mlečni
    { term: 'jaja', name: 'Eggs' }, // Jaja
    { term: 'jaje', name: 'Eggs' }, // Jaje
    { term: 'badem', name: 'Almonds' }, // Badem
    { term: 'orah', name: 'Walnuts' }, // Orah
    { term: 'susam', name: 'Sesame' }, // Susam
  ];
  
  let mentionedNonGlutenAllergens: string[] = [];
  if (product.ingredientsText && typeof product.ingredientsText === 'string') {
    const ingredientsLower = product.ingredientsText.toLowerCase();
    const foundAllergenNames = new Set<string>();
    commonAllergenKeywords.forEach(allergen => {
      if (ingredientsLower.includes(allergen.term)) {
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
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <Card className="overflow-hidden shadow-lg">
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
                        {isGlutenFree && (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-5 w-5 mr-2" />
                              <span>Certified Gluten-Free</span>
                            </div>
                          )}
                        {containsGluten && !isGlutenFree && ( 
                          <div className="flex items-center text-red-600">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            <span>Contains Gluten</span>
                          </div>
                        )}
                        {mayContainGluten && !isGlutenFree && !containsGluten && (
                          <div className="flex items-center text-orange-500">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            <span>May Contain Gluten Traces</span>
                          </div>
                        )}
                        {!isGlutenFree && !containsGluten && !mayContainGluten && (
                           <div className="flex items-center text-muted-foreground">
                             <Info className="h-5 w-5 mr-2" />
                             <span>Gluten status unknown or not specified</span>
                           </div>
                        )}
                    </div>

                    {product.nutriScore && (
                      <div>
                        <h3 className="text-md font-semibold mb-2">Nutri-Score</h3>
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getNutriScoreClasses(product.nutriScore)}`}>
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
                  
                  <div>
                    <h3 className="text-md font-semibold mb-2">Certifications & Verifications</h3>
                    <div className="space-y-2">
                      <DietaryTag label="AOECS Licensed" icon={ShieldCheck} present={product.hasAOECSLicense} />
                      <DietaryTag label="Manufacturer Statement (Gluten-Free)" icon={FileText} present={product.hasManufacturerStatement} />
                      <DietaryTag label="Admin Verified" icon={CheckCircle} present={product.isVerifiedAdmin} />
                    </div>
                  </div>

                  {product.ingredientsText && (
                    <div>
                      <h3 className="text-md font-semibold mb-1">Ingredients</h3>
                      <p className="text-xs text-muted-foreground p-3 bg-muted rounded-md">{product.ingredientsText}</p>
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <h3 className="text-md font-semibold mb-2 flex items-center">
                        <CircleAlert className="h-4 w-4 mr-2 text-primary"/> Allergen Notes
                    </h3>
                    {identifiedGlutenSources.length > 0 && (
                        <p className="text-sm text-red-600"><strong>Contains Gluten Sources:</strong> {identifiedGlutenSources.join(', ')}.</p>
                    )}
                    {identifiedGlutenSources.length === 0 && mayContainGluten && !isGlutenFree && (
                         <p className="text-sm text-orange-600"><strong>Advisory:</strong> May contain traces of gluten.</p>
                    )}
                    {identifiedGlutenSources.length === 0 && isGlutenFree && (
                        <p className="text-sm text-green-600">This product is tagged as gluten-free.</p>
                    )}
                    
                    {mentionedNonGlutenAllergens.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          <strong>Other Potential Allergens Mentioned in Ingredients:</strong> {mentionedNonGlutenAllergens.join(', ')}.
                        </p>
                      </div>
                    )}

                    {identifiedGlutenSources.length === 0 && !isGlutenFree && !mayContainGluten && mentionedNonGlutenAllergens.length === 0 && (
                        <p className="text-sm text-muted-foreground">For specific allergen information, please refer to the ingredients list.</p>
                    )}
                     <p className="text-xs text-muted-foreground mt-3 italic">Always check the product packaging for the most accurate and complete allergen details. Allergen information provided here is for guidance and is based on available data.</p>
                  </div>


                  {product.labelText && (
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
                          <Badge key={tag} variant="secondary">{tag}</Badge>
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
                  
                  <Button size="lg" className="w-full mt-4">
                    <ShoppingBag className="mr-2 h-5 w-5" /> Add to Shopping List (Example)
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

