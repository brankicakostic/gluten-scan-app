// This is a Server Component that fetches all products for the favorites page.
import { getProducts } from '@/lib/services/product-service';
import FavoritesClientPage from './client';

export default async function FavoritesPage() {
  // Fetch all products on the server
  const allProducts = await getProducts();

  // The client component will handle filtering based on localStorage
  return <FavoritesClientPage allProducts={allProducts} />;
}
