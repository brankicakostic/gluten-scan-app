import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, AlertCircle, CheckCircle, Trash2, FileText, QrCode, Archive } from 'lucide-react';
import Image from 'next/image';

// Placeholder scan history data
const placeholderHistory = [
  { id: '1', type: 'declaration', name: 'Analiza sastojaka žitarica', date: '2024-07-15', status: 'contains_gluten', summary: 'Sadrži pšenično brašno, ječmeni slad.', dataAiHint: 'cereal box' },
  { id: '2', type: 'barcode', name: 'Organski kukuruzni čips', date: '2024-07-14', status: 'gluten_free', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'chips snack' },
  { id: '3', type: 'declaration', name: 'Analiza preliva za salatu', date: '2024-07-12', status: 'gluten_free', summary: 'Svi sastojci deluju bezglutenski.', dataAiHint: 'salad dressing' },
];

export default function HistoryPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <PageHeader 
          title="Istorija skeniranja"
          description="Pregledajte prethodna skeniranja proizvoda i analize deklaracija."
          icon={History}
        />

        {placeholderHistory.length > 0 ? (
          <div className="space-y-6">
            {placeholderHistory.map(item => (
              <Card key={item.id} className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {item.type === 'declaration' ? <FileText className="h-5 w-5 text-primary" /> : <QrCode className="h-5 w-5 text-primary" />}
                      {item.name}
                    </CardTitle>
                    <CardDescription className="text-xs">Skenirano: {item.date}</CardDescription>
                  </div>
                  {item.imageUrl && (
                    <Image 
                      src={item.imageUrl} 
                      alt={item.name} 
                      width={60} 
                      height={60} 
                      className="rounded-md object-cover"
                      data-ai-hint={item.dataAiHint}
                    />
                  )}
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {item.status === 'contains_gluten' ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    <span className={'text-sm font-medium ' + (item.status === 'contains_gluten' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400')}>
                      {item.status === 'contains_gluten' ? 'Može sadržati gluten' : 'Verovatno bez glutena'}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-1" /> Obriši
                  </Button>
                </CardContent>
                {item.type === 'declaration' && item.summary && (
                   <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground border-t pt-2 mt-2"><strong>Rezime:</strong> {item.summary}</p>
                   </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Archive className="mx-auto h-16 w-16 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Još uvek nema istorije skeniranja</h3>
            <p>Skenirane stavke i analize deklaracija će se pojaviti ovde.</p>
          </div>
        )}
      </div>
    </div>
  );
}
