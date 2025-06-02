
'use client';

import { useState, type FormEvent, useRef, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link'; 
import { useParams } from 'next/navigation'; 
import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert as ShadcnAlert, AlertDescription as ShadcnAlertDescription, AlertTitle as ShadcnAlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScanLine, QrCode, ScanSearch, AlertCircle, CheckCircle, Info, Loader2, Sparkles, ShoppingBag, PackageOpen, Search, CameraOff, Lightbulb, BookOpen, AlertTriangle, UploadCloud, Star, RotateCcw } from 'lucide-react'; // Changed Premium to Star
import { analyzeDeclaration, type AnalyzeDeclarationOutput } from '@/ai/flows/analyze-declaration';
import { getDailyCeliacTip, type DailyCeliacTipOutput } from '@/ai/flows/daily-celiac-tip-flow';
import { ocrDeclaration, type OcrDeclarationOutput } from '@/ai/flows/ocr-declaration-flow';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useScanLimiter } from '@/contexts/scan-limiter-context'; 

import { placeholderProducts as allProducts, type Product } from './products/page'; 

interface BarcodeScanResult {
  name: string;
  tags?: string[]; 
  ingredientsText?: string;
  imageUrl: string;
  dataAiHint?: string;
}


const productCategories = Array.from(new Set(allProducts.map(p => p.category)));

const getNutriScoreClasses = (score?: string) => {
  if (!score) return 'border-gray-300 text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500';
  // Return only border and text color, background will be transparent or very light
  switch (score.toUpperCase()) {
    case 'A': return 'border-green-500 text-green-700 dark:text-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/30';
    case 'B': return 'border-lime-500 text-lime-700 dark:text-lime-400 dark:border-lime-600 bg-lime-50 dark:bg-lime-900/30';
    case 'C': return 'border-yellow-500 text-yellow-700 dark:text-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/30';
    case 'D': return 'border-orange-500 text-orange-700 dark:text-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/30';
    case 'E': return 'border-red-500 text-red-700 dark:text-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/30';
    default: return 'border-gray-300 text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500';
  }
};

const explicitlyHandledTags = [
  'gluten-free', 'contains-gluten', 'may-contain-gluten', 
  'contains-wheat', 'risk-of-contamination', 'contains-barley', 'contains-rye', 'contains-oats',
  'sugar-free', 'lactose-free', 'posno', 'high-protein'
];

export default function HomePage() {
  const routeParams = useParams(); 
  const locale = routeParams.locale as string;
  const { toast } = useToast();
  const { canScan, incrementScanCount, getRemainingScans, scanLimit, resetScanCount } = useScanLimiter();

  const [declarationText, setDeclarationText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalyzeDeclarationOutput | null>(null);
  const [isLoadingDeclaration, setIsLoadingDeclaration] = useState<boolean>(false);
  const [errorDeclaration, setErrorDeclaration] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoadingOcr, setIsLoadingOcr] = useState<boolean>(false);
  
  const [barcodeScanResult, setBarcodeScanResult] = useState<BarcodeScanResult | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [errorBarcode, setErrorBarcode] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>(allProducts.slice(0, 8)); 

  const [dailyTip, setDailyTip] = useState<DailyCeliacTipOutput | null>(null);
  const [isLoadingTip, setIsLoadingTip] = useState<boolean>(true);
  const [errorTip, setErrorTip] = useState<string | null>(null);
  const [showTipDetailsModal, setShowTipDetailsModal] = useState<boolean>(false);
  const [showScanLimitModal, setShowScanLimitModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchTip = async () => {
      setIsLoadingTip(true);
      setErrorTip(null);
      try {
        const tipResult = await getDailyCeliacTip();
        setDailyTip(tipResult);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error.';
        console.error('Failed to fetch daily tip:', errorMessage);
        setErrorTip('Could not load daily tip. Please try refreshing.');
      } finally {
        setIsLoadingTip(false);
      }
    };
    fetchTip();
  }, []);

  useEffect(() => {
    let filtered = allProducts;
    if (searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase().trim()))
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    setDisplayedProducts(filtered.slice(0,8)); 
  }, [searchTerm, selectedCategory]);
  
  useEffect(() => {
    if (isScanning) {
      if (!canScan()) {
        setShowScanLimitModal(true);
        setIsScanning(false);
        return;
      }
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setTimeout(() => {
            const randomProduct = allProducts[Math.floor(Math.random() * allProducts.length)];
            const isProductFound = Math.random() > 0.3; 

            if (isProductFound && randomProduct) {
                 setBarcodeScanResult({ 
                    name: randomProduct.name, 
                    tags: randomProduct.tags,
                    ingredientsText: randomProduct.ingredientsText || "Ingredients not available.", 
                    imageUrl: randomProduct.imageUrl,
                    dataAiHint: randomProduct.dataAiHint || "scanned product"
                  });
            } else {
                 setBarcodeScanResult({ 
                    name: "Unknown Product Scanned", 
                    tags: ['unknown-barcode'],
                    ingredientsText: "No product information found for this barcode. Try analyzing the declaration.", 
                    imageUrl: "https://placehold.co/300x200.png",
                    dataAiHint: "unknown product"
                  });
            }
            incrementScanCount();
            setIsScanning(false); 
            stopCameraStream();
            toast({ title: "Barcode Scan Simulated", description: "Product details loaded."});
          }, 3000); // Reduced timeout for quicker simulation
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          setErrorBarcode('Camera access denied. Please enable permissions.');
          toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Enable camera permissions for barcode scanning.'});
          setIsScanning(false);
        }
      };
      getCameraPermission();
    } else {
      stopCameraStream();
    }
    return () => stopCameraStream();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning, toast]); // Removed canScan and incrementScanCount from deps to avoid re-triggering on count change while scanning

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleDeclarationSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!canScan()) {
      setShowScanLimitModal(true);
      return;
    }
    if (!declarationText.trim()) {
      setErrorDeclaration('Please enter a product declaration or upload an image.');
      return;
    }
    setIsLoadingDeclaration(true);
    setErrorDeclaration(null);
    setAnalysisResult(null);
    try {
      const result = await analyzeDeclaration({ declarationText });
      setAnalysisResult(result);
      incrementScanCount();
      toast({ title: "Analysis Complete", description: "Product declaration analyzed." });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error.';
      setErrorDeclaration('Analysis failed: ' + errorMessage);
      toast({ variant: "destructive", title: "Analysis Failed", description: errorMessage });
    } finally {
      setIsLoadingDeclaration(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setErrorDeclaration(null); 
      setDeclarationText(''); 
      setAnalysisResult(null); 
    }
  };

  const handleOcrScanAndAnalyze = async () => {
    if (!canScan()) {
      setShowScanLimitModal(true);
      return;
    }
    if (!selectedFile) {
      setErrorDeclaration('Please select an image file first.');
      return;
    }
    setIsLoadingOcr(true);
    setErrorDeclaration(null);
    setAnalysisResult(null);

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = async () => {
      const imageDataUri = reader.result as string;
      try {
        const ocrResult: OcrDeclarationOutput = await ocrDeclaration({ imageDataUri });
        setDeclarationText(ocrResult.extractedText);
        toast({ title: "OCR Scan Complete", description: "Text extracted. Analyzing..." });
        
        if (ocrResult.extractedText.trim()) {
          setIsLoadingDeclaration(true); // Set loading for AI analysis part
          const analysis = await analyzeDeclaration({ declarationText: ocrResult.extractedText });
          setAnalysisResult(analysis);
          incrementScanCount(); // Increment after successful AI analysis
          toast({ title: "AI Analysis Complete", description: "Product declaration analyzed." });
        } else {
          setErrorDeclaration('OCR did not find any text to analyze.');
          toast({ variant: "destructive", title: "OCR Empty", description: "No text found in image."});
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error.';
        setErrorDeclaration('OCR or Analysis failed: ' + errorMessage);
        toast({ variant: "destructive", title: "Operation Failed", description: errorMessage });
      } finally {
        setIsLoadingOcr(false);
        setIsLoadingDeclaration(false); // Ensure this is also reset
        setSelectedFile(null); 
        const fileInput = document.getElementById('ocr-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      setErrorDeclaration('Failed to read the image file.');
      setIsLoadingOcr(false);
      toast({ variant: "destructive", title: "File Read Error", description: "Could not read the selected image." });
    };
  };


  const handleStartScanning = () => {
    if (!canScan()) {
      setShowScanLimitModal(true);
      return;
    }
    setIsScanning(true);
    setBarcodeScanResult(null);
    setErrorBarcode(null);
  };
  
  const handleCancelScanning = () => {
    setIsScanning(false);
    stopCameraStream();
  };

  const currentRemainingScans = getRemainingScans();
  const userCanCurrentlyScan = canScan();


  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarRail />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-6 md:p-8">
          <PageHeader 
            title="Welcome to Gluten Detective" // Updated app name
            description="Search, scan, or analyze ingredients to find gluten-free products."
            icon={ScanLine}
          />
          
          {/* Scan Limiter Info */}
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
                {/* Reset button for testing - REMOVE FOR PRODUCTION */}
                {process.env.NODE_ENV === 'development' && (
                  <Button variant="outline" size="sm" onClick={resetScanCount} title="Reset Scan Count (Dev Only)">
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mb-8">
            {isLoadingTip && (
              <div className="flex items-center justify-center text-muted-foreground p-4 bg-muted/50 rounded-lg shadow-sm">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                <span>Loading daily tip...</span>
              </div>
            )}
            {errorTip && !isLoadingTip && (
              <div className="flex items-center justify-center text-destructive p-4 bg-destructive/10 rounded-lg shadow-sm">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{errorTip}</span>
              </div>
            )}
            {dailyTip && !isLoadingTip && !errorTip && (
              <Card className="bg-secondary/50 border-secondary shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
                    <div className="flex items-center">
                      <Lightbulb className="h-6 w-6 mr-3 text-primary flex-shrink-0" />
                      <p className="text-sm text-secondary-foreground">{dailyTip.summary}</p>
                    </div>
                    <AlertDialog open={showTipDetailsModal} onOpenChange={setShowTipDetailsModal}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-background/70 hover:bg-background">
                          <BookOpen className="mr-2 h-4 w-4" /> Read More
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-primary" /> Daily Celiac Tip
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-left pt-2">
                            <strong>{dailyTip.summary}</strong>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="text-sm text-muted-foreground max-h-[60vh] overflow-y-auto pr-2">
                          <p>{dailyTip.details}</p>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogAction>Got it!</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Find Products</CardTitle>
                <CardDescription>Search by name or filter by category to find gluten-free items.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="product-search" className="text-sm font-medium">Search by name or brand</Label>
                  <Input 
                    id="product-search" 
                    placeholder="e.g., Gluten-Free Bread, Schar" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </div>
                <div>
                  <Label htmlFor="product-category" className="text-sm font-medium">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="product-category">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {productCategories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" /> Scan Product Barcode</CardTitle>
                <CardDescription>Use your device's camera for instant gluten information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isScanning && !barcodeScanResult && (
                  <Button onClick={handleStartScanning} className="w-full" size="lg" disabled={!userCanCurrentlyScan || isLoadingOcr || isLoadingDeclaration}>
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
                    <Button onClick={handleCancelScanning} variant="outline" className="w-full">Cancel Scan</Button>
                  </div>
                )}
                {errorBarcode && !isScanning && (
                  <ShadcnAlert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <ShadcnAlertTitle>Scanning Error</ShadcnAlertTitle>
                    <ShadcnAlertDescription>{errorBarcode}</ShadcnAlertDescription>
                  </ShadcnAlert>
                )}
                {barcodeScanResult && !isScanning && (
                  <Card className="mt-4">
                    <CardHeader className="flex flex-row items-start gap-4">
                      <Image src={barcodeScanResult.imageUrl} alt={barcodeScanResult.name} width={80} height={80} className="rounded-md object-cover" data-ai-hint={barcodeScanResult.dataAiHint || "product image"}/>
                      <div>
                        <CardTitle className="text-xl">{barcodeScanResult.name}</CardTitle>
                        {barcodeScanResult.tags?.includes('gluten-free') && (
                          <div className="flex items-center text-green-600 mt-1"><CheckCircle className="h-5 w-5 mr-1" /><span>Likely Gluten-Free</span></div>
                        )}
                        {(barcodeScanResult.tags?.includes('contains-gluten') || barcodeScanResult.tags?.includes('contains-wheat') || barcodeScanResult.tags?.includes('contains-barley') || barcodeScanResult.tags?.includes('contains-rye') || (barcodeScanResult.tags?.includes('contains-oats') && !barcodeScanResult.tags?.includes('gluten-free'))) && (
                          <div className="flex items-center text-red-600 mt-1"><AlertTriangle className="h-5 w-5 mr-1" /><span>Contains Gluten</span></div>
                        )}
                        {barcodeScanResult.tags?.includes('may-contain-gluten') && !barcodeScanResult.tags?.includes('gluten-free') && !barcodeScanResult.tags?.includes('contains-gluten') && (
                           <div className="flex items-center text-orange-500 mt-1"><AlertTriangle className="h-5 w-5 mr-1" /><span>May Contain Traces</span></div>
                        )}
                         {barcodeScanResult.tags?.includes('unknown-barcode') && (
                           <div className="flex items-center text-muted-foreground mt-1"><Info className="h-5 w-5 mr-1" /><span>Barcode Not Found</span></div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-semibold mb-1 text-sm">Ingredients:</h4>
                      <p className="text-xs text-muted-foreground">{barcodeScanResult.ingredientsText || 'Not available'}</p>
                      <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => { setBarcodeScanResult(null); setErrorBarcode(null);}} disabled={!userCanCurrentlyScan}>Scan Another</Button>
                    </CardContent>
                  </Card>
                )}
                {!isScanning && !barcodeScanResult && !errorBarcode && hasCameraPermission !== false && (
                   <div className="text-center text-muted-foreground py-4 border-dashed border-2 rounded-md">
                    <QrCode className="mx-auto h-8 w-8 mb-2" />
                    <p className="text-sm">Scan results will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary" /> Products
            </h2>
            {displayedProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedProducts.map(product => {
                  const isGlutenFreeTag = product.tags?.includes('gluten-free');
                  const containsGlutenTag = product.tags?.includes('contains-gluten') || product.tags?.includes('contains-wheat') || product.tags?.includes('contains-barley') || product.tags?.includes('contains-rye') || (product.tags?.includes('contains-oats') && !isGlutenFreeTag);
                  const mayContainGlutenTag = product.tags?.includes('may-contain-gluten') || product.tags?.includes('risk-of-contamination');

                  return (
                    <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-200 flex flex-col">
                      <CardHeader className="p-0">
                        <Image src={product.imageUrl} alt={product.name} width={400} height={200} className="w-full h-48 object-cover" data-ai-hint={product.dataAiHint || 'product image'}/>
                      </CardHeader>
                      <CardContent className="p-4 flex flex-col flex-grow">
                        <CardTitle className="text-lg mb-1">{product.name}</CardTitle>
                        {product.brand && <CardDescription className="text-xs text-muted-foreground mb-1">{product.brand}</CardDescription>}
                        <div className="flex justify-between items-center mb-2">
                          <CardDescription className="text-sm text-muted-foreground">{product.category}</CardDescription>
                          {product.nutriScore && (
                            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${getNutriScoreClasses(product.nutriScore)}`}>
                              {product.nutriScore}
                            </span>
                          )}
                        </div>

                        {isGlutenFreeTag && (
                          <div className="flex items-center text-green-600 text-xs mt-1 mb-1">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            <span>Gluten-Free</span>
                          </div>
                        )}
                        {containsGlutenTag && (
                          <div className="flex items-center text-red-600 text-xs mt-1 mb-1">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            <span>Contains Gluten</span>
                          </div>
                        )}
                        {mayContainGlutenTag && !isGlutenFreeTag && !containsGlutenTag && (
                          <div className="flex items-center text-orange-500 text-xs mt-1 mb-1">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            <span>May Contain Traces</span>
                          </div>
                        )}
                        
                        <p className="text-sm mb-3 h-10 overflow-hidden flex-grow">{product.description}</p>
                         <div className="flex flex-wrap gap-1 mb-3">
                          {product.isLactoseFree && <Badge variant="secondary" className="text-xs">Lactose-Free</Badge>}
                          {product.isSugarFree && <Badge variant="secondary" className="text-xs">Sugar-Free</Badge>}
                          {product.isPosno && <Badge variant="secondary" className="text-xs">Posno</Badge>}
                           {product.tags?.filter(tag => !explicitlyHandledTags.includes(tag.toLowerCase())).slice(0,1).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                           ))}
                           {product.tags?.includes('high-protein') && <Badge variant="secondary" className="text-xs">High Protein</Badge>}
                        </div>
                        <Button asChild variant="outline" size="sm" className="w-full mt-auto">
                          <Link href={`/${locale}/products/${product.id}`}>View Details</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border-dashed border-2 rounded-md">
                <PackageOpen className="mx-auto h-16 w-16 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
                <p>Try adjusting your search or filters.</p>
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ScanSearch className="h-5 w-5" /> Analyze Ingredients</CardTitle>
              <CardDescription>Paste ingredients below, or upload an image of the ingredient list for AI analysis.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ocr-file-input" className="text-sm font-medium">Upload Ingredient List Image</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="ocr-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="flex-grow"
                      disabled={!userCanCurrentlyScan || isLoadingOcr || isLoadingDeclaration}
                    />
                    <Button onClick={handleOcrScanAndAnalyze} disabled={!selectedFile || !userCanCurrentlyScan || isLoadingOcr || isLoadingDeclaration} variant="outline">
                      {isLoadingOcr || (isLoadingDeclaration && selectedFile) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                      Scan Image & Analyze
                    </Button>
                  </div>
                   {selectedFile && <p className="text-xs text-muted-foreground mt-1">Selected: {selectedFile.name}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-grow border-t"></div>
                  <span className="text-xs text-muted-foreground">OR</span>
                  <div className="flex-grow border-t"></div>
                </div>
                <form onSubmit={handleDeclarationSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="declaration-text-area" className="text-sm font-medium">Paste Ingredient List</Label>
                    <Textarea
                      id="declaration-text-area"
                      placeholder="e.g., Wheat flour, sugar, salt, yeast, barley malt extract..."
                      value={declarationText}
                      onChange={(e) => {
                        setDeclarationText(e.target.value);
                        setSelectedFile(null); 
                        const fileInput = document.getElementById('ocr-file-input') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                      rows={6}
                      className="resize-none"
                      aria-label="Product Declaration Input"
                      disabled={!userCanCurrentlyScan || isLoadingOcr || isLoadingDeclaration}
                    />
                  </div>
                  {errorDeclaration && (
                    <ShadcnAlert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <ShadcnAlertTitle>Error</ShadcnAlertTitle>
                      <ShadcnAlertDescription>{errorDeclaration}</ShadcnAlertDescription>
                    </ShadcnAlert>
                  )}
                  <Button type="submit" disabled={!userCanCurrentlyScan || isLoadingDeclaration || isLoadingOcr || !declarationText.trim()} className="w-full">
                    {(isLoadingDeclaration && !selectedFile) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Analyze Text with AI
                  </Button>
                </form>
              </div>
            </CardContent>
            
            {(analysisResult || isLoadingDeclaration || isLoadingOcr ) && (
              <CardContent className="mt-6 border-t pt-6">
                <CardTitle className="text-lg mb-2">AI Analysis Report</CardTitle>
                {(isLoadingDeclaration || isLoadingOcr) && (
                  <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p>Analyzing...</p>
                  </div>
                )}
                {analysisResult && !isLoadingDeclaration && !isLoadingOcr && (
                  <>
                    <ShadcnAlert variant={analysisResult.hasGluten ? 'destructive' : 'default'} className={analysisResult.hasGluten ? '' : 'border-green-500'}>
                      {analysisResult.hasGluten ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5 text-green-600" />}
                      <ShadcnAlertTitle className={analysisResult.hasGluten ? '' : 'text-green-700'}>
                        {analysisResult.hasGluten ? 'Potential Gluten Detected' : 'Likely Gluten-Free'}
                      </ShadcnAlertTitle>
                      <ShadcnAlertDescription>Confidence: {Math.round(analysisResult.confidence * 100)}%</ShadcnAlertDescription>
                    </ShadcnAlert>
                    <div className="mt-3">
                      <h4 className="font-semibold mb-1 text-sm">Reasoning:</h4>
                      <p className="text-xs text-muted-foreground p-2 bg-muted rounded-md whitespace-pre-wrap">{analysisResult.reason}</p>
                    </div>
                    {analysisResult.glutenIngredients && analysisResult.glutenIngredients.length > 0 && (
                      <div className="mt-3">
                        <h4 className="font-semibold mb-1 text-sm">Potential Gluten Ingredients:</h4>
                        <ul className="list-disc list-inside text-xs space-y-1">
                          {analysisResult.glutenIngredients.map((ing, index) => (
                            <li key={index} className="text-destructive-foreground bg-destructive/80 px-1.5 py-0.5 rounded-sm">{ing}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                     <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => {
                       setAnalysisResult(null);
                       setDeclarationText('');
                       setSelectedFile(null);
                       const fileInput = document.getElementById('ocr-file-input') as HTMLInputElement;
                       if (fileInput) fileInput.value = '';
                       setErrorDeclaration(null);
                     }}>Clear Analysis & Input</Button>
                  </>
                )}
              </CardContent>
            )}
             {!isLoadingDeclaration && !isLoadingOcr && !analysisResult && !errorDeclaration && (declarationText || selectedFile) && (
                   <div className="text-center text-muted-foreground py-4 border-dashed border-2 rounded-md mt-4 mx-6 mb-6">
                    <Info className="mx-auto h-8 w-8 mb-2 text-primary" />
                    <p className="text-sm">Analysis results will appear here once submitted.</p>
                  </div>
              )}
          </Card>

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
