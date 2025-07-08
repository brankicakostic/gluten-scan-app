// This is a Server Component responsible for fetching a single product.
import { getProductById } from '@/lib/services/product-service';
import ProductDetailClient from './client';
import { PageHeader } from '@/components/page-header';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ProductDetailPageProps {
  params: {
    productId: string;
    locale: string;
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  // Fetch the product on the server
  const product = await getProductById(params.productId);

  if (!product) {
    return (
      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          <PageHeader
            title="Product Not Found"
            description="The product you are looking for does not exist or could not be loaded."
            icon={AlertTriangle}
          />
          <div className="text-center">
            <Button asChild variant="outline">
              <Link href={`/${params.locale}/products`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return <ProductDetailClient product={product} />;
}
