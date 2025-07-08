'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
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
import { Shield, PlusCircle, Edit, Trash2, Loader2, Mail, CheckSquare, ExternalLink, Hourglass, Save, MessageSquare, Flag } from 'lucide-react';
import type { Product } from '@/lib/products';
import type { Report } from '@/lib/reports';
import { addProductAction, updateProductAction, deleteProductAction } from '@/app/actions/product-actions';
import { deleteReportAction, updateReportStatusAction, updateReportNotesAction } from '@/app/actions/report-actions';
import { useToast } from '@/hooks/use-toast';

// Zod schema for form validation
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
  hasAOECSLicense: z.boolean().optional(),
  hasManufacturerStatement: z.boolean().optional(),
  isVerifiedAdmin: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isPosno: z.boolean().optional(),
  isSugarFree: z.boolean().optional(),
  isLactoseFree: z.boolean().optional(),
  isHighProtein: z.boolean().optional(),
  tags: z.string().optional().transform(value => value ? value.split(',').map(tag => tag.trim()).filter(Boolean) : []),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface AdminClientPageProps {
  initialProducts: Product[];
  initialReports: Report[];
  locale: string;
}

export default function AdminClientPage({ initialProducts, initialReports, locale }: AdminClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Products state
  const [products, setProducts] = useState(initialProducts);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
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


  // Common state
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => setProducts(initialProducts), [initialProducts]);
  useEffect(() => {
    setReports(initialReports);
    const initialNotes = initialReports.reduce((acc, report) => {
      acc[report.id] = report.adminNotes || '';
      return acc;
    }, {} as Record<string, string>);
    setAdminNotes(initialNotes);
  }, [initialReports]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {},
  });

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123')) {
      setIsAuthenticated(true);
    } else {
      toast({ variant: 'destructive', title: 'Netačna lozinka' });
    }
  };

  const handleOpenForm = (product?: Product) => {
    setProductToEdit(product || null);
    form.reset(product ? { ...product, tags: product.tags?.join(', ') } : {});
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    const action = data.id ? updateProductAction(data.id, data) : addProductAction(data);
    
    const result = await action;
    setIsLoading(false);

    if (result.success) {
      toast({ title: `Proizvod ${data.id ? 'ažuriran' : 'dodan'}!` });
      setIsFormOpen(false);
      router.refresh(); 
    } else {
      toast({ variant: 'destructive', title: 'Greška', description: result.error });
    }
  };

  const handleDeleteProductClick = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteProductConfirm = async () => {
    if (!productToDelete?.id) return;
    setIsLoading(true);
    const result = await deleteProductAction(productToDelete.id);
    setIsLoading(false);
    setIsDeleteAlertOpen(false);

    if (result.success) {
      toast({ title: `Proizvod "${productToDelete.name}" obrisan.` });
      router.refresh();
    } else {
      toast({ variant: 'destructive', title: 'Greška pri brisanju', description: result.error });
    }
    setProductToDelete(null);
  };

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


  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarRail />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            <PageHeader title="Admin Panel" description="Upravljanje bazom podataka i prijavama korisnika." icon={Shield} />

            <Tabs defaultValue="products">
              <TabsList className="mb-4">
                <TabsTrigger value="products">Proizvodi</TabsTrigger>
                <TabsTrigger value="reports">Prijave i Upiti <Badge variant="destructive" className="ml-2">{reports.filter(r => r.status === 'new').length}</Badge></TabsTrigger>
              </TabsList>

              {/* Products Tab */}
              <TabsContent value="products">
                <div className="flex justify-end mb-4">
                  <Button onClick={() => handleOpenForm()}>
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
                          <TableHead className="text-right">Akcije</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.brand}</TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button variant="outline" size="icon" onClick={() => handleOpenForm(product)}>
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
            </Tabs>

          </div>
        </main>
      </SidebarInset>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{productToEdit ? 'Izmeni proizvod' : 'Dodaj novi proizvod'}</DialogTitle>
            <DialogDescription>Popunite detalje o proizvodu.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="name">Naziv</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="brand">Brend</Label>
                <Input id="brand" {...form.register('brand')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="category">Kategorija</Label>
                <Input id="category" {...form.register('category')} />
                 {form.formState.errors.category && <p className="text-xs text-destructive">{form.formState.errors.category.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="barcode">Barcode</Label>
                <Input id="barcode" {...form.register('barcode')} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="imageUrl">URL Slike (relativni putanja)</Label>
              <Input id="imageUrl" placeholder="npr. aleksandrija-fruska-gora/instant-palenta.png" {...form.register('imageUrl')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Opis</Label>
              <Textarea id="description" {...form.register('description')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ingredientsText">Sastojci (odvojeni zarezom)</Label>
              <Textarea id="ingredientsText" {...form.register('ingredientsText')} />
            </div>
             <div className="space-y-1">
                <Label htmlFor="tags">Tagovi (odvojeni zarezom)</Label>
                <Input id="tags" placeholder="npr. povučeno, sadrži-gluten, upozorenje" {...form.register('tags')} />
              </div>
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <Label htmlFor="nutriScore">Nutri-Score</Label>
                    <Input id="nutriScore" {...form.register('nutriScore')} />
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                 <Controller name="hasAOECSLicense" control={form.control} render={({ field }) => <Checkbox id="hasAOECSLicense" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="hasAOECSLicense">AOECS Licenca</Label>
              </div>
              <div className="flex items-center space-x-2">
                 <Controller name="hasManufacturerStatement" control={form.control} render={({ field }) => <Checkbox id="hasManufacturerStatement" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="hasManufacturerStatement">Izjava proizvođača</Label>
              </div>
               <div className="flex items-center space-x-2">
                 <Controller name="isVerifiedAdmin" control={form.control} render={({ field }) => <Checkbox id="isVerifiedAdmin" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="isVerifiedAdmin">Admin Verifikovan</Label>
              </div>
               <div className="flex items-center space-x-2">
                 <Controller name="isVegan" control={form.control} render={({ field }) => <Checkbox id="isVegan" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="isVegan">Vegan</Label>
              </div>
               <div className="flex items-center space-x-2">
                 <Controller name="isPosno" control={form.control} render={({ field }) => <Checkbox id="isPosno" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="isPosno">Posno</Label>
              </div>
               <div className="flex items-center space-x-2">
                 <Controller name="isSugarFree" control={form.control} render={({ field }) => <Checkbox id="isSugarFree" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="isSugarFree">Bez šećera</Label>
              </div>
                <div className="flex items-center space-x-2">
                 <Controller name="isLactoseFree" control={form.control} render={({ field }) => <Checkbox id="isLactoseFree" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="isLactoseFree">Bez laktoze</Label>
              </div>
               <div className="flex items-center space-x-2">
                 <Controller name="isHighProtein" control={form.control} render={({ field }) => <Checkbox id="isHighProtein" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="isHighProtein">Bogat proteinima</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Odustani</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {productToEdit ? 'Sačuvaj izmene' : 'Dodaj proizvod'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Product Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
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
