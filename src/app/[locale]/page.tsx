// This is a Server Component responsible for fetching initial data.
import { getFeaturedProducts } from '@/lib/services/product-service';
import { getDailyCeliacTip, type DailyCeliacTipOutput } from '@/ai/flows/daily-celiac-tip-flow';
import HomeClient from './home-client';

export default async function HomePage() {
  // Fetch initial data on the server
  const initialProducts = await getFeaturedProducts(8);
  
  let initialTip: DailyCeliacTipOutput;
  try {
    initialTip = await getDailyCeliacTip();
  } catch (error) {
    console.error("Failed to fetch daily celiac tip. This might be due to a missing API key. The page will load without a tip.", error);
    // Gracefully handle the error by providing a fallback tip.
    initialTip = {
      summary: "Could not load the Daily Tip.",
      details: "The daily tip feature requires a valid AI API key. Please ensure the GOOGLE_API_KEY or GEMINI_API_KEY is set in your environment variables. This information is not medical advice; please consult with a healthcare professional for any health concerns."
    };
  }

  return (
    <HomeClient 
      initialProducts={initialProducts} 
      initialTip={initialTip} 
    />
  );
}
