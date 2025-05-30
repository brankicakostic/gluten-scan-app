
'use client'; // Required for useState, useEffect, event handlers

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ShoppingBag, PackageOpen, CheckCircle, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import type { Product } from './[productId]/page'; // Import Product type

// Updated placeholder product data based on user input
export const placeholderProducts: Product[] = [
  {
    id: 'product-0',
    name: 'Instant Palenta',
    brand: 'Aleksandija',
    category: 'Flours & Grains',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'sa sirom - 60g',
    ingredientsText: 'Griz od kukuruza (semolina) 94%, prah od sira 5%, stolna so 1%',
    labelText: 'Instant Palenta',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free'],
    nutriScore: undefined,
    isLactoseFree: false,
    isSugarFree: true,
    isPosno: false,
    dataAiHint: 'instant palenta'
  },
  {
    id: 'product-1',
    name: 'Pirinčani Griz',
    brand: 'Aleksandija',
    category: 'Flours & Grains',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'pirinčani griz - 300g',
    ingredientsText: 'pirinčani griz 100%',
    labelText: 'Pirinčani Griz',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: false, // Assuming not specified, default to false
    isSugarFree: true,
    isPosno: true,
    dataAiHint: 'pirinčani griz'
  },
  {
    id: 'product-2',
    name: 'Prezle',
    brand: 'Aleksandija',
    category: 'Flours & Grains',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'od prosa i heljde - 300g',
    ingredientsText: 'Kukuruzno brašno, brašno od pirinča, brašno od prosa 12%, brašno od heljde 7%, pekarski kvasac, šećer, brašno od guar graška, so, biljna mast (palmina), sojin lecitin, sredstva za dizanje (amonijum bikarbonat, natrijum bikarbonat)',
    labelText: 'Prezle',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'posno'], // Contains šećer
    nutriScore: undefined,
    isLactoseFree: false, // Assuming not specified
    isSugarFree: false, // Contains šećer
    isPosno: true,
    dataAiHint: 'prezle prosa'
  },
  {
    id: 'product-3',
    name: 'Dvopek',
    brand: 'Aleksandija',
    category: 'Flours & Grains',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'od heljde i prosa - 110g',
    ingredientsText: 'Brašno od pirinča, kukuruzni skrob, kukuruzno brašno, brašno od prosa 11%, brašno od heljde 10%, biljno ulje (palmino), pekarski kvasac, šećer, kuvarska so, brašno od guar graška, sirovi sojin lecitin, sredstvo za dizanje testa (amonijum bikarbonat, natrijum bikarbonat), so',
    labelText: 'Dvopek',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'posno'], // Contains šećer
    nutriScore: undefined,
    isLactoseFree: false, // Assuming not specified
    isSugarFree: false, // Contains šećer
    isPosno: true,
    dataAiHint: 'dvopek heljde'
  },
  {
    id: 'product-4',
    name: 'Dvopek',
    brand: 'Aleksandija',
    category: 'Flours & Grains',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'sa prosom - 110g',
    ingredientsText: 'Brašno od pirinča, kukuruzni skrob, kukuruzno brašno, brašno od prosa 15%, suncokretovo ulje, šećer, kvasac, brašno od guar graška, so, sirovi sojin lecitin, sredstvo za dizanje testa (amonijum bikarbonat, natrijum bikarbonat)',
    labelText: 'Dvopek',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'posno'], // Contains šećer
    nutriScore: undefined,
    isLactoseFree: false, // Assuming not specified
    isSugarFree: false, // Contains šećer
    isPosno: true,
    dataAiHint: 'dvopek prosom'
  },
  {
    id: 'product-5',
    name: 'Cookies',
    brand: 'Aleksandija',
    category: 'Sweets & Biscuits',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'keks sa čokoladom - 200g',
    ingredientsText: 'Brašno od pirinča, brašno od prosa, kukuruzni skrob, šećer, biljna mast (suncokretova), brašno od heljde, komadići čokolade 8% (šećer, najmanje 40% suve kakao mase, najmanje 7% kakao maslaca), vanilin šećer, sirovi sojin lecitin, brašno od guar graška, sredstva za dizanje testa (amonijum bikarbonat, prašak za pecivo), kuvarska so',
    labelText: 'Cookies',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: false, // Assuming not specified
    isSugarFree: false, // Contains šećer
    isPosno: true,
    dataAiHint: 'čokoladni keks'
  },
  {
    id: 'product-6',
    name: 'Čajni Kolutići',
    brand: 'Aleksandija',
    category: 'Sweets & Biscuits',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'sa heljdom - 300g',
    ingredientsText: 'Brašno od pirinča, kukuruzni skrob, šećer, brašno od prosa, palmino ulje, brašno od heljde 6,5%, kukuruzno brašno, brašno od guar graška, sirovi sojin lecitin, sredstvo za dizanje testa (amonijum bikarbonat, natrijum bikarbonat)',
    labelText: 'Čajni Kolutići',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: false, // Assuming not specified
    isSugarFree: false, // Contains šećer
    isPosno: true,
    dataAiHint: 'čajni kolutići'
  },
  {
    id: 'product-7',
    name: 'KO-GO',
    brand: 'Aleksandija',
    category: 'Sweets & Biscuits',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'sendvič keks bez šećera - 200g',
    ingredientsText: 'Brašno od pirinča, kukuruzni skrob, biljna mast (palmina), krem od kakaa min 20%, zaslađivači (eritritol, steviol glikozid), kakao prah, lešnici, brašno od soje, sojin lecitin, vanila, skrob od tapioke, brašno od guar graška, sredstva za dizanje testa (amonijum bikarbonat, prašak za pecivo), aroma limuna, so',
    labelText: 'KO-GO',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: false, // Assuming not specified
    isSugarFree: true,
    isPosno: true,
    dataAiHint: 'kogo keks'
  },
  {
    id: 'product-8',
    name: 'Keks Života',
    brand: 'Aleksandija',
    category: 'Sweets & Biscuits',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'mleveni keks bez šećera - 300g',
    ingredientsText: 'Brašno od pirinča, kukuruzni skrob, skrob od tapioke, biljno ulje (palmino), brašno od guar graška, sojin lecitin, zaslađivač (eritritol, steviol glikozidi), sredstvo za dizanje testa (amonijum bikarbonat, natrijum bikarbonat), so',
    labelText: 'Keks Života',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: false, // Assuming not specified
    isSugarFree: true,
    isPosno: true,
    dataAiHint: 'mleveni keks'
  },
  {
    id: 'product-9',
    name: 'Happy Life',
    brand: 'Aleksandija',
    category: 'Sweets & Biscuits',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'mleveni keks - 300g',
    ingredientsText: 'Brašno od pirinča, kukuruzni skrob, kukuruzno brašno, brašno od prosa, šećer, suncokretovo ulje, brašno od guar graška, sredstvo za pohovanje (amonijum bikarbonat)',
    labelText: 'Happy Life',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: false, // Assuming not specified
    isSugarFree: false, // Contains šećer
    isPosno: true,
    dataAiHint: 'happy keks'
  },
  {
    id: 'product-10',
    name: 'Pusa',
    brand: 'Aleksandija',
    category: 'Sweets & Biscuits',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'keks od prosa - 150g',
    ingredientsText: 'Kukuruzni skrob, brašno od prosa, šećer, kukuruzno brašno, brašno od pirinča, biljna mast, kakao prah sa smanjenim sadržajem masti 10%, brašno od guar graška, vanilin šećer, sirovi sojin lecitin, so, sredstvo za dizanje testa (amonijum bikarbonat)',
    labelText: 'Pusa',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: false, // Assuming not specified
    isSugarFree: false, // Contains šećer
    isPosno: true,
    dataAiHint: 'pusa keks'
  },
  {
    id: 'product-11',
    name: 'Premium Univerzal Mix',
    brand: 'Aleksandija',
    category: 'Flours & Grains',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'univerzalna mešavina brašna - 1kg',
    ingredientsText: 'Brašno od pirinča, brašno od prosa, krompirov skrob, kukuruzni skrob, brašno od guar graška, zgušnjivač (ksantan guma)',
    labelText: 'Premium Univerzal Mix',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: true, // No obvious lactose
    isSugarFree: true,
    isPosno: true,
    dataAiHint: 'univerzalno brašno'
  },
  {
    id: 'product-12',
    name: 'Vanilice',
    brand: 'Aleksandija',
    category: 'Sweets & Biscuits',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'sa kajsijom - 180g',
    ingredientsText: 'Brašno od pirinča, brašno od prosa (20%), kukuruzni skrob, voćni fil (šećer, kajsijevo pirea (40%), regulator kiselosti (limunska kiselina), sredstvo za geliranje (pektin)), biljna mast (palmina), šećer, vanilin šećer, sirovi sojin lecitin, brašno od guar graška, so, sredstvo za dizanje testa (amonijum bikarbonat, natrijum bikarbonat)',
    labelText: 'Vanilice',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: false, // Assuming not specified
    isSugarFree: false, // Contains šećer
    isPosno: true,
    dataAiHint: 'vanilice kajsijom'
  },
  {
    id: 'product-13',
    name: 'Integralni Štapići',
    brand: 'Aleksandija',
    category: 'Salty Snacks',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'sa heljdom i prosom - 130g',
    ingredientsText: 'Kukuruzni skrob, brašno od pirinča, brašno od prosa 11%, brašno od heljde 10%, suncokretovo ulje, stolna so, brašno od guar graška, sredstva za dizanje testa (amonijum bikarbonat, prašak za pecivo)',
    labelText: 'Integralni Štapići',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: true, // No obvious lactose
    isSugarFree: true,
    isPosno: true,
    dataAiHint: 'integralni štapići'
  },
  {
    id: 'product-14',
    name: 'Chia',
    brand: 'Aleksandija',
    category: 'Salty Snacks',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'krekeri sa čijom - 140g',
    ingredientsText: 'Kukuruzno brašno, brašno od pirinča, kukuruzni skrob, brašno od prosa, biljna mast (palmina), čija 3%, so, zgušnjivač (guar guma), sredstvo za dizanje testa (amonijum bikarbonat, natrijum bikarbonat)',
    labelText: 'Chia',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: true, // No obvious lactose
    isSugarFree: true,
    isPosno: true,
    dataAiHint: 'chia krekeri'
  },
  {
    id: 'product-15',
    name: 'ALEX',
    brand: 'Aleksandija',
    category: 'Salty Snacks',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'slani krekeri od prosa i lana - 150g',
    ingredientsText: 'Kukuruzni skrob, kukuruzno brašno, brašno od pirinča, biljna mast (palmina), brašno od prosa (10%), šećer, so, laneno seme (3%), brašno od guar graška, sojin lecitin, sredstva za dizanje testa (amonijum bikarbonat, prašak za pecivo)',
    labelText: 'ALEX',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: false, // Assuming not specified
    isSugarFree: false, // Contains šećer
    isPosno: true,
    dataAiHint: 'alex krekeri'
  },
  {
    id: 'product-16',
    name: 'Proteinski Kakao Krem',
    brand: 'Aleksandija',
    category: 'Spreads & Creams',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'bez šećera - 200g',
    ingredientsText: 'Protein iz graška, brašno od semena bundeve, vanila, zaslađivač (eritritol, steviol glikozidi), kakao prah sa smanjenim sadržajem masti, lešnici (10%), biljna mast (suncokretova, palmina), sojin lecitin, mleko u prahu',
    labelText: 'Proteinski Kakao Krem',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'high-protein'],
    nutriScore: undefined,
    isLactoseFree: false, // Contains mleko u prahu
    isSugarFree: true,
    isPosno: false, // Contains mleko u prahu
    dataAiHint: 'proteinski krem'
  },
  {
    id: 'product-17',
    name: 'Vege Proteinski Kakao Krem',
    brand: 'Aleksandija',
    category: 'Spreads & Creams',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'bez šećera - 200g',
    ingredientsText: 'Protein iz graška, semenke bundeve golice u prahu 15%, biljna mast (ulje repice, suncokretovo ulje),semenke bundeve golice, kakao prah sa smanjenim sadržajem masti min 10%, lešnici min 10%, zaslađivač (eritritol, steviol glikozid), sirovi sojin lecitin, vanilin',
    labelText: 'Vege Proteinski Kakao Krem',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'posno', 'high-protein'],
    nutriScore: undefined,
    isLactoseFree: true,
    isSugarFree: true,
    isPosno: true,
    dataAiHint: 'vege krem'
  },
  {
    id: 'product-18',
    name: 'Proteinske Fit Noodle',
    brand: 'Aleksandija',
    category: 'Pasta & Noodles',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'instant proteinske nudle sa belim lukom - 70g',
    ingredientsText: 'Brašno od pirinča, brašno od bundeve, kukuruzno brašno, brašno od prosa, brašno od heljde, prah od belog luka (5%), biljno ulje (palmino), brašno od guar graška, mešavina začina (u različitim količinama – kurkuma, kari, peršun, so, biber)',
    labelText: 'Proteinske Fit Noodle',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'posno', 'high-protein'],
    nutriScore: undefined,
    isLactoseFree: true,
    isSugarFree: true,
    isPosno: true,
    dataAiHint: 'fit nudle'
  },
  {
    id: 'product-19',
    name: 'Proteinske Vege Tagliatelle',
    brand: 'Aleksandija',
    category: 'Pasta & Noodles',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'proteinske vege taljatele - 200g',
    ingredientsText: 'Brašno od pirinča, brašno od bundeve, kukuruzno brašno, brašno od prosa, brašno od heljde, brašno od guar graška, zgušnjivač (ksantan guma), kurkuma',
    labelText: 'Proteinske Vege Tagliatelle',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'posno', 'high-protein'],
    nutriScore: undefined,
    isLactoseFree: true,
    isSugarFree: true,
    isPosno: true,
    dataAiHint: 'vege taljatele'
  },
  {
    id: 'product-20',
    name: 'RISO Pasta',
    brand: 'Aleksandija',
    category: 'Pasta & Noodles',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'pirinčane nudle - 320g',
    ingredientsText: 'Brašno od pirinča, zgušnjivač ksantan guma',
    labelText: 'RISO Pasta',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: true,
    isSugarFree: true,
    isPosno: true,
    dataAiHint: 'riso pasta'
  },
  {
    id: 'product-21',
    name: 'Tagliatelle di RISO',
    brand: 'Aleksandija',
    category: 'Pasta & Noodles',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'pirinčane taljatele - 210g',
    ingredientsText: 'Brašno od pirinča, zgušnjivač ksantan guma.',
    labelText: 'Tagliatelle di RISO',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: true,
    isSugarFree: true,
    isPosno: true,
    dataAiHint: 'riso taljatele'
  },
  {
    id: 'product-22',
    name: 'Premium Tamna Gotova Smeša',
    brand: 'Aleksandija',
    category: 'Flours & Grains',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'od heljde i prosa - 1kg',
    ingredientsText: 'Brašno od pirinča, brašno od prosa, krompirov skrob, kukuruzni skrob, brašno od guar graška, zgušnjivač (ksantan guma)',
    labelText: 'Premium Tamna Gotova Smeša',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: true,
    isSugarFree: true,
    isPosno: true,
    dataAiHint: 'tamna smeša'
  },
  {
    id: 'product-23',
    name: 'Taljatele sa Kurkumom',
    brand: 'Aleksandija',
    category: 'Pasta & Noodles',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'taljatele sa kurkumom - 280g',
    ingredientsText: 'Brašno od pirinča, brašno od prosa, kukuruzno brašno, mlevena kurkuma 2%, zgušnjivač (ksantan guma)',
    labelText: 'Taljatele sa Kurkumom',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: true,
    isSugarFree: true,
    isPosno: true,
    dataAiHint: 'taljatele kurkumom'
  },
  {
    id: 'product-24',
    name: 'Testenina Života',
    brand: 'Aleksandija',
    category: 'Pasta & Noodles',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/gluten-detective-8ukpw.firebasestorage.app/o/products%2Faleksandrija-fruska-gora%2F1746774464069_Testenina_Zivota.png?alt=media&token=aa4716f6-aac4-4303-a35c-5e49726dbb5a',
    description: 'testenina od heljde i prosa - 350g',
    ingredientsText: 'Brašno od pirinča, kukuruzni skrob, brašno od prolećnog ječma 20%, brašno od heljde 10%, zgušnjivač (ksantan guma), kurkuma',
    labelText: 'Testenina Života',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'posno'], // Contains barley - this might be incorrect, AI should flag
    nutriScore: undefined,
    isLactoseFree: true,
    isSugarFree: true,
    isPosno: true,
    dataAiHint: 'testenina heljdom'
  },
  {
    id: 'product-25',
    name: 'Brašno od Prosa',
    brand: 'Aleksandija',
    category: 'Flours & Grains',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'brašno od prosa - 500g',
    ingredientsText: 'Brašno od prosa 100%',
    labelText: 'Brašno od Prosa',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: true,
    isSugarFree: true,
    isPosno: true,
    dataAiHint: 'brašno prosa'
  },
  {
    id: 'product-26',
    name: 'Brašno od Pirinča',
    brand: 'Aleksandija',
    category: 'Flours & Grains',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'brašno od pirinča - 500g',
    ingredientsText: 'Brašno od pirinča 100%',
    labelText: 'Brašno od Pirinča',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: true,
    isSugarFree: true,
    isPosno: true,
    dataAiHint: 'brašno pirinča'
  },
  {
    id: 'product-27',
    name: 'Brašno od Heljde',
    brand: 'Aleksandija',
    category: 'Flours & Grains',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'brašno od heljde - 500g',
    ingredientsText: 'Brašno od heljde 100%',
    labelText: 'Brašno od Heljde',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: true,
    isSugarFree: true,
    isPosno: true,
    dataAiHint: 'brašno heljde'
  },
  {
    id: 'product-28',
    name: 'Premium Palenta',
    brand: 'Aleksandija',
    category: 'Flours & Grains',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'od prosa, pirinča i kukuruza - 500g',
    ingredientsText: 'Griz od prosa 33,33%, griz od pirinča 33,33%, griz od kukuruza 33,33%',
    labelText: 'Premium Palenta',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: true,
    isSugarFree: true,
    isPosno: true,
    dataAiHint: 'premium palenta'
  },
  {
    id: 'product-29',
    name: 'Proteinski Pire',
    brand: 'Aleksandija',
    category: 'Instant Meals',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'sa leblebijom i prosom - 180g',
    ingredientsText: 'Brašno leblebija 45%, brašno od prosa 45% i brašno od pirinča',
    labelText: 'Proteinski Pire',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'posno', 'high-protein'],
    nutriScore: undefined,
    isLactoseFree: true,
    isSugarFree: true, // Not specified "Bez šećera", but ingredients suggest no added sugar
    isPosno: true,
    dataAiHint: 'proteinski pire'
  },
  {
    id: 'product-30',
    name: 'Tapioka',
    brand: 'Aleksandija',
    category: 'Flours & Grains',
    imageUrl: 'https://placehold.co/300x200.png',
    description: 'tapioka - 500g',
    ingredientsText: 'Skrob od tapioke 100%',
    labelText: 'Tapioka',
    hasAOECSLicense: false,
    hasManufacturerStatement: false,
    isVerifiedAdmin: false,
    source: 'User Provided Data',
    tags: ['gluten-free', 'sugar-free', 'posno'],
    nutriScore: undefined,
    isLactoseFree: true,
    isSugarFree: true,
    isPosno: true,
    dataAiHint: 'tapioka skrob'
  }
];


const productCategories = Array.from(new Set(placeholderProducts.map(p => p.category)));

const getNutriScoreClasses = (score?: string) => {
  if (!score) return 'bg-gray-300 text-gray-700';
  switch (score.toUpperCase()) {
    case 'A': return 'bg-green-700 text-white';
    case 'B': return 'bg-lime-500 text-black';
    case 'C': return 'bg-yellow-400 text-black';
    case 'D': return 'bg-orange-500 text-white';
    case 'E': return 'bg-red-600 text-white';
    default: return 'bg-gray-300 text-gray-700';
  }
};

export default function ProductsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [displayedProducts, setDisplayedProducts] = useState(placeholderProducts);

  useEffect(() => {
    let filtered = placeholderProducts;
    if (searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase().trim())
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    setDisplayedProducts(filtered);
  }, [searchTerm, selectedCategory]);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarRail />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-6 md:p-8">
          <PageHeader 
            title="Find Gluten-Free Products"
            description="Search and filter through a curated list of gluten-free items."
            icon={ShoppingBag}
          />

          <div className="mb-8 p-6 bg-card border rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="search" className="text-sm font-medium">Search Products</label>
                <Input 
                  id="search" 
                  placeholder="Search by name, brand, or description..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="category" className="text-sm font-medium">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {productCategories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {displayedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedProducts.map(product => {
                const isGlutenFreeTag = product.tags?.includes('gluten-free');
                const containsGlutenTag = product.tags?.includes('contains-gluten') || product.tags?.includes('contains-wheat');
                const mayContainGlutenTag = product.tags?.includes('may-contain-gluten') || product.tags?.includes('risk-of-contamination');
                
                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-200 flex flex-col">
                    <CardHeader className="p-0">
                      <Image 
                        src={product.imageUrl} 
                        alt={product.name} 
                        width={400} 
                        height={200} 
                        className="w-full h-48 object-cover"
                        data-ai-hint={product.dataAiHint}
                      />
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col flex-grow">
                      <CardTitle className="text-lg mb-1">{product.name}</CardTitle>
                      {product.brand && <CardDescription className="text-xs text-muted-foreground mb-1">{product.brand}</CardDescription>}
                      <div className="flex justify-between items-center mb-2">
                        <CardDescription className="text-sm text-muted-foreground">{product.category}</CardDescription>
                        {product.nutriScore && (
                          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${getNutriScoreClasses(product.nutriScore)}`}>
                            Nutri-Score: {product.nutriScore}
                          </span>
                        )}
                      </div>
                      
                      {isGlutenFreeTag && (
                        <div className="flex items-center text-green-600 text-xs mt-1 mb-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          <span>Gluten-Free</span>
                        </div>
                      )}
                      {containsGlutenTag && (
                        <div className="flex items-center text-red-600 text-xs mt-1 mb-1">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          <span>Contains Gluten</span>
                        </div>
                      )}
                      {mayContainGlutenTag && !isGlutenFreeTag && !containsGlutenTag && (
                        <div className="flex items-center text-orange-500 text-xs mt-1 mb-1">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          <span>May Contain Traces</span>
                        </div>
                      )}

                      <p className="text-sm mb-3 h-10 overflow-hidden flex-grow">{product.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {product.isLactoseFree && <Badge variant="secondary" className="text-xs">Lactose-Free</Badge>}
                        {product.isSugarFree && <Badge variant="secondary" className="text-xs">Sugar-Free</Badge>}
                        {product.isPosno && <Badge variant="secondary" className="text-xs">Posno</Badge>}
                        {product.tags?.filter(tag => !['gluten-free', 'contains-gluten', 'may-contain-gluten', 'contains-wheat', 'risk-of-contamination', 'sugar-free', 'posno', 'high-protein'].includes(tag)).slice(0,2).map(tag => (
                           <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                         {product.tags?.includes('high-protein') && <Badge variant="secondary" className="text-xs">High Protein</Badge>}
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full mt-auto">
                        <Link href={`/${locale}/products/${product.id}`}>View Details</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <PackageOpen className="mx-auto h-16 w-16 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
              <p>Try adjusting your filters or search terms.</p>
            </div>
          )}
        </main>
      </SidebarInset>
    </div>
  );
}


