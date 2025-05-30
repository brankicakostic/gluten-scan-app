import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, StarOff, ShoppingBag, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';

// Placeholder favorite products data
const placeholderFavorites = [
  { id: '1', name: 'Gluten-Free Oatmeal', category: 'Breakfast', imageUrl: 'https://placehold.co/300x200.png', isGlutenFree: true, dataAiHint: 'oatmeal breakfast' },
  { id: '2', name: 'Almond Flour Crackers', category: 'Snacks', imageUrl: 'https://placehold.co/300x200.png', isGlutenFree: true, dataAiHint: 'crackers snack' },
];


export default function FavoritesPage() {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarRail />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-6 md:p-8">
          <PageHeader 
            title="Favorite Products"
            description="Manage your list of favorite gluten-free items."
            icon={Heart}
          />
          
          {placeholderFavorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {placeholderFavorites.map(product => (
                <Card key={product.id} className="overflow-hidden group hover:shadow-xl transition-shadow duration-200">
                  <CardHeader className="p-0 relative">
                    <Image 
                      src={product.imageUrl} 
                      alt={product.name} 
                      width={400} 
                      height={200} 
                      className="w-full h-48 object-cover"
                      data-ai-hint={product.dataAiHint}
                    />
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove from favorites</span>
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-1">{product.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mb-2">{product.category}</CardDescription>
                    {product.isGlutenFree ? (
                        <div className="flex items-center text-green-600 text-sm mt-1">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span>Gluten-Free</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600 text-sm mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          <span>May Contain Gluten</span>
                        </div>
                      )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <StarOff className="mx-auto h-16 w-16 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Favorites Yet</h3>
              <p>Add products to your favorites list to see them here.</p>
              <Button variant="outline" className="mt-4">
                <ShoppingBag className="mr-2 h-4 w-4" /> Browse Products
              </Button>
            </div>
          )}
        </main>
      </SidebarInset>
    </div>
  );
}
