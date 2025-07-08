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
    // Using console.warn instead of console.error as this is a non-critical, handled error.
    console.warn("Could not fetch daily celiac tip. This is expected if the API key is not set. The page will load with a fallback tip.");
    
    // Gracefully handle the error by providing a fallback tip.
    initialTip = {
      summary: "Could not load the Daily Tip.",
      details: "The daily tip feature requires a valid AI API key to function. Please ensure the GOOGLE_API_KEY or GEMINI_API_KEY is set in your environment variables. This information is not medical advice; please consult with a healthcare professional for any health concerns."
    };
  }

  return (
    <HomeClient 
      initialProducts={initialProducts} 
      initialTip={initialTip} 
    />
  );
}
