
// Nema 'use client' direktive ovde, ovo je Server Komponenta
import type { Metadata } from 'next';
import MojaCelijakijaSvesnoZivljenjeClient from './client';

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }): Promise<Metadata> {
  const postTitleBase = "Moja celijakija: Nije me uništila – naučila me je da živim svesno";
  const postDescriptionBase = "Lična priča o dijagnozi celijakije, putu ka svesnijem životu i borbi za zdravlje.";
  
  const title = params.locale === 'sr' 
    ? `${postTitleBase} | Gluten Detective Edukacija` 
    : `My Celiac Disease: It Taught Me to Live Consciously | Gluten Detective Education`;
  
  const description = params.locale === 'sr' 
    ? postDescriptionBase
    : `A personal story about celiac disease diagnosis, the journey to a more conscious life, and the fight for health.`;

  return {
    title,
    description,
  };
}

export default function MojaCelijakijaSvesnoZivljenjePage({ params }: { params: { locale:string; slug: string } }) {
  // Prosleđujemo locale klijentskoj komponenti ako je potrebno
  return <MojaCelijakijaSvesnoZivljenjeClient locale={params.locale} />;
}
