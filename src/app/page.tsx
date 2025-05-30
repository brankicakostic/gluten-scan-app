'use client';

import { useState, type FormEvent, useRef, useEffect } from 'react';
import Image from 'next/image';
import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScanSearch, QrCode, AlertCircle, CheckCircle, Info, Loader2, Sparkles, ShoppingBag, ScanLine, CameraOff } from 'lucide-react';
import { analyzeDeclaration, type AnalyzeDeclarationOutput } from '@/ai/flows/analyze-declaration';
import { useToast } from '@/hooks/use-toast';
import { Alert as ShadcnAlert } from '@/components/ui/alert'; // Renamed to avoid conflict with window.Alert


// Placeholder for barcode scan result
interface BarcodeScanResult {
  name: string;
  isGlutenFree: boolean;
  ingredients: string;
  imageUrl: string;
  dataAiHint?: string;
}

export default function HomePage() {
  // State for Declaration Analysis
  const [declarationText, setDeclarationText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalyzeDeclarationOutput | null>(null);
  const [isLoadingDeclaration, setIsLoadingDeclaration] = useState<boolean>(false);
  const [errorDeclaration, setErrorDeclaration] = useState<string | null>(null);
  
  // State for Barcode Scanning
  const [barcodeScanResult, setBarcodeScanResult] = useState<BarcodeScanResult | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [errorBarcode, setErrorBarcode] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);


  const { toast } = useToast();

  useEffect(() => {
    if (isScanning) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          // In a real app, you'd integrate a barcode scanning library here
          // For now, we'll simulate a scan after a delay
          setTimeout(() => {
            // Simulate finding a product
            setBarcodeScanResult({ 
              name: "Simulated Product", 
              isGlutenFree: Math.random() > 0.5, 
              ingredients: "Simulated ingredients, may contain gluten if !isGlutenFree", 
              imageUrl: "https://placehold.co/300x200.png",
              dataAiHint: "food product"
            });
            setIsScanning(false); 
            stopCameraStream();
            toast({ title: "Barcode Scan Simulated", description: "Product details loaded."});
          }, 5000); // Simulate 5 second scan
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          setErrorBarcode('Camera access denied or no camera found. Please enable camera permissions or try manual input.');
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to scan barcodes.',
          });
          setIsScanning(false);
        }
      };
      getCameraPermission();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isScanning]);

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleDeclarationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!declarationText.trim()) {
      setErrorDeclaration('Please enter a product declaration.');
      return;
    }

    setIsLoadingDeclaration(true);
    setErrorDeclaration(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeDeclaration({ declarationText });
      setAnalysisResult(result);
      toast({
        title: "Analysis Complete",
        description: "Product declaration has been analyzed.",
      });
    } catch (err) {
      console.error('Error analyzing declaration:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setErrorDeclaration(`Failed to analyze declaration: ${errorMessage}`);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: `Could not analyze declaration. ${errorMessage}`,
      });
    } finally {
      setIsLoadingDeclaration(false);
    }
  };

  const handleStartScanning = () => {
    setIsScanning(true);
    setBarcodeScanResult(null);
    setErrorBarcode(null);
  };
  
  const handleCancelScanning = () => {
    setIsScanning(false);
    stopCameraStream();
  };


  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarRail />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-6 md:p-8">
          <PageHeader 
            title="Welcome to Gluten Scan" 
            description="Quickly check products by scanning a barcode or entering ingredients."
            icon={ScanLine}
          />
          <div className="space-y-8">
            {/* Barcode Scanning Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><QrCode /> Scan Product Barcode</CardTitle>
                <CardDescription>Use your device's camera to scan a product's barcode for instant gluten information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isScanning && !barcodeScanResult && (
                  <Button onClick={handleStartScanning} className="w-full" size="lg">
                    <QrCode className="mr-2 h-5 w-5" /> Start Scanning
                  </Button>
                )}

                {isScanning && (
                  <div className="space-y-4">
                    <div className="aspect-video bg-muted rounded-md flex flex-col items-center justify-center text-muted-foreground p-4">
                       <video ref={videoRef} className="w-full h-full object-cover rounded-md" autoPlay playsInline muted />
                       {hasCameraPermission === false && (
                         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4 rounded-md">
                            <CameraOff className="h-12 w-12 mb-2 text-destructive" />
                            <p className="text-center text-destructive-foreground">Camera access is required. Please enable permissions.</p>
                         </div>
                       )}
                       {hasCameraPermission === true && (
                          <p className="mt-2 text-sm">Point your camera at a barcode...</p>
                       )}
                    </div>
                    <Button onClick={handleCancelScanning} variant="outline" className="w-full">
                      Cancel Scan
                    </Button>
                  </div>
                )}
                
                {errorBarcode && !isScanning && (
                    <ShadcnAlert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Scanning Error</AlertTitle>
                      <AlertDescription>{errorBarcode}</AlertDescription>
                    </ShadcnAlert>
                  )}

                {barcodeScanResult && !isScanning && (
                  <Card className="mt-4">
                    <CardHeader className="flex flex-row items-start gap-4">
                      <Image 
                        src={barcodeScanResult.imageUrl} 
                        alt={barcodeScanResult.name} 
                        width={80} 
                        height={80} 
                        className="rounded-md object-cover"
                        data-ai-hint={barcodeScanResult.dataAiHint || "product image"}
                      />
                      <div>
                        <CardTitle className="text-xl">{barcodeScanResult.name}</CardTitle>
                        {barcodeScanResult.isGlutenFree ? (
                          <div className="flex items-center text-green-600 mt-1">
                            <CheckCircle className="h-5 w-5 mr-1" />
                            <span>Likely Gluten-Free</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600 mt-1">
                            <AlertCircle className="h-5 w-5 mr-1" />
                            <span>May Contain Gluten</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-semibold mb-1 text-sm">Ingredients:</h4>
                      <p className="text-xs text-muted-foreground">{barcodeScanResult.ingredients}</p>
                      <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => { setBarcodeScanResult(null); setErrorBarcode(null);}}>
                        Scan Another Product
                      </Button>
                    </CardContent>
                  </Card>
                )}
                 {!isScanning && !barcodeScanResult && !errorBarcode && hasCameraPermission !== false && (
                   <div className="text-center text-muted-foreground py-4 border-dashed border-2 rounded-md">
                    <ShoppingBag className="mx-auto h-8 w-8 mb-2" />
                    <p className="text-sm">Scan a product to see its details here.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Declaration Analysis Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ScanSearch /> Analyze Ingredients Manually</CardTitle>
                <CardDescription>If you can't scan a barcode, paste the product's ingredient list below for AI analysis.</CardDescription>
              </CardHeader>
              <form onSubmit={handleDeclarationSubmit}>
                <CardContent>
                  <Textarea
                    placeholder="e.g., Wheat flour, sugar, salt, yeast, barley malt extract..."
                    value={declarationText}
                    onChange={(e) => setDeclarationText(e.target.value)}
                    rows={8}
                    className="resize-none"
                    aria-label="Product Declaration Input"
                  />
                  {errorDeclaration && (
                    <ShadcnAlert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{errorDeclaration}</AlertDescription>
                    </ShadcnAlert>
                  )}
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isLoadingDeclaration} className="w-full">
                    {isLoadingDeclaration ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Analyze with AI
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Declaration Analysis Results */}
            {(analysisResult || isLoadingDeclaration) && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Analysis Report</CardTitle>
                  <CardDescription>Results of the gluten detection analysis for the entered ingredients.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingDeclaration && (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                      <p>Analyzing ingredients...</p>
                    </div>
                  )}
                  {analysisResult && !isLoadingDeclaration && (
                    <>
                      <ShadcnAlert variant={analysisResult.hasGluten ? 'destructive' : 'default'} className={analysisResult.hasGluten ? '' : 'border-green-500'}>
                        {analysisResult.hasGluten ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5 text-green-600" />}
                        <AlertTitle className={analysisResult.hasGluten ? '' : 'text-green-700'}>
                          {analysisResult.hasGluten ? 'Potential Gluten Detected' : 'Likely Gluten-Free'}
                        </AlertTitle>
                        <AlertDescription>
                          Confidence: {Math.round(analysisResult.confidence * 100)}%
                        </AlertDescription>
                      </ShadcnAlert>
                      
                      <div>
                        <h4 className="font-semibold mb-1 text-sm">Reasoning:</h4>
                        <p className="text-xs text-muted-foreground p-2 bg-muted rounded-md">{analysisResult.reason}</p>
                      </div>

                      {analysisResult.glutenIngredients && analysisResult.glutenIngredients.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-1 text-sm">Potential Gluten Ingredients Found:</h4>
                          <ul className="list-disc list-inside text-xs space-y-1">
                            {analysisResult.glutenIngredients.map((ing, index) => (
                              <li key={index} className="text-destructive-foreground bg-destructive/80 px-1.5 py-0.5 rounded-sm">{ing}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                       <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setAnalysisResult(null)}>
                        Clear Analysis Results
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
             {!isLoadingDeclaration && !analysisResult && !errorDeclaration && declarationText && (
                   <div className="text-center text-muted-foreground py-4 border-dashed border-2 rounded-md">
                    <Info className="mx-auto h-8 w-8 mb-2 text-primary" />
                    <p className="text-sm">Analysis results for ingredients will appear here once submitted.</p>
                  </div>
              )}
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}
