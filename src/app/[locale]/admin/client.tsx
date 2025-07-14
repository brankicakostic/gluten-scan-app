
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { PageHeader } from '@/components/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Shield, PlusCircle, Edit, Trash2, Loader2, Mail, CheckSquare, ExternalLink, Hourglass, Save, MessageSquare, Flag, Send, CalendarIcon, CalendarDays, CircleAlert } from 'lucide-react';
import type { Product } from '@/lib/products';
import type { Report } from '@/lib/reports';
import type { Event } from '@/lib/events';
import { addProductAction, updateProductAction, deleteProductAction } from '@/app/actions/product-actions';
import { deleteReportAction, updateReportStatusAction, updateReportNotesAction } from '@/app/actions/report-actions';
import { addEventAction, updateEventAction, deleteEventAction } from '@/app/actions/event-actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';


const productFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  brand: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  ingredientsText: z.string().optional(),
  imageUrl: z.string().optional(),
  barcode: z.string().optional(),
  nutriScore: z.string().optional(),
  Poreklo: z.string().optional(),
  hasAOECSLicense: z.boolean().optional(),
  hasManufacturerStatement: z.boolean().optional(),
  isVerifiedAdmin: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isPosno: z.boolean().optional(),
  isSugarFree: z.boolean().optional(),
  isLactoseFree: z.boolean().optional(),
  isHighProtein: z.boolean().optional(),
  tags: z.string().optional().transform(value => value ? value.split(',').map(tag => tag.trim()).filter(Boolean) : []),
  warning: z.boolean().optional(),
  note: z.string().optional(),
  seriesAffected: z.object({
    lotNumbers: z.string().optional().transform(value => value ? value.split(',').map(tag => tag.trim()).filter(Boolean) : []),
    expiry: z.string().optional(),
    finding: z.string().optional(),
    status: z.string().optional(),
    sourceLink: z.string().url({ message: "Unesite validan URL." }).optional().or(z.literal('')),
  }).optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

const eventFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Naziv je obavezan'),
  category: z.enum(['Radionica', 'Festival', 'Predavanje', 'Sajam', 'Ostalo'], { required_error: 'Kategorija je obavezna' }),
  date: z.date({ required_error: 'Datum je obavezan' }),
  time: z.string().min(1, 'Vreme je obavezno'),
  location: z.string().min(1, 'Lokacija je obavezna'),
  registrationLink: z.string().url({ message: "Unesite validan URL." }).optional().or(z.literal('')),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  organizer: z.string().optional(),
  status: z.enum(['draft', 'published', 'scheduled'], { required_error: 'Status je obavezan' }),
  tags: z.string().optional().transform(value => value ? value.split(',').map(tag => tag.trim()).filter(Boolean) : []),
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface AdminClientPageProps {
  initialProducts: Product[];
  initialReports: Report[];
  initialEvents: Event[];
  locale: string;
}

const generateInquiryMailto = (report: Report): string => {
  const subject = `GlutenScan - Upit za proizvod: ${report.productName || 'Provera sastojaka'}`;
  const bodyParts = [
    'Poštovani,', '',
    'Korisnik GlutenScan aplikacije postavio je sledeći upit za vaš proizvod:', '',
    `📌 Proizvod: ${report.productName || '[Unesite naziv proizvoda ovde]'}`,
    `📝 Pitanje: "${report.comment || 'Nije specificiran komentar.'}"`,
  ];
  if (report.contactEmail && report.wantsContact) {
    bodyParts.push(`📩 Email korisnika (za cc): ${report.contactEmail}`);
  }
  bodyParts.push('', 'Zahvaljujemo unapred na odgovoru, koji ćemo proslediti korisnicima aplikacije.', '', 'Srdačno,', 'GlutenScan tim');
  const body = bodyParts.join('\n');
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};


export default function AdminClientPage({ initialProducts, initialReports, initialEvents, locale }: AdminClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Products state
  const [products, setProducts] = useState(initialProducts);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isProductDeleteAlertOpen, setIsProductDeleteAlertOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  // Reports state
  const [reports, setReports] = useState(initialReports);
  const [isReportDeleteAlertOpen, setIsReportDeleteAlertOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [isResolveAlertOpen, setIsResolveAlertOpen] = useState(false);
  const [reportToResolve, setReportToResolve] = useState<Report | null>(null);
  const [isMarkInProgressAlertOpen, setIsMarkInProgressAlertOpen] = useState(false);
  const [reportToMarkInProgress, setReportToMarkInProgress] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [isSavingNote, setIsSavingNote] = useState<string | null>(null);

  // Events state
  const [events, setEvents] = useState(initialEvents);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isEventDeleteAlertOpen, setIsEventDeleteAlertOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  // Common state
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => setProducts(initialProducts), [initialProducts]);
  useEffect(() => setEvents(initialEvents), [initialEvents]);
  useEffect(() => {
    setReports(initialReports);
    const initialNotes = initialReports.reduce((acc, report) => {
      acc[report.id] = report.adminNotes || '';
      return acc;
    }, {} as Record<string, string>);
    setAdminNotes(initialNotes);
  }, [initialReports]);

  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      warning: false,
    },
  });

  const eventForm = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
        status: 'draft',
        category: 'Radionica',
    },
  });

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123')) {
      setIsAuthenticated(true);
    } else {
      toast({ variant: 'destructive', title: 'Netačna lozinka' });
    }
  };

  const handleOpenProductForm = (product?: Product) => {
    setProductToEdit(product || null);
    const formValues = product ? {
      ...product,
      tags: product.tags?.join(', ') || '',
      note: product.note || '',
      seriesAffected: product.seriesAffected ? {
          ...product.seriesAffected,
          lotNumbers: product.seriesAffected.lotNumbers?.join(', ') || ''
      } : undefined
    } : { warning: false };
    productForm.reset(formValues);
    setIsProductFormOpen(true);
  };

  const handleProductFormSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    const action = data.id ? updateProductAction(data.id, data) : addProductAction(data);
    
    const result = await action;
    setIsLoading(false);

    if (result.success) {
      toast({ title: `Proizvod ${data.id ? 'ažuriran' : 'dodan'}!` });
      setIsProductFormOpen(false);
      router.refresh(); 
    } else {
      toast({ variant: 'destructive', title: 'Greška', description: result.error });
    }
  };

  const handleDeleteProductClick = (product: Product) => {
    setProductToDelete(product);
    setIsProductDeleteAlertOpen(true);
  };

  const handleDeleteProductConfirm = async () => {
    if (!productToDelete?.id) return;
    setIsLoading(true);
    const result = await deleteProductAction(productToDelete.id);
    setIsLoading(false);
    setIsProductDeleteAlertOpen(false);

    if (result.success) {
      toast({ title: `Proizvod "${productToDelete.name}" obrisan.` });
      router.refresh();
    } else {
      toast({ variant: 'destructive', title: 'Greška pri brisanju', description: result.error });
    }
    setProductToDelete(null);
  };

  const handleOpenEventForm = (event?: Event) => {
    setEventToEdit(event || null);
    eventForm.reset(event ? { ...event, date: new Date(event.date), tags: event.tags?.join(', ') } : { status: 'draft' });
    setIsEventFormOpen(true);
  };
  
  const handleEventFormSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    const action = data.id ? updateEventAction(data.id, data as Event) : addEventAction(data as Event);
    const result = await action;
    setIsLoading(false);
  
    if (result.success) {
      toast({ title: `Događaj ${data.id ? 'ažuriran' : 'dodan'}!` });
      setIsEventFormOpen(false);
      router.refresh();
    } else {
      toast({ variant: 'destructive', title: 'Greška', description: result.error });
    }
  };
  
  const handleDeleteEventClick = (event: Event) => {
    setEventToDelete(event);
    setIsEventDeleteAlertOpen(true);
  };
  
  const handleDeleteEventConfirm = async () => {
    if (!eventToDelete?.id) return;
    setIsLoading(true);
    const result = await deleteEventAction(eventToDelete.id);
    setIsLoading(false);
    setIsEventDeleteAlertOpen(false);
  
    if (result.success) {
      toast({ title: `Događaj "${eventToDelete.title}" obrisan.` });
      router.refresh();
    } else {
      toast({ variant: 'destructive', title: 'Greška pri brisanju', description: result.error });
    }
    setEventToDelete(null);
  };


  // Report handlers...
  const handleDeleteReportClick = (report: Report) => {
    setReportToDelete(report);
    setIsReportDeleteAlertOpen(true);
  };

  const handleDeleteReportConfirm = async () => {
    if (!reportToDelete?.id) return;
    setIsLoading(true);
    const result = await deleteReportAction(reportToDelete.id);
    setIsLoading(false);
    setIsReportDeleteAlertOpen(false);

    if (result.success) {
      toast({ title: `Prijava obrisana.` });
      router.refresh();
    } else {
      toast({ variant: 'destructive', title: 'Greška pri brisanju prijave', description: result.error });
    }
    setReportToDelete(null);
  };
  
  const handleResolveReportClick = (report: Report) => {
    setReportToResolve(report);
    setIsResolveAlertOpen(true);
  };

  const handleResolveReportConfirm = async () => {
    if (!reportToResolve?.id) return;
    setIsLoading(true);
    const result = await updateReportStatusAction(reportToResolve.id, 'resolved');
    setIsLoading(false);
    setIsResolveAlertOpen(false);

    if (result.success) {
        toast({ title: `Prijava označena kao rešena.` });
        router.refresh();
    } else {
        toast({ variant: 'destructive', title: 'Greška', description: result.error });
    }
    setReportToResolve(null);
  };

  const handleMarkInProgressClick = (report: Report) => {
    setReportToMarkInProgress(report);
    setIsMarkInProgressAlertOpen(true);
  };

  const handleMarkInProgressConfirm = async () => {
    if (!reportToMarkInProgress?.id) return;
    setIsLoading(true);
    const result = await updateReportStatusAction(reportToMarkInProgress.id, 'in_progress');
    setIsLoading(false);
    setIsMarkInProgressAlertOpen(false);

    if (result.success) {
        toast({ title: `Prijava označena kao "u toku".` });
        router.refresh();
    } else {
        toast({ variant: 'destructive', title: 'Greška', description: result.error });
    }
    setReportToMarkInProgress(null);
  };

  const handleNoteChange = (reportId: string, value: string) => {
    setAdminNotes(prev => ({ ...prev, [reportId]: value }));
  };

  const handleSaveNote = async (reportId: string) => {
    setIsSavingNote(reportId);
    const result = await updateReportNotesAction(reportId, adminNotes[reportId]);
    setIsSavingNote(null);
    if (result.success) {
      toast({ title: 'Admin beleška sačuvana!' });
    } else {
      toast({ variant: 'destructive', title: 'Greška pri čuvanju beleške', description: result.error });
    }
  };


  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted">
        <Card className="w-full max-w-sm p-6">
          <form onSubmit={handleAuth} className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Admin Prijavljivanje</h2>
            <p className="text-sm text-center text-muted-foreground">Unesite lozinku za pristup.</p>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Lozinka"
            />
            <Button type="submit" className="w-full">Prijavi se</Button>
          </form>
        </Card>
      </div>
    );
  }

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'visoka': return <Badge variant="destructive">Visoka</Badge>;
      case 'srednja': return <Badge variant="default" className="bg-orange-500 hover:bg-orange-500/80">Srednja</Badge>;
      case 'niska': return <Badge variant="secondary">Niska</Badge>;
      default: return null;
    }
  };
  
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'resolved': return <Badge variant="default" className="bg-green-600 hover:bg-green-600/80">Rešeno</Badge>;
      case 'in_progress': return <Badge variant="default" className="bg-blue-500 hover:bg-blue-500/80">U toku</Badge>;
      case 'new':
      default: return <Badge variant="destructive">Novo</Badge>;
    }
  };

  const getEventStatusBadge = (status?: string) => {
    switch (status) {
        case 'published': return <Badge variant="default" className="bg-green-600 hover:bg-green-600/80">Objavljeno</Badge>;
        case 'draft': return <Badge variant="secondary">Nacrt</Badge>;
        case 'scheduled': return <Badge variant="default" className="bg-blue-500 hover:bg-blue-500/80">Zakazano</Badge>;
        default: return <Badge variant="outline">Nepoznato</Badge>;
    }
  };


  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Admin Panel" description="Upravljanje bazom podataka i prijavama korisnika." icon={Shield} />

        <Tabs defaultValue="products">
          <TabsList className="mb-4">
            <TabsTrigger value="products">Proizvodi</TabsTrigger>
            <TabsTrigger value="reports">Prijave i Upiti <Badge variant="destructive" className="ml-2">{reports.filter(r => r.status === 'new').length}</Badge></TabsTrigger>
            <TabsTrigger value="events">Događaji</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="flex justify-end mb-4">
              <Button onClick={() => handleOpenProductForm()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Dodaj novi proizvod
              </Button>
            </div>
            <Card>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naziv Proizvoda</TableHead>
                      <TableHead>Brend</TableHead>
                      <TableHead>Kategorija</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.brand}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          {product.warning && <Badge variant="destructive">Opozvan</Badge>}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="icon" onClick={() => handleOpenProductForm(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => handleDeleteProductClick(product)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
             <Accordion type="multiple" className="w-full space-y-2">
                {reports.map((report) => (
                  <AccordionItem key={report.id} value={report.id} className={`rounded-lg border ${report.status === 'new' ? 'border-primary/50 bg-muted/30' : 'bg-card'}`}>
                    <AccordionTrigger className="p-4 hover:no-underline">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 w-full">
                        <span className="text-sm font-normal text-muted-foreground w-36 text-left">
                          {new Date(report.createdAt).toLocaleString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <Badge variant={report.type === 'error' ? 'destructive' : 'secondary'} className="w-20 justify-center">
                          <div className="flex items-center gap-1">
                            {report.type === 'error' ? <Flag className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                            <span>{report.type === 'error' ? 'Greška' : 'Upit'}</span>
                          </div>
                        </Badge>
                         <span className="font-medium text-sm flex-1 text-left truncate">{report.productName || 'Tekstualna analiza'}</span>
                        <div className="flex items-center gap-2">
                          {report.type === 'error' && report.priority && getPriorityBadge(report.priority)}
                          {getStatusBadge(report.status)}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm">Komentar korisnika:</h4>
                          <p className="text-sm text-muted-foreground p-2 bg-muted rounded-md mt-1">{report.comment || 'Nije ostavljen komentar.'}</p>
                        </div>

                         <div>
                          <h4 className="font-semibold text-sm">Povezani proizvod/kontekst:</h4>
                           <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md mt-1">
                            {report.productId ? (
                              <Link href={`/${locale}/products/${report.productId}`} className="hover:underline text-primary" target="_blank">
                                {report.productName} <ExternalLink className="inline h-3 w-3 ml-1" />
                              </Link>
                            ) : (
                              <p className="whitespace-pre-wrap font-mono text-xs">{report.productContext}</p>
                            )}
                          </div>
                        </div>

                         {report.wantsContact && report.contactEmail && (
                           <div>
                            <h4 className="font-semibold text-sm">Kontakt korisnika:</h4>
                            <a href={`mailto:${report.contactEmail}`} className="text-sm text-primary hover:underline mt-1 flex items-center gap-2">
                              <Mail className="h-4 w-4" /> {report.contactEmail}
                            </a>
                          </div>
                        )}

                         <div>
                          <h4 className="font-semibold text-sm mb-1">Admin beleške:</h4>
                          <Textarea
                            placeholder="Dodaj internu belešku..."
                            value={adminNotes[report.id] || ''}
                            onChange={(e) => handleNoteChange(report.id, e.target.value)}
                            className="text-sm"
                          />
                          <Button size="sm" className="mt-2" onClick={() => handleSaveNote(report.id)} disabled={isSavingNote === report.id}>
                            {isSavingNote === report.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Sačuvaj belešku
                          </Button>
                        </div>

                        <div className="border-t pt-4 flex flex-wrap gap-2 justify-end">
                            {report.type === 'inquiry' && (
                              <Button asChild variant="secondary" size="sm" title="Sastavi upit za proizvođača">
                                <a href={generateInquiryMailto(report)}>
                                  <Send className="h-4 w-4" /> Sastavi upit
                                </a>
                              </Button>
                            )}
                            {report.wantsContact && report.contactEmail && (
                              <Button asChild variant="outline" size="sm" title="Odgovori korisniku">
                                <a href={`mailto:${report.contactEmail}?subject=Re: GlutenScan prijava`}>
                                  <Mail className="h-4 w-4" /> Odgovori
                                </a>
                              </Button>
                            )}
                            {report.status === 'new' && (
                              <Button variant="outline" size="sm" onClick={() => handleMarkInProgressClick(report)} title="Označi kao 'u toku'">
                                <Hourglass className="h-4 w-4" /> Označi kao "u toku"
                              </Button>
                            )}
                            {report.status !== 'resolved' && (
                              <Button variant="default" className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => handleResolveReportClick(report)} title="Označi kao rešeno">
                                <CheckSquare className="h-4 w-4" /> Reši prijavu
                              </Button>
                            )}
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteReportClick(report)} title="Obriši prijavu">
                              <Trash2 className="h-4 w-4" /> Obriši
                            </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
          </TabsContent>
          
          {/* Events Tab */}
          <TabsContent value="events">
            <div className="flex justify-end mb-4">
                <Button onClick={() => handleOpenEventForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Dodaj novi događaj
                </Button>
            </div>
            <Card>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Naziv Događaja</TableHead>
                                <TableHead>Datum</TableHead>
                                <TableHead>Lokacija</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Akcije</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell className="font-medium">{event.title}</TableCell>
                                    <TableCell>{new Date(event.date).toLocaleDateString('sr-RS')}</TableCell>
                                    <TableCell>{event.location}</TableCell>
                                    <TableCell>{getEventStatusBadge(event.status)}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="icon" onClick={() => handleOpenEventForm(event)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="destructive" size="icon" onClick={() => handleDeleteEventClick(event)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{productToEdit ? 'Izmeni proizvod' : 'Dodaj novi proizvod'}</DialogTitle>
            <DialogDescription>Popunite detalje o proizvodu.</DialogDescription>
          </DialogHeader>
          <form onSubmit={productForm.handleSubmit(handleProductFormSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="name">Naziv</Label>
                <Input id="name" {...productForm.register('name')} />
                {productForm.formState.errors.name && <p className="text-xs text-destructive">{productForm.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="brand">Brend</Label>
                <Input id="brand" {...productForm.register('brand')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="category">Kategorija</Label>
                <Input id="category" {...productForm.register('category')} />
                 {productForm.formState.errors.category && <p className="text-xs text-destructive">{productForm.formState.errors.category.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="barcode">Barcode</Label>
                <Input id="barcode" {...productForm.register('barcode')} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="imageUrl">URL Slike</Label>
              <Input id="imageUrl" placeholder="https://..." {...productForm.register('imageUrl')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Opis</Label>
              <Textarea id="description" {...productForm.register('description')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ingredientsText">Sastojci (odvojeni zarezom)</Label>
              <Textarea id="ingredientsText" {...productForm.register('ingredientsText')} />
            </div>
             <div className="space-y-1">
                <Label htmlFor="tags">Tagovi (odvojeni zarezom)</Label>
                <Input id="tags" placeholder="npr. povučeno, sadrži-gluten, upozorenje" {...productForm.register('tags')} />
              </div>
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <Label htmlFor="nutriScore">Nutri-Score</Label>
                    <Input id="nutriScore" {...productForm.register('nutriScore')} />
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="Poreklo">Poreklo</Label>
                    <Input id="Poreklo" {...productForm.register('Poreklo')} />
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                 <Controller name="hasAOECSLicense" control={productForm.control} render={({ field }) => <Checkbox id="hasAOECSLicense" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="hasAOECSLicense">AOECS Licenca</Label>
              </div>
              <div className="flex items-center space-x-2">
                 <Controller name="hasManufacturerStatement" control={productForm.control} render={({ field }) => <Checkbox id="hasManufacturerStatement" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="hasManufacturerStatement">Izjava proizvođača</Label>
              </div>
               <div className="flex items-center space-x-2">
                 <Controller name="isVerifiedAdmin" control={productForm.control} render={({ field }) => <Checkbox id="isVerifiedAdmin" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="isVerifiedAdmin">Admin Verifikovan</Label>
              </div>
               <div className="flex items-center space-x-2">
                 <Controller name="isVegan" control={productForm.control} render={({ field }) => <Checkbox id="isVegan" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="isVegan">Vegan</Label>
              </div>
               <div className="flex items-center space-x-2">
                 <Controller name="isPosno" control={productForm.control} render={({ field }) => <Checkbox id="isPosno" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="isPosno">Posno</Label>
              </div>
               <div className="flex items-center space-x-2">
                 <Controller name="isSugarFree" control={productForm.control} render={({ field }) => <Checkbox id="isSugarFree" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="isSugarFree">Bez šećera</Label>
              </div>
                <div className="flex items-center space-x-2">
                 <Controller name="isLactoseFree" control={productForm.control} render={({ field }) => <Checkbox id="isLactoseFree" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="isLactoseFree">Bez laktoze</Label>
              </div>
               <div className="flex items-center space-x-2">
                 <Controller name="isHighProtein" control={productForm.control} render={({ field }) => <Checkbox id="isHighProtein" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="isHighProtein">Bogat proteinima</Label>
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t">
              <Controller name="warning" control={productForm.control} render={({ field }) => (
                <div className="flex items-center space-x-2 p-3 bg-destructive/10 rounded-lg">
                    <Checkbox id="warning" checked={field.value} onCheckedChange={field.onChange} className="border-destructive" />
                    <Label htmlFor="warning" className="text-destructive font-semibold text-base">Označi proizvod kao povučen/problematičan</Label>
                </div>
              )} />
              
              {productForm.watch('warning') && (
                <Accordion type="single" collapsible defaultValue="recall-details" className="w-full bg-muted/40 p-4 rounded-lg">
                    <AccordionItem value="recall-details" className="border-0">
                        <AccordionTrigger className="text-base py-2 hover:no-underline">
                          <div className="flex items-center gap-2 text-destructive">
                            <CircleAlert className="h-5 w-5" />
                            <span>Unesi detalje o povlačenju</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                            <div className="space-y-1">
                                <Label htmlFor="note">Napomena (prikazuje se na vrhu stranice)</Label>
                                <Textarea id="note" {...productForm.register('note')} placeholder="Npr. VAŽNO: Serija XYZ je povučena zbog prisustva glutena." />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="lotNumbers">Pogođene serije (odvojene zarezom)</Label>
                                <Input id="lotNumbers" {...productForm.register('seriesAffected.lotNumbers')} placeholder="npr. 1281203, 1281204" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <Label htmlFor="expiry">Rok trajanja pogođene serije</Label>
                                  <Input id="expiry" {...productForm.register('seriesAffected.expiry')} placeholder="npr. 12.2025" />
                              </div>
                              <div className="space-y-1">
                                  <Label htmlFor="status">Status</Label>
                                  <Input id="status" {...productForm.register('seriesAffected.status')} placeholder="npr. Povučeno iz prodaje"/>
                              </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="finding">Nalaz/Razlog povlačenja</Label>
                                <Textarea id="finding" {...productForm.register('seriesAffected.finding')} placeholder="npr. Prisustvo glutena iznad dozvoljenog nivoa."/>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="sourceLink">Link ka izvoru (zvanično obaveštenje)</Label>
                                <Input id="sourceLink" type="url" {...productForm.register('seriesAffected.sourceLink')} placeholder="https://..."/>
                                {productForm.formState.errors.seriesAffected?.sourceLink && <p className="text-xs text-destructive">{productForm.formState.errors.seriesAffected.sourceLink.message}</p>}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProductFormOpen(false)}>Odustani</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {productToEdit ? 'Sačuvaj izmene' : 'Dodaj proizvod'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Add/Edit Event Dialog */}
      <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{eventToEdit ? 'Izmeni događaj' : 'Dodaj novi događaj'}</DialogTitle>
                <DialogDescription>Popunite detalje o događaju.</DialogDescription>
            </DialogHeader>
            <form onSubmit={eventForm.handleSubmit(handleEventFormSubmit)} className="space-y-4">
                <div className="space-y-1">
                    <Label htmlFor="event-title">Naziv događaja</Label>
                    <Input id="event-title" {...eventForm.register('title')} />
                    {eventForm.formState.errors.title && <p className="text-xs text-destructive">{eventForm.formState.errors.title.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label>Datum</Label>
                        <Controller
                            control={eventForm.control}
                            name="date"
                            render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, "PPP") : <span>Izaberi datum</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        />
                         {eventForm.formState.errors.date && <p className="text-xs text-destructive">{eventForm.formState.errors.date.message}</p>}
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="event-time">Vreme</Label>
                        <Input id="event-time" {...eventForm.register('time')} placeholder="npr. 18:00h" />
                         {eventForm.formState.errors.time && <p className="text-xs text-destructive">{eventForm.formState.errors.time.message}</p>}
                    </div>
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="event-location">Lokacija</Label>
                    <Input id="event-location" {...eventForm.register('location')} placeholder="npr. Kreativni Centar, Beograd" />
                     {eventForm.formState.errors.location && <p className="text-xs text-destructive">{eventForm.formState.errors.location.message}</p>}
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="event-image">URL Slike</Label>
                    <Input id="event-image" {...eventForm.register('imageUrl')} placeholder="https://placehold.co/600x400.png" />
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="event-desc">Opis</Label>
                    <Textarea id="event-desc" {...eventForm.register('description')} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label>Kategorija</Label>
                        <Controller
                            control={eventForm.control}
                            name="category"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Radionica">Radionica</SelectItem>
                                        <SelectItem value="Festival">Festival</SelectItem>
                                        <SelectItem value="Predavanje">Predavanje</SelectItem>
                                        <SelectItem value="Sajam">Sajam</SelectItem>
                                        <SelectItem value="Ostalo">Ostalo</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                     <div className="space-y-1">
                        <Label>Status</Label>
                         <Controller
                            control={eventForm.control}
                            name="status"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Nacrt (Draft)</SelectItem>
                                        <SelectItem value="published">Objavljeno</SelectItem>
                                        <SelectItem value="scheduled">Zakazano</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="event-reg-link">Link za registraciju</Label>
                    <Input id="event-reg-link" {...eventForm.register('registrationLink')} placeholder="https://..." />
                    {eventForm.formState.errors.registrationLink && <p className="text-xs text-destructive">{eventForm.formState.errors.registrationLink.message}</p>}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEventFormOpen(false)}>Odustani</Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sačuvaj'}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>


      {/* Delete Product Confirmation Dialog */}
      <AlertDialog open={isProductDeleteAlertOpen} onOpenChange={setIsProductDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
            <AlertDialogDescription>
              Ova akcija se ne može opozvati. Proizvod "{productToDelete?.name}" će biti trajno obrisan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>Odustani</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProductConfirm} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Obriši'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       {/* Delete Event Confirmation Dialog */}
      <AlertDialog open={isEventDeleteAlertOpen} onOpenChange={setIsEventDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
            <AlertDialogDescription>
              Ova akcija se ne može opozvati. Događaj "{eventToDelete?.title}" će biti trajno obrisan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEventToDelete(null)}>Odustani</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEventConfirm} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Obriši'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* Delete Report Confirmation Dialog */}
      <AlertDialog open={isReportDeleteAlertOpen} onOpenChange={setIsReportDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
            <AlertDialogDescription>
              Ova akcija se ne može opozvati. Prijava će biti trajno obrisana.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReportToDelete(null)}>Odustani</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReportConfirm} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Obriši'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resolve Report Confirmation Dialog */}
      <AlertDialog open={isResolveAlertOpen} onOpenChange={setIsResolveAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Označi kao rešeno?</AlertDialogTitle>
            <AlertDialogDescription>
              Da li ste sigurni da želite da označite ovu prijavu kao rešenu?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReportToResolve(null)}>Odustani</AlertDialogCancel>
            <AlertDialogAction onClick={handleResolveReportConfirm} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Potvrdi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark In Progress Confirmation Dialog */}
      <AlertDialog open={isMarkInProgressAlertOpen} onOpenChange={setIsMarkInProgressAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Označi kao "u toku"?</AlertDialogTitle>
            <AlertDialogDescription>
              Da li ste sigurni da želite da označite ovu prijavu kao "u toku"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReportToMarkInProgress(null)}>Odustani</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkInProgressConfirm} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Potvrdi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
