
'use client'; // Required for useState, useEffect, event handlers

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ShoppingBag, PackageOpen } from 'lucide-react';
import Image from 'next/image';

// Placeholder product data - Exported for use in product detail page
export const placeholderProducts = [
  { id: '1', name: 'Gluten-Free Bread', category: 'Bakery', imageUrl: 'https://placehold.co/300x200.png', description: 'Delicious and soft gluten-free white bread.', dataAiHint: 'bread bakery', isGlutenFree: true, ingredients: 'Water, Rice Flour, Tapioca Starch, Potato Starch, Sunflower Oil, Yeast, Sugar, Psyllium Husk Powder, Salt, Xanthan Gum.' },
  { id: '2', name: 'Corn Pasta', category: 'Pasta', imageUrl: 'https://placehold.co/300x200.png', description: 'Authentic Italian corn pasta, naturally gluten-free.', dataAiHint: 'pasta corn', isGlutenFree: true, ingredients: 'Corn Flour (100%). May contain traces of soy.' },
  { id: '3', name: 'Rice Cakes', category: 'Snacks', imageUrl: 'https://placehold.co/300x200.png', description: 'Light and crispy rice cakes, perfect for snacking.', dataAiHint: 'rice cakes', isGlutenFree: true, ingredients: 'Whole Grain Brown Rice, Sea Salt.' },
  { id: '4', name: 'Gluten-Free Oats', category: 'Cereals', imageUrl: 'https://placehold.co/300x200.png', description: 'Certified gluten-free rolled oats for breakfast.', dataAiHint: 'oats cereal', isGlutenFree: true, ingredients: 'Certified Gluten-Free Whole Grain Rolled Oats.' },
  { id: '5', name: 'Almond Flour Mix', category: 'Bakery', imageUrl: 'https://placehold.co/300x200.png', description: 'Versatile almond flour for baking.', dataAiHint: 'almond flour', isGlutenFree: true, ingredients: 'Blanched Almond Flour.' },
  { id: '6', name: 'Quinoa Salad Mix', category: 'Snacks', imageUrl: 'https://placehold.co/300x200.png', description: 'Ready-to-eat quinoa salad.', dataAiHint: 'quinoa salad', isGlutenFree: true, ingredients: 'Cooked Quinoa, Vegetables (Bell Peppers, Corn, Black Beans), Olive Oil, Lemon Juice, Spices.' },
  { id: '7', name: 'Regular Wheat Bread', category: 'Bakery', imageUrl: 'https://placehold.co/300x200.png', description: 'Traditional wheat bread.', dataAiHint: 'wheat bread', isGlutenFree: false, ingredients: 'Wheat Flour, Water, Yeast, Salt, Sugar. Contains: Wheat.' },
];
// Unique categories for the select dropdown
const productCategories = Array.from(new Set(placeholderProducts.map(p => p.category)));


export default function ProductsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [displayedProducts, setDisplayedProducts] = useState(placeholderProducts);

  useEffect(() => {
    let filtered = placeholderProducts;
    if (searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase().trim())
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    setDisplayedProducts(filtered);
  }, [searchTerm, selectedCategory]);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarRail />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-6 md:p-8">
          <PageHeader 
            title="Find Gluten-Free Products"
            description="Search and filter through a curated list of gluten-free items."
            icon={ShoppingBag}
          />

          <div className="mb-8 p-6 bg-card border rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="search" className="text-sm font-medium">Search Products</label>
                <Input 
                  id="search" 
                  placeholder="Search by name or description..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="category" className="text-sm font-medium">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {productCategories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Apply Filters button can be removed if filtering is live, or kept for explicit action */}
              {/* <Button className="w-full md:w-auto">
                <Search className="mr-2 h-4 w-4" /> Apply Filters
              </Button> */}
            </div>
          </div>

          {displayedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedProducts.map(product => (
                <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-200 flex flex-col">
                  <CardHeader className="p-0">
                    <Image 
                      src={product.imageUrl} 
                      alt={product.name} 
                      width={400} 
                      height={200} 
                      className="w-full h-48 object-cover"
                      data-ai-hint={product.dataAiHint}
                    />
                  </CardHeader>
                  <CardContent className="p-4 flex flex-col flex-grow">
                    <CardTitle className="text-lg mb-1">{product.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mb-2">{product.category}</CardDescription>
                    <p className="text-sm mb-3 h-10 overflow-hidden flex-grow">{product.description}</p>
                    <Button asChild variant="outline" size="sm" className="w-full mt-auto">
                      <Link href={`/${locale}/products/${product.id}`}>View Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <PackageOpen className="mx-auto h-16 w-16 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
              <p>Try adjusting your filters or search terms.</p>
            </div>
          )}
        </main>
      </SidebarInset>
    </div>
  );
}
