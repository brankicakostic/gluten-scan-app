// This file uses client-side rendering.
'use client';

import { useEffect, useState } from 'react';
import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, StarOff, ShoppingBag, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useFavorites } from '@/contexts/favorites-context';
import type { Product } from '@/lib/products';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useParams } from 'next/navigation';


export default function FavoritesPage() {
  const { getFavoriteProducts, removeFavorite } = useFavorites();
  const [favoritedProducts, setFavoritedProducts] = useState<Product[]>([]);
  const { toast } = useToast();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    setFavoritedProducts(getFavoriteProducts());
  }, [getFavoriteProducts, removeFavorite]); // Added removeFavorite to dependency array to ensure re-render on removal

  const handleRemoveFavorite = (product: Product) => {
    removeFavorite(product.id);
    toast({ title: `${product.name} removed from favorites.` });
    // The useEffect will re-render the list because favoriteProductIds in context changes,
    // which causes getFavoriteProducts to return a new list.
  };


  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarRail />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            <PageHeader 
              title="Favorite Products"
              description="Manage your list of favorite gluten-free items."
              icon={Heart}
            />
            
            {favoritedProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoritedProducts.map(product => {
                  const isGlutenFreeTag = product.tags?.includes('gluten-free');
                  const containsGlutenTag = product.tags?.includes('contains-gluten') || product.tags?.includes('contains-wheat');
                  const mayContainGlutenTag = product.tags?.includes('may-contain-gluten') || product.tags?.includes('risk-of-contamination');

                  return (
                  <Card key={product.id} className="overflow-hidden group hover:shadow-xl transition-shadow duration-200 flex flex-col">
                    <CardHeader className="p-0 relative">
                      <Link href={`/${locale}/products/${product.id}`}>
                        <Image 
                          src={product.imageUrl} 
                          alt={product.name} 
                          width={400} 
                          height={200} 
                          className="w-full h-48 object-cover"
                          data-ai-hint={product.dataAiHint || 'product image'}
                        />
                      </Link>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2 opacity-80 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveFavorite(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove from favorites</span>
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col flex-grow">
                      <Link href={`/${locale}/products/${product.id}`} className="hover:underline">
                        <CardTitle className="text-lg mb-1">{product.name}</CardTitle>
                      </Link>
                      {product.brand && <CardDescription className="text-xs text-muted-foreground mb-1">{product.brand}</CardDescription>}
                      <CardDescription className="text-sm text-muted-foreground mb-2">{product.category}</CardDescription>
                      
                      {isGlutenFreeTag ? (
                        <div className="flex items-center text-green-600 dark:text-green-400 text-xs mt-1 mb-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          <span>Gluten-Free</span>
                        </div>
                      ) : containsGlutenTag ? (
                        <div className="flex items-center text-red-600 dark:text-red-500 text-xs mt-1 mb-1">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          <span>Contains Gluten</span>
                        </div>
                      ) : mayContainGlutenTag ? (
                        <div className="flex items-center text-orange-500 dark:text-orange-400 text-xs mt-1 mb-1">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          <span>May Contain Traces</span>
                        </div>
                      ) : (
                         <div className="flex items-center text-muted-foreground text-xs mt-1 mb-1">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          <span>Proveriti sastav</span>
                        </div>
                      )}
                      <p className="text-sm mb-3 h-10 overflow-hidden flex-grow">{product.description}</p>
                       <Button asChild variant="outline" size="sm" className="w-full mt-auto">
                          <Link href={`/${locale}/products/${product.id}`}>View Details</Link>
                        </Button>
                    </CardContent>
                  </Card>
                )})}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <StarOff className="mx-auto h-16 w-16 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Favorites Yet</h3>
                <p>Add products to your favorites list to see them here.</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href={`/${locale}/products`}>
                    <ShoppingBag className="mr-2 h-4 w-4" /> Browse Products
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}
