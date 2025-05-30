
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
import { Search, ShoppingBag, PackageOpen, CheckCircle, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import type { Product } from './[productId]/page'; // Import Product type

// Updated placeholder product data
export const placeholderProducts: Product[] = [
  { 
    id: '1', 
    name: 'Gluten-Free Bread', 
    brand: 'Schar',
    barcode: '8008698000478',
    category: 'Bakery', 
    imageUrl: 'https://placehold.co/300x200.png', 
    description: 'Delicious and soft gluten-free white bread.', 
    ingredientsText: 'Water, Rice Flour, Tapioca Starch, Potato Starch, Sunflower Oil, Yeast, Sugar, Psyllium Husk Powder, Salt, Xanthan Gum.', 
    labelText: 'Certified Gluten-Free. Suitable for celiacs and those with gluten intolerance.',
    hasAOECSLicense: true,
    hasManufacturerStatement: true,
    isVerifiedAdmin: false,
    source: 'Manufacturer Website',
    tags: ['gluten-free', 'lactose-free', 'schar-brand'],
    nutriScore: 'B', 
    isLactoseFree: true, 
    isSugarFree: false, 
    isPosno: true,
    dataAiHint: 'bread bakery'
  },
  { 
    id: '2', 
    name: 'Corn Pasta', 
    brand: 'Barilla',
    barcode: '8076809578587',
    category: 'Pasta', 
    imageUrl: 'https://placehold.co/300x200.png', 
    description: 'Authentic Italian corn pasta, naturally gluten-free.', 
    ingredientsText: 'Corn Flour (100%). May contain traces of soy.', 
    labelText: 'Gluten-Free Corn Pasta. Cooks in 8-10 minutes.',
    hasAOECSLicense: true,
    hasManufacturerStatement: true,
    isVerifiedAdmin: true,
    source: 'OpenFoodFacts',
    tags: ['gluten-free', 'corn-based', 'pasta', 'barilla-brand'],
    nutriScore: 'A', 
    isLactoseFree: true, 
    isSugarFree: true, 
    isPosno: true,
    dataAiHint: 'pasta corn'
  },
  { 
    id: '3', 
    name: 'Rice Cakes', 
    brand: 'Nature Valley',
    barcode: '016000273047',
    category: 'Snacks', 
    imageUrl: 'https://placehold.co/300x200.png', 
    description: 'Light and crispy rice cakes, perfect for snacking.', 
    ingredientsText: 'Whole Grain Brown Rice, Sea Salt.', 
    labelText: 'Simple and natural rice cakes. Only 2 ingredients.',
    hasAOECSLicense: false,
    hasManufacturerStatement: true,
    isVerifiedAdmin: false,
    source: 'User Input',
    tags: ['gluten-free', 'snack', 'rice-based', 'low-fat'],
    nutriScore: 'A', 
    isLactoseFree: true, 
    isSugarFree: true, 
    isPosno: true,
    dataAiHint: 'rice cakes'
  },
  { 
    id: '4', 
    name: 'Gluten-Free Oats', 
    brand: 'Bob\'s Red Mill',
    barcode: '039978003305',
    category: 'Cereals', 
    imageUrl: 'https://placehold.co/300x200.png', 
    description: 'Certified gluten-free rolled oats for breakfast.', 
    ingredientsText: 'Certified Gluten-Free Whole Grain Rolled Oats.', 
    labelText: 'Heart-healthy whole grain oats. Tested for gluten.',
    hasAOECSLicense: true,
    hasManufacturerStatement: true,
    isVerifiedAdmin: true,
    source: 'CeliVita',
    tags: ['gluten-free', 'oats', 'breakfast', 'high-fiber'],
    nutriScore: 'A', 
    isLactoseFree: true, 
    isSugarFree: true, 
    isPosno: true,
    dataAiHint: 'oats cereal'
  },
  { 
    id: '5', 
    name: 'Almond Flour Mix', 
    brand: 'King Arthur Baking',
    barcode: '071012060409',
    category: 'Bakery', 
    imageUrl: 'https://placehold.co/300x200.png', 
    description: 'Versatile almond flour for baking.', 
    ingredientsText: 'Blanched Almond Flour.', 
    labelText: 'Finely ground almond flour for gluten-free baking. Keto-friendly.',
    hasAOECSLicense: false,
    hasManufacturerStatement: true,
    isVerifiedAdmin: false,
    source: 'Manufacturer Website',
    tags: ['gluten-free', 'almond-flour', 'baking', 'keto'],
    nutriScore: 'C', 
    isLactoseFree: true, 
    isSugarFree: true, 
    isPosno: true,
    dataAiHint: 'almond flour'
  },
  { 
    id: '6', 
    name: 'Quinoa Salad Mix', 
    brand: 'Seeds of Change',
    barcode: '054800000708',
    category: 'Snacks', 
    imageUrl: 'https://placehold.co/300x200.png', 
    description: 'Ready-to-eat quinoa salad.', 
    ingredientsText: 'Cooked Quinoa, Vegetables (Bell Peppers, Corn, Black Beans), Olive Oil, Lemon Juice, Spices.', 
    labelText: 'Organic quinoa and brown rice with garlic. Ready in 90 seconds.',
    hasAOECSLicense: false,
    hasManufacturerStatement: false, // Example: might be GF by ingredients but no explicit statement
    isVerifiedAdmin: false,
    source: 'User Input',
    tags: ['gluten-free-by-ingredients', 'quinoa', 'salad', 'organic', 'quick-meal', 'may-contain-traces'], // Example may-contain
    nutriScore: 'B', 
    isLactoseFree: true, 
    isSugarFree: false, 
    isPosno: true,
    dataAiHint: 'quinoa salad'
  },
  { 
    id: '7', 
    name: 'Regular Wheat Bread', 
    brand: 'Wonder Bread',
    barcode: '072250010107',
    category: 'Bakery', 
    imageUrl: 'https://placehold.co/300x200.png', 
    description: 'Traditional wheat bread.', 
    ingredientsText: 'Wheat Flour, Water, Yeast, Salt, Sugar. Contains: Wheat.', 
    labelText: 'Classic white bread. Contains gluten and wheat.',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: true,
    source: 'Manual Entry',
    tags: ['contains-gluten', 'wheat', 'bakery'],
    nutriScore: 'D', 
    isLactoseFree: false, 
    isSugarFree: false, 
    isPosno: false,
    dataAiHint: 'wheat bread'
  },
];

const productCategories = Array.from(new Set(placeholderProducts.map(p => p.category)));

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
        (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
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
                  placeholder="Search by name, brand, or description..." 
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
            </div>
          </div>

          {displayedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedProducts.map(product => {
                const isGlutenFreeTag = product.tags?.includes('gluten-free');
                const containsGlutenTag = product.tags?.includes('contains-gluten') || product.tags?.includes('contains-wheat');
                const mayContainGlutenTag = product.tags?.includes('may-contain-gluten') || product.tags?.includes('risk-of-contamination');
                
                return (
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
                      {product.brand && <CardDescription className="text-xs text-muted-foreground mb-1">{product.brand}</CardDescription>}
                      <div className="flex justify-between items-center mb-2">
                        <CardDescription className="text-sm text-muted-foreground">{product.category}</CardDescription>
                        {product.nutriScore && (
                          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${getNutriScoreClasses(product.nutriScore)}`}>
                            Nutri-Score: {product.nutriScore}
                          </span>
                        )}
                      </div>
                      
                      {isGlutenFreeTag && (
                        <div className="flex items-center text-green-600 text-xs mt-1 mb-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          <span>Gluten-Free</span>
                        </div>
                      )}
                      {containsGlutenTag && (
                        <div className="flex items-center text-red-600 text-xs mt-1 mb-1">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          <span>Contains Gluten</span>
                        </div>
                      )}
                      {mayContainGlutenTag && !isGlutenFreeTag && !containsGlutenTag && (
                        <div className="flex items-center text-orange-500 text-xs mt-1 mb-1">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          <span>May Contain Traces</span>
                        </div>
                      )}

                      <p className="text-sm mb-3 h-10 overflow-hidden flex-grow">{product.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {product.isLactoseFree && <Badge variant="secondary" className="text-xs">Lactose-Free</Badge>}
                        {product.isSugarFree && <Badge variant="secondary" className="text-xs">Sugar-Free</Badge>}
                        {product.isPosno && <Badge variant="secondary" className="text-xs">Posno</Badge>}
                        {/* Display a few other key tags, avoiding redundancy */}
                        {product.tags?.filter(tag => !['gluten-free', 'contains-gluten', 'may-contain-gluten', 'contains-wheat', 'risk-of-contamination'].includes(tag)).slice(0,2).map(tag => (
                           <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full mt-auto">
                        <Link href={`/${locale}/products/${product.id}`}>View Details</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
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

