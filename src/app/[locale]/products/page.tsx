
'use client';

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
import { Search, ShoppingBag, PackageOpen, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import type { Product } from './[productId]/page';

const firebaseStorageBaseUrl = 'https://firebasestorage.googleapis.com/v0/b/gluten-detective-8ukpw.firebasestorage.app/o/products%2F';

const sanitizeForDataAiHint = (text: string | undefined, fallback: string): string => {
  if (!text) return fallback;
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').split('-').slice(0, 2).join(' ');
};

const rawProductsData = [
  // Aleksandrija Fruška Gora products
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
    "tagsFromInput": ["bez šećera"],
    "imageUrl": "aleksandrija-fruska-gora/instant-palenta-8606112581172.png",
    "nutriscore": "N/A",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/pirinčani-griz-8606107907321.png",
    "nutriscore": "N/A",
    "Poreklo": "Srbija"
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
      "sredstva za dizanje testa (amonijum bikarbonat",
      "natrijum bikarbonat)"
    ],
    "labelText": "od prosa i heljde",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/prezle-8606107907765.png",
    "nutriscore": "N/A",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/dvopek-8606107907666.png",
    "nutriscore": "B",
    "Poreklo": "Srbija"
  },
  {
    "name": "Dvopek",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907671",
    "size": "220g",
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
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/dvopek-8606107907666.png",
    "nutriscore": "B",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/dvopek-8606107904434.png",
    "nutriscore": "C",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["vegan"],
    "imageUrl": "aleksandrija-fruska-gora/cookies-8606107907482.png",
    "nutriscore": "C",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["vegan"],
    "imageUrl": "aleksandrija-fruska-gora/cajni-kolutići-8606107907062.png",
    "nutriscore": "D",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/ko-go-8606107907291.png",
    "nutriscore": "N/A",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/keks-zivota-8606107907680.png",
    "nutriscore": "N/A",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["vegan"],
    "imageUrl": "aleksandrija-fruska-gora/happy-life-8606107907819.png",
    "nutriscore": "N/A",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["vegan"],
    "imageUrl": "aleksandrija-fruska-gora/pusa-8606107907543.png",
    "nutriscore": "C",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/premium-univerzal-mix-8606107907710.png",
    "nutriscore": "C",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["vegan"],
    "imageUrl": "aleksandrija-fruska-gora/vanilice-8606107907918.png",
    "nutriscore": "D",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/integralni-stapici-8606107907130.png",
    "nutriscore": "C",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/chia-8606107907222.png",
    "nutriscore": "N/A",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["vegan"],
    "imageUrl": "aleksandrija-fruska-gora/alex-8606107907536.png",
    "nutriscore": "N/A",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["protein", "bez šećera"],
    "imageUrl": "aleksandrija-fruska-gora/proteinski-kakao-krem-8606107907246.png",
    "nutriscore": "N/A",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["protein", "bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/vege-proteinski-kakao-krem-8606112581127.png",
    "nutriscore": "N/A",
    "Poreklo": "Srbija"
  },
  {
    "name": "Proteinske Fit Noodle",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606112581124", //netacan
    "size": "70g",
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
    "tagsFromInput": ["protein", "bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/proteinske-fit-noodle-8606107907925.png",
    "nutriscore": "A",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["protein", "bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/proteinske-vege-tagliatelle-8606112581080.png",
    "nutriscore": "N/A",
    "Poreklo": "Srbija"
  },
  {
    "name": "RISO Pasta",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907925", // Note: Same barcode as "Proteinske Fit Noodle", potentially an error in data
    "size": "320g",
    "ingredients": ["Brašno od pirinča", "zgušnjivač ksantan guma"],
    "labelText": "pirinčane nudle",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/riso-pasta-8606107907925.png",
    "nutriscore": "N/A",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/tagliatelle-di-riso-8606107907109.png",
    "nutriscore": "N/A",
    "Poreklo": "Srbija"
  },
  {
    "name": "Tagliatelle di RISO",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907949",
    "size": "210g",
    "ingredients": ["Brašno od pirinča", "zgušnjivač ksantan guma."],
    "labelText": "pirinčane taljatele",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/tagliatelle-di-riso-8606107907109.png",
    "nutriscore": "N/A",
    "Poreklo": "Srbija"
  },
  {
    "name": "Premium Tamna Gotova Smeša",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907703",
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
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/premium-tamna-gotova-smesa-8606107907703.png",
    "nutriscore": "C",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/taljatele-sa-kurkumom-8606107907963.png",
    "nutriscore": "N/A",
    "Poreklo": "Srbija"
  },
  {
    "name": "Testenina Života",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907567",
    "size": "350g",
    "ingredients": [
      "Brašno od pirinča",
      "kukuruzni skrob",
      "brašno od prolećnog ječma 20%", // Note: "ječma" (barley) - contains gluten
      "brašno od heljde 10%",
      "zgušnjivač (ksantan guma)",
      "kurkuma"
    ],
    "labelText": "testenina od heljde i prosa",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/testenina-zivota-8606107907567.png",
    "nutriscore": "B",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/brasno-od-prosa-8606107907437.png",
    "nutriscore": "B",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/brašno-od-pirinca-8606107907642.png",
    "nutriscore": "A",
    "Poreklo": "Srbija"
  },
  {
    "name": "Brašno od Heljde",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907741",
    "size": "500g",
    "ingredients": ["Brašno od heljde 100%"],
    "labelText": "brašno od heljde",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/brašno-od-heljde.png",
    "nutriscore": "N/A",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/premium-palenta-8606107907260.png",
    "nutriscore": "C",
    "Poreklo": "Srbija"
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
    "tagsFromInput": ["protein", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/proteinski-pire-8606112581004.png",
    "nutriscore": "N/A",
    "Poreklo": "Srbija"
  },
  {
    "name": "Tapioka",
    "brand": "Aleksandrija Fruška Gora",
    "barcode": "8606107907307",
    "size": "500g",
    "ingredients": ["Skrob od tapioke 100%"],
    "labelText": "tapioka",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "aleksandrijaglutenfree.com",
    "tagsFromInput": ["bez šećera", "vegan"],
    "imageUrl": "aleksandrija-fruska-gora/tapioka.png",
    "nutriscore": "N/A",
    "Poreklo": "Srbija"
  },
  // Aleva products
  {
    "name": "Aleva Paprika Slatka Mlevena",
    "brand": "Aleva",
    "barcode": "8600500000011",
    "size": "100g",
    "ingredients": ["Mlevena začinska paprika slatka 100%"],
    "labelText": "Slatka začinska paprika",
    "license": false,
    "manufacturerStatement": true,
    "verified": true,
    "source": "Aleva.rs (primer)",
    "tagsFromInput": ["vegan"],
    "imageUrl": "https://placehold.co/400x200.png", // Using placeholder for Aleva
    "nutriscore": "A",
    "jsonCategory": "Spices & Seasonings", // Used for category mapping
    "Poreklo": "Srbija"
  },
  // Slavuj products
  {
    "brand": "Slavuj", "barcode": "8606109176510", "name": "Integralno brašno od prosa", "size": "500g", "jsonCategory": "Brašno", "nutriscore": "B", "Poreklo": "Srbija",
    "ingredients": ["Integralno brašno od prosa 100%"], "labelText": "Integralno brašno od prosa", "license": false, "manufacturerStatement": true, "verified": true, "source": "Slavuj (dodato iz liste)", "tagsFromInput": ["vegan", "bez šećera"], "imageUrl": "https://placehold.co/400x200.png"
  },
  {
    "brand": "Slavuj", "barcode": "8606109176329", "name": "Integralno brašno od heljde", "size": "500g", "jsonCategory": "Brašno", "nutriscore": "B", "Poreklo": "Srbija",
    "ingredients": ["Integralno brašno od heljde 100%"], "labelText": "Integralno brašno od heljde", "license": false, "manufacturerStatement": true, "verified": true, "source": "Slavuj (dodato iz liste)", "tagsFromInput": ["vegan", "bez šećera"], "imageUrl": "https://placehold.co/400x200.png"
  },
  {
    "brand": "Slavuj", "barcode": "8606109176497", "name": "Integralno brašno od prosa", "size": "5kg", "jsonCategory": "Brašno", "nutriscore": "B", "Poreklo": "Srbija",
    "ingredients": ["Integralno brašno od prosa 100%"], "labelText": "Integralno brašno od prosa", "license": false, "manufacturerStatement": true, "verified": true, "source": "Slavuj (dodato iz liste)", "tagsFromInput": ["vegan", "bez šećera"], "imageUrl": "https://placehold.co/400x200.png"
  },
  {
    "brand": "Slavuj", "barcode": "8606109176473", "name": "Integralno brašno od heljde", "size": "5kg", "jsonCategory": "Brašno", "nutriscore": "B", "Poreklo": "Srbija",
    "ingredients": ["Integralno brašno od heljde 100%"], "labelText": "Integralno brašno od heljde", "license": false, "manufacturerStatement": true, "verified": true, "source": "Slavuj (dodato iz liste)", "tagsFromInput": ["vegan", "bez šećera"], "imageUrl": "https://placehold.co/400x200.png"
  },
  {
    "brand": "Slavuj", "barcode": "8606109176459", "name": "Pahuljice od sirove heljde", "size": "300g", "jsonCategory": "Pahuljice", "nutriscore": "A", "Poreklo": "Srbija",
    "ingredients": ["Pahuljice od sirove heljde 100%"], "labelText": "Pahuljice od sirove heljde", "license": false, "manufacturerStatement": true, "verified": true, "source": "Slavuj (dodato iz liste)", "tagsFromInput": ["vegan", "bez šećera"], "imageUrl": "https://placehold.co/400x200.png"
  },
  {
    "brand": "Slavuj", "barcode": "8606109176138", "name": "Pahuljice od heljde", "size": "300g", "jsonCategory": "Pahuljice", "nutriscore": "A", "Poreklo": "Srbija",
    "ingredients": ["Pahuljice od heljde 100%"], "labelText": "Pahuljice od heljde", "license": false, "manufacturerStatement": true, "verified": true, "source": "Slavuj (dodato iz liste)", "tagsFromInput": ["vegan", "bez šećera"], "imageUrl": "https://placehold.co/400x200.png"
  },
  {
    "brand": "Slavuj", "barcode": "8606109176022", "name": "Pahuljice od prosa", "size": "300g", "jsonCategory": "Pahuljice", "nutriscore": "A", "Poreklo": "Srbija",
    "ingredients": ["Pahuljice od prosa 100%"], "labelText": "Pahuljice od prosa", "license": false, "manufacturerStatement": true, "verified": true, "source": "Slavuj (dodato iz liste)", "tagsFromInput": ["vegan", "bez šećera"], "imageUrl": "https://placehold.co/400x200.png"
  },
  {
    "brand": "Slavuj", "barcode": "8606109176015", "name": "Pahuljice od pirinča", "size": "300g", "jsonCategory": "Pahuljice", "nutriscore": "A", "Poreklo": "Srbija",
    "ingredients": ["Pahuljice od pirinča 100%"], "labelText": "Pahuljice od pirinča", "license": false, "manufacturerStatement": true, "verified": true, "source": "Slavuj (dodato iz liste)", "tagsFromInput": ["vegan", "bez šećera"], "imageUrl": "https://placehold.co/400x200.png"
  },
  {
    "brand": "Slavuj", "barcode": "8606109176039", "name": "Pahuljice od graška", "size": "300g", "jsonCategory": "Pahuljice", "nutriscore": "A", "Poreklo": "Srbija",
    "ingredients": ["Pahuljice od graška 100%"], "labelText": "Pahuljice od graška", "license": false, "manufacturerStatement": true, "verified": true, "source": "Slavuj (dodato iz liste)", "tagsFromInput": ["vegan", "bez šećera"], "imageUrl": "https://placehold.co/400x200.png"
  },
  {
    "brand": "Slavuj", "barcode": "8606109176084", "name": "Pahuljice od kukuruza", "size": "300g", "jsonCategory": "Pahuljice", "nutriscore": "A", "Poreklo": "Srbija",
    "ingredients": ["Pahuljice od kukuruza 100%"], "labelText": "Pahuljice od kukuruza", "license": false, "manufacturerStatement": true, "verified": true, "source": "Slavuj (dodato iz liste)", "tagsFromInput": ["vegan", "bez šećera"], "imageUrl": "https://placehold.co/400x200.png"
  },
  {
    "brand": "Slavuj", "barcode": "8606109176008", "name": "Pahuljice od heljde", "size": "500g", "jsonCategory": "Pahuljice", "nutriscore": "A", "Poreklo": "Srbija",
    "ingredients": ["Pahuljice od heljde 100%"], "labelText": "Pahuljice od heljde", "license": false, "manufacturerStatement": true, "verified": true, "source": "Slavuj (dodato iz liste)", "tagsFromInput": ["vegan", "bez šećera"], "imageUrl": "https://placehold.co/400x200.png"
  },
  {
    "brand": "Slavuj", "barcode": "8606109176768", "name": "Pahuljice od kukuruza", "size": "3kg", "jsonCategory": "Pahuljice", "nutriscore": "A", "Poreklo": "Srbija",
    "ingredients": ["Pahuljice od kukuruza 100%"], "labelText": "Pahuljice od kukuruza", "license": false, "manufacturerStatement": true, "verified": true, "source": "Slavuj (dodato iz liste)", "tagsFromInput": ["vegan", "bez šećera"], "imageUrl": "https://placehold.co/400x200.png"
  },
  {
    "brand": "Slavuj", "barcode": "8606109176183", "name": "Pahuljice od prosa", "size": "3kg", "jsonCategory": "Pahuljice", "nutriscore": "A", "Poreklo": "Srbija",
    "ingredients": ["Pahuljice od prosa 100%"], "labelText": "Pahuljice od prosa", "license": false, "manufacturerStatement": true, "verified": true, "source": "Slavuj (dodato iz liste)", "tagsFromInput": ["vegan", "bez šećera"], "imageUrl": "https://placehold.co/400x200.png"
  },
  {
    "brand": "Slavuj", "barcode": "8606109176176", "name": "Pahuljice od kukuruza", "size": "3kg", "jsonCategory": "Pahuljice", "nutriscore": "A", "Poreklo": "Srbija",
    "ingredients": ["Pahuljice od kukuruza 100%"], "labelText": "Pahuljice od kukuruza", "license": false, "manufacturerStatement": true, "verified": true, "source": "Slavuj (dodato iz liste)", "tagsFromInput": ["vegan", "bez šećera"], "imageUrl": "https://placehold.co/400x200.png"
  },
  {
    "brand": "Slavuj", "barcode": "8606109177628", "name": "Heljda oljuštena-sirova", "size": "300g", "jsonCategory": "Drevna zrna", "nutriscore": "A", "Poreklo": "Srbija",
    "ingredients": ["Heljda oljuštena-sirova 100%"], "labelText": "Heljda oljuštena-sirova", "license": false, "manufacturerStatement": true, "verified": true, "source": "Slavuj (dodato iz liste)", "tagsFromInput": ["vegan", "bez šećera"], "imageUrl": "https://placehold.co/400x200.png"
  },
  {
    "brand": "Slavuj", "barcode": "8606109176275", "name": "Heljda propržena", "size": "300g", "jsonCategory": "Drevna zrna", "nutriscore": "A", "Poreklo": "Srbija",
    "ingredients": ["Heljda propržena 100%"], "labelText": "Heljda propržena", "license": false, "manufacturerStatement": true, "verified": true, "source": "Slavuj (dodato iz liste)", "tagsFromInput": ["vegan", "bez šećera"], "imageUrl": "https://placehold.co/400x200.png"
  },
  {
    "brand": "Slavuj", "barcode": "8606109176251", "name": "Proso", "size": "300g", "jsonCategory": "Drevna zrna", "nutriscore": "A", "Poreklo": "Srbija",
    "ingredients": ["Proso 100%"], "labelText": "Proso", "license": false, "manufacturerStatement": true, "verified": true, "source": "Slavuj (dodato iz liste)", "tagsFromInput": ["vegan", "bez šećera"], "imageUrl": "https://placehold.co/400x200.png"
  },
  {
    "brand": "Slavuj", "barcode": "8606109177669", "name": "Prirodni med od heljde", "size": "900g", "jsonCategory": "Med", "nutriscore": "C", "Poreklo": "Srbija",
    "ingredients": ["Prirodni med od heljde 100%"], "labelText": "Prirodni med od heljde", "license": false, "manufacturerStatement": true, "verified": true, "source": "Slavuj (dodato iz liste)", "tagsFromInput": ["vegan"], "imageUrl": "https://placehold.co/400x200.png"
  },
  {
    "brand": "Slavuj", "barcode": "8606109176893", "name": "Prirodni med od heljde", "size": "400g", "jsonCategory": "Med", "nutriscore": "C", "Poreklo": "Srbija",
    "ingredients": ["Prirodni med od heljde 100%"], "labelText": "Prirodni med od heljde", "license": false, "manufacturerStatement": true, "verified": true, "source": "Slavuj (dodato iz liste)", "tagsFromInput": ["vegan"], "imageUrl": "https://placehold.co/400x200.png"
  },
  // Molendini Products
  {
    "barcode": 8600955501298,
    "name": "Keks sa voćnim punjenjem od aronije, šljive i jabuke",
    "size": "180g",
    "ingredients": [
      "voćno punjenje - aronija, šljiva i jabuka 27 % (voćna kaša - aronija 30 %, šljiva 30 % i jabuka 15 %, šećer, zgušnjivač: agar i limunska kiselina), invertni šećerni sirup, brašno (heljdino brašno, pirinčano brašno, ekstrudirano kukuruzno brašno i kukuruzno brašno), biljna (palmina) mast, mlevene semenke biljke chia (Salvia hispanica), med, mešavina začina (cimet i karanfilić), kakao prah sa redukovanim sadržajem kakao maslaca, jaja u prahu, konzervans (kalijum-sorbat), limunska kiselina, sredstva za dizanje testa (amonijum-bikarbonat i natrijum-hidrogenkarbonat), stabilizator (guar guma), emulgator (sojin lecitin) i so."
    ],
    "license": false,
    "manufacturerStatement": true,
    "verified": false,
    "source": "Molendini katalog",
    "tagsFromInput": [],
    "imageUrl": "molendini/keks-sa-vocnim-punjenjem-od-aronije-sljive-i-jabuke-8600955501298.jpg",
    "brand": "Molendini (Velptom)",
    "nutriscore": "N/A",
    "Poreklo": "Srbija",
    "Dostupnost": ""
  },
  {
    "barcode": 8600955501281,
    "name": "Keks sa voćnim punjenjem od kajsije i jabuke",
    "size": "180g",
    "ingredients": [
      "voćno punjenje - kajsija i jabuka 27 % (voćna kaša - kajsija 30 % i jabuka 30 %, šećer, glukozni sirup i limunska kiselina), invertni šećerni sirup, brašno (heljdino brašno, pirinčano brašno, ekstrudirano kukuruzno brašno i kukuruzno brašno), biljna (palmina) mast, mlevene semenke biljke chia (Salvia hispanica), med, mešavina začina (cimet i karanfilić), kakao prah sa redukovanim sadržajem kakao maslaca, jaja u prahu, konzervans (kalijum-sorbat), limunska kiselina, sredstva za dizanje testa (amonijum-bikarbonat i natrijum-hidrogenkarbonat), stabilizator (guar guma), emulgator (sojin lecitin) i so."
    ],
    "license": false,
    "manufacturerStatement": true,
    "verified": false,
    "source": "Molendini katalog",
    "tagsFromInput": [],
    "imageUrl": "molendini/keks-sa-vocnim-punjenjem-od-kajsije-i-jabuke-8600955501281.jpg",
    "brand": "Molendini (Velptom)",
    "nutriscore": "N/A",
    "Poreklo": "Srbija",
    "Dostupnost": ""
  },
  {
    "barcode": 8600955501311,
    "name": "Keks sa voćnim punjenjem od višnje i jabuke",
    "size": "180g",
    "ingredients": [
      "voćno punjenje - višnja i jabuka 27 % (voćna kaša - višnja 30 % i jabuka 30 %, šećer, glukozni sirup i limunska kiselina), invertni šećerni sirup, brašno (heljdino brašno, pirinčano brašno, ekstrudirano kukuruzno brašno i kukuruzno brašno), biljna (palmina) mast, mlevene semenke biljke chia (Salvia hispanica), med, mešavina začina (cimet i karanfilić), kakao prah sa redukovanim sadržajem kakao maslaca, jaja u prahu, konzervans (kalijum-sorbat), limunska kiselina, sredstva za dizanje testa (amonijum-bikarbonat i natrijum-hidrogenkarbonat), stabilizator (guar guma), emulgator (sojin lecitin) i so."
    ],
    "license": false,
    "manufacturerStatement": true,
    "verified": false,
    "source": "Molendini katalog",
    "tagsFromInput": [],
    "imageUrl": "molendini/keks-sa-vocnim-punjenjem-od-visnje-i-jabuke-8600955501311.jpg",
    "brand": "Molendini (Velptom)",
    "nutriscore": "N/A",
    "Poreklo": "Srbija",
    "Dostupnost": ""
  },
  {
    "barcode": 8600955501274,
    "name": "Keks punjen kremom",
    "size": "180g",
    "ingredients": [
      "punjenje – krem 23 % (šećer, nehidrogenizovana biljna ulja i masti (ulja (suncokreta), masti (palme)), kakao prah sa redukovanim sadržajem kakao maslaca (16,5 %), lešnici, kukuruzni skrob, emulgator (suncokretov lecitin) i aroma (vanilin)), invertni šećerni sirup, brašno (heljdino brašno, pirinčano brašno, ekstrudirano kukuruzno brašno i kukuruzno brašno), biljna (palmina) mast, mlevene semenke biljke chia (Salvia hispanica), med, mešavina začina (cimet i karanfilić), kakao prah sa redukovanim sadržajem kakao maslaca, jaja u prahu, konzervans (kalijum-sorbat), limunska kiselina, sredstva za dizanje testa (amonijum-bikarbonat i natrijum-hidrogenkarbonat), stabilizator (guar guma), emulgator (sojin lecitin) i so."
    ],
    "license": false,
    "manufacturerStatement": true,
    "verified": false,
    "source": "Molendini katalog",
    "tagsFromInput": [],
    "imageUrl": "molendini/keks-punjen-kremom-8600955501274.jpg",
    "brand": "Molendini (Velptom)",
    "nutriscore": "N/A",
    "Poreklo": "Srbija",
    "Dostupnost": ""
  },
  {
    "barcode": 8600955501526,
    "name": "Keks punjen belim kremom",
    "size": "180g",
    "ingredients": [
      "punjenje – beli krem 23 % (šećer, nehidrogenizovana biljna ulja i masti (ulja (suncokreta), masti (palme)), bela čokolada 10 % ( šećer, mleko u prahu, kakao maslac), mleko u prahu, kukuruzni skrob, emulgator (suncokretov lecitin) i aroma), invertni šećerni sirup, brašno (heljdino brašno, pirinčano brašno, ekstrudirano kukuruzno brašno i kukuruzno brašno), biljna (palmina) mast, mlevene semenke biljke chia (Salvia hispanica), med, mešavina začina (cimet i karanfilić), kakao prah sa redukovanim sadržajem kakao maslaca, jaja u prahu, konzervans (kalijum-sorbat), limunska kiselina, sredstva za dizanje testa (amonijum-bikarbonat i natrijum-hidrogenkarbonat), stabilizator (guar guma), emulgator (sojin lecitin) i so."
    ],
    "license": false,
    "manufacturerStatement": true,
    "verified": false,
    "source": "Molendini katalog",
    "tagsFromInput": [],
    "imageUrl": "molendini/keks-punjen-belim-kremom-8600955501526.jpg",
    "brand": "Molendini (Velptom)",
    "nutriscore": "N/A",
    "Poreklo": "Srbija",
    "Dostupnost": ""
  },
  {
    "barcode": 8600955501519,
    "name": "Keks punjen kremom sa lešnikom",
    "size": "180g",
    "ingredients": [
      "punjenje – krem proizvod sa dodatkom lešnika 23 % (šećer, nehidrogenizovana biljna ulja i masti (ulja (suncokreta), masti (palme)), kakao prah sa redukovanim sadržajem kakao maslaca 5,8%, obrano mleko u prahu 5,35%, lešnici 5,3 %, surutka u prahu, sojino brašno, emulgator (sojin lecitin) i aroma), invertni šećerni sirup, brašno (heljdino brašno, pirinčano brašno, ekstrudirano kukuruzno brašno i kukuruzno brašno), biljna (palmina) mast, mlevene semenke biljke chia (Salvia hispanica), med, mešavina začina (cimet i karanfilić), kakao prah sa redukovanim sadržajem kakao maslaca, jaja u prahu, konzervans (kalijum-sorbat), limunska kiselina, sredstva za dizanje testa (amonijum-bikarbonat i natrijum-hidrogenkarbonat), stabilizator (guar guma), emulgator (sojin lecitin) i so."
    ],
    "license": false,
    "manufacturerStatement": true,
    "verified": false,
    "source": "Molendini katalog",
    "tagsFromInput": [],
    "imageUrl": "molendini/keks-punjen-kremom-sa-lesnikom-8600955501519.jpg",
    "brand": "Molendini (Velptom)",
    "nutriscore": "N/A",
    "Poreklo": "Srbija",
    "Dostupnost": ""
  },
  {
    "barcode": 8600955501304,
    "name": "Keks sa šumskim voćem",
    "size": "180g",
    "ingredients": [
      "invertni šećerni sirup, brašno (heljdino brašno, pirinčano brašno, ekstrudirano kukuruzno brašno i kukuruzno brašno), biljna (palmina) mast, mlevene semenke biljke chia (Salvia hispanica), šumsko voće 4,4 % (kandirana brusnica 1,6 %, kandirana aronija 1,6 %, kandirana kupina 0,4 %, kandirana jagoda 0,4 %, kandirana malina 0,4 %), surogat čokolade u granulama 4 % (šećer, potpuno hidrogenizovane biljne masti palminog jezgra, kakao prah sa redukovanim sadržajem kakao maslaca 16 %, emulgator - sojin lecitin, aroma – vanilin), med, kakao prah sa redukovanim sadržajem kakao maslaca, jaja u prahu, konzervans (kalijum-sorbat), limunska kiselina, sredstva za dizanje testa (amonijum-bikarbonat i natrijum-hidrogenkarbonat), stabilizator (guar guma), emulgator (sojin lecitin), aroma šumskog voća i so."
    ],
    "license": false,
    "manufacturerStatement": true,
    "verified": false,
    "source": "Molendini katalog",
    "tagsFromInput": [],
    "imageUrl": "molendini/keks-sa-sumskim-vocem-8600955501304.jpg",
    "brand": "Molendini (Velptom)",
    "nutriscore": "N/A",
    "Poreklo": "Srbija",
    "Dostupnost": ""
  },
  {
    "barcode": 8600955501809,
    "name": "Keks Frollini sa kremom",
    "size": "120g",
    "ingredients": [
      "brašno (pirinčano brašno, kukuruzno brašno, ekstrudirano kukuruzno brašno, obezmašćeno sojino brašno), punjenje – krem 13 % (šećer, nehidrogenizovana biljna ulja i masti (ulja (suncokreta), masti (palme)), kakao prah sa redukovanim sadržajem kakao maslaca (16,5 %), lešnici, kukuruzni skrob, emulgator (suncokretov lecitin) i aroma (vanilin)), biljna (palmina) mast, invertni šećerni sirup, kukuruzni skrob, šećer, med, belance u prahu, sredstva za dizanje testa (natrijum-hidrogenkarbonat i natrijum-pirofosfat), so, limunska kiselina, konzervans (kalijum-sorbat), stabilizator (guar guma), emulgator (sojin lecitin) i  aroma slatke pavlake."
    ],
    "license": false,
    "manufacturerStatement": true,
    "verified": false,
    "source": "Molendini katalog",
    "tagsFromInput": [],
    "imageUrl": "molendini/keks-frollini-sa-kremom-8600955501809.png",
    "brand": "Molendini (Velptom)",
    "nutriscore": "N/A",
    "Poreklo": "Srbija",
    "Dostupnost": ""
  },
  {
    "barcode": 8600955501816,
    "name": "Keks Frollini sa belim kremom",
    "size": "120g",
    "ingredients": [
      "brašno (pirinčano brašno, kukuruzno brašno, ekstrudirano kukuruzno brašno, obezmašćeno sojino brašno), punjenje – beli krem 13 % (šećer, nehidrogenizovana biljna ulja i masti (ulja (suncokreta), masti (palme)), bela čokolada 10 % ( šećer, mleko u prahu, kakao maslac), mleko u prahu, kukuruzni skrob, emulgator (suncokretov lecitin) i aroma), biljna (palmina) mast, invertni šećerni sirup, kukuruzni skrob, šećer, med, belance u prahu,  sredstva za dizanje testa (natrijum hidrogenkarbonat i natrijum pirofosfat), so, kakao prah sa redukovanim sadržajem kakao maslaca, limunska kiselina, konzervans (kalijum-sorbat), aroma čokolade, stabilizator (guar guma),  emulgator (sojin lecitin), aroma slatke pavlake i prirodna boja (oksid gvožđa). "
    ],
    "license": false,
    "manufacturerStatement": true,
    "verified": false,
    "source": "Molendini katalog",
    "tagsFromInput": [],
    "imageUrl": "molendini/keks-frollini-sa-belim-kremom-8600955501816.png",
    "brand": "Molendini (Velptom)",
    "nutriscore": "N/A",
    "Poreklo": "Srbija",
    "Dostupnost": ""
  },
  {
    "barcode": 8600955501861,
    "name": "Keks sa urmom punjen šljivom",
    "size": "180g",
    "ingredients": [
      "urma (mlevena) 27 %, voćno punjenje - šljiva 20 % (voćna kaša – šljiva 99,4 % i zgušnjivač: agar), brašno (heljdino brašno, pirinčano brašno i ekstrudirano kukuruzno brašno), biljna (palmina) mast, mlevene semenke biljke chia (Salvia hispanica), mešavina začina (cimet i karanfilić), kakao prah sa redukovanim sadržajem kakao maslaca, jaja u prahu, belance u prahu, konzervans (kalijum-sorbat), limunska kiselina, sredstva za dizanje testa (amonijum-bikarbonat i natrijum-hidrogenkarbonat), stabilizator (guar guma), emulgator (sojin lecitin) i so."
    ],
    "license": false,
    "manufacturerStatement": true,
    "verified": false,
    "source": "Molendini katalog",
    "tagsFromInput": [],
    "imageUrl": "molendini/keks-sa-urmom-punjen-sljivom-8600955501861.jpg",
    "brand": "Molendini (Velptom)",
    "nutriscore": "N/A",
    "Poreklo": "Srbija",
    "Dostupnost": ""
  },
  {
    "barcode": 8600955501878,
    "name": "Keks sa urmom punjen višnjom",
    "size": "180g",
    "ingredients": [
      "urma (mlevena) 27%, voćno punjenje - višnja 20 % (voćna kaša – višnja 99,4 % i zgušnjivač: agar), brašno (heljdino brašno, pirinčano brašno i ekstrudirano kukuruzno brašno), biljna (palmina) mast, mlevene semenke biljke chia (Salvia hispanica), mešavina začina (cimet, karanfilić), kakao prah sa redukovanim sadržajem kakao maslaca, jaja u prahu, belance u prahu, konzervans (kalijum-sorbat), limunska kiselina, sredstva za dizanje testa (amonijum-bikarbonat i natrijum-hidrogenkarbonat), stabilizator (guar guma), emulgator (sojin lecitin) i so."
    ],
    "license": false,
    "manufacturerStatement": true,
    "verified": false,
    "source": "Molendini katalog",
    "tagsFromInput": [],
    "imageUrl": "molendini/keks-sa-urmom-punjen-visnjom-8600955501878.jpg",
    "brand": "Molendini (Velptom)",
    "nutriscore": "N/A",
    "Poreklo": "Srbija",
    "Dostupnost": ""
  },
  {
    "barcode": 8600955501885,
    "name": "Keks sa urmom punjen smokvom",
    "size": "180g",
    "ingredients": [
      "urma (mlevena) 27 %, voćno punjenje - smokva 20 % (voćna kaša – smokva 99,4 % i zgušnjivač: agar), brašno (heljdino brašno, pirinčano brašno i ekstrudirano kukuruzno brašno), biljna (palmina) mast, mlevene semenke biljke chia (Salvia hispanica), mešavina začina (cimet i karanfilić), kakao prah sa redukovanim sadržajem kakao maslaca, jaja u prahu, belance u prahu, konzervans (kalijum-sorbat), limunska kiselina, sredstva za dizanje testa (amonijum-bikarbonat i natrijum-hidrogenkarbonat), stabilizator (guar guma), emulgator (sojin lecitin) i so."
    ],
    "license": false,
    "manufacturerStatement": true,
    "verified": false,
    "source": "Molendini katalog",
    "tagsFromInput": [],
    "imageUrl": "molendini/keks-sa-urmom-punjen-smokvom-8600955501885.jpg",
    "brand": "Molendini (Velptom)",
    "nutriscore": "N/A",
    "Poreklo": "Srbija",
    "Dostupnost": ""
  },
  {
    "barcode": 8600955501991,
    "name": "Kreker sa đumbirom",
    "size": "120g",
    "ingredients": [
      "brašno (pirinčano/rižino brašno, heljdino brašno, kukuruzno brašno, ekstrudirano kukuruzno brašno i brašno od prosa), biljna (palmina) mast, kukuruzni skrob,                               mlevene/mljevene semenke/sjemenke biljke chia (Salvia hispanica), citrusna vlakna, so/sol, đumbir u prahu 1%, kiselina/kisjelina (limunska kiselina/kisjelina), konzervans (kalijum-sorbat), sredstva za dizanje testa/tijesta (natrijum-hidrogenkarbonat i natrijum-pirofosfat), stabilizator (guar guma), emulgator (sojin lecitin) i aroma đumbir. "
    ],
    "license": false,
    "manufacturerStatement": true,
    "verified": false,
    "source": "Molendini katalog",
    "tagsFromInput": ["bez šećera"],
    "imageUrl": "molendini/kreker-sa-djumbirom-8600955501991.jpg",
    "brand": "Molendini (Velptom)",
    "nutriscore": "N/A",
    "Poreklo": "Srbija",
    "Dostupnost": ""
  },
  {
    "barcode": 8600955501977,
    "name": "Kreker sa belim lukom ",
    "size": "120g",
    "ingredients": [
      "brašno (pirinčano/rižino brašno, heljdino brašno, kukuruzno brašno, ekstrudirano kukuruzno brašno i brašno od prosa), biljna (palmina) mast, kukuruzni skrob, mlevene/mljevene semenke/sjemenke biljke chia (Salvia hispanica), citrusna vlakana, so/sol, beli/bijeli luk u prahu 0,65%, kiselina/kisjelina (limunska kiselina/kisjelina), konzervans (kalijum-sorbat), sredstva za dizanje testa/tijesta (natrijum-hidrogenkarbonat i natrijum-pirofosfat), stabilizator (guar guma) i emulgator (sojin lecitin)."
    ],
    "license": false,
    "manufacturerStatement": true,
    "verified": false,
    "source": "Molendini katalog",
    "tagsFromInput": ["bez šećera"],
    "imageUrl": "molendini/kreker-sa-belim-lukom-8600955501977.jpg",
    "brand": "Molendini (Velptom)",
    "nutriscore": "N/A",
    "Poreklo": "Srbija",
    "Dostupnost": ""
  },
  {
    "barcode": 8600955501984,
    "name": "Kreker sa čilijem",
    "size": "120g",
    "ingredients": [
      "brašno (pirinčano/rižino brašno, heljdino brašno, kukuruzno brašno, ekstrudirano kukuruzno brašno i brašno od prosa), biljna (palmina) mast, kukuruzni skrob,                               mlevene/mljevene semenke/sjemenke biljke chia (Salvia hispanica), citrusna vlakna, so/sol, kiselina/kisjelina (limunska kiselina/kisjelina), konzervans (kalijum-sorbat), sredstva za dizanje testa/tijesta (natrijum-hidrogenkarbonat i natrijum-pirofosfat), čili u prahu 0,4%, stabilizator (guar guma) i emulgator (sojin lecitin)."
    ],
    "license": false,
    "manufacturerStatement": true,
    "verified": false,
    "source": "Molendini katalog",
    "tagsFromInput": ["bez šećera"],
    "imageUrl": "molendini/kreker-sa-cilijem-8600955501984.jpg",
    "brand": "Molendini (Velptom)",
    "nutriscore": "N/A",
    "Poreklo": "Srbija",
    "Dostupnost": ""
  },
  {
    "barcode": 8600955502004,
    "name": "Kreker sa kikirikijem",
    "size": "120g",
    "ingredients": [
      "brašno (pirinčano/rižino brašno, heljdino brašno, kukuruzno brašno, ekstrudirano kukuruzno brašno i brašno od prosa), biljna (palmina) mast, kukuruzni skrob,                               mleveni/mljeveni kikiriki 4,5 %, mlevene/mljevene semenke/sjemenke biljke chia (Salvia hispanica), citrusna vlakna, so/sol, kiselina/kisjelina (limunska kiselina/kisjelina), konzervans (kalijum-sorbat), sredstva za dizanje testa/tijesta (natrijum-hidrogenkarbonat i natrijum-pirofosfat), stabilizator (guar guma), emulgator (sojin lecitin) i aroma kikirikija."
    ],
    "license": false,
    "manufacturerStatement": true,
    "verified": false,
    "source": "Molendini katalog",
    "tagsFromInput": ["bez šećera"],
    "imageUrl": "molendini/kreker-sa-kikirikijem-8600955502004.jpg",
    "brand": "Molendini (Velptom)",
    "nutriscore": "N/A",
    "Poreklo": "Srbija",
    "Dostupnost": ""
  },
  // Scitec Nutrition Product with Recall
  {
    "brand": "Scitec Nutrition",
    "name": "Choco Pro Bar 50g - Salted Caramel",
    "barcode": "5999100025684",
    "size": "50g",
    "ingredients": ["Sastojci nisu dostupni za ovaj unos. VAŽNO: Serija 1281203 (Salted Caramel) je povučena zbog prisustva glutena."],
    "labelText": "Gluten free",
    "license": true,
    "manufacturerStatement": true,
    "verified": false,
    "source": "Scitec Nutrition Obaveštenje o Povlačenju",
    "tagsFromInput": ["povučeno", "sadrži-gluten", "serija-problematična", "upozorenje", "salted caramel", "protein bar"],
    "imageUrl": "scitec-nutrition/scitec-choco-pro-bar-salted-caramel-5999100025684.png", // Assumed path
    "Poreklo": "EU (Proveriti na pakovanju)",
    "seriesAffected": {
      "lotNumbers": ["1281203"],
      "expiry": "12.2025",
      "finding": "Prisustvo glutena iznad dozvoljenog nivoa u seriji 1281203.",
      "status": "Povučeno iz prodaje",
      "sourceLink": "https://scitecnutrition.com/scitec-choco-pro-product-recall-a23062"
    },
    "warning": true,
    "note": "VAŽNO: Serija 1281203 ukusa Salted Caramel je povučena zbog utvrđenog prisustva glutena. Obavezno proverite broj serije na pakovanju pre konzumacije!"
  },
];

export const placeholderProducts: Product[] = rawProductsData.flat().map((p, index) => {
  const originalTags = p.tagsFromInput?.map(t => t.toLowerCase()) || [];
  const isSugarFreeInput = originalTags.includes('bez šećera') || p.name?.toLowerCase().includes('bez šećera');
  const isPosnoSource = originalTags.includes('vegan');
  const isProteinSource = originalTags.includes('protein');

  const productTags: Set<string> = new Set<string>();

  const ingredientsString = Array.isArray(p.ingredients) ? p.ingredients.join(' ').toLowerCase() : (typeof p.ingredients === 'string' ? p.ingredients.toLowerCase() : '');
  let containsKnownGlutenSource = false;

  if (p.warning) {
    productTags.add('sadrži-gluten');
    productTags.add('upozorenje');
    productTags.add('povučeno');
    productTags.add('problematična-serija');
    containsKnownGlutenSource = true;
  } else {
    if (ingredientsString.includes('ječma') || ingredientsString.includes('barley') || ingredientsString.includes('ječmenog slada') || ingredientsString.includes('ekstrakt slada')) {
      productTags.add('contains-barley');
      productTags.add('contains-gluten');
      containsKnownGlutenSource = true;
    }
    if (ingredientsString.includes('pšenic') || ingredientsString.includes('wheat') || ingredientsString.includes('pšenična krupica') || ingredientsString.includes('pšenični skrob') || ingredientsString.includes('durum') || ingredientsString.includes('spelta') || ingredientsString.includes('kuskus') || ingredientsString.includes('polbe')) {
      productTags.add('contains-wheat');
      if (!productTags.has('contains-gluten')) productTags.add('contains-gluten');
      containsKnownGlutenSource = true;
    }
    if (ingredientsString.includes('raž') || ingredientsString.includes('rye')) {
      productTags.add('contains-rye');
      if (!productTags.has('contains-gluten')) productTags.add('contains-gluten');
      containsKnownGlutenSource = true;
    }
    if (ingredientsString.includes('ovas') || ingredientsString.includes('zob') || ingredientsString.includes('oats')) {
      productTags.add('contains-oats');
    }

    if (!containsKnownGlutenSource) {
      if (p.license) {
        productTags.add('gluten-free');
      } else if (p.manufacturerStatement && p.labelText?.toLowerCase().includes('gluten free')) {
        productTags.add('gluten-free');
      } else if (p.manufacturerStatement && (p.tagsFromInput || []).includes('gluten-free')) {
        productTags.add('gluten-free');
      } else if (p.manufacturerStatement && !productTags.has('contains-oats')) {
        productTags.add('gluten-free');
      }
    }
  }

  if (isSugarFreeInput) productTags.add('sugar-free');
  if (isPosnoSource) productTags.add('posno');
  if (isProteinSource) productTags.add('high-protein');

  (p.tagsFromInput || []).forEach(tag => {
    const lowerTag = tag.toLowerCase();
    if (lowerTag !== 'bez šećera' && lowerTag !== 'vegan' && lowerTag !== 'protein' &&
      !productTags.has(lowerTag) && !['gluten-free', 'contains-gluten', 'contains-wheat', 'contains-barley', 'contains-rye', 'contains-oats', 'sadrži-gluten', 'upozorenje', 'povučeno', 'problematična-serija'].includes(lowerTag)) {
      productTags.add(lowerTag);
    }
  });

  let category = 'Other';
  const lowerName = p.name.toLowerCase();
  const lowerLabelText = p.labelText ? p.labelText.toLowerCase() : '';
  const jsonCategory = p.jsonCategory?.toLowerCase();

  if (jsonCategory === 'brašno' || jsonCategory === 'drevna zrna') {
    category = 'Flours & Grains';
  } else if (jsonCategory === 'pahuljice') {
    category = 'Cereals & Flakes';
  } else if (jsonCategory === 'med') {
    category = 'Honey & Sweeteners';
  } else if (lowerName.includes('keks') || lowerLabelText.includes('keks') || lowerName.includes('cookies') || lowerLabelText.includes('cookies') || lowerName.includes('kolutići') || lowerLabelText.includes('kolutići') || lowerName.includes('vanilice') || lowerLabelText.includes('vanilice') || lowerName.includes('pusa') || lowerLabelText.includes('pusa') || lowerName.includes('frollini')) {
    category = 'Sweets & Biscuits';
  } else if (lowerName.includes('kreker') || lowerLabelText.includes('kreker') || lowerName.includes('štapići') || lowerLabelText.includes('štapići') || lowerName.includes('chia') || lowerLabelText.includes('chia') || lowerName.includes('alex') || lowerLabelText.includes('alex')) {
    category = 'Salty Snacks';
  } else if (lowerName.includes('palenta') || lowerLabelText.includes('palenta') || lowerName.includes('griz') || lowerLabelText.includes('griz') || lowerName.includes('mix') || lowerLabelText.includes('mix') || lowerName.includes('prezle') || lowerLabelText.includes('prezle') || lowerName.includes('tapioka') || lowerLabelText.includes('tapioka')) {
    category = 'Flours & Grains';
  } else if (lowerName.includes('dvopek') || lowerLabelText.includes('dvopek')) {
    category = 'Bakery';
  } else if (lowerName.includes('krem') || lowerLabelText.includes('krem')) {
    category = 'Spreads & Creams';
  } else if (lowerName.includes('noodle') || lowerLabelText.includes('noodle') || lowerName.includes('pasta') || lowerLabelText.includes('pasta') || lowerName.includes('tagliatelle') || lowerLabelText.includes('tagliatelle') || lowerName.includes('taljatele') || lowerLabelText.includes('taljatele')) {
    category = 'Pasta & Noodles';
  } else if (lowerName.includes('pire') || lowerLabelText.includes('pire') || lowerName.includes('supa') || lowerLabelText.includes('supa')) {
    category = 'Soups & Instant Meals';
  } else if (jsonCategory === 'spices & seasonings' || lowerName.includes('začin') || lowerLabelText.includes('začin') || lowerName.includes('paprika') || lowerLabelText.includes('paprika') || lowerName.includes('biber') || lowerLabelText.includes('biber') || (lowerName.includes('so') && !lowerName.includes('sos'))) {
    category = 'Spices & Seasonings';
  } else if (lowerName.includes('bar') && isProteinSource) {
    category = 'Protein & Energy Bars';
  }

  let actualIsPosno = isPosnoSource;
  let actualIsLactoseFree = isPosnoSource;

  const milkKeywords = ['mleko', 'mlijeko', 'mlečni', 'surutka', 'whey', 'sir', 'cheese', 'kazein', 'casein', 'laktoza', 'lactose', 'bela čokolada']; // "bela čokolada" often contains milk
  const eggKeywords = ['jaja', 'jaje', 'jaja u prahu', 'belance', 'belance u prahu', 'egg'];

  if (milkKeywords.some(kw => ingredientsString.includes(kw))) {
    actualIsPosno = false;
    actualIsLactoseFree = false;
    productTags.delete('posno'); // Remove if present
  }
  if (eggKeywords.some(kw => ingredientsString.includes(kw))) {
    actualIsPosno = false; // Eggs are not posno
    // Lactose status is independent of eggs
  }

  if (actualIsLactoseFree && !productTags.has('posno')) productTags.add('lactose-free');
  else if (!actualIsLactoseFree) productTags.delete('lactose-free');


  const isFullUrl = p.imageUrl?.startsWith('http://') || p.imageUrl?.startsWith('https://');
  let finalImageUrl = 'https://placehold.co/400x200.png'; // Default placeholder

  if (p.imageUrl) {
    if (isFullUrl) {
      finalImageUrl = p.imageUrl;
    } else {
      const encodedImagePath = p.imageUrl.replace(/\//g, '%2F');
      finalImageUrl = `${firebaseStorageBaseUrl}${encodedImagePath}?alt=media`;
    }
  }

  if (p.name.toLowerCase().includes("polbe")) {
    productTags.delete('gluten-free');
    productTags.add('contains-wheat');
    productTags.add('contains-gluten');
  }
  if (p.barcode === "8606107907567") {
    productTags.delete('gluten-free');
    productTags.add('contains-barley');
    productTags.add('contains-gluten');
  }

  const nameForDesc = p.name.replace(/(\d+g|\d+kg)/i, '').trim();
  const productSizeFromName = p.name.match(/(\d+g|\d+kg)/i);
  const currentProductSize = p.size || (productSizeFromName ? productSizeFromName[0] : p.weight); // Use p.weight as fallback for size

  let description = `${nameForDesc}${currentProductSize ? ' - ' + currentProductSize : ''}${p.Poreklo ? ` (Poreklo: ${p.Poreklo})` : ''}`;
  if (p.warning && p.note) {
    description = `${p.note} Originalni opis: ${description}`;
  }

  return {
    id: p.barcode?.toString() || `product-${index}-${p.name.replace(/\s+/g, '-')}`,
    name: p.name,
    brand: p.brand,
    barcode: p.barcode?.toString() || undefined,
    category: category,
    imageUrl: finalImageUrl,
    description: description,
    ingredientsText: Array.isArray(p.ingredients) ? p.ingredients.join(', ') : (p.ingredients || "Sastojci nisu navedeni."),
    labelText: p.labelText || p.name,
    hasAOECSLicense: !!p.license,
    hasManufacturerStatement: !!p.manufacturerStatement,
    isVerifiedAdmin: !!p.verified,
    source: p.source,
    tags: Array.from(productTags),
    nutriScore: p.nutriscore && p.nutriscore.toUpperCase() !== "N/A" ? p.nutriscore.toUpperCase() : undefined,
    isLactoseFree: actualIsLactoseFree,
    isSugarFree: isSugarFreeInput,
    isPosno: actualIsPosno,
    dataAiHint: sanitizeForDataAiHint(p.name, `product ${p.brand?.toLowerCase() || 'item'} ${index}`),
    warning: p.warning,
    note: p.note,
    seriesAffected: p.seriesAffected,
  };
});

const productCategories = Array.from(new Set(placeholderProducts.map(p => p.category))).sort();

const getNutriScoreClasses = (score?: string) => {
  if (!score) return 'border-gray-300 text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500';
  switch (score.toUpperCase()) {
    case 'A': return 'border-green-500 text-green-700 dark:text-green-400 dark:border-green-600 bg-green-100 dark:bg-green-900/50';
    case 'B': return 'border-lime-500 text-lime-700 dark:text-lime-400 dark:border-lime-600 bg-lime-100 dark:bg-lime-900/50';
    case 'C': return 'border-yellow-500 text-yellow-700 dark:text-yellow-400 dark:border-yellow-600 bg-yellow-100 dark:bg-yellow-900/50';
    case 'D': return 'border-orange-500 text-orange-700 dark:text-orange-400 dark:border-orange-600 bg-orange-100 dark:bg-orange-900/50';
    case 'E': return 'border-red-500 text-red-700 dark:text-red-400 dark:border-red-600 bg-red-100 dark:bg-red-900/50';
    default: return 'border-gray-300 text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500';
  }
};

const explicitlyHandledTags = [
  'gluten-free', 'contains-gluten', 'may-contain-gluten',
  'contains-wheat', 'risk-of-contamination', 'contains-barley', 'contains-rye', 'contains-oats',
  'sugar-free', 'lactose-free', 'posno', 'high-protein', 'upozorenje', 'povučeno', 'problematična-serija', 'sadrži-gluten'
];

const PRODUCTS_PER_PAGE = 12;

export default function ProductsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState(placeholderProducts);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let newFilteredProducts = placeholderProducts;
    if (searchTerm.trim()) {
      newFilteredProducts = newFilteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase().trim())
      );
    }
    if (selectedCategory !== 'all') {
      newFilteredProducts = newFilteredProducts.filter(product => product.category === selectedCategory);
    }
    setFilteredProducts(newFilteredProducts);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, selectedCategory]);

  const indexOfLastProduct = currentPage * PRODUCTS_PER_PAGE;
  const indexOfFirstProduct = indexOfLastProduct - PRODUCTS_PER_PAGE;
  const currentProductsToDisplay = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };


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

          {currentProductsToDisplay.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentProductsToDisplay.map(product => {
                  const isGlutenFreeTag = product.tags?.includes('gluten-free');
                  const containsGlutenTag = product.warning || product.tags?.includes('contains-gluten') || product.tags?.includes('sadrži-gluten') || product.tags?.includes('contains-wheat') || product.tags?.includes('contains-barley') || product.tags?.includes('contains-rye') || (product.tags?.includes('contains-oats') && !isGlutenFreeTag);
                  const mayContainGlutenTag = !product.warning && (product.tags?.includes('may-contain-gluten') || product.tags?.includes('risk-of-contamination'));

                  return (
                    <Card key={product.id} className={`overflow-hidden hover:shadow-xl transition-shadow duration-200 flex flex-col ${product.warning ? 'border-destructive border-2' : ''}`}>
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
                            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${getNutriScoreClasses(product.nutriScore)}`}>
                              {product.nutriScore}
                            </span>
                          )}
                        </div>

                        {product.warning ? (
                          <div className="flex items-center text-red-600 dark:text-red-400 text-xs mt-1 mb-1 font-semibold">
                            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                            <span>UPOZORENJE: Problematična serija!</span>
                          </div>
                        ) : isGlutenFreeTag ? (
                          <div className="flex items-center text-green-600 dark:text-green-400 text-xs mt-1 mb-1">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            <span>Gluten-Free</span>
                          </div>
                        ) : containsGlutenTag ? (
                          <div className="flex items-center text-red-600 dark:text-red-500 text-xs mt-1 mb-1">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            <span>Contains Gluten</span>
                          </div>
                        ) : mayContainGlutenTag ? (
                          <div className="flex items-center text-orange-500 dark:text-orange-400 text-xs mt-1 mb-1">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            <span>May Contain Traces</span>
                          </div>
                        ) : (
                           <div className="flex items-center text-muted-foreground text-xs mt-1 mb-1">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            <span>Proveriti sastav</span>
                          </div>
                        )}


                        <p className="text-sm mb-3 h-10 overflow-hidden flex-grow">{product.description.length > 100 && product.warning ? product.note : product.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {product.isLactoseFree && <Badge variant="secondary" className="text-xs">Lactose-Free</Badge>}
                          {product.isSugarFree && <Badge variant="secondary" className="text-xs">Sugar-Free</Badge>}
                          {product.isPosno && <Badge variant="secondary" className="text-xs">Posno</Badge>}
                          {product.tags?.filter(tag => !explicitlyHandledTags.includes(tag.toLowerCase())).slice(0, 2).map(tag => (
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
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
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
