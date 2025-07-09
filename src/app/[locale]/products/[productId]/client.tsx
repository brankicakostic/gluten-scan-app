
'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert as ShadcnAlert, AlertDescription as ShadcnAlertDescription, AlertTitle as ShadcnAlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Package, ShoppingBag, AlertTriangle, CheckCircle, Heart, Leaf, Info, ShieldCheck, FileText, GitBranch, Tag, Barcode, CircleAlert, Store, MapPin, ExternalLink, ListChecks, CalendarDays, SearchCheck, Zap, Flag, Mail, Loader2, Send } from 'lucide-react';
import type { Product } from '@/lib/products';
import { Badge } from '@/components/ui/badge';
import { useFavorites } from '@/contexts/favorites-context';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { addReportAction } from '@/app/actions/report-actions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const getNutriScoreClasses = (score?: string) => {
  if (!score) return 'border-gray-300 text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500';
  switch (score.toUpperCase()) {
    case 'A': return 'border-green-500 text-green-700 dark:text-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/30';
    case 'B': return 'border-lime-500 text-lime-700 dark:text-lime-400 dark:border-lime-600 bg-lime-50 dark:bg-lime-900/30';
    case 'C': return 'border-yellow-500 text-yellow-700 dark:text-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/30';
    case 'D': return 'border-orange-500 text-orange-700 dark:text-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/30';
    case 'E': return 'border-red-500 text-red-700 dark:text-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/30';
    default: return 'border-gray-300 text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500';
  }
};

const getCountryFlag = (country?: string) => {
  if (!country) return null;
  const countryLower = country.toLowerCase();
  if (countryLower.includes('srbija')) return '🇷🇸';
  if (countryLower.includes('hrvatska')) return '🇭🇷';
  if (countryLower.includes('slovenija')) return '🇸🇮';
  if (countryLower.includes('italija')) return '🇮🇹';
  if (countryLower.includes('nemačka') || countryLower.includes('njemačka')) return '🇩🇪';
  if (countryLower.includes('eu')) return '🇪🇺';
  return '🌍'; // Generic globe as fallback
};

const tagStyles: { [key: string]: string } = {
  vegan: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
  posno: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/50 dark:text-teal-300 dark:border-teal-800',
  'bez šećera': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
  'bez laktoze': 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/50 dark:text-sky-300 dark:border-sky-800',
  protein: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800',
  'high-protein': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800',
  povučeno: 'bg-red-200 text-red-900 border-red-300 dark:bg-red-900/70 dark:text-red-200 dark:border-red-800',
  upozorenje: 'bg-yellow-200 text-yellow-900 border-yellow-300 dark:bg-yellow-900/70 dark:text-yellow-200 dark:border-yellow-800',
  'sadrži-gluten': 'bg-red-200 text-red-900 border-red-300 dark:bg-red-900/70 dark:text-red-200 dark:border-red-800',
  default: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'
};

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const params = useParams();
  const locale = params.locale as string;

  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { toast } = useToast();
  
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const [showReportErrorModal, setShowReportErrorModal] = useState(false);
  const [reportComment, setReportComment] = useState('');
  const [wantsContact, setWantsContact] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [reportPriority, setReportPriority] = useState('');
  const [errorType, setErrorType] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const isCurrentlyFavorite = isClient && isFavorite(product.id);

  const handleToggleFavorite = () => {
    if (isCurrentlyFavorite) {
      removeFavorite(product.id);
      toast({ title: `${product.name} uklonjen iz omiljenih.` });
    } else {
      addFavorite(product.id);
      toast({ title: `${product.name} dodat u omiljene!` });
    }
  };
  
  const handleReportSubmit = async () => {
    setSubmissionStatus('submitting');
    
    const reportData = {
      type: 'error' as const,
      errorType: errorType as 'podaci' | 'sastav' | 'drugo',
      priority: reportPriority as 'niska' | 'srednja' | 'visoka',
      comment: reportComment,
      wantsContact: wantsContact,
      contactEmail: wantsContact ? contactEmail : '',
      productContext: `Prijava za proizvod: ${product.name} (ID: ${product.id})`,
      productId: product.id,
      productName: product.name,
    };
    
    const result = await addReportAction(reportData);

    if (result.success) {
      setSubmissionStatus('success');
    } else {
      setSubmissionStatus('idle');
      toast({ variant: 'destructive', title: 'Greška pri slanju', description: result.error });
    }
  };

  const resetReportForm = () => {
    setShowReportErrorModal(false);
    setTimeout(() => {
        setSubmissionStatus('idle');
        setReportComment('');
        setWantsContact(false);
        setContactEmail('');
        setReportPriority('');
        setErrorType('');
    }, 300);
  };

  const isConsideredGF = product.hasAOECSLicense || product.hasManufacturerStatement || product.isVerifiedAdmin;
  const containsGluten = product.warning || product.tags?.includes('contains-gluten') || product.tags?.includes('sadrži-gluten') || product.tags?.includes('contains-wheat') || product.tags?.includes('contains-barley') || product.tags?.includes('contains-rye') || (product.tags?.includes('contains-oats') && !isConsideredGF);
  const mayContainGluten = product.tags?.includes('may-contain-gluten') || product.tags?.includes('risk-of-contamination');
  
  const identifiedGlutenSources: string[] = [];
  if (product.tags?.includes('contains-wheat')) identifiedGlutenSources.push('Pšenica');
  if (product.tags?.includes('contains-barley')) identifiedGlutenSources.push('Ječam');
  if (product.tags?.includes('contains-rye')) identifiedGlutenSources.push('Raž');
  if (product.tags?.includes('contains-oats') && !isConsideredGF) identifiedGlutenSources.push('Ovas (verovatno nije bezglutenski)');

  const commonAllergenKeywords: { term: string, name: string }[] = [
    { term: 'lešnik', name: 'Lešnici' }, { term: 'lešnici', name: 'Lešnici' }, { term: 'lesnik', name: 'Lešnici' }, { term: 'lesnici', name: 'Lešnici' },
    { term: 'kikiriki', name: 'Kikiriki' },
    { term: 'soja', name: 'Soja' }, { term: 'sojin', name: 'Soja' },
    { term: 'mleko', name: 'Mleko' }, { term: 'mlijeko', name: 'Mleko' }, { term: 'mlečni', name: 'Mleko' }, { term: 'mleko u prahu', name: 'Mleko' }, { term: 'obrano mleko u prahu', name: 'Mleko' }, { term: 'surutka', name: 'Surutka (mleko)' }, { term: 'surutka u prahu', name: 'Surutka (mleko)' },
    { term: 'jaja', name: 'Jaja' }, { term: 'jaje', name: 'Jaja' }, { term: 'jaja u prahu', name: 'Jaja'}, {"term": "belance u prahu", "name": "Jaja"},
    { term: 'badem', name: 'Bademi' },
    { term: 'orah', name: 'Orasi' },
    { term: 'susam', name: 'Susam' },
  ];

  let mentionedNonGlutenAllergens: string[] = [];
  if (product.ingredientsText && typeof product.ingredientsText === 'string') {
    const ingredientsLower = product.ingredientsText.toLowerCase();
    const foundAllergenNames = new Set<string>();
    commonAllergenKeywords.forEach(allergen => {
      if (ingredientsLower.includes(allergen.term.toLowerCase())) {
        foundAllergenNames.add(allergen.name);
      }
    });
    mentionedNonGlutenAllergens = Array.from(foundAllergenNames);
  }

  const allProductTags = new Set(product.tags || []);
  if(product.isVegan) allProductTags.add('vegan');
  if(product.isPosno) allProductTags.add('posno');
  if(product.isSugarFree) allProductTags.add('bez šećera');
  if(product.isLactoseFree) allProductTags.add('bez laktoze');
  if(product.isHighProtein) allProductTags.add('high-protein');

  const GlutenStatusBadge = () => {
    if (product.warning) {
      return (
        <Badge variant="destructive" className="text-base py-1 px-3">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span>Sadrži gluten</span>
        </Badge>
      );
    }
    if (isConsideredGF) {
      return (
        <Badge variant="default" className="text-base py-1 px-3 bg-green-600 hover:bg-green-600/90">
          <ShieldCheck className="h-4 w-4 mr-2" />
          <span>Bez glutena</span>
        </Badge>
      );
    }
    if (containsGluten) {
      return (
        <Badge variant="destructive" className="text-base py-1 px-3">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span>Sadrži gluten</span>
        </Badge>
      );
    }
    if (mayContainGluten) {
      return (
        <Badge variant="default" className="text-base py-1 px-3 bg-orange-500 hover:bg-orange-500/90">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span>Mogući tragovi</span>
        </Badge>
      );
    }
    return (
       <Badge variant="secondary" className="text-base py-1 px-3">
        <Info className="h-4 w-4 mr-2" />
        <span>Status nepoznat</span>
      </Badge>
    );
  };
  
  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href={`/${locale}/products`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Nazad
            </Link>
          </Button>
        </div>
        <PageHeader
          title={product.name}
          description={<span className="text-muted-foreground italic">{product.brand}</span>}
          icon={Package}
        />

        {product.warning && product.seriesAffected && (
          <ShadcnAlert variant="destructive" className="mb-6">
            <AlertTriangle className="h-5 w-5" />
            <ShadcnAlertTitle className="text-lg font-semibold">Upozorenje o Povlačenju Proizvoda!</ShadcnAlertTitle>
            <ShadcnAlertDescription className="mt-2 space-y-1 text-sm">
              <p><strong>Napomena:</strong> {product.note}</p>
              <p><ListChecks className="inline h-4 w-4 mr-1.5"/><strong>Serija(e) pogođene:</strong> {product.seriesAffected.lotNumbers.join(', ')}</p>
              <p><CalendarDays className="inline h-4 w-4 mr-1.5"/><strong>Rok upotrebe pogođene serije:</strong> {product.seriesAffected.expiry}</p>
              <p><SearchCheck className="inline h-4 w-4 mr-1.5"/><strong>Nalaz:</strong> {product.seriesAffected.finding}</p>
              <p><CircleAlert className="inline h-4 w-4 mr-1.5"/><strong>Status:</strong> {product.seriesAffected.status}</p>
              {product.seriesAffected.sourceLink && (
                <p>
                  <ExternalLink className="inline h-4 w-4 mr-1.5"/>
                  <strong>Izvor:</strong>{' '}
                  <a href={product.seriesAffected.sourceLink} target="_blank" rel="noopener noreferrer" className="underline hover:text-destructive-foreground/80">
                    Zvanično obaveštenje
                  </a>
                </p>
              )}
               <p className="mt-3 font-semibold">Molimo Vas da ne konzumirate proizvod iz navedene serije ako ga posedujete.</p>
            </ShadcnAlertDescription>
          </ShadcnAlert>
        )}

        <Card className={`overflow-hidden shadow-lg ${product.warning ? 'border-2 border-destructive' : ''}`}>
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={800}
            height={533}
            className="w-full h-auto object-cover aspect-[3/2]"
            data-ai-hint={product.dataAiHint}
            priority
          />
        </Card>
        
        <Card className="mt-4">
          <CardContent className="p-3">
             <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <GlutenStatusBadge />
                  {product.nutriScore && product.nutriScore !== 'N/A' && (
                    <span className={`px-3 py-1 rounded-lg text-lg font-bold border-2 ${getNutriScoreClasses(product.nutriScore)}`}>
                      {product.nutriScore}
                    </span>
                  )}
                </div>
                
                <Button variant="outline" size="icon" onClick={handleToggleFavorite} className="flex-shrink-0">
                  <Heart className="h-5 w-5" fill={isCurrentlyFavorite ? 'hsl(var(--primary))' : 'none'} />
                  <span className="sr-only">{isCurrentlyFavorite ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}</span>
                </Button>
              </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-center gap-4">
          <Button className="flex-1" disabled>
            <ShoppingBag className="mr-2 h-4 w-4" /> Dodaj na listu
          </Button>
          <Dialog open={showReportErrorModal} onOpenChange={resetReportForm}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                <CircleAlert className="h-4 w-4 mr-2" /> Prijavi grešku
              </Button>
            </DialogTrigger>
            <DialogContent>
              {submissionStatus === 'success' ? (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                  <DialogTitle className="text-xl">Prijava je poslata!</DialogTitle>
                  <DialogDescription className="mt-2">Hvala što pomažete da podaci budu tačni. Ako ste ostavili kontakt, možemo vam se javiti.</DialogDescription>
                  <DialogFooter className="mt-6 w-full"><Button className="w-full" onClick={resetReportForm}>Zatvori</Button></DialogFooter>
                </div>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Prijavi grešku za: {product.name}</DialogTitle>
                    <DialogDescription>Ako mislite da su podaci o ovom proizvodu netačni, molimo popunite formu.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2 text-sm">
                    <div>
                      <Label className="font-semibold">Tip greške</Label>
                      <RadioGroup value={errorType} onValueChange={setErrorType} className="mt-2 space-y-1">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="podaci" id="err-data" /><Label htmlFor="err-data" className="font-normal">Netačni podaci (slika, naziv, barkod)</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="sastav" id="err-sastav" /><Label htmlFor="err-sastav" className="font-normal">Neispravni sastojci / alergeni</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="drugo" id="err-drugo" /><Label htmlFor="err-drugo" className="font-normal">Drugo</Label></div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label className="font-semibold">Prioritet</Label>
                      <RadioGroup value={reportPriority} onValueChange={setReportPriority} className="mt-2 space-y-1">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="niska" id="prod-priority-low" /><Label htmlFor="prod-priority-low" className="font-normal">Nizak</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="srednja" id="prod-priority-medium" /><Label htmlFor="prod-priority-medium" className="font-normal">Srednji</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="visoka" id="prod-priority-high" /><Label htmlFor="prod-priority-high" className="font-normal">Visok (utiče na bezbednost)</Label></div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2"><Label htmlFor="report-comment-prod">Komentar</Label><Textarea id="report-comment-prod" placeholder="Opišite grešku..." value={reportComment} onChange={(e) => setReportComment(e.target.value)} /></div>
                    <div className="flex items-center space-x-2"><Checkbox id="wants-contact-prod" checked={wantsContact} onCheckedChange={(checked) => setWantsContact(!!checked)} /><Label htmlFor="wants-contact-prod">Želim da me kontaktirate.</Label></div>
                    {wantsContact && <div className="space-y-2 pl-6"><Label htmlFor="contact-email-prod">Email</Label><Input id="contact-email-prod" type="email" placeholder="vas.email@primer.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></div>}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowReportErrorModal(false)}>Odustani</Button>
                    <Button onClick={handleReportSubmit} disabled={submissionStatus === 'submitting' || !reportComment || !errorType}>
                      {submissionStatus === 'submitting' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />} Pošalji prijavu
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-8 space-y-6">
          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Opis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardContent className="p-0">
               <Accordion type="multiple" className="w-full" defaultValue={['item-2']}>
                {product.ingredientsText && (
                  <AccordionItem value="item-1" className="px-6">
                    <AccordionTrigger className="text-lg font-semibold">Sastojci</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md whitespace-pre-wrap">{product.ingredientsText}</p>
                    </AccordionContent>
                  </AccordionItem>
                )}
                <AccordionItem value="item-2" className="px-6">
                  <AccordionTrigger className="text-lg font-semibold">Napomene o alergenima</AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    {product.warning && identifiedGlutenSources.length === 0 && (
                      <p className="text-sm text-red-600 dark:text-red-400"><strong>Upozorenje:</strong> Ovaj proizvod (ili određena serija) može sadržati gluten. Molimo proverite detalje o povlačenju.</p>
                    )}
                    {!product.warning && identifiedGlutenSources.length > 0 && (
                      <p className="text-sm text-red-600 dark:text-red-500"><strong>Sadrži izvore glutena:</strong> {identifiedGlutenSources.join(', ')}.</p>
                    )}
                    {!product.warning && identifiedGlutenSources.length === 0 && mayContainGluten && !isConsideredGF && (
                      <p className="text-sm text-orange-600 dark:text-orange-400"><strong>Napomena:</strong> Može sadržati tragove glutena.</p>
                    )}
                    {!product.warning && identifiedGlutenSources.length === 0 && isConsideredGF && (
                      <p className="text-sm text-green-600 dark:text-green-400">Ovaj proizvod se generalno smatra bezglutenskim na osnovu dostupnih informacija.</p>
                    )}
                    {mentionedNonGlutenAllergens.length > 0 && (
                      <p className="text-sm text-muted-foreground"><strong>Ostali potencijalni alergeni:</strong> {mentionedNonGlutenAllergens.join(', ')}.</p>
                    )}
                     <ShadcnAlert className="mt-4 border-blue-500/50 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 [&>svg]:text-blue-600">
                      <Info className="h-4 w-4" />
                      <ShadcnAlertTitle>Važna napomena</ShadcnAlertTitle>
                      <ShadcnAlertDescription>
                        Uvek proverite ambalažu proizvoda za najtačnije i najažurnije informacije o sastojcima i alergenima. Informacije u aplikaciji su samo smernice.
                      </ShadcnAlertDescription>
                    </ShadcnAlert>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="px-6">
                  <AccordionTrigger className="text-lg font-semibold">Sertifikati i verifikacije</AccordionTrigger>
                  <AccordionContent className="space-y-2 pt-2">
                    <p className="text-xs text-muted-foreground italic">Ove oznake pomažu u identifikaciji bezbednosti proizvoda.</p>
                    {product.hasAOECSLicense && <div className="flex items-center text-sm text-foreground"><ShieldCheck className="h-4 w-4 mr-2 text-primary" /><span>AOECS licenca</span></div>}
                    {product.hasManufacturerStatement && <div className="flex items-center text-sm text-foreground"><FileText className="h-4 w-4 mr-2 text-primary" /><span>Izjava proizvođača (Bez glutena)</span></div>}
                    {product.isVerifiedAdmin && <div className="flex items-center text-sm text-foreground"><CheckCircle className="h-4 w-4 mr-2 text-primary" /><span>Admin verifikovan</span></div>}
                    {!(product.hasAOECSLicense || product.hasManufacturerStatement || product.isVerifiedAdmin) && <p className="text-sm text-muted-foreground">Nema dostupnih sertifikata ili izjava.</p>}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="px-6 border-b-0">
                  <AccordionTrigger className="text-lg font-semibold">Ostali detalji</AccordionTrigger>
                   <AccordionContent className="pt-2 text-sm text-muted-foreground">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                        {product.Poreklo && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-foreground">Poreklo</span>
                            <span className="flex items-center gap-2">{getCountryFlag(product.Poreklo)} {product.Poreklo}</span>
                          </div>
                        )}
                        {product.barcode && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-foreground">Barkod</span>
                            <span>{product.barcode}</span>
                          </div>
                        )}
                    </div>
                     {(product.stores && product.stores.length > 0 && product.stores[0] !== '') && (
                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <span className="font-medium text-foreground">Dostupno u</span>
                        <span className="text-right">{product.stores.join(', ')}</span>
                      </div>
                    )}
                     {product.source && (
                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <span className="font-medium text-foreground">Izvor podataka</span>
                        <span>
                          {product.source.startsWith('http') ? (
                            <a href={product.source} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                              Link <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            product.source
                          )}
                        </span>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {allProductTags.size > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-xl">Tagovi</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Array.from(allProductTags).map(tag => (
                    <Badge key={tag} variant="outline" className={`border ${tagStyles[tag.toLowerCase()] || tagStyles.default}`}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
