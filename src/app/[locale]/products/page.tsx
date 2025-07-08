// This is a Server Component responsible for fetching all products.
import { getProducts } from '@/lib/services/product-service';
import ProductsClientPage from './client';

export default async function ProductsPage() {
  // Fetch all products on the server
  const allProducts = await getProducts();
  const productCategories = Array.from(new Set(allProducts.map(p => p.category))).sort();

  return <ProductsClientPage allProducts={allProducts} productCategories={productCategories} />;
}
