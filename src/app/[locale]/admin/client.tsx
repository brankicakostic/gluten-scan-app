'use client';

import { useState, useEffect } from 'react';
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
import { Shield, PlusCircle, Edit, Trash2, Loader2, MessageSquareWarning, Mail, Flag } from 'lucide-react';
import type { Product } from '@/lib/products';
import type { Report } from '@/lib/reports';
import { addProductAction, updateProductAction, deleteProductAction } from '@/app/actions/product-actions';
import { deleteReportAction } from '@/app/actions/report-actions';
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
}

export default function AdminClientPage({ initialProducts, initialReports }: AdminClientPageProps) {
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

  // Common state
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => setProducts(initialProducts), [initialProducts]);
  useEffect(() => setReports(initialReports), [initialReports]);

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
      default: return <Badge variant="outline">N/A</Badge>;
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
                <TabsTrigger value="reports">Prijave <Badge variant="destructive" className="ml-2">{reports.length}</Badge></TabsTrigger>
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
                 <Card>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Datum</TableHead>
                          <TableHead>Tip</TableHead>
                          <TableHead>Prioritet</TableHead>
                          <TableHead>Komentar</TableHead>
                          <TableHead>Kontakt</TableHead>
                          <TableHead className="text-right">Akcije</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="text-xs">{new Date(report.createdAt).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={report.type === 'error' ? 'destructive' : 'secondary'}>
                                {report.type === 'error' ? 'Greška' : 'Upit'}
                              </Badge>
                            </TableCell>
                            <TableCell>{getPriorityBadge(report.priority)}</TableCell>
                            <TableCell className="text-xs max-w-sm">
                                <p className="font-semibold">{report.comment || 'N/A'}</p>
                                <p className="text-muted-foreground mt-1 truncate"><strong>Kontekst:</strong> {report.productContext}</p>
                            </TableCell>
                            <TableCell className="text-xs">{report.wantsContact ? report.contactEmail : 'Nije zatražen'}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="destructive" size="icon" onClick={() => handleDeleteReportClick(report)}>
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
    </div>
  );
}
