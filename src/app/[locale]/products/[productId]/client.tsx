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
import { ArrowLeft, Package, ShoppingBag, AlertTriangle, CheckCircle, Heart, Leaf, Info, ShieldCheck, FileText, GitBranch, Tag, Barcode, CircleAlert, Store, MapPin, ExternalLink, ListChecks, CalendarDays, SearchCheck, Zap, Flag, Mail, CheckSquare, Loader2, Send } from 'lucide-react';
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

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href={`/${locale}/products`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Nazad
            </Link>
          </Button>
        </div>
        <PageHeader
          title={product.name}
          description={product.brand}
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

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card className={`overflow-hidden shadow-lg ${product.warning ? 'border-2 border-destructive' : ''}`}>
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-auto object-cover aspect-square"
                data-ai-hint={product.dataAiHint}
              />
            </Card>
            <div className="pt-4 flex flex-col gap-2">
                 <Button size="lg" className="w-full" disabled>
                  <ShoppingBag className="mr-2 h-5 w-5" /> Dodaj na listu za kupovinu
                </Button>
                <Dialog open={showReportErrorModal} onOpenChange={resetReportForm}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Flag className="h-4 w-4 mr-2" /> Prijavi grešku u podacima
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
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                 <div className="flex-grow">
                    {product.warning ? (
                        <div className="flex items-center text-red-600 dark:text-red-400 font-semibold text-lg">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            <span>SADRŽI GLUTEN (Povučen lot)</span>
                        </div>
                    ) : isConsideredGF ? (
                      <div className="flex items-center text-green-600 dark:text-green-400 text-lg font-semibold">
                        <ShieldCheck className="h-5 w-5 mr-2" />
                        <span>Bez glutena</span>
                      </div>
                    ) : containsGluten ? (
                      <div className="flex items-center text-red-600 dark:text-red-500 text-lg font-semibold">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        <span>Sadrži gluten</span>
                      </div>
                    ) : mayContainGluten ? (
                      <div className="flex items-center text-orange-500 dark:text-orange-400 text-lg font-semibold">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        <span>Može sadržati tragove glutena</span>
                      </div>
                    ) : (
                       <div className="flex items-center text-muted-foreground text-lg font-semibold">
                         <Info className="h-5 w-5 mr-2" />
                         <span>Status glutena nije specificiran</span>
                       </div>
                    )}
                 </div>
                 <div className="flex items-center gap-2 flex-shrink-0">
                    {product.nutriScore && product.nutriScore !== 'N/A' && (
                        <span className={`px-3 py-1 rounded-lg text-lg font-bold border-2 ${getNutriScoreClasses(product.nutriScore)}`}>
                            {product.nutriScore}
                        </span>
                    )}
                    <Button variant="outline" size="icon" onClick={handleToggleFavorite}>
                        <Heart className="h-5 w-5" fill={isCurrentlyFavorite ? 'hsl(var(--primary))' : 'none'} />
                        <span className="sr-only">{isCurrentlyFavorite ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}</span>
                    </Button>
                 </div>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {product.description && (
                  <div>
                    <h3 className="text-lg font-semibold mt-2 mb-2">Opis</h3>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  </div>
                )}
                
                <Accordion type="multiple" className="w-full" defaultValue={['item-1']}>
                    {product.ingredientsText && (
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="text-lg font-semibold">Sastojci</AccordionTrigger>
                        <AccordionContent>
                            <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md whitespace-pre-wrap">{product.ingredientsText}</p>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    <AccordionItem value="item-2">
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
                          <p className="text-xs text-muted-foreground pt-2 italic">Uvek proverite ambalažu proizvoda za najtačnije detalje o alergenima. Informacije ovde su samo smernice.</p>
                        </AccordionContent>
                    </AccordionItem>
                    
                     <AccordionItem value="item-3">
                        <AccordionTrigger className="text-lg font-semibold">Sertifikati i verifikacije</AccordionTrigger>
                        <AccordionContent className="space-y-2 pt-2">
                           <p className="text-xs text-muted-foreground italic">Ove oznake pomažu u identifikaciji bezbednosti proizvoda.</p>
                           {product.hasAOECSLicense && <div className="flex items-center text-sm text-foreground"><ShieldCheck className="h-4 w-4 mr-2 text-primary" /><span>AOECS licenca</span></div>}
                           {product.hasManufacturerStatement && <div className="flex items-center text-sm text-foreground"><FileText className="h-4 w-4 mr-2 text-primary" /><span>Izjava proizvođača (Bez glutena)</span></div>}
                           {product.isVerifiedAdmin && <div className="flex items-center text-sm text-foreground"><CheckCircle className="h-4 w-4 mr-2 text-primary" /><span>Admin verifikovan</span></div>}
                           {!(product.hasAOECSLicense || product.hasManufacturerStatement || product.isVerifiedAdmin) && <p className="text-sm text-muted-foreground">Nema dostupnih sertifikata ili izjava.</p>}
                        </AccordionContent>
                     </AccordionItem>
                      <AccordionItem value="item-4">
                        <AccordionTrigger className="text-lg font-semibold">Ostali detalji</AccordionTrigger>
                         <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                            {product.Poreklo && <p><span className="mr-2">{getCountryFlag(product.Poreklo)}</span><strong>Poreklo:</strong> {product.Poreklo}</p>}
                            {product.stores && product.stores.length > 0 && <p><strong>Dostupno u:</strong> {product.stores.join(', ')}</p>}
                            {product.barcode && <p><strong>Barkod:</strong> {product.barcode}</p>}
                            {product.source && <p><strong>Izvor podataka:</strong> {product.source}</p>}
                         </AccordionContent>
                      </AccordionItem>
                </Accordion>
                
                {allProductTags.size > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mt-6 mb-3">Tagovi</h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(allProductTags).map(tag => (
                        <Badge key={tag} variant="outline" className={`border ${tagStyles[tag.toLowerCase()] || tagStyles.default}`}>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
