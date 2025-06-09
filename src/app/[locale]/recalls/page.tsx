
// This file uses client-side rendering for potential interactivity.
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Siren, Search, Filter, PackageSearch, Info, MapPinIcon, TagIcon, Barcode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

// Define the structure for a recall item
interface RecallItem {
  id: string;
  date: string;
  productName: string;
  productBrand?: string;
  productId?: string; // To link to product details page
  productImageUrl?: string;
  dataAiHint?: string;
  status: 'lot-specific' | 'global-recall' | 'check-suspicion';
  lotNumbers: string[];
  displayLotNumbers: string; // For table display (e.g., "123, 456, ...")
  country: string;
  reason?: string;
  sourceLink?: string;
  advice?: string;
}

const placeholderRecalls: RecallItem[] = [
  {
    id: '1',
    date: '09.06.2025',
    productName: 'Dr. Schär Mix It Dunkel Rustico',
    productBrand: 'Dr. Schär',
    productId: 'schar-mix-it-dunkel-1000g', // Example ID, can be used for linking
    productImageUrl: 'https://placehold.co/64x64.png', // Placeholder
    dataAiHint: 'flour mix bread',
    status: 'lot-specific',
    lotNumbers: ['141025C', '141025D', '151025A', '161025B', '171025X'],
    displayLotNumbers: '141025C, 141025D, 151025A, ...', // Show truncated in table
    country: 'Hrvatska',
    reason: 'Prisustvo neodobrenog pesticida (Etilen oksid) iznad dozvoljene granice u sirovini (psilijum).',
    sourceLink: 'https://www.schaer.com/hr-hr/p/obavijest-o-opozivu-proizvoda-mix-it-dunkel',
    advice: 'Potrošači koji su kupili navedeni proizvod, ukoliko se LOT broj na pakovanju podudara sa navedenim LOT brojevima, mole se da proizvod ne konzumiraju i da ga vrate na mesto kupovine.',
  },
  // Example of another recall status
  {
    id: '2',
    date: '15.05.2025',
    productName: 'Bezglutenske Kukuruzne Pahuljice',
    productBrand: 'BioLife',
    productId: 'biolife-cornflakes-500g',
    productImageUrl: 'https://placehold.co/64x64.png',
    dataAiHint: 'cereal cornflakes',
    status: 'global-recall',
    lotNumbers: ['SVI'],
    displayLotNumbers: 'SVI LOT-ovi',
    country: 'EU',
    reason: 'Potencijalna kontaminacija glutenom usled greške u proizvodnji.',
    sourceLink: '#', // Placeholder link
    advice: 'Svi potrošači se mole da vrate proizvod na mesto kupovine za puni povraćaj novca.',
  },
  {
    id: '3',
    date: '01.06.2025',
    productName: 'Pirinčani Krekeri sa Susamom',
    productBrand: 'Zdravo Zalogaj',
    // No productId if not in our DB
    productImageUrl: 'https://placehold.co/64x64.png',
    dataAiHint: 'rice crackers snack',
    status: 'check-suspicion',
    lotNumbers: ['Proveriti ambalažu'],
    displayLotNumbers: 'Nije specifičan LOT',
    country: 'Srbija',
    reason: 'Prijavljena sumnja na nedeklarisane alergene. Proizvođač vrši internu proveru.',
    sourceLink: '#',
    advice: 'Osobe sa alergijama da obrate pažnju. Pratite zvanična obaveštenja proizvođača.',
  }
];

// Dummy categories for filter example
const productCategories = ['Sve kategorije', 'Brašno i smeše', 'Grickalice', 'Testenine', 'Slatkiši'];
const countries = ['Sve zemlje', 'Hrvatska', 'Srbija', 'EU', 'Ostalo'];

export default function RecallsPage() {
  const params = useParams();
  const locale = params.locale as string; // Ensure locale is available for links
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Sve kategorije');
  const [selectedCountry, setSelectedCountry] = useState('Sve zemlje');
  
  // In a real app, filtering logic would go here
  const filteredRecalls = placeholderRecalls.filter(recall => {
    const nameMatch = recall.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (recall.productBrand && recall.productBrand.toLowerCase().includes(searchTerm.toLowerCase()));
    // Basic filtering example, more complex logic would be needed
    return nameMatch;
  });

  const getStatusBadge = (status: RecallItem['status']) => {
    switch (status) {
      case 'lot-specific':
        return <Badge variant="warning">Opoziv (LOT-spec.)</Badge>;
      case 'global-recall':
        return <Badge variant="destructive">Potpuni opoziv</Badge>;
      case 'check-suspicion':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200">Proveriti (sumnja)</Badge>;
      default:
        return <Badge variant="outline">Nepoznat status</Badge>;
    }
  };


  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarRail />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-6 md:p-8">
          <PageHeader 
            title="Aktivni Opozivi Proizvoda"
            description="Lista proizvoda koji su povučeni sa tržišta ili su pod istragom."
            icon={Siren}
          />

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5 text-primary"/> Filteri i Pretraga Opoziva</CardTitle>
              <CardDescription>Pronađite specifične opozive koristeći filtere ispod.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="recall-search" className="text-sm font-medium mb-1 block">Pretraga (naziv, barkod)</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="recall-search" 
                    placeholder="Unesi naziv ili barkod..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="recall-category" className="text-sm font-medium mb-1 block">Kategorija proizvoda</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="recall-category">
                    <SelectValue placeholder="Izaberi kategoriju" />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="recall-country" className="text-sm font-medium mb-1 block">Zemlja</label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger id="recall-country">
                    <SelectValue placeholder="Izaberi zemlju" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] whitespace-nowrap">📅 Datum</TableHead>
                  <TableHead className="min-w-[250px]">🧾 Proizvod</TableHead>
                  <TableHead className="whitespace-nowrap">⚠️ Status</TableHead>
                  <TableHead>📦 LOT brojevi</TableHead>
                  <TableHead className="whitespace-nowrap">🧭 Zemlja</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Detalji</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecalls.length > 0 ? filteredRecalls.map((recall) => (
                  <TableRow key={recall.id}>
                    <TableCell className="font-medium">{recall.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {recall.productImageUrl && (
                           <Image 
                              src={recall.productImageUrl} 
                              alt={recall.productName} 
                              width={40} 
                              height={40} 
                              className="rounded-md object-cover"
                              data-ai-hint={recall.dataAiHint || 'product image'}
                            />
                        )}
                        <div>
                          {recall.productId ? (
                            <Link href={`/${locale}/products/${recall.productId}`} className="font-semibold hover:underline">
                              {recall.productName}
                            </Link>
                          ) : (
                            <span className="font-semibold">{recall.productName}</span>
                          )}
                          {recall.productBrand && <div className="text-xs text-muted-foreground">{recall.productBrand}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(recall.status)}</TableCell>
                    <TableCell className="text-xs">{recall.displayLotNumbers}</TableCell>
                    <TableCell>{recall.country}</TableCell>
                    <TableCell className="text-right">
                       {/* Details button could open a modal or navigate to a recall details page in future */}
                      <Button variant="outline" size="sm" asChild>
                         {/* For now, link to product if available, otherwise a placeholder action */}
                        {recall.productId ? (
                           <Link href={`/${locale}/products/${recall.productId}`}>
                            Vidi proizvod
                           </Link>
                        ) : (
                          // In a real app, this might open a modal with recall.reason, recall.advice, recall.sourceLink
                          <span onClick={() => alert(`Detalji opoziva za ${recall.productName}:\nRazlog: ${recall.reason}\nSavet: ${recall.advice}\nIzvor: ${recall.sourceLink || 'Nije naveden'}`)} className="cursor-pointer">
                             Info
                          </span>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      Nema aktivnih opoziva koji odgovaraju vašoj pretrazi.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <CardDescription className="mt-4 text-sm">
            <Info className="inline h-4 w-4 mr-1.5 text-muted-foreground"/>
            Klikom na proizvod ili dugme "Info" možete videti više detalja (razlog opoziva, link ka izvoru, saveti korisnicima). Lista se redovno ažurira.
          </CardDescription>


          <Card className="mt-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PackageSearch className="h-5 w-5 text-primary" /> Šta Sadrži Sekcija "Aktivni Opozivi"?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                Ovde možete pronaći informacije o proizvodima koji su zvanično povučeni sa tržišta ili su pod posebnim merama opreza. Cilj je da vam pružimo pravovremene i tačne podatke kako biste mogli da donesete informisane odluke.
              </p>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Mogućnosti Filtracije:</h3>
                <ul className="list-disc list-inside pl-4 space-y-1 text-muted-foreground">
                  <li><TagIcon className="inline h-4 w-4 mr-1.5 text-primary"/><strong>Kategorija proizvoda:</strong> Filtrirajte opozive po tipu proizvoda (npr. brašno, grickalice, testenine).</li>
                  <li><Barcode className="inline h-4 w-4 mr-1.5 text-primary"/><strong>Pretraga po barkodu ili nazivu:</strong> Brzo pronađite specifičan proizvod.</li>
                  <li><MapPinIcon className="inline h-4 w-4 mr-1.5 text-primary"/><strong>Filter po zemlji:</strong> Pregledajte opozive relevantne za vaše tržište (HR, RS, EU, itd.).</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Statusi Opoziva:</h3>
                <ul className="list-disc list-inside pl-4 space-y-1 text-muted-foreground">
                  <li><Badge variant="warning" className="mr-1.5">Opoziv (LOT-spec.)</Badge> Zvanični opoziv koji se odnosi samo na određene serije (LOT brojeve) proizvoda.</li>
                  <li><Badge variant="destructive" className="mr-1.5">Potpuni opoziv</Badge> Svi primerci proizvoda su povučeni, bez obzira na seriju.</li>
                  <li><Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 mr-1.5">Proveriti (sumnja)</Badge> Postoji sumnja na problem, ali još uvek nema zvaničnog opoziva; proizvođač ili nadležne institucije vrše proveru. Potreban je dodatan oprez.</li>
                </ul>
              </div>
               <p className="italic text-muted-foreground pt-2">
                Informacije o opozivima preuzimamo iz zvaničnih izvora i trudimo se da budu što ažurnije. Uvek proverite i direktno kod proizvođača ili na mestu kupovine.
              </p>
            </CardContent>
          </Card>

        </main>
      </SidebarInset>
    </div>
  );
}
