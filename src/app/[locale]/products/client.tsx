

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ShoppingBag, PackageOpen, CheckCircle, AlertTriangle, X, Wheat, Sandwich, Utensils, Cookie, Popcorn, Soup, Container, CookingPot, CupSoda, Package, Box, Droplet, Layers, Dumbbell, Sprout, UtensilsCrossed, type LucideIcon, FilterX, Info } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/products';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';


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

const categoryIconMap: Record<string, LucideIcon> = {
  "Brašno i smeše": Wheat,
  "Hleb i peciva": Sandwich,
  "Testenine": Utensils,
  "Keks i slatkiši": Cookie,
  "Grickalice": Package,
  "Pahuljice": Layers,
  "Kremovi i namazi": Container,
  "Proteinski proizvodi": Dumbbell,
  "Drevna zrna": Sprout,
  "Palenta i pire": UtensilsCrossed,
  "Med": Droplet,
  "Začini": CookingPot,
  "Pića": CupSoda,
  "Sosovi i prelivi": CookingPot,
  "Nekategorizovano": Box,
};

const getCategoryIcon = (categoryName: string): LucideIcon => {
  return categoryIconMap[categoryName] || Box;
};

const PRODUCTS_PER_PAGE = 12;

export interface CategoryInfo {
  name: string;
  count: number;
}

interface ProductsClientPageProps {
  allProducts: Product[];
  productCategories: CategoryInfo[];
  quickFilterCategories: CategoryInfo[];
}

export default function ProductsClientPage({ allProducts, productCategories, quickFilterCategories }: ProductsClientPageProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = params.locale as string;
  
  const initialCategory = searchParams.get('category') || 'all';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedManufacturer, setSelectedManufacturer] = useState('all');
  const [selectedOrigin, setSelectedOrigin] = useState('all');
  const [selectedGfStatus, setSelectedGfStatus] = useState('all');
  const [barcode, setBarcode] = useState('');
  
  const [filteredProducts, setFilteredProducts] = useState(allProducts);
  const [currentPage, setCurrentPage] = useState(1);
  
  const manufacturers = useMemo(() => Array.from(new Set(allProducts.map(p => p.brand).filter(Boolean))).sort(), [allProducts]);
  const origins = useMemo(() => Array.from(new Set(allProducts.map(p => p.Poreklo).filter(Boolean))).sort(), [allProducts]);

  useEffect(() => {
    let newFilteredProducts = allProducts;
    
    if (searchTerm.trim()) {
      newFilteredProducts = newFilteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        (product.ingredientsText && product.ingredientsText.toLowerCase().includes(searchTerm.toLowerCase().trim()))
      );
    }
    if (selectedCategory !== 'all') {
      newFilteredProducts = newFilteredProducts.filter(product => product.category === selectedCategory);
    }
    if (selectedManufacturer !== 'all') {
      newFilteredProducts = newFilteredProducts.filter(product => product.brand === selectedManufacturer);
    }
    if (selectedOrigin !== 'all') {
      newFilteredProducts = newFilteredProducts.filter(product => product.Poreklo === selectedOrigin);
    }
    if (barcode.trim()) {
      newFilteredProducts = newFilteredProducts.filter(product => product.barcode && product.barcode.includes(barcode.trim()));
    }
    if (selectedGfStatus !== 'all') {
       newFilteredProducts = newFilteredProducts.filter(product => {
        const isConsideredGF = product.hasAOECSLicense || product.hasManufacturerStatement || product.isVerifiedAdmin;
        if (selectedGfStatus === 'aoecs') return product.hasAOECSLicense;
        if (selectedGfStatus === 'izjava') return product.hasManufacturerStatement && !product.hasAOECSLicense;
        if (selectedGfStatus === 'nema_podataka') return !isConsideredGF && !product.warning;
        return false;
      });
    }

    setFilteredProducts(newFilteredProducts);
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedManufacturer, selectedOrigin, selectedGfStatus, barcode, allProducts]);
  
  const handleRemoveFilter = (filterType: string) => {
    switch (filterType) {
        case 'searchTerm': setSearchTerm(''); break;
        case 'category': setSelectedCategory('all'); break;
        case 'manufacturer': setSelectedManufacturer('all'); break;
        case 'origin': setSelectedOrigin('all'); break;
        case 'gfStatus': setSelectedGfStatus('all'); break;
        case 'barcode': setBarcode(''); break;
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedManufacturer('all');
    setSelectedOrigin('all');
    setSelectedGfStatus('all');
    setBarcode('');
  };

  const areFiltersActive = searchTerm.trim() !== '' || selectedCategory !== 'all' || selectedManufacturer !== 'all' || selectedOrigin !== 'all' || selectedGfStatus !== 'all' || barcode.trim() !== '';

  const indexOfLastProduct = currentPage * PRODUCTS_PER_PAGE;
  const indexOfFirstProduct = indexOfLastProduct - PRODUCTS_PER_PAGE;
  const currentProductsToDisplay = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="Pronađi proizvode bez glutena"
          description="Pretražite i filtrirajte listu bezglutenskih proizvoda."
          icon={ShoppingBag}
        />
        
        <div className="mb-6 p-4 md:p-6 bg-muted/30 border-muted/50 rounded-lg md:sticky top-[calc(var(--header-height,6rem)-1px)] z-10 bg-background/80 backdrop-blur-sm -mx-4 md:mx-0">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="search">Pretraži po nazivu</Label>
                <Input
                  id="search"
                  placeholder="Unesite naziv, brend..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
               <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label htmlFor="category">Kategorija</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category"><SelectValue placeholder="Sve kategorije" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Sve kategorije ({allProducts.length})</SelectItem>
                    {productCategories.map(cat => <SelectItem key={cat.name} value={cat.name}>{cat.name} ({cat.count})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label htmlFor="manufacturer">Proizvođač</Label>
                <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                  <SelectTrigger id="manufacturer"><SelectValue placeholder="Svi proizvođači" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Svi proizvođači</SelectItem>
                    {manufacturers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label htmlFor="barcode">Bar-kod (EAN)</Label>
                <Input id="barcode" placeholder="Unesite bar-kod..." value={barcode} onChange={(e) => setBarcode(e.target.value)} />
              </div>
               <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <Label htmlFor="gf-status" className="flex items-center gap-1">
                    BG Status
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-center p-2" side="top">
                          <ul className="list-disc list-inside text-left space-y-1">
                              <li><span className="font-bold">AOECS sertifikat:</span> Zvanični EU standard (precrtani klas).</li>
                              <li><span className="font-bold">Izjava proizvođača:</span> Nije nezavisno testirano.</li>
                              <li><span className="font-bold">Nema podataka:</span> Nema zvanične GF oznake.</li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Select value={selectedGfStatus} onValueChange={setSelectedGfStatus}>
                    <SelectTrigger id="gf-status"><SelectValue placeholder="Svi statusi" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Svi statusi</SelectItem>
                        <SelectItem value="aoecs">AOECS Sertifikat</SelectItem>
                        <SelectItem value="izjava">Izjava proizvođača</SelectItem>
                        <SelectItem value="nema_podataka">Nema podataka</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
               <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label htmlFor="origin">Zemlja porekla</Label>
                <Select value={selectedOrigin} onValueChange={setSelectedOrigin}>
                  <SelectTrigger id="origin"><SelectValue placeholder="Sve zemlje" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Sve zemlje</SelectItem>
                    {origins.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 md:col-span-1 flex gap-2 items-end">
                <Button className="w-full transition-transform active:scale-95" disabled>
                    <Search className="h-4 w-4" />
                    <span>Pretraži</span>
                </Button>
                {areFiltersActive && (
                  <Button variant="outline" size="icon" onClick={handleResetFilters} title="Očisti filtere">
                    <FilterX className="h-5 w-5" />
                  </Button>
                )}
              </div>
          </div>
        </div>

        {currentProductsToDisplay.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentProductsToDisplay.map(product => {
                const isConsideredGF = product.hasAOECSLicense || product.hasManufacturerStatement || product.isVerifiedAdmin;
                const containsGlutenTag = product.warning || product.tags?.includes('contains-gluten') || product.tags?.includes('sadrži-gluten') || product.tags?.includes('contains-wheat') || product.tags?.includes('contains-barley') || product.tags?.includes('contains-rye') || (product.tags?.includes('contains-oats') && !isConsideredGF);
                const mayContainGlutenTag = !product.warning && (product.tags?.includes('may-contain-gluten') || product.tags?.includes('risk-of-contamination'));
                
                const imageUrl = product.imageUrl && product.imageUrl.startsWith('http') 
                    ? product.imageUrl 
                    : 'https://placehold.co/400x200.png';

                return (
                  <Card key={product.id} className={cn(`overflow-hidden hover:shadow-xl transition-shadow duration-200 flex flex-col`, product.warning && 'border-destructive border-2')}>
                    <CardHeader className="p-0">
                      <Link href={`/${locale}/products/${product.id}`}>
                        <Image
                          src={imageUrl}
                          alt={product.name}
                          width={400}
                          height={200}
                          className="w-full h-48 object-cover"
                          data-ai-hint={product.dataAiHint}
                        />
                      </Link>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col flex-grow">
                      <Link href={`/${locale}/products/${product.id}`} className="hover:underline">
                        <CardTitle className="text-lg mb-1">{product.name}</CardTitle>
                      </Link>
                      {product.brand && <CardDescription className="text-xs text-muted-foreground mb-1">{product.brand}</CardDescription>}
                      <div className="flex justify-between items-center mb-2">
                        <CardDescription className="text-sm text-muted-foreground">{product.category}</CardDescription>
                        {product.nutriScore && product.nutriScore !== 'N/A' && (
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
                      ) : isConsideredGF ? (
                        <div className="flex items-center text-green-600 dark:text-green-400 text-xs mt-1 mb-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          <span>Bez glutena</span>
                        </div>
                      ) : containsGlutenTag ? (
                        <div className="flex items-center text-red-600 dark:text-red-500 text-xs mt-1 mb-1">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          <span>Sadrži gluten</span>
                        </div>
                      ) : mayContainGlutenTag ? (
                        <div className="flex items-center text-orange-500 dark:text-orange-400 text-xs mt-1 mb-1">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          <span>Može sadržati tragove</span>
                        </div>
                      ) : (
                         <div className="flex items-center text-muted-foreground text-xs mt-1 mb-1">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          <span>Proveriti sastav</span>
                        </div>
                      )}

                      <p className="text-sm mb-3 h-10 overflow-hidden">{product.description && product.description.length > 100 && product.warning && product.note ? product.note : product.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                          {product.isPosno && <Badge variant="secondary" className="text-xs">Posno</Badge>}
                          {product.isVegan && <Badge variant="secondary" className="text-xs">Vegan</Badge>}
                          {product.isLactoseFree && <Badge variant="outline" className="text-xs">Bez laktoze</Badge>}
                          {product.isSugarFree && <Badge variant="outline" className="text-xs">Bez šećera</Badge>}
                          {product.isHighProtein && <Badge variant="default" className="text-xs bg-primary/80">Bogat proteinima</Badge>}
                      </div>
                      <Button asChild variant="default" size="sm" className="w-full mt-auto">
                        <Link href={`/${locale}/products/${product.id}`}>Vidi detalje</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    />
                  </PaginationItem>
                  
                  {(() => {
                    const pageNumbers = [];
                    const maxPagesToShow = 5;
                    const ellipsis = '...';

                    if (totalPages <= maxPagesToShow + 2) {
                      for (let i = 1; i <= totalPages; i++) {
                        pageNumbers.push(i);
                      }
                    } else {
                      if (currentPage <= maxPagesToShow - 2) {
                        for (let i = 1; i <= maxPagesToShow -1; i++) {
                          pageNumbers.push(i);
                        }
                        pageNumbers.push(ellipsis);
                        pageNumbers.push(totalPages);
                      } else if (currentPage >= totalPages - (maxPagesToShow - 3)) {
                        pageNumbers.push(1);
                        pageNumbers.push(ellipsis);
                        for (let i = totalPages - (maxPagesToShow - 2); i <= totalPages; i++) {
                          pageNumbers.push(i);
                        }
                      } else {
                        pageNumbers.push(1);
                        pageNumbers.push(ellipsis);
                        pageNumbers.push(currentPage - 1);
                        pageNumbers.push(currentPage);
                        pageNumbers.push(currentPage + 1);
                        pageNumbers.push(ellipsis);
                        pageNumbers.push(totalPages);
                      }
                    }

                    return pageNumbers.map((page, index) => (
                      <PaginationItem key={index}>
                        {page === ellipsis ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            isActive={currentPage === page}
                            onClick={() => handlePageChange(page as number)}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ));
                  })()}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <PackageOpen className="mx-auto h-16 w-16 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nema pronađenih proizvoda</h3>
            <p className="mb-4">Pokušajte da promenite filtere ili termine pretrage.</p>
             <Button variant="outline" onClick={handleResetFilters} size="sm">
              <FilterX className="mr-2 h-4 w-4" />
              Očisti sve filtere
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
