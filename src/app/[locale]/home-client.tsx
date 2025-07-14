

'use client';

import { useState, type FormEvent, useRef, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link'; 
import { useParams } from 'next/navigation'; 
import { useForm } from 'react-hook-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert as ShadcnAlert, AlertDescription as ShadcnAlertDescription, AlertTitle as ShadcnAlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScanLine, QrCode, ScanSearch, AlertCircle, CheckCircle, Info, Loader2, Sparkles, ShoppingBag, PackageOpen, Search, Camera, CameraOff, Lightbulb, BookOpen, AlertTriangle, UploadCloud, Star, RotateCcw, ShieldAlert, Barcode as BarcodeIcon, X, FileText, Flag, XCircle, Send, PackagePlus, LayoutGrid, Wheat, Sandwich, UtensilsCrossed, Cookie, Popcorn, Soup, Container, CookingPot, CupSoda, Package, Box, Droplet, type LucideIcon, Layers, Utensils, Dumbbell, Sprout } from 'lucide-react';
import { analyzeDeclaration, type AnalyzeDeclarationOutput, type IngredientAssessment } from '@/ai/flows/analyze-declaration';
import type { DailyCeliacTipOutput } from '@/ai/flows/daily-celiac-tip-flow';
import { ocrDeclaration, type OcrDeclarationOutput } from '@/ai/flows/ocr-declaration-flow';
import { extractProductInfo, type ExtractProductInfoOutput } from '@/ai/flows/extract-product-info-flow';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { countRelevantGlutenIssues } from '@/lib/analysis-utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Product } from '@/lib/products'; 
import { AlertDialog, AlertDialogTrigger, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { getProductByBarcodeAction } from '@/app/actions/product-actions';
import { addReportAction } from '@/app/actions/report-actions';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';


interface BarcodeScanResult {
  name: string;
  barcode?: string;
  tags?: string[]; 
  ingredientsText?: string;
  imageUrl: string;
  dataAiHint?: string;
}

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

interface CategoryInfo {
  name: string;
  count: number;
}
interface HomeClientProps {
  initialTip: DailyCeliacTipOutput;
  categories: CategoryInfo[];
  featuredProducts: Product[];
}

const categoryIconMap: Record<string, LucideIcon> = {
  "Brašno i smeše": Wheat,
  "Hleb i peciva": Sandwich,
  "Testenine": Utensils,
  "Keks i slatkiši": Cookie,
  "Grickalice": Package,
  "Pahuljice": Layers,
  "Kremovi i namazi": Container,
  "Proteinski proizvodi": Dumbbell,
  "Drevna zrna": Sprout,
  "Palenta i pire": UtensilsCrossed,
  "Med": Droplet,
  "Začini": CookingPot,
  "Pića": CupSoda,
  "Sosovi i prelivi": CookingPot,
  "Nekategorizovano": Box,
};

const getCategoryIcon = (categoryName: string): LucideIcon => {
  return categoryIconMap[categoryName] || Box;
};


export default function HomeClient({ initialTip, categories, featuredProducts }: HomeClientProps) {
  const routeParams = useParams(); 
  const locale = routeParams.locale as string;
  const { toast } = useToast();

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Main declaration analysis state
  const [declarationText, setDeclarationText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalyzeDeclarationOutput | null>(null);
  const [isLoadingDeclaration, setIsLoadingDeclaration] = useState<boolean>(false);
  const [errorDeclaration, setErrorDeclaration] = useState<string | null>(null);
  
  // OCR image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoadingOcr, setIsLoadingOcr] = useState<boolean>(false); 
  const [stagedImage, setStagedImage] = useState<string | null>(null);
  
  // Barcode scanning state
  const [barcodeScanResult, setBarcodeScanResult] = useState<BarcodeScanResult | null>(null);
  const [isScanningBarcode, setIsScanningBarcode] = useState<boolean>(false);
  const html5QrcodeScannerRef = useRef<Html5Qrcode | null>(null);
  const barcodeReaderElementId = "barcode-reader";
  const [hasBarcodeCameraPermission, setHasBarcodeCameraPermission] = useState<boolean | null>(null);
  const [errorBarcode, setErrorBarcode] = useState<string | null>(null);

  // Main OCR camera state
  const [isTakingOcrPhoto, setIsTakingOcrPhoto] = useState<boolean>(false);
  const ocrVideoRef = useRef<HTMLVideoElement>(null);
  const [hasOcrCameraPermission, setHasOcrCameraPermission] = useState<boolean | null>(null);

  // Labeling info modal state
  const [showLabelingQuestionModal, setShowLabelingQuestionModal] = useState<boolean>(false);
  const [ocrTextForAnalysis, setOcrTextForAnalysis] = useState<string>('');
  const [manualTextForAnalysis, setManualTextForAnalysis] = useState<string>('');
  const [selectedLabelingOption, setSelectedLabelingOption] = useState<string>('');

  // Daily tip state
  const [dailyTip, setDailyTip] = useState<DailyCeliacTipOutput | null>(initialTip);
  const [isLoadingTip, setIsLoadingTip] = useState<boolean>(!initialTip);
  const [showTipDetailsModal, setShowTipDetailsModal] = useState<boolean>(false);

  // Report error form state (for text analysis)
  const [showReportErrorModal, setShowReportErrorModal] = useState(false);
  const [reportComment, setReportComment] = useState('');
  const [wantsContact, setWantsContact] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [reportPriority, setReportPriority] = useState('');
  const [errorType, setErrorType] = useState('');
  const [reportSubmissionStatus, setReportSubmissionStatus] = useState('idle');

  // New product flow state (for not found barcodes)
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);

  const analysisReportRef = useRef<HTMLDivElement>(null);
  const analysisSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (analysisResult && analysisReportRef.current) {
      analysisReportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [analysisResult]);
  
  useEffect(() => {
    const startScanner = async () => {
      if (!isScanningBarcode || !document.getElementById(barcodeReaderElementId)) {
        return;
      }
      
      setHasBarcodeCameraPermission(null); // Set to loading state

      const scanner = new Html5Qrcode(barcodeReaderElementId, /* verbose= */ false);
      html5QrcodeScannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          async (decodedText, decodedResult) => {
            // Success callback
            if (html5QrcodeScannerRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
                html5QrcodeScannerRef.current.stop();
            }
            setIsScanningBarcode(false);
            setHasBarcodeCameraPermission(true);

            // Validate the scanned code
            const isValidBarcode = (code: string) => {
                const isNumeric = /^\d+$/.test(code);
                const validLengths = [8, 12, 13, 14]; // EAN-8, UPC-A, EAN-13, GTIN-14
                return isNumeric && validLengths.includes(code.length);
            };

            if (!isValidBarcode(decodedText)) {
                setErrorBarcode(`Skenirani kod "${decodedText}" nije validan barkod. Pokušajte ponovo.`);
                toast({
                    variant: 'destructive',
                    title: 'Nevalidan Kod',
                    description: 'Molimo skenirajte validan barkod proizvoda (EAN-8, EAN-13, UPC).',
                });
                return; // Stop further processing
            }

            // Process the barcode using the Server Action
            const foundProduct = await getProductByBarcodeAction(decodedText);
            
            if (foundProduct) {
              setBarcodeScanResult({ 
                name: foundProduct.name, 
                barcode: foundProduct.barcode,
                tags: foundProduct.tags,
                ingredientsText: foundProduct.ingredientsText || "Sastojci nisu dostupni.", 
                imageUrl: foundProduct.imageUrl,
                dataAiHint: foundProduct.dataAiHint || "scanned product"
              });
              toast({ title: "Proizvod pronađen!", description: `Učitani su detalji za ${foundProduct.name}.` });
            } else {
              setNotFoundBarcode(decodedText);
              toast({ title: "Barkod skeniran", description: "Ovaj proizvod još uvek nije u našoj bazi. Pomozite nam da ga dodamo!" });
            }
          },
          (errorMessage) => {
            // Error callback (called continuously until a QR code is found)
            // We can ignore most of these, but it's here if we need it.
          }
        );
        setHasBarcodeCameraPermission(true);
      } catch (err) {
        console.error("html5-qrcode start error", err);
        setHasBarcodeCameraPermission(false);
        setErrorBarcode("Nije moguće pokrenuti kameru. Proverite dozvole.");
        toast({ variant: 'destructive', title: 'Greška sa kamerom', description: 'Nije moguće pokrenuti kameru. Proverite dozvole.'});
        setIsScanningBarcode(false);
      }
    };

    if (isScanningBarcode) {
      startScanner();
    }

    return () => {
      if (html5QrcodeScannerRef.current && html5QrcodeScannerRef.current.isScanning) {
        html5QrcodeScannerRef.current.stop().catch(err => {
          console.error("Failed to stop html5-qrcode scanner", err);
        });
      }
    };
  }, [isScanningBarcode, toast]);

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
                setErrorDeclaration('Pristup OCR kameri je odbijen. Molimo omogućite dozvole.');
                toast({ variant: 'destructive', title: 'Pristup kameri odbijen', description: 'Omogućite dozvole za kameru za OCR.' });
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
        setErrorDeclaration('Nema teksta za analizu.');
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
      toast({ title: "AI analiza završena", description: "Deklaracija proizvoda je analizirana." });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nepoznata greška.';
      setErrorDeclaration('Analiza neuspešna: ' + errorMessage);
      toast({ variant: "destructive", title: "Analiza neuspešna", description: errorMessage });
    } finally {
      setIsLoadingDeclaration(false);
    }
  };

  const handleDeclarationSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!declarationText.trim()) {
        setErrorDeclaration('Molimo unesite sastojke za analizu.');
        return;
    }
    setManualTextForAnalysis(declarationText);
    resetAnalysisInputs(true);
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
      setDeclarationText('');
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
        toast({ title: "OCR skeniranje završeno", description: "Molimo unesite informacije o oznakama ispod." });
      } else {
        setErrorDeclaration('OCR nije pronašao tekst za analizu.');
        toast({ variant: "destructive", title: "OCR Prazan", description: "Nije pronađen tekst na slici."});
        resetAnalysisInputs();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nepoznata greška.';
      setErrorDeclaration('OCR obrada neuspešna: ' + errorMessage);
      toast({ variant: "destructive", title: "OCR Neuspešan", description: errorMessage });
      resetAnalysisInputs();
    } finally {
      setIsLoadingOcr(false); 
    }
  };
  
  const handleAnalyzeStagedImage = async () => {
    if (!stagedImage) {
      setErrorDeclaration('Molimo prvo izaberite ili snimite sliku.');
      return;
    }
    await processOcrData(stagedImage);
  };

  const handleLabelingChoiceSubmit = async () => {
    const textToAnalyze = manualTextForAnalysis || ocrTextForAnalysis;
    if (!textToAnalyze || !selectedLabelingOption) {
      toast({ variant: "destructive", title: "Nedostaje odabir", description: "Molimo odaberite opciju označavanja ili unesite tekst."});
      return;
    }
    setShowLabelingQuestionModal(false); 
    
    if (ocrTextForAnalysis) {
        setDeclarationText(ocrTextForAnalysis);
    }

    await performAiAnalysis(textToAnalyze, selectedLabelingOption);
    
    setManualTextForAnalysis('');
    setOcrTextForAnalysis('');
    setSelectedLabelingOption('');
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
    resetAnalysisInputs(); 
    setIsTakingOcrPhoto(true);
    setHasOcrCameraPermission(null); 
  };

  const handleCaptureOcrPhoto = async () => {
    if (!ocrVideoRef.current || !hasOcrCameraPermission) {
        setErrorDeclaration("OCR kamera nije spremna ili je pristup odbijen.");
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
        setErrorDeclaration("Nije moguće snimiti sliku sa kamere.");
    }
    setIsTakingOcrPhoto(false); 
  };

  const handleCancelOcrPhotoCapture = () => {
    setIsTakingOcrPhoto(false);
    setErrorDeclaration(null); 
  };

  const handleStartBarcodeScanning = () => {
    setIsScanningBarcode(true);
    setBarcodeScanResult(null);
    setErrorBarcode(null);
    setNotFoundBarcode(null);
    setHasBarcodeCameraPermission(null);
  };
  
  const handleCancelBarcodeScanning = () => {
    setIsScanningBarcode(false);
  };

  const handleReportSubmit = async () => {
    setReportSubmissionStatus('submitting');
    
    const reportData = {
        type: 'error' as const,
        comment: reportComment,
        wantsContact: wantsContact,
        contactEmail: wantsContact ? contactEmail : '',
        priority: reportPriority as 'niska' | 'srednja' | 'visoka',
        errorType: errorType as 'sastav' | 'drugo',
        productContext: declarationText || ocrTextForAnalysis,
    };
    
    const result = await addReportAction(reportData);

    if (result.success) {
        setReportSubmissionStatus('success');
    } else {
        setReportSubmissionStatus('idle');
        toast({ variant: 'destructive', title: 'Greška pri slanju', description: result.error });
    }
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
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <PageHeader 
          title="Dobrodošli u Gluten Scan"
          description="Pretražite, skenirajte ili analizirajte sastojke da biste pronašli proizvode bez glutena."
          icon={ScanLine}
        />
        
        <div className="mb-8">
          {isLoadingTip && (
            <div className="flex items-center justify-center text-muted-foreground p-4 bg-muted/50 rounded-lg shadow-sm h-16">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              <span>Učitavanje dnevnog saveta...</span>
            </div>
          )}
          {dailyTip && !isLoadingTip && (
            <div className="relative rounded-lg border border-primary/20 bg-secondary/30 p-3 pl-4 border-l-4">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 flex-shrink-0 text-primary mt-1 sm:mt-0" />
                  <p className="text-sm text-muted-foreground">
                      <Badge variant="secondary" className="mr-2">Savet Dana</Badge>
                      {dailyTip.summary}
                  </p>
                </div>
                <AlertDialog open={showTipDetailsModal} onOpenChange={setShowTipDetailsModal}>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-background/70 hover:bg-background flex-shrink-0">
                            <BookOpen className="mr-2 h-4 w-4" /> Pročitaj više
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-primary" /> Dnevni savet o celijakiji
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-left pt-2">
                          <strong>{dailyTip.summary}</strong>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="text-sm text-muted-foreground max-h-[60vh] overflow-y-auto pr-2">
                        <p>{dailyTip.details}</p>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogAction>U redu!</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
            <Card className="flex flex-col text-center items-center justify-between p-6 hover:shadow-lg transition-shadow">
                <div className="flex-grow flex flex-col items-center text-center">
                    <div className="flex justify-center items-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
                        <ShoppingBag className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl mb-1">Pretraži proizvode</CardTitle>
                    <CardDescription>Pronađite bezbedne proizvode u našoj bazi.</CardDescription>
                </div>
                <Button asChild className="w-full mt-4 hover:scale-[.98] transition-transform duration-200">
                    <Link href={`/${locale}/products`}>
                        <Search className="mr-2 h-4 w-4" />
                        Pretraži bazu
                    </Link>
                </Button>
            </Card>

            <Card className="flex flex-col text-center items-center justify-between p-6 hover:shadow-lg transition-shadow">
                 <div className="flex-grow flex flex-col items-center text-center">
                    <div className="flex justify-center items-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
                        <QrCode className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl mb-1">Skeniraj barkod</CardTitle>
                    <CardDescription>Proverite proizvod koristeći kameru telefona.</CardDescription>
                </div>
                <Button onClick={handleStartBarcodeScanning} disabled={isLoadingAnyAnalysisProcess || isTakingOcrPhoto} className="w-full mt-4 hover:scale-[.98] transition-transform duration-200">
                    <QrCode className="mr-2 h-4 w-4" />
                    Pokreni skener
                </Button>
            </Card>

            <Card className="flex flex-col text-center items-center justify-between p-6 hover:shadow-lg transition-shadow">
                <div className="flex-grow flex flex-col items-center text-center">
                    <div className="flex justify-center items-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
                        <ScanSearch className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl mb-1">Analiziraj sastojke</CardTitle>
                    <CardDescription>Unesite sastojke ručno ili slikajte deklaraciju.</CardDescription>
                </div>
                <Button onClick={() => analysisSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} className="w-full mt-4 hover:scale-[.98] transition-transform duration-200">
                    <ScanSearch className="mr-2 h-4 w-4" />
                    Započni analizu
                </Button>
            </Card>
        </div>

        <div className="my-8">
            {isScanningBarcode && (
              <div className="space-y-4">
                 <div className="aspect-video bg-muted rounded-md flex flex-col items-center justify-center text-muted-foreground p-4 relative">
                   <div id={barcodeReaderElementId} className="w-full h-full"></div>
                   {hasBarcodeCameraPermission === null && <Loader2 className="absolute h-8 w-8 animate-spin text-primary"/>}
                   {hasBarcodeCameraPermission === false && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4 rounded-md">
                        <CameraOff className="h-12 w-12 mb-2 text-destructive" />
                        <p className="text-center text-destructive-foreground">Potreban je pristup kameri. Molimo omogućite dozvole.</p>
                     </div>
                   )}
                   {hasBarcodeCameraPermission === true && (
                      <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm bg-black/50 text-white px-2 py-1 rounded">Uperite kameru ka barkodu...</p>
                   )}
                </div>
                <Button onClick={handleCancelBarcodeScanning} variant="outline" className="w-full">Otkaži skeniranje barkoda</Button>
              </div>
            )}
            {errorBarcode && !isScanningBarcode && (
              <ShadcnAlert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <ShadcnAlertTitle>Greška pri skeniranju barkoda</ShadcnAlertTitle>
                <ShadcnAlertDescription>{errorBarcode}</ShadcnAlertDescription>
              </ShadcnAlert>
            )}
            {barcodeScanResult && !isScanningBarcode && (
              <Card className="mt-4 max-w-2xl mx-auto">
                <CardHeader className="flex flex-row items-start gap-4">
                  {barcodeScanResult.imageUrl && (
                    <Image
                      src={barcodeScanResult.imageUrl && barcodeScanResult.imageUrl.startsWith('http') ? barcodeScanResult.imageUrl : '/placeholder.svg'}
                      alt={barcodeScanResult.name}
                      width={80}
                      height={80}
                      className="rounded-md object-cover"
                      data-ai-hint={barcodeScanResult.dataAiHint || "product image"}
                    />
                  )}
                  <div>
                    <CardTitle className="text-xl">{barcodeScanResult.name}</CardTitle>
                    {barcodeScanResult.tags?.includes('gluten-free') && (
                      <div className="flex items-center text-green-600 dark:text-green-400 mt-1"><CheckCircle className="h-5 w-5 mr-1" /><span>Verovatno bez glutena</span></div>
                    )}
                    {(barcodeScanResult.tags?.includes('contains-gluten') || barcodeScanResult.tags?.includes('contains-wheat') || barcodeScanResult.tags?.includes('contains-barley') || barcodeScanResult.tags?.includes('contains-rye') || (barcodeScanResult.tags?.includes('contains-oats') && !barcodeScanResult.tags?.includes('gluten-free'))) && (
                      <div className="flex items-center text-red-600 dark:text-red-500 mt-1"><AlertTriangle className="h-5 w-5 mr-1" /><span>Sadrži gluten</span></div>
                    )}
                    {barcodeScanResult.tags?.includes('may-contain-gluten') && !barcodeScanResult.tags?.includes('gluten-free') && !barcodeScanResult.tags?.includes('contains-gluten') && (
                       <div className="flex items-center text-orange-500 dark:text-orange-400 mt-1"><AlertTriangle className="h-5 w-5 mr-1" /><span>Može sadržati tragove</span></div>
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
                  <h4 className="font-semibold mb-1 text-sm">Sastojci:</h4>
                  <p className="text-xs text-muted-foreground">{barcodeScanResult.ingredientsText || 'Nisu dostupni'}</p>
                  <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => { setBarcodeScanResult(null); setErrorBarcode(null);}}>Skeniraj drugi barkod</Button>
                </CardContent>
              </Card>
            )}
        </div>
        
        {featuredProducts.length > 0 && (
          <div className="my-12 pt-10 scroll-mt-20">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold tracking-tight" style={{ lineHeight: 1.4 }}>Popularni proizvodi</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Neki od proizvoda koje naši korisnici najčešće traže.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProducts.map(product => {
                const isConsideredGF = product.hasAOECSLicense || product.hasManufacturerStatement || product.isVerifiedAdmin;
                const containsGlutenTag = product.warning || product.tags?.includes('contains-gluten') || product.tags?.includes('sadrži-gluten');
                const mayContainGlutenTag = !product.warning && product.tags?.includes('may-contain-gluten');
                const imageUrl = product.imageUrl && product.imageUrl.startsWith('http') ? product.imageUrl : '/placeholder.svg';

                return (
                  <Card key={product.id} className={cn("overflow-hidden hover:shadow-xl transition-shadow duration-200 flex flex-col", product.warning && 'border-destructive border-2')}>
                    <CardHeader className="p-0">
                      <Link href={`/${locale}/products/${product.id}`}>
                        <Image
                          src={imageUrl}
                          alt={product.name}
                          width={400}
                          height={200}
                          className="w-full h-48 object-cover"
                          data-ai-hint={product.dataAiHint}
                        />
                      </Link>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col flex-grow">
                      <Link href={`/${locale}/products/${product.id}`} className="hover:underline">
                        <CardTitle className="text-lg mb-1">{product.name}</CardTitle>
                      </Link>
                      {product.brand && <CardDescription className="text-xs text-muted-foreground mb-2">{product.brand}</CardDescription>}

                      {isConsideredGF ? (
                        <div className="flex items-center text-green-600 dark:text-green-400 text-xs mt-1 mb-1 font-medium"><CheckCircle className="h-3.5 w-3.5 mr-1" /><span>Bez glutena</span></div>
                      ) : containsGlutenTag ? (
                        <div className="flex items-center text-red-600 dark:text-red-500 text-xs mt-1 mb-1 font-medium"><AlertTriangle className="h-3.5 w-3.5 mr-1" /><span>Sadrži gluten</span></div>
                      ) : mayContainGlutenTag ? (
                        <div className="flex items-center text-orange-500 dark:text-orange-400 text-xs mt-1 mb-1 font-medium"><AlertTriangle className="h-3.5 w-3.5 mr-1" /><span>Mogući tragovi</span></div>
                      ) : (
                         <div className="flex items-center text-muted-foreground text-xs mt-1 mb-1 font-medium"><Info className="h-3.5 w-3.5 mr-1" /><span>Proveriti sastav</span></div>
                      )}
                      
                      <div className="flex-grow"></div>
                      <Button asChild variant="secondary" size="sm" className="w-full mt-4">
                        <Link href={`/${locale}/products/${product.id}`}>Vidi detalje</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        <div ref={analysisSectionRef} className="space-y-8 pt-10 scroll-mt-20">
            <div className="text-center">
                <h2 className="text-2xl font-semibold tracking-tight" style={{ lineHeight: 1.4 }}>Analiziraj Deklaraciju</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Iskoristite moć veštačke inteligencije za proveru sastojaka. Možete uneti tekst ručno ili otpremiti sliku deklaracije.</p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5" /> Analiziraj sa slike</CardTitle>
                  <CardDescription>Otpremite sliku liste sastojaka ili slikajte.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isTakingOcrPhoto ? (
                    <div className="space-y-2">
                      <div className="aspect-video bg-muted rounded-md flex flex-col items-center justify-center text-muted-foreground p-1 relative">
                        <video ref={ocrVideoRef} className="w-full h-full object-cover rounded-md" autoPlay playsInline muted />
                        {hasOcrCameraPermission === null && <Loader2 className="absolute h-8 w-8 animate-spin text-primary"/>}
                        {hasOcrCameraPermission === false && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-4 rounded-md">
                            <CameraOff className="h-10 w-10 mb-2 text-destructive" />
                            <p className="text-center text-destructive-foreground text-sm">Pristup OCR kameri je neophodan.</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleCaptureOcrPhoto} disabled={!hasOcrCameraPermission || isLoadingOcr} className="flex-grow">
                          {isLoadingOcr ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Camera className="mr-2 h-4 w-4"/>}
                           Snimi fotografiju
                        </Button>
                        <Button onClick={handleCancelOcrPhotoCapture} variant="outline" className="flex-grow">Otkaži</Button>
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
                            <span className="sr-only">Ukloni sliku</span>
                          </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Slika je spremna za analizu.</p>
                     </div>
                  ) : (
                    <div className="space-y-4 text-center">
                      <Label htmlFor="ocr-file-input" className="group cursor-pointer w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center hover:border-primary hover:bg-muted/50 transition-colors">
                        <UploadCloud className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                        <span className="mt-2 text-sm font-semibold">Izaberi fajl</span>
                        <Input id="ocr-file-input" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" disabled={isLoadingAnyAnalysisProcess}/>
                      </Label>
                       <div className="flex items-center gap-2">
                          <div className="flex-grow border-t"></div>
                          <span className="text-xs text-muted-foreground">ILI</span>
                          <div className="flex-grow border-t"></div>
                       </div>
                       <Button variant="outline" className="w-full" onClick={handleInitiateOcrPhotoCapture} disabled={isLoadingAnyAnalysisProcess}>
                          <Camera className="mr-2 h-4 w-4" />
                          Fotografiši
                       </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                   <Button onClick={handleAnalyzeStagedImage} size="lg" disabled={!stagedImage || isLoadingAnyAnalysisProcess} className="w-full">
                      {isLoadingOcr ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Analiziraj Sliku sa AI
                   </Button>
                </CardFooter>
                
                 <Accordion type="single" collapsible className="w-full border-t">
                    <AccordionItem value="manual-text" className="border-b-0">
                      <AccordionTrigger className="px-6 text-sm text-muted-foreground hover:no-underline">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4"/>
                            <span>Nemate sliku? Nalepite tekst ručno</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6">
                        <form onSubmit={handleDeclarationSubmit}>
                          <div className="space-y-4">
                             <Textarea
                              id="declaration-text-area"
                              placeholder="npr. pšenično brašno, šećer, so, kvasac, ekstrakt ječmenog slada..."
                              value={declarationText}
                              onChange={(e) => {
                                 setDeclarationText(e.target.value);
                                 if(e.target.value) { resetAnalysisInputs(true); }
                              }}
                              rows={8}
                              className="resize-none"
                              aria-label="Product Declaration Input"
                              disabled={isLoadingAnyAnalysisProcess}
                            />
                            <Button type="submit" 
                                size="lg"
                                disabled={isLoadingDeclaration || !declarationText.trim() || isLoadingAnyAnalysisProcess} 
                                className="w-full"
                              >
                                {isLoadingDeclaration && !isLoadingOcr ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Analiziraj Tekst sa AI
                            </Button>
                          </div>
                        </form>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
              </Card>
            </div>

            <div
              ref={analysisReportRef}
              aria-live="polite" 
              aria-busy={isLoadingAnyAnalysisProcess}
              className="mt-6"
            >
              {(analysisResult || isLoadingDeclaration || (isLoadingOcr && !isTakingOcrPhoto)) && !showLabelingQuestionModal && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg mb-2">Izveštaj AI analize</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(isLoadingDeclaration || (isLoadingOcr && !isTakingOcrPhoto)) && (
                      <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <p>{isLoadingOcr ? 'Obrađujem sliku...' : 'Analiziram sastojke...'}</p>
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
                            Očisti i počni ponovo
                          </Button>
                           <Dialog open={showReportErrorModal} onOpenChange={(open) => {
                               if (!open) {
                                   setReportComment('');
                                   setWantsContact(false);
                                   setContactEmail('');
                                   setReportPriority('');
                                   setErrorType('');
                                   setReportSubmissionStatus('idle');
                               }
                           }}>
                             <DialogTrigger asChild>
                               <Button className="w-full">
                                 <Flag className="mr-2 h-4 w-4" />
                                 Prijavi grešku
                               </Button>
                             </DialogTrigger>
                             <DialogContent>
                               {reportSubmissionStatus === 'success' ? (
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
                                            <RadioGroupItem value="niska" id="priority-low" />
                                            <Label htmlFor="priority-low" className="font-normal">Niska (čisto informacija)</Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="srednja" id="priority-medium" />
                                            <Label htmlFor="priority-medium" className="font-normal">Srednja (važno mi je)</Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="visoka" id="priority-high" />
                                            <Label htmlFor="priority-high" className="font-normal">Visoka (utiče na moju bezbednost)</Label>
                                          </div>
                                        </RadioGroup>
                                      </div>
                                   
                                      <div>
                                        <Label className="font-semibold">Tip greške (opciono)</Label>
                                         <RadioGroup value={errorType} onValueChange={setErrorType} className="mt-2 space-y-1">
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="sastav" id="type-sastav" />
                                            <Label htmlFor="type-sastav" className="font-normal">Greška u sastavu / AI analizi</Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="drugo" id="type-drugo" />
                                            <Label htmlFor="type-drugo" className="font-normal">Ostalo</Label>
                                          </div>
                                        </RadioGroup>
                                      </div>

                                     <div className="space-y-2">
                                       <Label htmlFor="report-comment">Komentar (opciono)</Label>
                                       <Textarea id="report-comment" placeholder="Npr. Brašno od rogača je bez glutena, a označeno je kao rizično." onChange={(e) => setReportComment(e.target.value)} />
                                     </div>
                                   
                                     <div className="flex items-center space-x-2">
                                       <Checkbox id="wants-contact" onCheckedChange={(checked) => setWantsContact(!!checked)} />
                                       <Label htmlFor="wants-contact">Želim da me kontaktirate povodom ove prijave.</Label>
                                     </div>
                                     {wantsContact && (
                                       <div className="space-y-2 pl-6">
                                         <Label htmlFor="contact-email">Email za odgovor</Label>
                                         <Input id="contact-email" type="email" placeholder="vas.email@primer.com" onChange={(e) => setContactEmail(e.target.value)} />
                                       </div>
                                     )}
                                     <p className="text-xs text-muted-foreground">
                                       Napomena: Uz prijavu se automatski šalje i analizirani tekst (ili slika) radi lakše provere.
                                     </p>
                                   </div>
                                   <DialogFooter>
                                     <Button variant="outline" onClick={() => setShowReportErrorModal(false)}>Odustani</Button>
                                     <Button onClick={handleReportSubmit} disabled={reportSubmissionStatus === 'submitting'}>
                                       {reportSubmissionStatus === 'submitting' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />} Pošalji prijavu
                                     </Button>
                                   </DialogFooter>
                                 </>
                               )}
                             </DialogContent>
                           </Dialog>
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
                    <ShadcnAlertTitle>Greška</ShadcnAlertTitle>
                    <ShadcnAlertDescription>{errorDeclaration}</ShadcnAlertDescription>
                  </ShadcnAlert>
                )}
            </div>
        </div>
        
        <div className="my-12 pt-10 scroll-mt-20">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold tracking-tight" style={{ lineHeight: 1.4 }}>Pretraži po kategoriji</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto" style={{ lineHeight: 1.5 }}>Ne znate odakle da krenete? Istražite po kategorijama 👇</p>
            </div>
            <TooltipProvider delayDuration={200}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categories.map((category) => {
                      const Icon = getCategoryIcon(category.name);
                      return (
                        <Link key={category.name} href={`/${locale}/products?category=${encodeURIComponent(category.name)}`} className="block group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg">
                            <Card className="h-full flex flex-col items-center justify-center text-center p-4 hover:bg-muted/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group-hover:border-primary">
                                <div className="text-primary mb-2 transition-transform duration-200 group-hover:scale-110">
                                  <Icon className="h-12 w-12" />
                                </div>
                                <p className="font-semibold text-sm">{category.name}</p>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge variant="secondary" className="mt-2 text-xs font-semibold group-hover:scale-105 transition-transform duration-200">{category.count} proizvoda</Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Ukupno {category.count} proizvoda u ovoj kategoriji</p>
                                    </TooltipContent>
                                </Tooltip>
                            </Card>
                        </Link>
                      );
                    })}
                </div>
            </TooltipProvider>
            <div className="text-center mt-8">
                <Button asChild variant="outline">
                    <Link href={`/${locale}/products`}>
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        Vidi sve proizvode i kategorije
                    </Link>
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Ne vidite kategoriju koju tražite? Pogledajte sve proizvode i filtrirajte ručno.</p>
            </div>
        </div>

        <AlertDialog open={showLabelingQuestionModal} onOpenChange={(open) => {
          if (!open) { resetAnalysisInputs(); }
          setShowLabelingQuestionModal(open);
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Informacije o oznakama na proizvodu</AlertDialogTitle>
              <AlertDialogDescription>
                Molimo vas naznačite da li vidite neku od ovih bezglutenskih oznaka na pakovanju proizvoda. Ovo pomaže u poboljšanju tačnosti analize. <br /> (Primer AOECS: Simbol precrtanog klasa, često sa brojem licence i kodom zemlje.)
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3 py-2">
              <RadioGroup value={selectedLabelingOption} onValueChange={setSelectedLabelingOption} className="gap-3">
                <div className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="aoecs" id="label-aoecs" />
                  <Label htmlFor="label-aoecs" className="cursor-pointer flex-1">AOECS sertifikat (npr. simbol precrtanog klasa)</Label>
                </div>
                <div className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="gf_text" id="label-gf_text" />
                  <Label htmlFor="label-gf_text" className="cursor-pointer flex-1">"Bez glutena" tekst/ikona (nije zvanični sertifikat)</Label>
                </div>
                <div className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="none" id="label-none" />
                  <Label htmlFor="label-none" className="cursor-pointer flex-1">Nema bezglutenske oznake</Label>
                </div>
              </RadioGroup>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Otkaži skeniranje</AlertDialogCancel>
              <AlertDialogAction onClick={handleLabelingChoiceSubmit} disabled={!selectedLabelingOption || isLoadingDeclaration}>
                {isLoadingDeclaration ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Nastavi na AI analizu
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AddProductDialog
          barcode={notFoundBarcode}
          isOpen={!!notFoundBarcode}
          onClose={() => setNotFoundBarcode(null)}
        />

      </div>
    </div>
  );
}


// New Component for the "Product Not Found" flow
interface AddProductDialogProps {
  barcode: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function AddProductDialog({ barcode, isOpen, onClose }: AddProductDialogProps) {
  const [step, setStep] = useState<'initial' | 'capturing' | 'confirming' | 'success'>('initial');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      productName: '',
      brand: '',
      comment: '',
    }
  });

  // Reset state when dialog is closed or barcode changes
  useEffect(() => {
    if (isOpen) {
      setStep('initial');
      setImage(null);
      setIsLoading(false);
      setError(null);
      setValue('productName', '');
      setValue('brand', '');
      setValue('comment', '');
    }
  }, [isOpen, setValue]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result as string;
        setImage(result);
        processImageWithAI(result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleStartCapture = async () => {
    setStep('capturing');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setHasCameraPermission(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError('Pristup kameri je odbijen. Molimo omogućite dozvole.');
      setHasCameraPermission(false);
      setStep('initial');
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const dataUri = canvas.toDataURL('image/jpeg');
      setImage(dataUri);
      stopCamera();
      processImageWithAI(dataUri);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const processImageWithAI = async (imageDataUri: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await extractProductInfo({ imageDataUri });
      setValue('productName', result.productName);
      setValue('brand', result.brand);
      setStep('confirming');
    } catch (err) {
      setError('Nije moguće izvući informacije sa slike. Molimo pokušajte ponovo.');
      setStep('initial'); // Revert to initial step on error
    } finally {
      setIsLoading(false);
    }
  };

  const onFormSubmit = async (data: { productName: string, brand: string, comment: string }) => {
    setIsLoading(true);
    const result = await addReportAction({
      type: 'inquiry',
      productName: data.productName,
      productContext: `Novi proizvod - Brend: ${data.brand || 'N/A'}, Barkod: ${barcode}`,
      comment: data.comment,
    });
    setIsLoading(false);

    if (result.success) {
      setStep('success');
    } else {
      toast({ variant: 'destructive', title: 'Greška pri slanju', description: result.error });
    }
  };
  
  const DialogSteps = () => {
    switch (step) {
      case 'initial':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><PackagePlus className="h-6 w-6 text-primary" /> Proizvod nije u bazi</DialogTitle>
              <DialogDescription>
                Ovaj barkod nije pronađen. Možete nam pomoći da ga dodamo – skenirajte prednju stranu pakovanja (sa nazivom proizvoda).
              </DialogDescription>
            </DialogHeader>
            {error && <ShadcnAlert variant="destructive"><AlertCircle className="h-4 w-4" />{error}</ShadcnAlert>}
            {isLoading && <div className="flex justify-center items-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button asChild variant="outline">
                <Label htmlFor="new-product-upload">
                  <UploadCloud className="mr-2 h-4 w-4" /> Dodaj iz galerije
                  <Input id="new-product-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                </Label>
              </Button>
              <Button onClick={handleStartCapture}><Camera className="mr-2 h-4 w-4" /> Fotografisi</Button>
            </div>
          </>
        );

      case 'capturing':
         return (
          <>
            <DialogHeader><DialogTitle>Fotografiši Proizvod</DialogTitle></DialogHeader>
            <div className="aspect-video bg-muted rounded-md relative">
              <video ref={videoRef} className="w-full h-full object-cover rounded-md" autoPlay playsInline muted />
              {!hasCameraPermission && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white p-4">Dozvolite pristup kameri...</div>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { stopCamera(); setStep('initial'); }}>Nazad</Button>
              <Button onClick={handleCapture} disabled={!hasCameraPermission}>Slikaj</Button>
            </DialogFooter>
          </>
        );
        
      case 'confirming':
        return (
          <form onSubmit={handleSubmit(onFormSubmit)}>
            <DialogHeader>
              <DialogTitle>Potvrdi podatke o proizvodu</DialogTitle>
              <DialogDescription>Molimo proverite podatke koje je AI izvukao iz slike i pošaljite ih našem timu na verifikaciju.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Naziv proizvoda</Label>
                <Input id="productName" {...register('productName', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brend</Label>
                <Input id="brand" {...register('brand')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barkod</Label>
                <Input id="barcode" value={barcode || ''} readOnly disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">Komentar (opciono)</Label>
                <Textarea id="comment" placeholder="Npr. Na pakovanju piše 'bez glutena'" {...register('comment')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep('initial')}>Nazad</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Pošalji timu GlutenScan
              </Button>
            </DialogFooter>
          </form>
        );
      
      case 'success':
        return (
          <>
            <DialogHeader className="items-center text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <DialogTitle>Hvala Vam!</DialogTitle>
              <DialogDescription>
                Uspešno ste poslali podatke o novom proizvodu. Naš tim će ih proveriti i dodati u bazu.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button className="w-full" onClick={onClose}>Zatvori</Button>
            </DialogFooter>
          </>
        );

      default: return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        {DialogSteps()}
      </DialogContent>
    </Dialog>
  );
}
