
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
import { Alert as ShadcnAlert, AlertDescription as ShadcnAlertDescription, AlertTitle as ShadcnAlertTitle } from '@/components/ui/alert'; // Renamed to avoid conflict
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScanLine, QrCode, ScanSearch, AlertCircle, CheckCircle, Info, Loader2, Sparkles, ShoppingBag, PackageOpen, Search, CameraOff, Lightbulb } from 'lucide-react';
import { analyzeDeclaration, type AnalyzeDeclarationOutput } from '@/ai/flows/analyze-declaration';
import { getDailyCeliacTip, type DailyCeliacTipOutput } from '@/ai/flows/daily-celiac-tip-flow';
import { useToast } from '@/hooks/use-toast';

// Placeholder for barcode scan result
interface BarcodeScanResult {
  name: string;
  isGlutenFree: boolean;
  ingredients: string;
  imageUrl: string;
  dataAiHint?: string;
}

// Placeholder product data (from products page)
const placeholderProducts = [
  { id: '1', name: 'Gluten-Free Bread', category: 'Bakery', imageUrl: 'https://placehold.co/300x200.png', description: 'Delicious and soft gluten-free white bread.', dataAiHint: 'bread bakery' },
  { id: '2', name: 'Corn Pasta', category: 'Pasta', imageUrl: 'https://placehold.co/300x200.png', description: 'Authentic Italian corn pasta, naturally gluten-free.', dataAiHint: 'pasta corn' },
  { id: '3', name: 'Rice Cakes', category: 'Snacks', imageUrl: 'https://placehold.co/300x200.png', description: 'Light and crispy rice cakes, perfect for snacking.', dataAiHint: 'rice cakes' },
  { id: '4', name: 'Gluten-Free Oats', category: 'Cereals', imageUrl: 'https://placehold.co/300x200.png', description: 'Certified gluten-free rolled oats for breakfast.', dataAiHint: 'oats cereal' },
  { id: '5', name: 'Almond Flour Mix', category: 'Bakery', imageUrl: 'https://placehold.co/300x200.png', description: 'Versatile almond flour for baking.', dataAiHint: 'almond flour' },
  { id: '6', name: 'Quinoa Salad Mix', category: 'Snacks', imageUrl: 'https://placehold.co/300x200.png', description: 'Ready-to-eat quinoa salad.', dataAiHint: 'quinoa salad' },
];

// Unique categories for the select dropdown
const productCategories = Array.from(new Set(placeholderProducts.map(p => p.category)));


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

  // State for Product Search/Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [displayedProducts, setDisplayedProducts] = useState(placeholderProducts);

  // State for Daily Celiac Tip
  const [dailyTip, setDailyTip] = useState<string | null>(null);
  const [isLoadingTip, setIsLoadingTip] = useState<boolean>(true);
  const [errorTip, setErrorTip] = useState<string | null>(null);

  const { toast } = useToast();

  // Effect to fetch daily celiac tip
  useEffect(() => {
    const fetchTip = async () => {
      setIsLoadingTip(true);
      setErrorTip(null);
      try {
        const tipResult = await getDailyCeliacTip();
        setDailyTip(tipResult.tip);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error.';
        console.error('Failed to fetch daily tip:', errorMessage);
        setErrorTip('Could not load daily tip. Please try refreshing.');
        // Do not toast error for tip, it's non-critical
      } finally {
        setIsLoadingTip(false);
      }
    };
    fetchTip();
  }, []);

  // Effect for product filtering
  useEffect(() => {
    let filtered = placeholderProducts;
    if (searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    setDisplayedProducts(filtered);
  }, [searchTerm, selectedCategory]);
  
  // Effect for camera handling (barcode scanning)
  useEffect(() => {
    if (isScanning) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          // Simulate scan
          setTimeout(() => {
            setBarcodeScanResult({ 
              name: "Simulated Scanned Product", 
              isGlutenFree: Math.random() > 0.5, 
              ingredients: "Simulated ingredients from barcode scan.", 
              imageUrl: "https://placehold.co/300x200.png",
              dataAiHint: "scanned product"
            });
            setIsScanning(false); 
            stopCameraStream();
            toast({ title: "Barcode Scan Simulated", description: "Product details loaded."});
          }, 5000);
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
  }, [isScanning, toast]);

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
      toast({ title: "Analysis Complete", description: "Product declaration analyzed." });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error.';
      setErrorDeclaration(`Analysis failed: ${errorMessage}`);
      toast({ variant: "destructive", title: "Analysis Failed", description: errorMessage });
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
            description="Search, scan, or analyze ingredients to find gluten-free products."
            icon={ScanLine}
          />

          {/* Daily Celiac Tip Section */}
          <div className="mb-8 text-center">
            {isLoadingTip && (
              <div className="flex items-center justify-center text-muted-foreground p-4 bg-muted/50 rounded-lg">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                <span>Loading daily tip...</span>
              </div>
            )}
            {errorTip && !isLoadingTip && (
              <div className="flex items-center justify-center text-destructive p-4 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{errorTip}</span>
              </div>
            )}
            {dailyTip && !isLoadingTip && !errorTip && (
              <Card className="bg-secondary/50 border-secondary shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center">
                    <Lightbulb className="h-6 w-6 mr-3 text-primary flex-shrink-0" />
                    <p className="text-sm text-secondary-foreground">{dailyTip}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Product Search & Filters Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Find Products</CardTitle>
                <CardDescription>Search by name or filter by category to find gluten-free items.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="product-search" className="text-sm font-medium">Search by name</Label>
                  <Input 
                    id="product-search" 
                    placeholder="e.g., Gluten-Free Bread" 
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

            {/* Barcode Scanning Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" /> Scan Product Barcode</CardTitle>
                <CardDescription>Use your device's camera for instant gluten information.</CardDescription>
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
                        {barcodeScanResult.isGlutenFree ? (
                          <div className="flex items-center text-green-600 mt-1"><CheckCircle className="h-5 w-5 mr-1" /><span>Likely Gluten-Free</span></div>
                        ) : (
                          <div className="flex items-center text-red-600 mt-1"><AlertCircle className="h-5 w-5 mr-1" /><span>May Contain Gluten</span></div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-semibold mb-1 text-sm">Ingredients:</h4>
                      <p className="text-xs text-muted-foreground">{barcodeScanResult.ingredients}</p>
                      <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => { setBarcodeScanResult(null); setErrorBarcode(null);}}>Scan Another</Button>
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

          {/* Product Listing Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary" /> Products
            </h2>
            {displayedProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedProducts.map(product => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-200">
                    <CardHeader className="p-0">
                      <Image src={product.imageUrl} alt={product.name} width={400} height={200} className="w-full h-48 object-cover" data-ai-hint={product.dataAiHint}/>
                    </CardHeader>
                    <CardContent className="p-4">
                      <CardTitle className="text-lg mb-1">{product.name}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground mb-2">{product.category}</CardDescription>
                      <p className="text-sm mb-3 h-10 overflow-hidden">{product.description}</p>
                      <Button variant="outline" size="sm" className="w-full">View Details</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border-dashed border-2 rounded-md">
                <PackageOpen className="mx-auto h-16 w-16 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
                <p>Try adjusting your search or filters.</p>
              </div>
            )}
          </div>

          {/* Declaration Analysis Section (Fallback) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ScanSearch className="h-5 w-5" /> Analyze Ingredients Manually</CardTitle>
              <CardDescription>If you can't scan or find a product, paste its ingredient list below for AI analysis.</CardDescription>
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
                    <ShadcnAlertTitle>Error</ShadcnAlertTitle>
                    <ShadcnAlertDescription>{errorDeclaration}</ShadcnAlertDescription>
                  </ShadcnAlert>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoadingDeclaration} className="w-full">
                  {isLoadingDeclaration ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : (<Sparkles className="mr-2 h-4 w-4" />)}
                  Analyze with AI
                </Button>
              </CardFooter>
            </form>
            {(analysisResult || isLoadingDeclaration) && (
              <CardContent className="mt-6 border-t pt-6">
                <CardTitle className="text-lg mb-2">AI Analysis Report</CardTitle>
                {isLoadingDeclaration && (
                  <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p>Analyzing...</p>
                  </div>
                )}
                {analysisResult && !isLoadingDeclaration && (
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
                      <p className="text-xs text-muted-foreground p-2 bg-muted rounded-md">{analysisResult.reason}</p>
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
                     <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setAnalysisResult(null)}>Clear Analysis</Button>
                  </>
                )}
              </CardContent>
            )}
             {!isLoadingDeclaration && !analysisResult && !errorDeclaration && declarationText && (
                   <div className="text-center text-muted-foreground py-4 border-dashed border-2 rounded-md mt-4">
                    <Info className="mx-auto h-8 w-8 mb-2 text-primary" />
                    <p className="text-sm">Analysis results for ingredients will appear here once submitted.</p>
                  </div>
              )}
          </Card>
        </main>
      </SidebarInset>
    </div>
  );
}
