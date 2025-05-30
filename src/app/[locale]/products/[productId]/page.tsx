
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
import { ArrowLeft, Package, ShoppingBag, AlertTriangle, CheckCircle, Heart } from 'lucide-react';
import { placeholderProducts } from '@/app/[locale]/products/page'; // Re-use from products page for now

// Minimal placeholder product data structure expected by this page
// Matches the structure in products/page.tsx
export interface Product {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  description: string;
  dataAiHint?: string;
  isGlutenFree?: boolean; 
  ingredients?: string; 
  nutriScore?: string; // Added Nutri-Score
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

export default function ProductDetailPage() {
  const params = useParams();
  const locale = params.locale as string;
  const productId = params.productId as string;

  const product = placeholderProducts.find(p => p.id === productId) as Product | undefined;

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
            description={`Details for ${product.name}`}
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
            </div>

            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-3xl">{product.name}</CardTitle>
                      <CardDescription className="text-lg text-muted-foreground">{product.category}</CardDescription>
                    </div>
                    <Button variant="outline" size="icon" className="ml-auto flex-shrink-0">
                      <Heart className="h-5 w-5" />
                      <span className="sr-only">Add to favorites</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-md font-semibold mb-1">Description</h3>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  </div>
                  
                  {product.isGlutenFree !== undefined && (
                     <div>
                        <h3 className="text-md font-semibold mb-1">Gluten Information</h3>
                        {product.isGlutenFree ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-5 w-5 mr-2" />
                              <span>Likely Gluten-Free</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600">
                              <AlertTriangle className="h-5 w-5 mr-2" />
                              <span>May Contain Gluten</span>
                            </div>
                          )}
                     </div>
                  )}

                  {product.nutriScore && (
                    <div>
                      <h3 className="text-md font-semibold mb-1">Nutri-Score</h3>
                      <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getNutriScoreClasses(product.nutriScore)}`}>
                        {product.nutriScore}
                      </span>
                    </div>
                  )}

                  {product.ingredients && (
                    <div>
                      <h3 className="text-md font-semibold mb-1">Ingredients</h3>
                      <p className="text-xs text-muted-foreground p-3 bg-muted rounded-md">{product.ingredients}</p>
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
