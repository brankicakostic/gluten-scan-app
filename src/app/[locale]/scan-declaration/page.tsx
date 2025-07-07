'use client';

import { useState, type FormEvent, useEffect, useRef } from 'react';
import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert as ShadcnAlert, AlertDescription as ShadcnAlertDescription, AlertTitle as ShadcnAlertTitle } from '@/components/ui/alert';
import { ScanSearch, AlertCircle, CheckCircle, Info, Loader2, Sparkles, Star, AlertTriangle, ShieldAlert, RotateCcw, Flag, XCircle, Send } from 'lucide-react'; 
import { analyzeDeclaration, type AnalyzeDeclarationOutput, type IngredientAssessment } from '@/ai/flows/analyze-declaration';
import { useToast } from '@/hooks/use-toast';
import { useScanLimiter } from '@/contexts/scan-limiter-context';
import { countRelevantGlutenIssues } from '@/lib/analysis-utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';


export default function ScanDeclarationPage() {
  const [declarationText, setDeclarationText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalyzeDeclarationOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { canScan, incrementScanCount, getRemainingScans, scanLimit } = useScanLimiter();
  const [showScanLimitModal, setShowScanLimitModal] = useState<boolean>(false);
  const analysisReportRef = useRef<HTMLDivElement>(null);

  // State for the report error form
  const [showReportErrorModal, setShowReportErrorModal] = useState(false);
  const [reportComment, setReportComment] = useState('');
  const [wantsContact, setWantsContact] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [reportPriority, setReportPriority] = useState('');
  const [errorType, setErrorType] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState('idle');

  // State for the manufacturer inquiry form
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryComment, setInquiryComment] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');


  // State to track client-side mounting to prevent hydration errors
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (analysisResult && analysisReportRef.current) {
      analysisReportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [analysisResult]);


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canScan()) {
      setShowScanLimitModal(true);
      return;
    }
    if (!declarationText.trim()) {
      setError('Please enter a product declaration.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // For this dedicated page, we assume no specific labeling info is gathered in a separate step,
      // so we pass 'unknown' or rely on the AI's default handling if labelingInfo is optional.
      // If a labeling info step were to be added here, it would mirror the homepage logic.
      const result = await analyzeDeclaration({ declarationText, labelingInfo: 'unknown' });
      setAnalysisResult(result);
      incrementScanCount();
      toast({
        title: "Analysis Complete",
        description: "Product declaration has been analyzed.",
      });
    } catch (err) {
      console.error('Error analyzing declaration:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to analyze declaration: ${errorMessage}`);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: `Could not analyze declaration. ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportSubmit = () => {
    setSubmissionStatus('submitting');
    // Simulate API call
    setTimeout(() => {
        setSubmissionStatus('success');
    }, 1000);
  };

  const getAssessmentAlert = (result: AnalyzeDeclarationOutput) => {
    const confidenceText = `Poverenje: ${result.poverenjeUkupneProcene !== undefined ? Math.round(result.poverenjeUkupneProcene * 100) : 'N/A'}%`;
    switch (result.ukupnaProcenaBezbednosti) {
      case 'sigurno':
        return (
          <ShadcnAlert variant='default' className='border-green-500 bg-green-50 dark:bg-green-900/30'>
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <ShadcnAlertTitle className='text-green-700 dark:text-green-400'>Verovatno bez glutena</ShadcnAlertTitle>
            <ShadcnAlertDescription className="text-green-600 dark:text-green-300">{confidenceText}</ShadcnAlertDescription>
          </ShadcnAlert>
        );
      case 'potrebna pažnja':
        return (
          <ShadcnAlert variant='default' className='border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30'>
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <ShadcnAlertTitle className='text-yellow-700 dark:text-yellow-400'>Potrebna pažnja / Verovatno bezbedno uz oprez</ShadcnAlertTitle>
            <ShadcnAlertDescription className="text-yellow-600 dark:text-yellow-300">{confidenceText}</ShadcnAlertDescription>
          </ShadcnAlert>
        );
      case 'rizično':
        return (
          <ShadcnAlert variant='default' className="border-orange-500 bg-orange-50 dark:bg-orange-900/30">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <ShadcnAlertTitle className="text-orange-700 dark:text-orange-400">Rizično / Mogući tragovi glutena</ShadcnAlertTitle>
            <ShadcnAlertDescription className="text-orange-600 dark:text-orange-300">{confidenceText}</ShadcnAlertDescription>
          </ShadcnAlert>
        );
      case 'nije bezbedno':
        return (
          <ShadcnAlert variant='destructive'>
            <AlertCircle className="h-5 w-5" />
            <ShadcnAlertTitle>Nije bezbedno / Sadrži gluten</ShadcnAlertTitle>
            <ShadcnAlertDescription>{confidenceText}</ShadcnAlertDescription>
          </ShadcnAlert>
        );
      default:
        return (
          <ShadcnAlert variant='default'>
            <Info className="h-5 w-5" />
            <ShadcnAlertTitle>Status nepoznat</ShadcnAlertTitle>
            <ShadcnAlertDescription>{confidenceText}</ShadcnAlertDescription>
          </ShadcnAlert>
        );
    }
  };

  const relevantGlutenIssueCount = analysisResult?.rezultat ? countRelevantGlutenIssues(analysisResult.rezultat as IngredientAssessment[]) : 0;
  
  const problematicIngredients = analysisResult?.rezultat.filter(item => item.ocena !== 'sigurno') || [];
  const safeIngredients = analysisResult?.rezultat.filter(item => item.ocena === 'sigurno') || [];


  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarRail />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            <PageHeader 
              title="Scan Product Declaration"
              description="Enter the ingredient list from a product to analyze it for gluten content using AI."
              icon={ScanSearch}
            />

            <Card className="mb-6 bg-muted/30 border-muted/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between text-sm min-h-[20px]">
                  {hasMounted ? (
                    <>
                      {canScan() ? (
                        <div className="flex items-center text-primary">
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          <span>{getRemainingScans()} of {scanLimit} free scans remaining.</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-destructive">
                          <AlertCircle className="h-4 w-4 mr-1.5" />
                          <span>No free scans remaining. Upgrade for unlimited scans.</span>
                        </div>
                      )}
                    </>
                  ) : (
                     <div className="h-5 w-56 bg-muted rounded animate-pulse" />
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-8 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Analyze Ingredients</CardTitle>
                  <CardDescription>Paste the product's ingredient list below.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent>
                    <Textarea
                      placeholder="e.g., Wheat flour, sugar, salt, yeast, barley malt extract..."
                      value={declarationText}
                      onChange={(e) => setDeclarationText(e.target.value)}
                      rows={10}
                      className="resize-none"
                      aria-label="Product Declaration Input"
                      disabled={!hasMounted || (hasMounted && !canScan()) || isLoading}
                    />
                    {error && (
                      <ShadcnAlert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <ShadcnAlertTitle>Error</ShadcnAlertTitle>
                        <ShadcnAlertDescription>{error}</ShadcnAlertDescription>
                      </ShadcnAlert>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" size="lg" disabled={!hasMounted || (hasMounted && !canScan()) || isLoading || !declarationText.trim()} className="w-full">
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Analyze with AI
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              <Card ref={analysisReportRef} className={analysisResult || isLoading || error ? 'opacity-100' : 'opacity-50'}>
                <CardHeader>
                  <CardTitle>AI Analysis Report</CardTitle>
                  <CardDescription>Results of the gluten detection analysis.</CardDescription>
                </CardHeader>
                <CardContent 
                  className="space-y-4"
                  aria-live="polite"
                  aria-busy={isLoading}
                >
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                      <p>Analyzing ingredients...</p>
                      <p className="text-sm">This may take a few moments.</p>
                    </div>
                  )}
                  {!isLoading && !analysisResult && !error && (
                     <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                      <Info className="h-12 w-12 text-primary mb-4" />
                      <p>Analysis results will appear here.</p>
                    </div>
                  )}
                  {analysisResult && (
                    <>
                      {getAssessmentAlert(analysisResult)}
                      
                       {relevantGlutenIssueCount > 0 && (
                          <div className="mt-3 p-2 bg-destructive/10 rounded-md text-sm text-destructive flex items-center gap-2">
                              <ShieldAlert className="h-5 w-5"/>
                              <span>Identifikovano {relevantGlutenIssueCount} kritičnih stavki vezanih za gluten.</span>
                          </div>
                       )}

                      <div>
                        <h4 className="font-semibold mb-1">Obrazloženje:</h4>
                        <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md whitespace-pre-wrap">{analysisResult.finalnoObrazlozenje}</p>
                      </div>

                      {problematicIngredients.length > 0 && (
                        <div className="mt-3">
                          <h4 className="font-semibold mb-2 text-md">Analiza rizičnih sastojaka:</h4>
                          <ul className="list-none space-y-2 text-sm">
                            {problematicIngredients.map((item, index) => {
                              let icon;
                              let colorClasses;
                              let textColor;
                      
                              switch (item.ocena) {
                                case 'nije bezbedno':
                                  icon = <XCircle className="h-5 w-5 text-red-600" />;
                                  colorClasses = 'border-red-400/50 bg-red-50 dark:bg-red-900/20';
                                  textColor = 'text-red-700 dark:text-red-300';
                                  break;
                                case 'rizično – proveriti poreklo':
                                default:
                                  icon = <AlertTriangle className="h-5 w-5 text-orange-500" />;
                                  colorClasses = 'border-orange-400/50 bg-orange-50 dark:bg-orange-900/20';
                                  textColor = 'text-orange-700 dark:text-orange-300';
                                  break;
                              }
                      
                              return (
                                <li key={index} className={`p-3 rounded-lg border ${colorClasses}`}>
                                  <Popover>
                                    <PopoverTrigger asChild disabled={!item.napomena}>
                                      <div className={`flex items-start gap-3 ${item.napomena ? 'cursor-pointer' : ''}`}>
                                        <div className="pt-0.5">{icon}</div>
                                        <div className="flex-1">
                                          <p className="font-semibold text-foreground">{item.sastojak}</p>
                                          <p className={`text-xs ${textColor}`}>
                                            {item.ocena} (Nivo rizika: {item.nivoRizika})
                                          </p>
                                        </div>
                                        {item.napomena && <Info className="h-4 w-4 text-blue-500 shrink-0" />}
                                      </div>
                                    </PopoverTrigger>
                                    {item.napomena && (
                                      <PopoverContent className="w-auto max-w-[300px] text-sm p-3" side="top" align="start">
                                        <p className="font-bold mb-1">{item.kategorijaRizika || 'Napomena'}</p>
                                        <p className="text-muted-foreground">{item.napomena}</p>
                                      </PopoverContent>
                                    )}
                                  </Popover>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {safeIngredients.length > 0 && (
                         <Accordion type="single" collapsible className="w-full mt-4">
                          <AccordionItem value="safe-ingredients">
                            <AccordionTrigger>Prikaži {safeIngredients.length} bezbednih sastojaka</AccordionTrigger>
                            <AccordionContent>
                              <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">
                                {safeIngredients.map(item => item.sastojak).join(', ')}
                              </p>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                       <div className="mt-6 flex flex-col sm:flex-row gap-2">
                         <Button variant="outline" className="w-full" onClick={() => {
                           setAnalysisResult(null);
                           setDeclarationText('');
                           setError(null);
                         }}>
                           <RotateCcw className="mr-2 h-4 w-4" />
                           Očisti i počni ponovo
                         </Button>
                          <Dialog open={showReportErrorModal} onOpenChange={(open) => {
                                 setShowReportErrorModal(open);
                                 if (!open) {
                                     setReportComment('');
                                     setWantsContact(false);
                                     setContactEmail('');
                                     setReportPriority('');
                                     setErrorType('');
                                     setSubmissionStatus('idle');
                                 }
                             }}>
                            <DialogTrigger asChild>
                              <Button className="w-full">
                                <Flag className="mr-2 h-4 w-4" />
                                Prijavi grešku
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              {submissionStatus === 'success' ? (
                                   <div className="flex flex-col items-center justify-center text-center p-4">
                                     <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                                     <DialogTitle className="text-xl">Prijava je poslata!</DialogTitle>
                                     <DialogDescription className="mt-2">
                                       Hvala što si deo GlutenScan zajednice. 💛 Ako si ostavio/la kontakt, možemo ti se javiti kad proverimo.
                                     </DialogDescription>
                                     <DialogFooter className="mt-6 w-full">
                                       <Button className="w-full" onClick={() => setShowReportErrorModal(false)}>Zatvori</Button>
                                     </DialogFooter>
                                   </div>
                                 ) : (
                                  <>
                                    <DialogHeader>
                                      <DialogTitle>Prijavi grešku u analizi</DialogTitle>
                                      <DialogDescription>
                                        Tvoje povratne informacije nam pomažu da poboljšamo tačnost aplikacije.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-2 text-sm">
                                        <div>
                                          <Label className="font-semibold">Koliko je ova greška ozbiljna za vas? (opciono)</Label>
                                          <RadioGroup value={reportPriority} onValueChange={setReportPriority} className="mt-2 space-y-1">
                                            <div className="flex items-center space-x-2">
                                              <RadioGroupItem value="niska" id="priority-low-scan" />
                                              <Label htmlFor="priority-low-scan" className="font-normal">Niska (čisto informacija)</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <RadioGroupItem value="srednja" id="priority-medium-scan" />
                                              <Label htmlFor="priority-medium-scan" className="font-normal">Srednja (važno mi je)</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <RadioGroupItem value="visoka" id="priority-high-scan" />
                                              <Label htmlFor="priority-high-scan" className="font-normal">Visoka (utiče na moju bezbednost)</Label>
                                            </div>
                                          </RadioGroup>
                                        </div>
                                        <div>
                                          <Label className="font-semibold">Tip greške (opciono)</Label>
                                           <RadioGroup value={errorType} onValueChange={setErrorType} className="mt-2 space-y-1">
                                            <div className="flex items-center space-x-2">
                                              <RadioGroupItem value="sastav" id="type-sastav-scan" />
                                              <Label htmlFor="type-sastav-scan" className="font-normal">Greška u sastavu / AI analizi</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <RadioGroupItem value="drugo" id="type-drugo-scan" />
                                              <Label htmlFor="type-drugo-scan" className="font-normal">Ostalo</Label>
                                            </div>
                                          </RadioGroup>
                                        </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="report-comment-scan">Komentar (opciono)</Label>
                                        <Textarea id="report-comment-scan" placeholder="Npr. Brašno od rogača je bez glutena, a označeno je kao rizično." onChange={(e) => setReportComment(e.target.value)} />
                                      </div>
                                      
                                      <div className="flex items-center space-x-2">
                                        <Checkbox id="wants-contact-scan" onCheckedChange={(checked) => setWantsContact(!!checked)} />
                                        <Label htmlFor="wants-contact-scan">Želim da me kontaktirate povodom ove prijave.</Label>
                                      </div>
                                      {wantsContact && (
                                        <div className="space-y-2 pl-6">
                                          <Label htmlFor="contact-email-scan">Email za odgovor</Label>
                                          <Input id="contact-email-scan" type="email" placeholder="vas.email@primer.com" onChange={(e) => setContactEmail(e.target.value)} />
                                        </div>
                                      )}
                                      <p className="text-xs text-muted-foreground">
                                        Napomena: Uz prijavu se automatski šalje i analizirani tekst radi lakše provere.
                                      </p>
                                    </div>
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setShowReportErrorModal(false)}>Odustani</Button>
                                      <Button onClick={handleReportSubmit} disabled={submissionStatus === 'submitting'}>
                                        {submissionStatus === 'submitting' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Pošalji prijavu'}
                                      </Button>
                                    </DialogFooter>
                                  </>
                                )}
                            </DialogContent>
                          </Dialog>
                            <Dialog open={showInquiryModal} onOpenChange={(open) => {
                               setShowInquiryModal(open);
                               if (!open) {
                                 setInquiryComment('');
                                 setInquiryEmail('');
                               }
                             }}>
                              <DialogTrigger asChild>
                                <Button variant="secondary" className="w-full">
                                  <Send className="mr-2 h-4 w-4" /> Pošalji proizvođaču upit
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>✉️ Želite da proverimo ovaj proizvod kod proizvođača?</DialogTitle>
                                  <DialogDescription>
                                    Ponekad je direktan upit proizvođaču najbolji način da se otklone sumnje. Rado ćemo to uraditi za vas.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                  <div className="space-y-2">
                                    <Label htmlFor="inquiry-comment-scan">Ostavi komentar (opciono)</Label>
                                    <Textarea id="inquiry-comment-scan" placeholder="Npr. 'Zanima me da li je aroma na bazi pšenice' ili 'Molim vas proverite rizik od unakrsne kontaminacije'." onChange={(e) => setInquiryComment(e.target.value)} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="inquiry-email-scan">Email za odgovor (opciono)</Label>
                                    <Input id="inquiry-email-scan" type="email" placeholder="vas.email@primer.com" onChange={(e) => setInquiryEmail(e.target.value)} />
                                    <p className="text-xs text-muted-foreground">Ako unesete email, javićemo vam direktno kada dobijemo odgovor.</p>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setShowInquiryModal(false)}>Odustani</Button>
                                  <Button onClick={() => {
                                    toast({
                                      title: "Upit se šalje!",
                                      description: "Hvala! Poslaćemo upit proizvođaču i obavestiti vas.",
                                    });
                                    setShowInquiryModal(false);
                                  }}>
                                    <Send className="mr-2 h-4 w-4" /> Pošalji
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                       </div>
                       <p className="text-xs text-muted-foreground mt-4 text-center">
                        <Info className="inline h-3 w-3 mr-1" />
                        Ova analiza je informativna i ne zamenjuje zvaničnu potvrdu proizvođača. Ako imate sumnje, pošaljite upit direktno preko aplikacije.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

             {/* Scan Limit Modal */}
            <AlertDialog open={showScanLimitModal} onOpenChange={setShowScanLimitModal}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2 text-primary" /> 
                    Free Scan Limit Reached
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    You have used all your {scanLimit} free scans. To continue scanning and analyzing products, please consider upgrading to our Premium version.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Maybe Later</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                    toast({ title: "Premium (Coming Soon!)", description: "Thanks for your interest! Premium features are under development."});
                    setShowScanLimitModal(false);
                  }}>
                    Learn More About Premium
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}
