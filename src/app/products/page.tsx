import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListFilter, Search, ShoppingBag, PackageOpen } from 'lucide-react';
import Image from 'next/image';

// Placeholder product data
const placeholderProducts = [
  { id: '1', name: 'Gluten-Free Bread', category: 'Bakery', imageUrl: 'https://placehold.co/300x200.png', description: 'Delicious and soft gluten-free white bread.', dataAiHint: 'bread bakery' },
  { id: '2', name: 'Corn Pasta', category: 'Pasta', imageUrl: 'https://placehold.co/300x200.png', description: 'Authentic Italian corn pasta, naturally gluten-free.', dataAiHint: 'pasta corn' },
  { id: '3', name: 'Rice Cakes', category: 'Snacks', imageUrl: 'https://placehold.co/300x200.png', description: 'Light and crispy rice cakes, perfect for snacking.', dataAiHint: 'rice cakes' },
  { id: '4', name: 'Gluten-Free Oats', category: 'Cereals', imageUrl: 'https://placehold.co/300x200.png', description: 'Certified gluten-free rolled oats for breakfast.', dataAiHint: 'oats cereal' },
  { id: '5', name: 'Almond Flour Mix', category: 'Bakery', imageUrl: 'https://placehold.co/300x200.png', description: 'Versatile almond flour for baking.', dataAiHint: 'almond flour' },
  { id: '6', name: 'Quinoa Salad Mix', category: 'Snacks', imageUrl: 'https://placehold.co/300x200.png', description: 'Ready-to-eat quinoa salad.', dataAiHint: 'quinoa salad' },
];
// Unique categories for the select dropdown
const productCategories = Array.from(new Set(placeholderProducts.map(p => p.category)));


export default function ProductsPage() {
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
            icon={ShoppingBag} // Changed from ListFilter for consistency with nav
          />

          <div className="mb-8 p-6 bg-card border rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <label htmlFor="search" className="text-sm font-medium">Search Products</label>
                {/* Removed unsupported icon prop from Input */}
                <Input id="search" placeholder="Search by name or brand..." />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="category" className="text-sm font-medium">Category</label>
                <Select>
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
              <Button className="w-full md:w-auto">
                <Search className="mr-2 h-4 w-4" /> Apply Filters
              </Button>
            </div>
          </div>

          {placeholderProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {placeholderProducts.map(product => (
                <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-200">
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
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-1">{product.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mb-2">{product.category}</CardDescription>
                    <p className="text-sm mb-3 h-10 overflow-hidden">{product.description}</p>
                    <Button variant="outline" size="sm" className="w-full">View Details</Button>
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
