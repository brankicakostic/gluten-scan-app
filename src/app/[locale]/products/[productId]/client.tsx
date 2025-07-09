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

const DietaryTag = ({ label, icon: Icon, present = true }: { label: string; icon: React.ElementType; present?: boolean }) => {
  if (!present) return null;
  return (
    <div className="flex items-center text-sm text-muted-foreground">
      <Icon className="h-4 w-4 mr-2 text-primary" />
      <span>{label}</span>
    </div>
  );
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
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Report error form state
  const [showReportErrorModal, setShowReportErrorModal] = useState(false);
  const [reportComment, setReportComment] = useState('');
  const [wantsContact, setWantsContact] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [reportPriority, setReportPriority] = useState('');
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
        errorType: 'podaci' as const,
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
    }, 300); // Delay to allow dialog to close before resetting state
  };


  const isConsideredGF = product.hasAOECSLicense || product.hasManufacturerStatement || product.isVerifiedAdmin;
  const containsGluten = product.warning || product.tags?.includes('contains-gluten') || product.tags?.includes('sadrži-gluten') || product.tags?.includes('contains-wheat') || product.tags?.includes('contains-barley') || product.tags?.includes('contains-rye') || (product.tags?.includes('contains-oats') && !isConsideredGF) ;
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

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href={`/${locale}/products`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Nazad na sve proizvode
            </Link>
          </Button>
        </div>
        <PageHeader
          title={product.name}
          description={product.brand ? `${product.brand} - Detalji za ${product.name}` : `Detalji za ${product.name}`}
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
                height={400}
                className="w-full h-auto object-cover aspect-square"
                data-ai-hint={product.dataAiHint}
              />
            </Card>
            {product.stores && product.stores.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center"><Store className="h-5 w-5 mr-2 text-primary"/> Gde kupiti</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{product.stores.join(', ')}</p>
                </CardContent>
              </Card>
            )}
             {product.barcode && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center"><Barcode className="h-5 w-5 mr-2 text-primary"/> Barkod</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{product.barcode}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-3xl">{product.name}</CardTitle>
                    {product.brand && <CardDescription className="text-lg text-muted-foreground">{product.brand}</CardDescription>}
                    <CardDescription className="text-md text-muted-foreground">{product.category}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                      <Button variant="outline" size="icon" onClick={handleToggleFavorite}>
                        <Heart className="h-5 w-5" fill={isCurrentlyFavorite ? 'hsl(var(--primary))' : 'none'} />
                        <span className="sr-only">{isCurrentlyFavorite ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}</span>
                      </Button>
                      <Dialog open={showReportErrorModal} onOpenChange={setShowReportErrorModal}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Flag className="h-5 w-5" />
                            <span className="sr-only">Prijavi problem</span>
                          </Button>
                        </DialogTrigger>
                         <DialogContent>
                           {submissionStatus === 'success' ? (
                               <div className="flex flex-col items-center justify-center text-center p-4">
                                 <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                                 <DialogTitle className="text-xl">Prijava je poslata!</DialogTitle>
                                 <DialogDescription className="mt-2">
                                   Hvala što pomažete da podaci budu tačni. Ako ste ostavili kontakt, možemo vam se javiti.
                                 </DialogDescription>
                                 <DialogFooter className="mt-6 w-full">
                                   <Button className="w-full" onClick={resetReportForm}>Zatvori</Button>
                                 </DialogFooter>
                               </div>
                           ) : (
                             <>
                               <DialogHeader>
                                 <DialogTitle>Prijavi grešku za proizvod: {product.name}</DialogTitle>
                                 <DialogDescription>
                                   Ako mislite da su podaci o ovom proizvodu netačni, molimo Vas da popunite formu ispod.
                                 </DialogDescription>
                               </DialogHeader>
                               <div className="space-y-4 py-2 text-sm">
                                  <div>
                                    <Label className="font-semibold">Koliko je ova greška ozbiljna?</Label>
                                    <RadioGroup value={reportPriority} onValueChange={setReportPriority} className="mt-2 space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="niska" id="prod-priority-low" />
                                        <Label htmlFor="prod-priority-low" className="font-normal">Niska (npr. pogrešna slika, opis)</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="srednja" id="prod-priority-medium" />
                                        <Label htmlFor="prod-priority-medium" className="font-normal">Srednja (netačan sastav, alergeni)</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="visoka" id="prod-priority-high" />
                                        <Label htmlFor="prod-priority-high" className="font-normal">Visoka (proizvod sadrži gluten, a nije tako označen)</Label>
                                      </div>
                                    </RadioGroup>
                                  </div>
                                 <div className="space-y-2">
                                   <Label htmlFor="report-comment-prod">Komentar</Label>
                                   <Textarea id="report-comment-prod" placeholder="Opišite grešku što detaljnije." value={reportComment} onChange={(e) => setReportComment(e.target.value)} />
                                 </div>
                                 <div className="flex items-center space-x-2">
                                   <Checkbox id="wants-contact-prod" checked={wantsContact} onCheckedChange={(checked) => setWantsContact(!!checked)} />
                                   <Label htmlFor="wants-contact-prod">Želim da me kontaktirate.</Label>
                                 </div>
                                 {wantsContact && (
                                   <div className="space-y-2 pl-6">
                                     <Label htmlFor="contact-email-prod">Email</Label>
                                     <Input id="contact-email-prod" type="email" placeholder="vas.email@primer.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                                   </div>
                                 )}
                               </div>
                               <DialogFooter>
                                 <Button variant="outline" onClick={() => setShowReportErrorModal(false)}>Odustani</Button>
                                 <Button onClick={handleReportSubmit} disabled={submissionStatus === 'submitting' || !reportComment}>
                                   {submissionStatus === 'submitting' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                                    Pošalji prijavu
                                 </Button>
                               </DialogFooter>
                             </>
                           )}
                         </DialogContent>
                      </Dialog>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-md font-semibold mb-1">Opis</h3>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                      <h3 className="text-md font-semibold mb-2">Informacije o glutenu</h3>
                       {product.warning ? (
                          <div className="flex items-center text-red-600 dark:text-red-400 font-semibold">
                              <AlertTriangle className="h-5 w-5 mr-2" />
                              <span>SADRŽI GLUTEN (Povučen lot)</span>
                          </div>
                      ) : product.hasAOECSLicense ? (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <ShieldCheck className="h-5 w-5 mr-2" />
                          <span>AOECS Licenciran - Bez glutena</span>
                        </div>
                      ) : product.hasManufacturerStatement ? (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <FileText className="h-5 w-5 mr-2" />
                          <span>Proizvođač deklariše - Bez glutena</span>
                        </div>
                      ) : product.isVerifiedAdmin ? (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          <span>Verifikovano - Bez glutena</span>
                        </div>
                      ) : containsGluten ? (
                        <div className="flex items-center text-red-600 dark:text-red-500">
                          <AlertTriangle className="h-5 w-5 mr-2" />
                          <span>Sadrži gluten</span>
                        </div>
                      ) : mayContainGluten ? (
                        <div className="flex items-center text-orange-500 dark:text-orange-400">
                          <AlertTriangle className="h-5 w-5 mr-2" />
                          <span>Može sadržati tragove glutena</span>
                        </div>
                      ) : (
                         <div className="flex items-center text-muted-foreground">
                           <Info className="h-5 w-5 mr-2" />
                           <span>Status glutena nije specificiran</span>
                         </div>
                      )}
                  </div>

                  {product.nutriScore && product.nutriScore !== 'N/A' && (
                    <div>
                      <h3 className="text-md font-semibold mb-2">Nutri-Score</h3>
                      <span className={`px-3 py-1 rounded-lg text-lg font-bold border-2 ${getNutriScoreClasses(product.nutriScore)}`}>
                        {product.nutriScore}
                      </span>
                    </div>
                  )}
                </div>

                {(product.isLactoseFree || product.isSugarFree || product.isPosno || product.isVegan || product.isHighProtein) && (
                  <div>
                    <h3 className="text-md font-semibold mb-2">Ostale dijetetske informacije</h3>
                    <div className="space-y-2">
                      <DietaryTag label="Posno" icon={Leaf} present={product.isPosno} />
                      <DietaryTag label="Vegan" icon={Leaf} present={product.isVegan} />
                      <DietaryTag label="Bez laktoze" icon={CheckCircle} present={product.isLactoseFree} />
                      <DietaryTag label="Bez šećera" icon={CheckCircle} present={product.isSugarFree} />
                      <DietaryTag label="Bogat proteinima" icon={Zap} present={product.isHighProtein} />
                    </div>
                  </div>
                )}

                {!product.warning && (
                  <div>
                    <h3 className="text-md font-semibold mb-2">Sertifikati i verifikacije</h3>
                    <div className="space-y-2">
                      {product.hasAOECSLicense && (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center text-sm text-foreground cursor-help">
                                <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                                <span>AOECS licenca</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="w-64 text-sm bg-popover text-popover-foreground border-border shadow-md p-2 rounded-md">
                              <p>✅ AOECS sertifikat potvrđuje da je proizvod prošao strogu kontrolu i laboratorijska testiranja. Siguran je za osobe sa celijakijom i označen je simbolom prekriženog klasja pšenice.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {product.hasManufacturerStatement && (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center text-sm text-foreground cursor-help">
                                <FileText className="h-4 w-4 mr-2 text-primary" />
                                <span>Izjava proizvođača (Bez glutena)</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="w-64 text-sm bg-popover text-popover-foreground border-border shadow-md p-2 rounded-md">
                              <p>ℹ️ Proizvođač tvrdi da ovaj proizvod ne sadrži gluten i da se pakuje na način koji sprečava kontaminaciju. Iako je ovo korisna informacija, bez zvaničnog sertifikata ili laboratorijskog testa, ovo se tretira kao izjava poverenja, a ne kao apsolutna garancija bezglutenskog statusa.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <DietaryTag label="Admin verifikovan" icon={CheckCircle} present={product.isVerifiedAdmin} />
                    </div>
                  </div>
                )}

                {product.brand === "Aleksandrija Fruška Gora" && (
                  <div>
                    <div className="flex items-center mb-1">
                      <Store className="h-4 w-4 mr-2 text-primary"/>
                      <h3 className="text-md font-semibold">Dostupno u</h3>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">DM, Maxi, Bio Špajz, online</p>

                    <div className="flex items-center mt-2 mb-1">
                      <MapPin className="h-4 w-4 mr-2 text-primary"/>
                      <h3 className="text-md font-semibold">Zemlja porekla</h3>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">Srbija</p>
                  </div>
                )}

                {product.ingredientsText && (
                  <div>
                    <h3 className="text-md font-semibold mb-1">Sastojci</h3>
                    <p className="text-xs text-muted-foreground p-3 bg-muted rounded-md whitespace-pre-wrap">{product.ingredientsText}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h3 className="text-md font-semibold mb-2 flex items-center">
                      <CircleAlert className="h-4 w-4 mr-2 text-primary"/> Napomene o alergenima
                  </h3>
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
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">
                        <strong>Ostali potencijalni alergeni pomenuti u sastojcima:</strong> {mentionedNonGlutenAllergens.join(', ')}.
                      </p>
                    </div>
                  )}

                  {!product.warning && identifiedGlutenSources.length === 0 && !isConsideredGF && !mayContainGluten && mentionedNonGlutenAllergens.length === 0 && (
                      <p className="text-sm text-muted-foreground">Za specifične informacije o alergenima, molimo pogledajte listu sastojaka.</p>
                  )}
                   <p className="text-xs text-muted-foreground mt-3 italic">Uvek proverite ambalažu proizvoda za najtačnije i najpotpunije detalje o alergenima. Informacije o alergenima koje su ovde navedene su samo smernice i zasnovane su na dostupnim podacima.</p>
                </div>

                {product.labelText && !product.warning && (
                  <div>
                    <h3 className="text-md font-semibold mb-1">Tekst sa etikete</h3>
                    <p className="text-xs text-muted-foreground p-3 bg-muted rounded-md">{product.labelText}</p>
                  </div>
                )}

                {product.tags && product.tags.length > 0 && (
                  <div>
                    <h3 className="text-md font-semibold mb-1 flex items-center"><Tag className="h-4 w-4 mr-2 text-primary"/> Tagovi</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {product.tags.map(tag => (
                        <Badge key={tag} variant={tag === 'povučeno' || tag === 'sadrži-gluten' || tag === 'upozorenje' ? 'destructive' : 'secondary'}>{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {product.source && (
                   <div>
                    <h3 className="text-md font-semibold mb-1 flex items-center"><GitBranch className="h-4 w-4 mr-2 text-primary"/> Izvor</h3>
                    <p className="text-sm text-muted-foreground">{product.source}</p>
                  </div>
                )}

                <Button size="lg" className="w-full mt-4" disabled={product.warning}>
                  <ShoppingBag className="mr-2 h-5 w-5" /> {product.warning ? "Proizvod povučen" : "Dodaj na listu za kupovinu (Primer)"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
