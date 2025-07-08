// This is a Server Component responsible for fetching data for the admin page.
import { getProducts } from '@/lib/services/product-service';
import AdminClientPage from './client';

export const dynamic = 'force-dynamic'; // Ensures the page is always dynamic

export default async function AdminPage() {
  // Fetch all products on the server each time the page is loaded
  const allProducts = await getProducts();

  return <AdminClientPage initialProducts={allProducts} />;
}
