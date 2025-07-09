// This is a Server Component responsible for fetching initial data.
import { getDailyCeliacTip, type DailyCeliacTipOutput } from '@/ai/flows/daily-celiac-tip-flow';
import HomeClient from './home-client';

export default async function HomePage() {
  // Fetch initial data on the server
  let initialTip: DailyCeliacTipOutput;
  try {
    initialTip = await getDailyCeliacTip();
  } catch (error) {
    // Using console.warn instead of console.error as this is a non-critical, handled error.
    console.warn("Could not fetch daily celiac tip. This is expected if the API key is not set. The page will load with a fallback tip.");
    
    // Gracefully handle the error by providing a fallback tip.
    initialTip = {
      summary: "Nije moguće učitati dnevni savet.",
      details: "Funkcija dnevnog saveta zahteva ispravan AI API ključ. Proverite da li je GOOGLE_API_KEY ili GEMINI_API_KEY postavljen u vašim environment varijablama. Ova informacija nije medicinski savet; molimo vas da se za zdravstvene probleme konsultujete sa zdravstvenim radnikom."
    };
  }

  return (
    <HomeClient 
      initialTip={initialTip} 
    />
  );
}
