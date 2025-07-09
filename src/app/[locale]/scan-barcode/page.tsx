
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { QrCode, AlertCircle, CheckCircle, ShoppingBag } from 'lucide-react';
import Image from 'next/image';

export default function ScanBarcodePage() {
  // Placeholder state - in a real app, this would come from scanning
  const scanResult = null; // or { name: "Sample Product", isGlutenFree: true, ingredients: "Corn, Sugar, Salt", imageUrl: "https://placehold.co/300x200.png" }

  return (
    <div className="p-6 md:p-8">
      <PageHeader 
        title="Scan Product Barcode"
        description="Use your device's camera to scan a product barcode and check its gluten status."
        icon={QrCode}
      />
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Barcode Scanner</CardTitle>
          <CardDescription>Point your camera at a barcode. Results will appear below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
            {/* Placeholder for camera feed or image upload */}
            <QrCode className="h-24 w-24 text-muted-foreground" />
          </div>
          <Button className="w-full" size="lg">
            <QrCode className="mr-2 h-5 w-5" />
            Start Scanning
          </Button>
          
          {scanResult && (
            <Card>
              <CardHeader className="flex flex-row items-start gap-4">
                <Image 
                  src={scanResult.imageUrl} 
                  alt={scanResult.name} 
                  width={80} 
                  height={80} 
                  className="rounded-md object-cover"
                  data-ai-hint="food product" 
                />
                <div>
                  <CardTitle className="text-2xl">{scanResult.name}</CardTitle>
                  {scanResult.isGlutenFree ? (
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
                <h4 className="font-semibold mb-1">Ingredients:</h4>
                <p className="text-sm text-muted-foreground">{scanResult.ingredients}</p>
              </CardContent>
            </Card>
          )}

          {!scanResult && (
             <div className="text-center text-muted-foreground py-8">
                <ShoppingBag className="mx-auto h-12 w-12 mb-2" />
                <p>Scan a product to see its details here.</p>
              </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
