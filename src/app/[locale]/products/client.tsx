'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ShoppingBag, PackageOpen, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/products';

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

const getCategoryIcon = (categoryName: string): string => {
  const lowerCaseName = categoryName.toLowerCase();
  if (lowerCaseName.includes('brašn') || lowerCaseName.includes('smeš')) return '🌾';
  if (lowerCaseName.includes('hleb') || lowerCaseName.includes('peciv')) return '🍞';
  if (lowerCaseName.includes('testenine') || lowerCaseName.includes('pasta')) return '🍝';
  if (lowerCaseName.includes('slatkiš') || lowerCaseName.includes('keks') || lowerCaseName.includes('čokolad')) return '🍪';
  if (lowerCaseName.includes('grickalice') || lowerCaseName.includes('kreker')) return '🥨';
  if (lowerCaseName.includes('pahuljice') || lowerCaseName.includes('musli')) return '🥣';
  if (lowerCaseName.includes('namaz') || lowerCaseName.includes('krem') || lowerCaseName.includes('med')) return '🍯';
  if (lowerCaseName.includes('sos') || lowerCaseName.includes('preliv')) return '🥫';
  if (lowerCaseName.includes('pić') || lowerCaseName.includes('sok')) return '🥤';
  if (lowerCaseName.includes('začin')) return '🧂';
  return '🛍️';
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
  const locale = params.locale as string;
  
  const initialCategory = searchParams.get('category') || 'all';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [filteredProducts, setFilteredProducts] = useState(allProducts);
  const [currentPage, setCurrentPage] = useState(1);

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
    setFilteredProducts(newFilteredProducts);
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, allProducts]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
  };

  const areFiltersActive = searchTerm.trim() !== '' || selectedCategory !== 'all';

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
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="Pronađi proizvode bez glutena"
          description="Pretražite i filtrirajte listu bezglutenskih proizvoda."
          icon={ShoppingBag}
        />

        <div className="mb-6 p-6 bg-muted/30 border-muted/50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="search" className="text-sm font-medium">Pretraži proizvode</label>
              <Input
                id="search"
                placeholder="Unesite naziv, brend ili sastojke..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="category" className="text-sm font-medium">Kategorija</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Sve kategorije" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Sve kategorije ({allProducts.length})</SelectItem>
                  {productCategories.map(category => (
                    <SelectItem key={category.name} value={category.name}>
                       <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(category.name)}</span>
                        <span>{category.name} ({category.count})</span>
                       </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-sm text-muted-foreground">
                Pronađeno {filteredProducts.length} od {allProducts.length} proizvoda.
            </p>
            {areFiltersActive && (
                <Button variant="ghost" onClick={handleResetFilters} size="sm">
                    <X className="mr-2 h-4 w-4" />
                    Resetuj filtere
                </Button>
            )}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
              <Button 
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  className="rounded-full shrink-0"
                  onClick={() => setSelectedCategory('all')}
              >
                  Sve
              </Button>
              {quickFilterCategories.slice(0, 7).map(category => (
                  <Button
                      key={category.name}
                      variant={selectedCategory === category.name ? 'default' : 'outline'}
                      className="rounded-full shrink-0"
                      onClick={() => setSelectedCategory(category.name)}
                  >
                      <span className="mr-2">{getCategoryIcon(category.name)}</span>
                      {category.name}
                  </Button>
              ))}
          </div>
        </div>

        {currentProductsToDisplay.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentProductsToDisplay.map(product => {
                const isConsideredGF = product.hasAOECSLicense || product.hasManufacturerStatement || product.isVerifiedAdmin;
                const containsGlutenTag = product.warning || product.tags?.includes('contains-gluten') || product.tags?.includes('sadrži-gluten') || product.tags?.includes('contains-wheat') || product.tags?.includes('contains-barley') || product.tags?.includes('contains-rye') || (product.tags?.includes('contains-oats') && !isConsideredGF);
                const mayContainGlutenTag = !product.warning && (product.tags?.includes('may-contain-gluten') || product.tags?.includes('risk-of-contamination'));

                return (
                  <Card key={product.id} className={`overflow-hidden hover:shadow-xl transition-shadow duration-200 flex flex-col ${product.warning ? 'border-destructive border-2' : ''}`}>
                    <CardHeader className="p-0">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={400}
                          height={200}
                          className="w-full h-48 object-cover"
                          data-ai-hint={product.dataAiHint}
                        />
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center bg-secondary">
                          <Image
                            src="/placeholder.svg"
                            alt="Slika nije dostupna"
                            width={64}
                            height={64}
                            className="opacity-50 text-muted-foreground"
                          />
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col flex-grow">
                      <CardTitle className="text-lg mb-1">{product.name}</CardTitle>
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
              <div className="flex justify-center items-center space-x-4 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Prethodna
                </Button>
                <span className="text-sm text-muted-foreground">
                  Stranica {currentPage} od {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Sledeća
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <PackageOpen className="mx-auto h-16 w-16 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nema pronađenih proizvoda</h3>
            <p>Pokušajte da promenite filtere ili termine pretrage.</p>
          </div>
        )}
      </div>
    </div>
  );
}
