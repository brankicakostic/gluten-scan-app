// This is a Server Component responsible for fetching all products.
import { getProducts } from '@/lib/services/product-service';
import ProductsClientPage, { type CategoryInfo } from './client';

export default async function ProductsPage() {
  // Fetch all products on the server
  const allProducts = await getProducts();
  
  const categoryCounts = allProducts.reduce((acc, product) => {
    const category = product.category || 'Nekategorizovano';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const productCategories: CategoryInfo[] = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, 'sr')); // Sort alphabetically

  // Create a separate list for quick filters, sorted by count
  const quickFilterCategories = [...productCategories].sort((a, b) => b.count - a.count);

  return <ProductsClientPage allProducts={allProducts} productCategories={productCategories} quickFilterCategories={quickFilterCategories} />;
}
