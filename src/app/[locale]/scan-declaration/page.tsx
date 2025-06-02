
'use client';

import { useState, type FormEvent } from 'react';
import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert as ShadcnAlert, AlertDescription as ShadcnAlertDescription, AlertTitle as ShadcnAlertTitle } from '@/components/ui/alert';
import { ScanSearch, AlertCircle, CheckCircle, Info, Loader2, Sparkles, Star } from 'lucide-react'; // Changed Premium to Star
import { analyzeDeclaration, type AnalyzeDeclarationOutput } from '@/ai/flows/analyze-declaration';
import { useToast } from '@/hooks/use-toast';
import { useScanLimiter } from '@/contexts/scan-limiter-context';

export default function ScanDeclarationPage() {
  const [declarationText, setDeclarationText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalyzeDeclarationOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { canScan, incrementScanCount, getRemainingScans, scanLimit } = useScanLimiter();
  const [showScanLimitModal, setShowScanLimitModal] = useState<boolean>(false);

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
      const result = await analyzeDeclaration({ declarationText });
      setAnalysisResult(result);
      incrementScanCount();
      toast({
        title: "Analysis Complete",
        description: "Product declaration has been analyzed.",
      });
    } catch (err) {
      console.error('Error analyzing declaration:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(\`Failed to analyze declaration: \${errorMessage}\`);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: \`Could not analyze declaration. \${errorMessage}\`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const userCanCurrentlyScan = canScan();
  const currentRemainingScans = getRemainingScans();

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
              <div className="flex items-center justify-between text-sm">
                {userCanCurrentlyScan ? (
                  <div className="flex items-center text-primary">
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    <span>{currentRemainingScans} of {scanLimit} free scans remaining.</span>
                  </div>
                ) : (
                  <div className="flex items-center text-destructive">
                    <AlertCircle className="h-4 w-4 mr-1.5" />
                    <span>No free scans remaining. Upgrade for unlimited scans.</span>
                  </div>
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
                    disabled={!userCanCurrentlyScan || isLoading}
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
                  <Button type="submit" disabled={!userCanCurrentlyScan || isLoading || !declarationText.trim()} className="w-full">
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
              <CardContent className="space-y-4">
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
                    <ShadcnAlert variant={analysisResult.hasGluten ? 'destructive' : 'default'} className={analysisResult.hasGluten ? '' : 'border-green-500'}>
                      {analysisResult.hasGluten ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5 text-green-600" />}
                      <ShadcnAlertTitle className={analysisResult.hasGluten ? '' : 'text-green-700'}>
                        {analysisResult.hasGluten ? 'Potential Gluten Detected' : 'Likely Gluten-Free'}
                      </ShadcnAlertTitle>
                      <ShadcnAlertDescription>
                        Confidence: {Math.round(analysisResult.confidence * 100)}%
                      </ShadcnAlertDescription>
                    </ShadcnAlert>
                    
                    <div>
                      <h4 className="font-semibold mb-1">Reasoning:</h4>
                      <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md whitespace-pre-wrap">{analysisResult.reason}</p>
                    </div>

                    {analysisResult.glutenIngredients && analysisResult.glutenIngredients.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-1">Potential Gluten Ingredients Found:</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {analysisResult.glutenIngredients.map((ing, index) => (
                            <li key={index} className="text-destructive-foreground bg-destructive/80 px-2 py-1 rounded-sm">{ing}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => {
                       setAnalysisResult(null);
                       setDeclarationText('');
                       setError(null);
                     }}>Clear Analysis & Input</Button>
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
                  <Star className="h-5 w-5 mr-2 text-primary" /> {/* Changed Premium to Star */}
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
