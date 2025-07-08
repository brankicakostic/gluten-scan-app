'use server';

import { revalidatePath } from 'next/cache';
import { createProduct, updateProduct, deleteProduct } from '@/lib/services/product-service';
import type { Product } from '@/lib/products';

// Server Action to add a product
export async function addProductAction(productData: Partial<Product>) {
  try {
    const newProductId = await createProduct(productData);
    revalidatePath('/[locale]/admin', 'page');
    revalidatePath('/[locale]/products', 'page');
    return { success: true, id: newProductId };
  } catch (error) {
    console.error('Error in addProductAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
}

// Server Action to update a product
export async function updateProductAction(productId: string, productData: Partial<Product>) {
  try {
    await updateProduct(productId, productData);
    revalidatePath('/[locale]/admin', 'page');
    revalidatePath('/[locale]/products', 'page');
    revalidatePath(`/[locale]/products/${productId}`, 'page');
    return { success: true };
  } catch (error) {
    console.error('Error in updateProductAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
}

// Server Action to delete a product
export async function deleteProductAction(productId: string) {
  try {
    await deleteProduct(productId);
    revalidatePath('/[locale]/admin', 'page');
    revalidatePath('/[locale]/products', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteProductAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
}
