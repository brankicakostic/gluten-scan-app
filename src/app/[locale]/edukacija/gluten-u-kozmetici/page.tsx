
// Nema 'use client' direktive ovde, ovo je Server Komponenta
import type { Metadata } from 'next';
import GlutenUKozmeticiClient from './client';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const postTitleBase = "Da li je kozmetika sa glutenom štetna za osobe sa celijakijom?";
  const postDescriptionBase = "Detaljno objašnjenje o uticaju glutena u kozmetici na osobe sa celijakijom.";
  
  const title = params.locale === 'sr' 
    ? `${postTitleBase} | Gluten Scan Edukacija` 
    : `Is Gluten in Cosmetics Harmful for Celiacs? | Gluten Scan Education`;
  
  const description = params.locale === 'sr' 
    ? postDescriptionBase
    : `A detailed explanation about the impact of gluten in cosmetics on people with celiac disease.`;

  return {
    title,
    description,
  };
}

export default function GlutenUKozmeticiPage({ params }: { params: { locale: string } }) {
  // Prosleđujemo locale klijentskoj komponenti ako je potrebno
  return <GlutenUKozmeticiClient locale={params.locale} />;
}
