// This is a Server Component responsible for fetching data for the admin page.
import { getProducts } from '@/lib/services/product-service';
import { getReports } from '@/lib/services/report-service';
import AdminClientPage from './client';

export const dynamic = 'force-dynamic'; // Ensures the page is always dynamic

export default async function AdminPage({ params }: { params: { locale: string } }) {
  // Fetch all data on the server each time the page is loaded
  const allProducts = await getProducts();
  const allReports = await getReports();

  return <AdminClientPage initialProducts={allProducts} initialReports={allReports} locale={params.locale} />;
}
