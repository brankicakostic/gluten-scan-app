// This is a Server Component responsible for fetching initial data.
import { getDailyCeliacTip, type DailyCeliacTipOutput } from '@/ai/flows/daily-celiac-tip-flow';
import HomeClient from './home-client';
import { getProducts, getFeaturedProducts } from '@/lib/services/product-service';
import type { Product } from '@/lib/products';

interface CategoryInfo {
  name: string;
  count: number;
}

export default async function HomePage() {
  // Fetch initial data on the server
  let initialTip: DailyCeliacTipOutput;
  try {
    initialTip = await getDailyCeliacTip();
  } catch (error) {
    // Gracefully handle the error by providing a fallback tip.
    initialTip = {
      summary: "Nije moguće učitati dnevni savet.",
      details: "Funkcija dnevnog saveta zahteva ispravan AI API ključ. Proverite da li je GOOGLE_API_KEY ili GEMINI_API_KEY postavljen u vašim environment varijablama. Ova informacija nije medicinski savet; molimo vas da se za zdravstvene probleme konsultujete sa zdravstvenim radnikom."
    };
  }
  
  // Fetch products and calculate category counts
  const allProducts = await getProducts();
  const categoryCounts = allProducts.reduce((acc, product) => {
    const category = product.category || 'Nekategorizovano';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoriesWithCounts: CategoryInfo[] = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count); // Sort by count descending

  // Fetch featured products for the new section
  const featuredProducts = await getFeaturedProducts(8);

  return (
    <HomeClient 
      initialTip={initialTip} 
      categories={categoriesWithCounts}
      featuredProducts={featuredProducts}
    />
  );
}
