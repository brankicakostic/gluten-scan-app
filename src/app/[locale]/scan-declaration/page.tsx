
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert as ShadcnAlert, AlertDescription as ShadcnAlertDescription, AlertTitle as ShadcnAlertTitle } from '@/components/ui/alert';
import { ScanSearch, AlertCircle, CheckCircle, Info, Loader2, Sparkles, Star, AlertTriangle, ShieldAlert, Send, RotateCcw, Mail, XCircle } from 'lucide-react'; 
import { analyzeDeclaration, type AnalyzeDeclarationOutput, type IngredientAssessment } from '@/ai/flows/analyze-declaration';
import { useToast } from '@/hooks/use-toast';
import { useScanLimiter } from '@/contexts/scan-limiter-context';
import { countRelevantGlutenIssues } from '@/lib/analysis-utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function ScanDeclarationPage() {
  const [declarationText, setDeclarationText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalyzeDeclarationOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { canScan, incrementScanCount, getRemainingScans, scanLimit } = useScanLimiter();
  const [showScanLimitModal, setShowScanLimitModal] = useState<boolean>(false);

  // State to track client-side mounting to prevent hydration errors
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

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


  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarRail />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-6 md:p-8">
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
                  <Button type="submit" disabled={!hasMounted || (hasMounted && !canScan()) || isLoading || !declarationText.trim()} className="w-full">
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

            <Card className={analysisResult || isLoading || error ? 'opacity-100' : 'opacity-50'}>
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

                    {analysisResult.rezultat.length > 0 && (
                      <div className="mt-3">
                        <h4 className="font-semibold mb-2 text-md">Analizirani sastojci:</h4>
                        <ul className="list-none space-y-2 text-sm">
                          {analysisResult.rezultat.map((item, index) => {
                            let icon;
                            let colorClasses;
                            let textColor;
                    
                            switch (item.ocena) {
                              case 'sigurno':
                                icon = <CheckCircle className="h-5 w-5 text-green-600" />;
                                colorClasses = 'border-green-400/50 bg-green-50 dark:bg-green-900/20';
                                textColor = 'text-green-700 dark:text-green-300';
                                break;
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
                     <div className="mt-6 flex flex-col sm:flex-row gap-2">
                       <Button variant="outline" className="w-full" onClick={() => {
                         setAnalysisResult(null);
                         setDeclarationText('');
                         setError(null);
                       }}>
                         <RotateCcw className="mr-2 h-4 w-4" />
                         Očisti i počni ponovo
                       </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button className="w-full">
                              <Send className="mr-2 h-4 w-4" />
                              Pošalji proizvođaču upit
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-primary" />
                                Želite da proverimo ovaj proizvod kod proizvođača?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Vaš upit će biti prosleđen. Ostavite komentar ili email ako želite da vas obavestimo o odgovoru.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-4 py-2">
                              <div className="space-y-2">
                                <Label htmlFor="inquiry-comment-scan">Komentar (opciono)</Label>
                                <Textarea id="inquiry-comment-scan" placeholder="Npr. da li ovaj proizvod sadrži gluten od..." />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="inquiry-email-scan">Email za odgovor (opciono)</Label>
                                <Input id="inquiry-email-scan" type="email" placeholder="vas.email@primer.com" />
                              </div>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Odustani</AlertDialogCancel>
                              <AlertDialogAction onClick={() => {
                                toast({
                                  title: 'Upit Poslat!',
                                  description: 'Hvala! Proverićemo proizvod sa proizvođačem.',
                                });
                              }}>
                                Pošalji
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                     </div>
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

        </main>
      </SidebarInset>
    </div>
  );
}
