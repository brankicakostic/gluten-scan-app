
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
import { AlertDialog, AlertDialogTrigger, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert as ShadcnAlert, AlertDescription as ShadcnAlertDescription, AlertTitle as ShadcnAlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScanLine, QrCode, ScanSearch, AlertCircle, CheckCircle, Info, Loader2, Sparkles, ShoppingBag, PackageOpen, Search, Camera, CameraOff, Lightbulb, BookOpen, AlertTriangle, UploadCloud, Star, RotateCcw, ShieldAlert, Barcode as BarcodeIcon, X, FileText, Send, Mail, XCircle } from 'lucide-react';
import { analyzeDeclaration, type AnalyzeDeclarationOutput, type IngredientAssessment } from '@/ai/flows/analyze-declaration';
import { getDailyCeliacTip, type DailyCeliacTipOutput } from '@/ai/flows/daily-celiac-tip-flow';
import { ocrDeclaration, type OcrDeclarationOutput } from '@/ai/flows/ocr-declaration-flow';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useScanLimiter } from '@/contexts/scan-limiter-context'; 
import { countRelevantGlutenIssues } from '@/lib/analysis-utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { placeholderProducts as allProducts, type Product } from '@/lib/products'; 

interface BarcodeScanResult {
  name: string;
  barcode?: string; // Added barcode field
  tags?: string[]; 
  ingredientsText?: string;
  imageUrl: string;
  dataAiHint?: string;
}

const productCategories = Array.from(new Set(allProducts.map(p => p.category)));

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

  // State to track client-side mounting to prevent hydration errors
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const [declarationText, setDeclarationText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalyzeDeclarationOutput | null>(null);
  const [isLoadingDeclaration, setIsLoadingDeclaration] = useState<boolean>(false);
  const [errorDeclaration, setErrorDeclaration] = useState<string | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoadingOcr, setIsLoadingOcr] = useState<boolean>(false); 
  const [stagedImage, setStagedImage] = useState<string | null>(null);
  
  const [barcodeScanResult, setBarcodeScanResult] = useState<BarcodeScanResult | null>(null);
  const [isScanningBarcode, setIsScanningBarcode] = useState<boolean>(false);
  const barcodeVideoRef = useRef<HTMLVideoElement>(null);
  const [hasBarcodeCameraPermission, setHasBarcodeCameraPermission] = useState<boolean | null>(null);
  const [errorBarcode, setErrorBarcode] = useState<string | null>(null);

  const [isTakingOcrPhoto, setIsTakingOcrPhoto] = useState<boolean>(false);
  const ocrVideoRef = useRef<HTMLVideoElement>(null);
  const [hasOcrCameraPermission, setHasOcrCameraPermission] = useState<boolean | null>(null);

  const [showLabelingQuestionModal, setShowLabelingQuestionModal] = useState<boolean>(false);
  const [ocrTextForAnalysis, setOcrTextForAnalysis] = useState<string>('');
  const [manualTextForAnalysis, setManualTextForAnalysis] = useState<string>('');
  const [selectedLabelingOption, setSelectedLabelingOption] = useState<string>('');


  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>(allProducts.slice(0, 8)); 

  const [dailyTip, setDailyTip] = useState<DailyCeliacTipOutput | null>(null);
  const [isLoadingTip, setIsLoadingTip] = useState<boolean>(true);
  const [errorTip, setErrorTip] = useState<string | null>(null);
  const [showTipDetailsModal, setShowTipDetailsModal] = useState<boolean>(false);
  const [showScanLimitModal, setShowScanLimitModal] = useState<boolean>(false);

  const analysisReportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (analysisResult && analysisReportRef.current) {
      analysisReportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [analysisResult]);

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
    const stopStream = (stream: MediaStream | null) => {
      stream?.getTracks().forEach(track => track.stop());
    };

    let currentStream: MediaStream | null = null;

    if (isScanningBarcode) {
      if (!canScan()) {
        setShowScanLimitModal(true);
        setIsScanningBarcode(false);
        return;
      }
      const getCamera = async () => {
        try {
          currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          setHasBarcodeCameraPermission(true);
          if (barcodeVideoRef.current) {
            barcodeVideoRef.current.srcObject = currentStream;
          }
          // Improved simulation: try to "find" a product with a barcode
          setTimeout(() => {
            const productsWithBarcode = allProducts.filter(p => p.barcode && p.barcode.trim() !== '');
            let foundProduct: Product | null = null;

            if (productsWithBarcode.length > 0) {
              // Simulate 80% chance of finding a product if one exists with a barcode
              if (Math.random() < 0.8) { 
                foundProduct = productsWithBarcode[Math.floor(Math.random() * productsWithBarcode.length)];
              }
            }

            if (foundProduct) {
                 setBarcodeScanResult({ 
                    name: foundProduct.name, 
                    barcode: foundProduct.barcode,
                    tags: foundProduct.tags,
                    ingredientsText: foundProduct.ingredientsText || "Ingredients not available.", 
                    imageUrl: foundProduct.imageUrl,
                    dataAiHint: foundProduct.dataAiHint || "scanned product"
                  });
            } else {
                 setBarcodeScanResult({ 
                    name: "Unknown Product Scanned", 
                    barcode: "N/A",
                    tags: ['unknown-barcode'],
                    ingredientsText: "No product information found for this barcode. Try analyzing the declaration.", 
                    imageUrl: "https://placehold.co/300x200.png",
                    dataAiHint: "unknown product"
                  });
            }
            incrementScanCount();
            setIsScanningBarcode(false); 
            toast({ title: "Barcode Scan Simulated", description: foundProduct ? "Product details loaded." : "Barcode not found in database."});
          }, 3000);
        } catch (error) {
          console.error('Error accessing barcode camera:', error);
          setHasBarcodeCameraPermission(false);
          setErrorBarcode('Camera access denied. Please enable permissions.');
          toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Enable camera permissions for barcode scanning.'});
          setIsScanningBarcode(false);
        }
      };
      getCamera();
    } else {
      if (barcodeVideoRef.current?.srcObject) {
        stopStream(barcodeVideoRef.current.srcObject as MediaStream);
        barcodeVideoRef.current.srcObject = null;
      }
    }
    return () => {
      stopStream(currentStream);
      if (barcodeVideoRef.current?.srcObject) { 
          stopStream(barcodeVideoRef.current.srcObject as MediaStream);
          barcodeVideoRef.current.srcObject = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanningBarcode]); 

  useEffect(() => {
    const stopStream = (stream: MediaStream | null) => {
        stream?.getTracks().forEach(track => track.stop());
    };
    let currentStream: MediaStream | null = null;

    if (isTakingOcrPhoto) {
        const getCamera = async () => {
            try {
                currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                setHasOcrCameraPermission(true);
                if (ocrVideoRef.current) {
                    ocrVideoRef.current.srcObject = currentStream;
                }
            } catch (error) {
                console.error('Error accessing OCR camera:', error);
                setHasOcrCameraPermission(false);
                setErrorDeclaration('OCR Camera access denied. Please enable permissions.');
                toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Enable camera permissions for OCR.' });
                setIsTakingOcrPhoto(false);
            }
        };
        getCamera();
    } else {
        if (ocrVideoRef.current?.srcObject) {
            stopStream(ocrVideoRef.current.srcObject as MediaStream);
            ocrVideoRef.current.srcObject = null;
        }
    }
    return () => {
        stopStream(currentStream);
        if (ocrVideoRef.current?.srcObject) { 
            stopStream(ocrVideoRef.current.srcObject as MediaStream);
            ocrVideoRef.current.srcObject = null;
        }
    };
  }, [isTakingOcrPhoto, toast]);


  const performAiAnalysis = async (textToAnalyze: string, labelingInfo?: string) => {
    if (!textToAnalyze.trim()) {
        setErrorDeclaration('No text to analyze.');
        setIsLoadingDeclaration(false); 
        return;
    }
    setIsLoadingDeclaration(true);
    setErrorDeclaration(null);
    setAnalysisResult(null);
    try {
      const result = await analyzeDeclaration({ 
        declarationText: textToAnalyze,
        labelingInfo: labelingInfo || 'unknown'
      });
      setAnalysisResult(result);
      incrementScanCount(); 
      toast({ title: "AI Analysis Complete", description: "Product declaration analyzed." });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error.';
      setErrorDeclaration('Analysis failed: ' + errorMessage);
      toast({ variant: "destructive", title: "Analysis Failed", description: errorMessage });
    } finally {
      setIsLoadingDeclaration(false);
    }
  };

  const handleDeclarationSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!canScan()) {
      setShowScanLimitModal(true);
      return;
    }
    if (!declarationText.trim()) {
        setErrorDeclaration('Please enter ingredients to analyze.');
        return;
    }
    setManualTextForAnalysis(declarationText);
    resetAnalysisInputs(true); // Reset OCR states
    setSelectedLabelingOption('');
    setShowLabelingQuestionModal(true);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setStagedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      setErrorDeclaration(null);
      setAnalysisResult(null);
      setIsTakingOcrPhoto(false); 
      setDeclarationText(''); // Reset text area if file is chosen
    }
  };
  
  const processOcrData = async (imageDataUri: string) => {
    setIsLoadingOcr(true);
    setErrorDeclaration(null);
    setAnalysisResult(null); 
    setManualTextForAnalysis('');
    try {
      const ocrResult: OcrDeclarationOutput = await ocrDeclaration({ imageDataUri });
      if (ocrResult.extractedText.trim()) {
        setOcrTextForAnalysis(ocrResult.extractedText);
        setSelectedLabelingOption('');
        setShowLabelingQuestionModal(true);
        toast({ title: "OCR Scan Complete", description: "Please provide labeling information below." });
      } else {
        setErrorDeclaration('OCR did not find any text to analyze.');
        toast({ variant: "destructive", title: "OCR Empty", description: "No text found in image."});
        resetAnalysisInputs();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error.';
      setErrorDeclaration('OCR processing failed: ' + errorMessage);
      toast({ variant: "destructive", title: "OCR Failed", description: errorMessage });
      resetAnalysisInputs();
    } finally {
      setIsLoadingOcr(false); 
    }
  };
  
  const handleAnalyzeStagedImage = async () => {
    if (!canScan()) {
      setShowScanLimitModal(true);
      return;
    }
    if (!stagedImage) {
      setErrorDeclaration('Please select or capture an image first.');
      return;
    }
    await processOcrData(stagedImage);
  };

  const handleLabelingChoiceSubmit = async () => {
    const textToAnalyze = manualTextForAnalysis || ocrTextForAnalysis;
    if (!textToAnalyze || !selectedLabelingOption) {
      toast({ variant: "destructive", title: "Selection Missing", description: "Please select a labeling option or provide text."});
      return;
    }
    setShowLabelingQuestionModal(false); 
    
    // Set the declaration text to be visible in the results area if it came from OCR
    if (ocrTextForAnalysis) {
        setDeclarationText(ocrTextForAnalysis);
    }

    await performAiAnalysis(textToAnalyze, selectedLabelingOption);
    
    // Clear the specific analysis source text
    setManualTextForAnalysis('');
    setOcrTextForAnalysis('');
    setSelectedLabelingOption('');
    // Keep staged image and selected file so user can see what they analyzed, will be cleared by resetAnalysisInputs
  };
  
  const resetAnalysisInputs = (keepManualText: boolean = false) => {
    if (!keepManualText) {
      setDeclarationText('');
    }
    setAnalysisResult(null);
    setErrorDeclaration(null);
    setSelectedFile(null);
    setStagedImage(null);
    const fileInput = document.getElementById('ocr-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    setIsTakingOcrPhoto(false);
    setOcrTextForAnalysis('');
    setManualTextForAnalysis('');
    setSelectedLabelingOption('');
    setShowLabelingQuestionModal(false); 
  };


  const handleInitiateOcrPhotoCapture = () => {
    if (!canScan()) {
      setShowScanLimitModal(true);
      return;
    }
    resetAnalysisInputs(); 
    setIsTakingOcrPhoto(true);
    setHasOcrCameraPermission(null); 
  };

  const handleCaptureOcrPhoto = async () => {
    if (!ocrVideoRef.current || !hasOcrCameraPermission) {
        setErrorDeclaration("OCR Camera not ready or permission denied.");
        return;
    }
    if (!canScan()) { 
        setShowScanLimitModal(true);
        setIsTakingOcrPhoto(false); 
        return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = ocrVideoRef.current.videoWidth;
    canvas.height = ocrVideoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
        context.drawImage(ocrVideoRef.current, 0, 0, canvas.width, canvas.height);
        const imageDataUri = canvas.toDataURL('image/jpeg'); 
        setStagedImage(imageDataUri);
    } else {
        setErrorDeclaration("Could not capture image from camera.");
    }
    setIsTakingOcrPhoto(false); 
  };

  const handleCancelOcrPhotoCapture = () => {
    setIsTakingOcrPhoto(false);
    setErrorDeclaration(null); 
  };

  const handleStartBarcodeScanning = () => {
    if (!canScan()) {
      setShowScanLimitModal(true);
      return;
    }
    setIsScanningBarcode(true);
    setBarcodeScanResult(null);
    setErrorBarcode(null);
    setHasBarcodeCameraPermission(null);
  };
  
  const handleCancelBarcodeScanning = () => {
    setIsScanningBarcode(false);
  };

  const isLoadingAnyAnalysisProcess = isLoadingOcr || isLoadingDeclaration || showLabelingQuestionModal;
  
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
          <PageHeader 
            title="Welcome to Gluten Detective"
            description="Search, scan, or analyze ingredients to find gluten-free products."
            icon={ScanLine}
          />
          
           <Card className="mb-6 bg-muted/30 border-muted/50">
             <CardContent className="p-3">
               <div className="flex items-center justify-between text-sm min-h-[28px]">
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
                   <div className="h-5 w-56 bg-muted rounded animate-pulse" /> // Skeleton placeholder
                 )}
                 
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
                {!isScanningBarcode && !barcodeScanResult && (
                  <Button 
                    onClick={handleStartBarcodeScanning} 
                    className="w-full" 
                    size="lg" 
                    disabled={!hasMounted || (hasMounted && !canScan()) || isLoadingAnyAnalysisProcess || isTakingOcrPhoto}
                  >
                    <QrCode className="mr-2 h-5 w-5" /> Start Barcode Scanning
                  </Button>
                )}
                {isScanningBarcode && (
                  <div className="space-y-4">
                     <div className="aspect-video bg-muted rounded-md flex flex-col items-center justify-center text-muted-foreground p-4 relative">
                       <video ref={barcodeVideoRef} className="w-full h-full object-cover rounded-md" autoPlay playsInline muted />
                       {hasBarcodeCameraPermission === null && <Loader2 className="absolute h-8 w-8 animate-spin text-primary"/>}
                       {hasBarcodeCameraPermission === false && (
                         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4 rounded-md">
                            <CameraOff className="h-12 w-12 mb-2 text-destructive" />
                            <p className="text-center text-destructive-foreground">Camera access is required. Please enable permissions.</p>
                         </div>
                       )}
                       {hasBarcodeCameraPermission === true && (
                          <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm bg-black/50 text-white px-2 py-1 rounded">Point camera at barcode...</p>
                       )}
                    </div>
                    <Button onClick={handleCancelBarcodeScanning} variant="outline" className="w-full">Cancel Barcode Scan</Button>
                  </div>
                )}
                {errorBarcode && !isScanningBarcode && (
                  <ShadcnAlert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <ShadcnAlertTitle>Barcode Scanning Error</ShadcnAlertTitle>
                    <ShadcnAlertDescription>{errorBarcode}</ShadcnAlertDescription>
                  </ShadcnAlert>
                )}
                {barcodeScanResult && !isScanningBarcode && (
                  <Card className="mt-4">
                    <CardHeader className="flex flex-row items-start gap-4">
                      <Image src={barcodeScanResult.imageUrl} alt={barcodeScanResult.name} width={80} height={80} className="rounded-md object-cover" data-ai-hint={barcodeScanResult.dataAiHint || "product image"}/>
                      <div>
                        <CardTitle className="text-xl">{barcodeScanResult.name}</CardTitle>
                        {barcodeScanResult.tags?.includes('gluten-free') && (
                          <div className="flex items-center text-green-600 dark:text-green-400 mt-1"><CheckCircle className="h-5 w-5 mr-1" /><span>Likely Gluten-Free</span></div>
                        )}
                        {(barcodeScanResult.tags?.includes('contains-gluten') || barcodeScanResult.tags?.includes('contains-wheat') || barcodeScanResult.tags?.includes('contains-barley') || barcodeScanResult.tags?.includes('contains-rye') || (barcodeScanResult.tags?.includes('contains-oats') && !barcodeScanResult.tags?.includes('gluten-free'))) && (
                          <div className="flex items-center text-red-600 dark:text-red-500 mt-1"><AlertTriangle className="h-5 w-5 mr-1" /><span>Contains Gluten</span></div>
                        )}
                        {barcodeScanResult.tags?.includes('may-contain-gluten') && !barcodeScanResult.tags?.includes('gluten-free') && !barcodeScanResult.tags?.includes('contains-gluten') && (
                           <div className="flex items-center text-orange-500 dark:text-orange-400 mt-1"><AlertTriangle className="h-5 w-5 mr-1" /><span>May Contain Traces</span></div>
                        )}
                         {barcodeScanResult.tags?.includes('unknown-barcode') && (
                           <div className="flex items-center text-muted-foreground mt-1"><Info className="h-5 w-5 mr-1" /><span>Barcode Not Found</span></div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {barcodeScanResult.barcode && barcodeScanResult.barcode !== "N/A" && (
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                           <BarcodeIcon className="h-4 w-4 mr-2" />
                           <span>{barcodeScanResult.barcode}</span>
                        </div>
                      )}
                      <h4 className="font-semibold mb-1 text-sm">Ingredients:</h4>
                      <p className="text-xs text-muted-foreground">{barcodeScanResult.ingredientsText || 'Not available'}</p>
                      <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => { setBarcodeScanResult(null); setErrorBarcode(null);}}>Scan Another Barcode</Button>
                    </CardContent>
                  </Card>
                )}
                {!isScanningBarcode && !barcodeScanResult && !errorBarcode && (
                   <div className="text-center text-muted-foreground py-4 border-dashed border-2 rounded-md">
                    <QrCode className="mx-auto h-8 w-8 mb-2" />
                    <p className="text-sm">Barcode scan results will appear here.</p>
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

                        {isGlutenFreeTag ? (
                          <div className="flex items-center text-green-600 dark:text-green-400 text-xs mt-1 mb-1">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            <span>Gluten-Free</span>
                          </div>
                        ) : containsGlutenTag ? (
                          <div className="flex items-center text-red-600 dark:text-red-500 text-xs mt-1 mb-1">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            <span>Contains Gluten</span>
                          </div>
                        ) : mayContainGlutenTag ? (
                          <div className="flex items-center text-orange-500 dark:text-orange-400 text-xs mt-1 mb-1">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            <span>May Contain Traces</span>
                          </div>
                        ) : (
                           <div className="flex items-center text-muted-foreground text-xs mt-1 mb-1">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            <span>Proveriti sastav</span>
                          </div>
                        )}
                        
                        <p className="text-sm mb-3 h-10 overflow-hidden flex-grow">{product.description}</p>
                         <div className="flex flex-wrap gap-1 mb-3">
                          {product.isPosno && <Badge variant="secondary" className="text-xs">Posno</Badge>}
                          {product.isLactoseFree && <Badge variant="secondary" className="text-xs">Lactose-Free</Badge>}
                          {product.isSugarFree && <Badge variant="secondary" className="text-xs">Sugar-Free</Badge>}
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
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ScanSearch className="h-5 w-5" /> Analyze Ingredients from Image</CardTitle>
                <CardDescription>Upload an image of an ingredient list, or take a picture for AI analysis.</CardDescription>
              </CardHeader>
              <CardContent className="min-h-[220px]">
                {isTakingOcrPhoto ? (
                  <div className="space-y-2">
                    <div className="aspect-video bg-muted rounded-md flex flex-col items-center justify-center text-muted-foreground p-1 relative">
                      <video ref={ocrVideoRef} className="w-full h-full object-cover rounded-md" autoPlay playsInline muted />
                      {hasOcrCameraPermission === null && <Loader2 className="absolute h-8 w-8 animate-spin text-primary"/>}
                      {hasOcrCameraPermission === false && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-4 rounded-md">
                          <CameraOff className="h-10 w-10 mb-2 text-destructive" />
                          <p className="text-center text-destructive-foreground text-sm">OCR Camera access is required.</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCaptureOcrPhoto} disabled={!hasOcrCameraPermission || isLoadingOcr} className="flex-grow">
                        {isLoadingOcr ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Camera className="mr-2 h-4 w-4"/>}
                         Capture Photo
                      </Button>
                      <Button onClick={handleCancelOcrPhotoCapture} variant="outline" className="flex-grow">Cancel</Button>
                    </div>
                  </div>
                ) : stagedImage ? (
                   <div className="space-y-2 text-center">
                    <div className="relative w-full max-w-sm mx-auto aspect-video rounded-md overflow-hidden border">
                       <Image src={stagedImage} alt="Staged image for analysis" layout="fill" objectFit="contain" />
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={() => resetAnalysisInputs()}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Clear Image</span>
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Image ready for analysis.</p>
                   </div>
                ) : (
                  <div className="space-y-4 text-center">
                    <Label htmlFor="ocr-file-input" className="group cursor-pointer w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center hover:border-primary hover:bg-muted/50 transition-colors">
                      <UploadCloud className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                      <span className="mt-2 text-sm font-semibold">Choose File</span>
                      <Input id="ocr-file-input" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" disabled={isLoadingAnyAnalysisProcess}/>
                    </Label>
                     <div className="flex items-center gap-2">
                        <div className="flex-grow border-t"></div>
                        <span className="text-xs text-muted-foreground">OR</span>
                        <div className="flex-grow border-t"></div>
                     </div>
                     <Button variant="outline" className="w-full" onClick={handleInitiateOcrPhotoCapture} disabled={isLoadingAnyAnalysisProcess}>
                        <Camera className="mr-2 h-4 w-4" />
                        Take Picture
                     </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                 <Button onClick={handleAnalyzeStagedImage} size="lg" disabled={!stagedImage || isLoadingAnyAnalysisProcess || !hasMounted || (hasMounted && !canScan())} className="w-full">
                    {isLoadingOcr ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Analyze with AI
                 </Button>
              </CardFooter>
            </Card>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                   <div className="flex items-center gap-2">
                     <FileText className="h-5 w-5"/> Or Paste Text Manually
                   </div>
                </AccordionTrigger>
                <AccordionContent>
                  <form onSubmit={handleDeclarationSubmit} className="space-y-4 pt-2">
                      <Textarea
                        id="declaration-text-area"
                        placeholder="e.g., Wheat flour, sugar, salt, yeast, barley malt extract..."
                        value={declarationText}
                        onChange={(e) => {
                           setDeclarationText(e.target.value);
                           if(e.target.value) { resetAnalysisInputs(true); }
                        }}
                        rows={6}
                        className="resize-none"
                        aria-label="Product Declaration Input"
                        disabled={!hasMounted || (hasMounted && !canScan()) || isLoadingAnyAnalysisProcess}
                      />
                    <Button type="submit" 
                      size="lg"
                      disabled={!hasMounted || (hasMounted && !canScan()) || isLoadingDeclaration || !declarationText.trim() || isLoadingAnyAnalysisProcess} 
                      className="w-full"
                    >
                      {isLoadingDeclaration && !isLoadingOcr ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Analyze Text with AI
                    </Button>
                  </form>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div
              ref={analysisReportRef}
              aria-live="polite" 
              aria-busy={isLoadingAnyAnalysisProcess}
              className="mt-6"
            >
              {(analysisResult || isLoadingDeclaration || (isLoadingOcr && !isTakingOcrPhoto)) && !showLabelingQuestionModal && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg mb-2">AI Analysis Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(isLoadingDeclaration || (isLoadingOcr && !isTakingOcrPhoto)) && (
                      <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <p>{isLoadingOcr ? 'Processing Image...' : 'Analyzing Ingredients...'}</p>
                      </div>
                    )}
                    {analysisResult && !isLoadingDeclaration && !isLoadingOcr && (
                      <div className="space-y-4">
                        {getAssessmentAlert(analysisResult)}

                         {relevantGlutenIssueCount > 0 && (
                            <div className="mt-3 p-2 bg-destructive/10 rounded-md text-sm text-destructive flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5"/>
                                <span>Identifikovano {relevantGlutenIssueCount} kritičnih stavki vezanih za gluten.</span>
                            </div>
                         )}

                        <div>
                          <h4 className="font-semibold mb-1 text-sm">Obrazloženje:</h4>
                          <p className="text-xs text-muted-foreground p-2 bg-muted rounded-md whitespace-pre-wrap">{analysisResult.finalnoObrazlozenje}</p>
                        </div>
                        
                        {problematicIngredients.length > 0 && (
                          <div>
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
                          <Button variant="outline" className="w-full" onClick={() => resetAnalysisInputs()}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Clear & Start Over
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
                                  <Label htmlFor="inquiry-comment-main">Komentar (opciono)</Label>
                                  <Textarea id="inquiry-comment-main" placeholder="Npr. da li ovaj proizvod sadrži gluten od..." />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="inquiry-email-main">Email za odgovor (opciono)</Label>
                                  <Input id="inquiry-email-main" type="email" placeholder="vas.email@primer.com" />
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
                        <p className="text-xs text-muted-foreground mt-4 text-center">
                          <Info className="inline h-3 w-3 mr-1" />
                          Ova analiza je informativna i ne zamenjuje zvaničnu potvrdu proizvođača. Ako imate sumnje, pošaljite upit direktno preko aplikacije.
                        </p>
                      </div>
                    )}
                   </CardContent>
                </Card>
              )}
               {errorDeclaration && !showLabelingQuestionModal && (
                  <ShadcnAlert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <ShadcnAlertTitle>Error</ShadcnAlertTitle>
                    <ShadcnAlertDescription>{errorDeclaration}</ShadcnAlertDescription>
                  </ShadcnAlert>
                )}
            </div>
          </div>
          

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

          <AlertDialog open={showLabelingQuestionModal} onOpenChange={(open) => {
            if (!open) { resetAnalysisInputs(); } // Reset everything if modal is closed without action
            setShowLabelingQuestionModal(open);
          }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Product Labeling Information</AlertDialogTitle>
                <AlertDialogDescription>
                  Please indicate if you see any of these gluten-free labels on the product packaging.
                  This helps improve the analysis accuracy. <br />
                  (Example AOECS: A crossed grain symbol, often with a license number and country code.)
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-3 py-2">
                <RadioGroup value={selectedLabelingOption} onValueChange={setSelectedLabelingOption} className="gap-3">
                  <div className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="aoecs" id="label-aoecs" />
                    <Label htmlFor="label-aoecs" className="cursor-pointer flex-1">AOECS Certificate (e.g., Crossed Grain symbol)</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="gf_text" id="label-gf_text" />
                    <Label htmlFor="label-gf_text" className="cursor-pointer flex-1">"Gluten-Free" Text/Icon (not an official certificate)</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="none" id="label-none" />
                    <Label htmlFor="label-none" className="cursor-pointer flex-1">No Gluten-Free Label Present</Label>
                  </div>
                </RadioGroup>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel Scan</AlertDialogCancel>
                <AlertDialogAction onClick={handleLabelingChoiceSubmit} disabled={!selectedLabelingOption || isLoadingDeclaration}>
                  {isLoadingDeclaration ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Continue to AI Analysis
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </main>
      </SidebarInset>
    </div>
  );
}
