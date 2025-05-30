
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

const firebaseStorageBaseUrl = 'https://firebasestorage.googleapis.com/v0/b/gluten-detective-8ukpw.firebasestorage.app/o/products%2Faleksandrija-fruska-gora%2F';
const firebaseStorageTokenPlaceholder = '?alt=media&token=REPLACE_WITH_ACTUAL_TOKEN';

const sanitizeForDataAiHint = (text: string | undefined, fallback: string): string => {
  if (!text) return fallback;
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').split('-').slice(0,2).join(' ');
};

const rawProductsData = [
  {
    "name": "Instant Palenta",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606112581172",
    "size": "60g",
    "ingredients": [
      "Griz od kukuruza (semolina) 94%",
      "prah od sira 5%",
      "stolna so 1%"
    ],
    "labelText": "sa sirom",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera"],
    "imageUrl": "instant-palentaz-8606112581172.png"
  },
  {
    "name": "Pirinčani Griz",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907321",
    "size": "300g",
    "ingredients": ["pirinčani griz 100%"],
    "labelText": "pirinčani griz",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera", "vegan"],
    "imageUrl": "pirinčani-griz-8606107907321.png"
  },
  {
    "name": "Prezle",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907765",
    "size": "300g",
    "ingredients": [
      "Kukuruzno brašno",
      "brašno od pirinča",
      "brašno od prosa 12%",
      "brašno od heljde 7%",
      "pekarski kvasac",
      "šećer",
      "brašno od guar graška",
      "so",
      "biljna mast (palmina)",
      "sojin lecitin",
      "sredstva za dizanje (amonijum bikarbonat",
      "natrijum bikarbonat)"
    ],
    "labelText": "od prosa i heljde",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera", "vegan"],
    "imageUrl": "prezle-8606107907765.png"
  },
  {
    "name": "Dvopek",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907666",
    "size": "110g",
    "ingredients": [
      "Brašno od pirinča",
      "kukuruzni skrob",
      "kukuruzno brašno",
      "brašno od prosa 11%",
      "brašno od heljde 10%",
      "biljno ulje (palmino)",
      "pekarski kvasac",
      "šećer",
      "kuvarska so",
      "brašno od guar graška",
      "sirovi sojin lecitin",
      "sredstvo za dizanje testa (amonijum bikarbonat",
      "natrijum bikarbonat)",
      "so"
    ],
    "labelText": "od heljde i prosa",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera", "vegan"],
    "imageUrl": "dvopek-8606107907666.png"
  },
  {
    "name": "Dvopek",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107904434",
    "size": "110g",
    "ingredients": [
      "Brašno od pirinča",
      "kukuruzni skrob",
      "kukuruzno brašno",
      "brašno od prosa 15%",
      "suncokretovo ulje",
      "šećer",
      "kvasac",
      "brašno od guar graška",
      "so",
      "sirovi sojin lecitin",
      "sredstvo za dizanje testa (amonijum bikarbonat",
      "natrijum bikarbonat)"
    ],
    "labelText": "sa prosom",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera", "vegan"],
    "imageUrl": "dvopek-8606107904434.png"
  },
  {
    "name": "Cookies",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907482",
    "size": "200g",
    "ingredients": [
      "Brašno od pirinča",
      "brašno od prosa",
      "kukuruzni skrob",
      "šećer",
      "biljna mast (suncokretova)",
      "brašno od heljde",
      "komadići čokolade 8% (šećer",
      "najmanje 40% suve kakao mase",
      "najmanje 7% kakao maslaca)",
      "vanilin šećer",
      "sirovi sojin lecitin",
      "brašno od guar graška",
      "sredstva za dizanje testa (amonijum bikarbonat",
      "prašak za pecivo)",
      "kuvarska so"
    ],
    "labelText": "keks sa čokoladom",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["vegan"],
    "imageUrl": "cookies-8606107907482.png"
  },
  {
    "name": "Čajni Kolutići",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907062",
    "size": "300g",
    "ingredients": [
      "Brašno od pirinča",
      "kukuruzni skrob",
      "šećer",
      "brašno od prosa",
      "palmino ulje",
      "brašno od heljde 6",
      "5%",
      "kukuruzno brašno",
      "brašno od guar graška",
      "sirovi sojin lecitin",
      "sredstvo za dizanje testa (amonijum bikarbonat",
      "natrijum bikarbonat)"
    ],
    "labelText": "sa heljdom",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["vegan"],
    "imageUrl": "cajni-kolutići-8606107907062.png"
  },
  {
    "name": "KO-GO",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907291",
    "size": "200g",
    "ingredients": [
      "Brašno od pirinča",
      "kukuruzni skrob",
      "biljna mast (palmina)",
      "krem od kakaa min 20%",
      "zaslađivači (eritritol",
      "steviol glikozid)",
      "kakao prah",
      "lešnici",
      "brašno od soje",
      "sojin lecitin",
      "vanila",
      "skrob od tapioke",
      "brašno od guar graška",
      "sredstva za dizanje testa (amonijum bikarbonat",
      "prašak za pecivo)",
      "aroma limuna",
      "so"
    ],
    "labelText": "sendvič keks bez šećera",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera", "vegan"],
    "imageUrl": "ko-go-8606107907291.png"
  },
  {
    "name": "Keks Života",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907680",
    "size": "300g",
    "ingredients": [
      "Brašno od pirinča",
      "kukuruzni skrob",
      "skrob od tapioke",
      "biljno ulje (palmino)",
      "brašno od guar graška",
      "sojin lecitin",
      "zaslađivač (eritritol",
      "steviol glikozidi)",
      "sredstvo za dizanje testa (amonijum bikarbonat",
      "natrijum bikarbonat)",
      "so"
    ],
    "labelText": "mleveni keks bez šećera",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera", "vegan"],
    "imageUrl": "keks-zivota-8606107907680.png"
  },
  {
    "name": "Happy Life",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907819",
    "size": "300g",
    "ingredients": [
      "Brašno od pirinča",
      "kukuruzni skrob",
      "kukuruzno brašno",
      "brašno od prosa",
      "šećer",
      "suncokretovo ulje",
      "brašno od guar graška",
      "sredstvo za pohovanje (amonijum bikarbonat)"
    ],
    "labelText": "mleveni keks",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["vegan"],
    "imageUrl": "happy-life-8606107907819.png"
  },
  {
    "name": "Pusa",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907543",
    "size": "150g",
    "ingredients": [
      "Kukuruzni skrob",
      "brašno od prosa",
      "šećer",
      "kukuruzno brašno",
      "brašno od pirinča",
      "biljna mast",
      "kakao prah sa smanjenim sadržajem masti 10%",
      "brašno od guar graška",
      "vanilin šećer",
      "sirovi sojin lecitin",
      "so",
      "sredstvo za dizanje testa (amonijum bikarbonat)"
    ],
    "labelText": "keks od prosa",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["vegan"],
    "imageUrl": "pusa-8606107907543.png"
  },
  {
    "name": "Premium Univerzal Mix",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907710",
    "size": "1kg",
    "ingredients": [
      "Brašno od pirinča",
      "brašno od prosa",
      "krompirov skrob",
      "kukuruzni skrob",
      "brašno od guar graška",
      "zgušnjivač (ksantan guma)"
    ],
    "labelText": "univerzalna mešavina brašna",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera", "vegan"],
    "imageUrl": "premium-univerzal-mix-8606107907710.png"
  },
  {
    "name": "Vanilice",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907918",
    "size": "180g",
    "ingredients": [
      "Brašno od pirinča",
      "brašno od prosa (20%)",
      "kukuruzni skrob",
      "voćni fil (šećer",
      "kajsijevo pirea (40%)",
      "regulator kiselosti (limunska kiselina)",
      "sredstvo za geliranje (pektin))",
      "biljna mast (palmina)",
      "šećer",
      "vanilin šećer",
      "sirovi sojin lecitin",
      "brašno od guar graška",
      "so",
      "sredstvo za dizanje testa (amonijum bikarbonat",
      "natrijum bikarbonat)"
    ],
    "labelText": "sa kajsijom",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["vegan"],
    "imageUrl": "vanilice-8606107907918.png"
  },
  {
    "name": "Integralni Štapići",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907130",
    "size": "130g",
    "ingredients": [
      "Kukuruzni skrob",
      "brašno od pirinča",
      "brašno od prosa 11%",
      "brašno od heljde 10%",
      "suncokretovo ulje",
      "stolna so",
      "brašno od guar graška",
      "sredstva za dizanje testa (amonijum bikarbonat",
      "prašak za pecivo)"
    ],
    "labelText": "sa heljdom i prosom",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera", "vegan"],
    "imageUrl": "integralni-stapici-8606107907130.png"
  },
  {
    "name": "Chia",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907222",
    "size": "140g",
    "ingredients": [
      "Kukuruzno brašno",
      "brašno od pirinča",
      "kukuruzni skrob",
      "brašno od prosa",
      "biljna mast (palmina)",
      "čija 3%",
      "so",
      "zgušnjivač (guar guma)",
      "sredstvo za dizanje testa (amonijum bikarbonat",
      "natrijum bikarbonat)"
    ],
    "labelText": "krekeri sa čijom",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera", "vegan"],
    "imageUrl": "chia-8606107907222.png"
  },
  {
    "name": "ALEX",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907536",
    "size": "150g",
    "ingredients": [
      "Kukuruzni skrob",
      "kukuruzno brašno",
      "brašno od pirinča",
      "biljna mast (palmina)",
      "brašno od prosa (10%)",
      "šećer",
      "so",
      "laneno seme (3%)",
      "brašno od guar graška",
      "sojin lecitin",
      "sredstva za dizanje testa (amonijum bikarbonat",
      "prašak za pecivo)"
    ],
    "labelText": "slani krekeri od prosa i lana",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["vegan"],
    "imageUrl": "alex-8606107907536.png"
  },
  {
    "name": "Proteinski Kakao Krem",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907246",
    "size": "250g",
    "ingredients": [
      "Protein iz graška",
      "brašno od semena bundeve",
      "vanila",
      "zaslađivač (eritritol",
      "steviol glikozidi)",
      "kakao prah sa smanjenim sadržajem masti",
      "lešnici (10%)",
      "biljna mast (suncokretova",
      "palmina)",
      "sojin lecitin",
      "mleko u prahu"
    ],
    "labelText": "bez šećera",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["protein", "bez šećera"],
    "imageUrl": "proteinski-kakao-krem-8606107907246.png"
  },
  {
    "name": "Vege Proteinski Kakao Krem",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606112581127",
    "size": "200g",
    "ingredients": [
      "Protein iz graška",
      "semenke bundeve golice u prahu 15%",
      "biljna mast (ulje repice",
      "suncokretovo ulje)",
      "semenke bundeve golice",
      "kakao prah sa smanjenim sadržajem masti min 10%",
      "lešnici min 10%",
      "zaslađivač (eritritol",
      "steviol glikozid)",
      "sirovi sojin lecitin",
      "vanilin"
    ],
    "labelText": "bez šećera",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["protein", "bez šećera", "vegan"],
    "imageUrl": "vege-proteinski-kakao-krem-8606112581127.png"
  },
  {
    "name": "Proteinske Fit Noodle",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907925",
    "size": "320g",
    "ingredients": [
      "Brašno od pirinča",
      "brašno od bundeve",
      "kukuruzno brašno",
      "brašno od prosa",
      "brašno od heljde",
      "prah od belog luka (5%)",
      "biljno ulje (palmino)",
      "brašno od guar graška",
      "mešavina začina (u različitim količinama – kurkuma",
      "kari",
      "peršun",
      "so",
      "biber)"
    ],
    "labelText": "instant proteinske nudle sa belim lukom",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["protein", "bez šećera", "vegan"],
    "imageUrl": "proteinske-fit-noodle-8606107907925.png"
  },
  {
    "name": "Proteinske Vege Tagliatelle",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606112581080",
    "size": "200g",
    "ingredients": [
      "Brašno od pirinča",
      "brašno od bundeve",
      "kukuruzno brašno",
      "brašno od prosa",
      "brašno od heljde",
      "brašno od guar graška",
      "zgušnjivač (ksantan guma)",
      "kurkuma"
    ],
    "labelText": "proteinske vege taljatele",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["protein", "bez šećera", "vegan"],
    "imageUrl": "proteinske-vege-tagliatelle-8606112581080.png"
  },
  {
    "name": "RISO Pasta",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907925", // Note: Same barcode as Proteinske Fit Noodle
    "size": "320g",
    "ingredients": ["Brašno od pirinča", "zgušnjivač ksantan guma"],
    "labelText": "pirinčane nudle",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera", "vegan"],
    "imageUrl": "riso-pasta-8606107907925.png"
  },
  {
    "name": "Tagliatelle di RISO",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907109",
    "size": "350g",
    "ingredients": ["Brašno od pirinča", "zgušnjivač ksantan guma."],
    "labelText": "pirinčane taljatele",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera", "vegan"],
    "imageUrl": "tagliatelle-di-riso-8606107907109.png"
  },
  {
    "name": "Premium Tamna Gotova Smeša",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907703", // Corrected from 86061079007703
    "size": "1kg",
    "ingredients": [
      "Brašno od pirinča",
      "brašno od prosa",
      "krompirov skrob",
      "kukuruzni skrob",
      "brašno od guar graška",
      "zgušnjivač (ksantan guma)"
    ],
    "labelText": "od heljde i prosa",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera", "vegan"],
    "imageUrl": "premium-tamna-gotova-smesa-8606107907703.png"
  },
  {
    "name": "Taljatele sa Kurkumom",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907963",
    "size": "280g",
    "ingredients": [
      "Brašno od pirinča",
      "brašno od prosa",
      "kukuruzno brašno",
      "mlevena kurkuma 2%",
      "zgušnjivač (ksantan guma)"
    ],
    "labelText": "taljatele sa kurkumom",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera", "vegan"],
    "imageUrl": "taljatele-sa-kurkumom-8606107907963.png"
  },
  {
    "name": "Testenina Života",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907567",
    "size": "350g",
    "ingredients": [
      "Brašno od pirinča",
      "kukuruzni skrob",
      "brašno od prolećnog ječma 20%",
      "brašno od heljde 10%",
      "zgušnjivač (ksantan guma)",
      "kurkuma"
    ],
    "labelText": "testenina od heljde i prosa",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera", "vegan"], // Note: Contains barley, "gluten-free" tag not added automatically
    "imageUrl": "testenina-zivota-8606107907567.png"
  },
  {
    "name": "Brašno od Prosa",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907437",
    "size": "500g",
    "ingredients": ["Brašno od prosa 100%"],
    "labelText": "brašno od prosa",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera", "vegan"],
    "imageUrl": "brasno-od-prosa-8606107907437.png"
  },
  {
    "name": "Brašno od Pirinča",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907642",
    "size": "500g",
    "ingredients": ["Brašno od pirinča 100%"],
    "labelText": "brašno od pirinča",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera", "vegan"],
    "imageUrl": "brašno-od-pirinca-8606107907642.png"
  },
  {
    "name": "Brašno od Heljde",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "", // Empty barcode
    "size": "500g",
    "ingredients": ["Brašno od heljde 100%"],
    "labelText": "brašno od heljde",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera", "vegan"],
    "imageUrl": "brašno-od-heljde.png"
  },
  {
    "name": "Premium Palenta",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907260",
    "size": "500g",
    "ingredients": [
      "Griz od prosa 33",
      "33%",
      "griz od pirinča 33",
      "33%",
      "griz od kukuruza 33",
      "33%"
    ],
    "labelText": "od prosa, pirinča i kukuruza",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera", "vegan"],
    "imageUrl": "premium-palenta-8606107907260.png"
  },
  {
    "name": "Proteinski Pire",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606112581004",
    "size": "180g",
    "ingredients": [
      "Brašno leblebija 45%",
      "brašno od prosa 45% i brašno od pirinča"
    ],
    "labelText": "sa leblebijom i prosom",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["protein", "vegan"],
    "imageUrl": "proteinski-pire-8606112581004.png"
  },
  {
    "name": "Tapioka",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "", // Empty barcode
    "size": "500g",
    "ingredients": ["Skrob od tapioke 100%"],
    "labelText": "tapioka",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tags": ["bez šećera", "vegan"],
    "imageUrl": "tapioka.png"
  }
];

export const placeholderProducts: Product[] = rawProductsData.map((p, index) => {
  const isSugarFree = p.tags.includes('bez šećera');
  const isPosno = p.tags.includes('vegan'); // Assuming 'vegan' maps to 'isPosno'
  const isProtein = p.tags.includes('protein');

  const productTags = ['gluten-free']; // Default assumption
  if (isSugarFree) productTags.push('sugar-free');
  if (isPosno) productTags.push('posno');
  if (isProtein) productTags.push('high-protein');
  // Add other tags from p.tags if they are not already covered
  p.tags.forEach(tag => {
    if (tag !== 'bez šećera' && tag !== 'vegan' && tag !== 'protein' && !productTags.includes(tag)) {
      productTags.push(tag);
    }
  });
  
  let category = 'Other';
  const lowerName = p.name.toLowerCase();
  if (lowerName.includes('palenta') || lowerName.includes('griz') || lowerName.includes('brašno') || lowerName.includes('mix') || lowerName.includes('prezle') || lowerName.includes('tapioka')) {
    category = 'Flours & Grains';
  } else if (lowerName.includes('keks') || lowerName.includes('cookies') || lowerName.includes('kolutići') || lowerName.includes('vanilice') || lowerName.includes('pusa')) {
    category = 'Sweets & Biscuits';
  } else if (lowerName.includes('dvopek')) {
    category = 'Bakery';
  } else if (lowerName.includes('štapići') || lowerName.includes('chia') || lowerName.includes('alex') ) {
    category = 'Salty Snacks';
  } else if (lowerName.includes('krem')) {
    category = 'Spreads & Creams';
  } else if (lowerName.includes('noodle') || lowerName.includes('pasta') || lowerName.includes('tagliatelle') || lowerName.includes('taljatele')) {
    category = 'Pasta & Noodles';
  } else if (lowerName.includes('pire')) {
    category = 'Instant Meals';
  }

  // Special handling for Testenina Života (contains barley)
  if (p.name === "Testenina Života") {
    const glutenFreeIndex = productTags.indexOf('gluten-free');
    if (glutenFreeIndex > -1) {
      productTags.splice(glutenFreeIndex, 1); // Remove 'gluten-free'
    }
    productTags.push('contains-barley'); // Add a specific tag
  }
  
  // Handle "Proteinski Kakao Krem" (contains milk)
  let actualIsPosno = isPosno;
  let actualIsLactoseFree = isPosno; // if posno, assume lactose free unless milk is present
  if (p.name === "Proteinski Kakao Krem" && p.ingredients.join(' ').toLowerCase().includes('mleko u prahu')) {
      actualIsPosno = false;
      actualIsLactoseFree = false;
      const posnoIndex = productTags.indexOf('posno');
      if (posnoIndex > -1) productTags.splice(posnoIndex, 1);
  }


  return {
    id: `product-${index}`, // Generate unique ID
    name: p.name,
    brand: p.brand,
    barcode: p.barcode || undefined,
    category: category,
    imageUrl: `${firebaseStorageBaseUrl}${p.imageUrl}${firebaseStorageTokenPlaceholder}`,
    description: `${p.labelText} - ${p.size}`,
    ingredientsText: p.ingredients.join(', '),
    labelText: p.labelText,
    hasAOECSLicense: p.license,
    hasManufacturerStatement: p.manufacturerStatement,
    isVerifiedAdmin: p.verified,
    source: p.source,
    tags: productTags,
    nutriScore: undefined, // Not in provided data
    isLactoseFree: actualIsLactoseFree, 
    isSugarFree: isSugarFree,
    isPosno: actualIsPosno,
    dataAiHint: sanitizeForDataAiHint(p.name, `product ${index}`),
  };
});


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
                const containsGlutenTag = product.tags?.includes('contains-gluten') || product.tags?.includes('contains-wheat') || product.tags?.includes('contains-barley');
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
                        {product.tags?.filter(tag => !['gluten-free', 'contains-gluten', 'may-contain-gluten', 'contains-wheat', 'risk-of-contamination', 'sugar-free', 'posno', 'high-protein', 'contains-barley'].includes(tag)).slice(0,2).map(tag => (
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
