
// This file uses the Firebase client SDK, but is intended for use in Server Components
// to fetch data from Firestore.

import { getDb } from '@/lib/firebase/client';
import { collection, getDocs, doc, getDoc, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Product } from '@/lib/products';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';


/**
 * Helper to construct the full Firebase Storage URL from a relative path.
 * If the URL is already absolute or a placeholder, it returns it as is.
 * @param imageUrl The relative path to the image in Firebase Storage.
 * @returns The full, public URL for the image.
 */
function transformImageUrl(imageUrl: string): string {
    if (!imageUrl || imageUrl.includes('placehold.co') || imageUrl.startsWith('/placeholder.svg')) {
        return '/placeholder.svg';
    }
    if (imageUrl.startsWith('http')) {
        // If it's already a full URL (like placeholders) or empty, return it as is.
        return imageUrl;
    }
    // If it starts with a slash, it's a local public asset.
    if (imageUrl.startsWith('/')) {
        return imageUrl;
    }

    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucket) {
        console.warn('Firebase storage bucket is not configured. Using placeholder for images.');
        return '/placeholder.svg';
    }
    
    const encodedPath = encodeURIComponent(`products/${imageUrl}`);
    
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
}


/**
 * Maps a Firestore document to a structured Product object, normalizing inconsistent fields.
 * This function is robust and provides default values for all fields to prevent runtime errors.
 * @param doc The Firestore document snapshot.
 * @returns A normalized Product object.
 */
function mapDocToProduct(doc: QueryDocumentSnapshot<DocumentData> | DocumentData): Product {
    const data = doc.data() || {};
    
    const tags = data.tagsFromInput || [];
    const tagsLower = new Set(tags.map((t: string) => t.toLowerCase()));

    const productData: Product = {
        id: doc.id,
        name: data.name || 'Bez imena',
        brand: data.brand || '',
        barcode: data.barcode || '',
        category: data.category || data.jsonCategory || 'Nekategorizovano',
        imageUrl: transformImageUrl(data.imageUrl || ''),
        description: data.description || '',
        ingredientsText: Array.isArray(data.ingredients) ? data.ingredients.join(', ') : (typeof data.ingredients === 'string' ? data.ingredients : ''),
        labelText: data.labelText || '',
        hasAOECSLicense: !!data.license,
        hasManufacturerStatement: !!data.manufacturerStatement,
        isVerifiedAdmin: !!data.verified,
        source: data.source || '',
        tags: tags,
        nutriScore: data.nutriscore || 'N/A',
        isLactoseFree: tagsLower.has('bez laktoze') || tagsLower.has('lactose-free'),
        isSugarFree: tagsLower.has('bez šećera') || tagsLower.has('sugar-free'),
        isPosno: tagsLower.has('posno'),
        isVegan: tagsLower.has('vegan'),
        isHighProtein: tagsLower.has('protein') || tagsLower.has('high-protein'),
        dataAiHint: data.dataAiHint || '',
        warning: !!data.warning,
        note: data.note || '',
        stores: data.Dostupnost ? data.Dostupnost.split(',').map((s: string) => s.trim()) : [],
        Poreklo: data.Poreklo || '',
        seriesAffected: data.seriesAffected, // This can be undefined
    };

    return productData;
}


/**
 * Maps a Product object to a Firestore document data structure for saving.
 * This ensures data consistency by storing image paths without any 'products/' prefix.
 * @param product The Product object.
 * @returns A plain object suitable for Firestore.
 */
function mapProductToDocData(product: Partial<Product>): DocumentData {
    const data: DocumentData = {};
    
    // Direct mappings
    if (product.name) data.name = product.name;
    if (product.brand) data.brand = product.brand;
    if (product.barcode) data.barcode = product.barcode;
    if (product.category) data.category = product.category;
    if (product.description) data.description = product.description;
    if (product.labelText) data.labelText = product.labelText;
    if (product.source) data.source = product.source;
    if (product.nutriScore) data.nutriscore = product.nutriScore;
    if (product.stores) data.Dostupnost = product.stores.join(', ');
    if (product.Poreklo) data.Poreklo = product.Poreklo;

    // Handle image URL, storing only the relative path
    if (product.imageUrl) {
        if (product.imageUrl.includes('firebasestorage')) {
             try {
                const url = new URL(product.imageUrl);
                const path = decodeURIComponent(url.pathname);
                const prefix = `/o/products%2F`;
                const startIndex = path.indexOf(prefix);
                if (startIndex !== -1) {
                  data.imageUrl = path.substring(startIndex + prefix.length);
                } else {
                  data.imageUrl = path.substring(path.indexOf('/o/') + 3);
                }
             } catch (e) {
                data.imageUrl = product.imageUrl;
             }
        } else if (!product.imageUrl.startsWith('http') && product.imageUrl !== '/placeholder.svg') {
            data.imageUrl = product.imageUrl;
        }
    }

    // Boolean to database fields
    data.license = !!product.hasAOECSLicense;
    data.manufacturerStatement = !!product.hasManufacturerStatement;
    data.verified = !!product.isVerifiedAdmin;

    // ingredientsText string to ingredients array
    if (product.ingredientsText) {
        data.ingredients = product.ingredientsText.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    // Booleans and tags to tagsFromInput array
    const tags = new Set<string>(product.tags || []);
    if (product.isVegan) tags.add('vegan'); else tags.delete('vegan');
    if (product.isPosno) tags.add('posno'); else tags.delete('posno');
    if (product.isSugarFree) tags.add('bez šećera'); else tags.delete('bez šećera');
    if (product.isLactoseFree) tags.add('bez laktoze'); else tags.delete('bez laktoze');
    if (product.isHighProtein) tags.add('high-protein'); else tags.delete('high-protein');
    data.tagsFromInput = Array.from(tags);

    // Handle recall information
    data.warning = !!product.warning;
    if (data.warning) {
        data.note = product.note || '';
        if (product.seriesAffected) {
            data.seriesAffected = {
                lotNumbers: product.seriesAffected.lotNumbers || [],
                expiry: product.seriesAffected.expiry || '',
                finding: product.seriesAffected.finding || '',
                status: product.seriesAffected.status || '',
                sourceLink: product.seriesAffected.sourceLink || '',
            };
        }
    } else {
        // If not a warning, clear the recall fields
        data.note = '';
        data.seriesAffected = null;
    }

    return data;
}

/**
 * Fetches all products from the Firestore 'products' collection.
 * @returns A promise that resolves to an array of products.
 */
export async function getProducts(): Promise<Product[]> {
    const db = getDb();
    if (!db) {
        return [];
    }
    try {
        const productsCol = collection(db, 'products');
        const q = query(productsCol);
        const productSnapshot = await getDocs(q);
        const productList = productSnapshot.docs
            .map(mapDocToProduct)
            .filter(p => p.name !== 'Bez imena');
        
        productList.sort((a, b) => a.name.localeCompare(b.name, 'sr'));

        return productList;
    } catch (error) {
        console.error("Error fetching products from Firestore: ", error);
        return [];
    }
}

/**
 * Fetches a specified number of products for display on the homepage.
 * @param count The number of products to fetch. Defaults to 8.
 * @returns A promise that resolves to an array of featured products.
 */
export async function getFeaturedProducts(count: number = 8): Promise<Product[]> {
    const db = getDb();
    if (!db) {
        return [];
    }
    try {
        const productsCol = collection(db, 'products');
        const q = query(productsCol, limit(count));
        const productSnapshot = await getDocs(q);
        const productList = productSnapshot.docs.map(mapDocToProduct);
        return productList;
    } catch (error) {
        console.error("Error fetching featured products from Firestore: ", error);
        return [];
    }
}

/**
 * Fetches a single product by its Firestore document ID.
 * @param id The document ID of the product to fetch.
 * @returns A promise that resolves to the product object or null if not found.
 */
export async function getProductById(id: string): Promise<Product | null> {
    const db = getDb();
    if (!db) {
        return null;
    }
    try {
        const productDocRef = doc(db, 'products', id);
        const productSnap = await getDoc(productDocRef);

        if (!productSnap.exists()) {
            console.warn(`Product with ID ${id} not found in Firestore.`);
            return null;
        }
        
        return mapDocToProduct(productSnap);
    } catch (error) {
        console.error(`Error fetching product with ID ${id}: `, error);
        return null;
    }
}

/**
 * Fetches a single product by its barcode from the Firestore 'products' collection.
 * @param barcode The barcode of the product to fetch.
 * @returns A promise that resolves to the product object or null if not found.
 */
export async function getProductByBarcode(barcode: string): Promise<Product | null> {
    const db = getDb();
    if (!db) {
        return null;
    }
    try {
        const productsCol = collection(db, 'products');
        const q = query(productsCol, where("barcode", "==", barcode), limit(1));
        const productSnapshot = await getDocs(q);

        if (productSnapshot.empty) {
            console.log(`Product with barcode ${barcode} not found.`);
            return null;
        }
        
        return mapDocToProduct(productSnapshot.docs[0]);

    } catch (error) {
        console.error(`Error fetching product with barcode ${barcode}: `, error);
        return null;
    }
}


/**
 * Creates a new product in Firestore.
 * @param productData The product data to save.
 * @returns The ID of the newly created document.
 */
export async function createProduct(productData: Partial<Product>): Promise<string> {
  const db = getDb();
  if (!db) {
    throw new Error("Firestore is not initialized. Cannot create product.");
  }
  const dataToSave = mapProductToDocData(productData);
  const productsCol = collection(db, 'products');
  const docRef = await addDoc(productsCol, dataToSave);
  return docRef.id;
}

/**
 * Updates an existing product in Firestore.
 * @param productId The ID of the product to update.
 * @param productData The data to update.
 */
export async function updateProduct(productId: string, productData: Partial<Product>): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error("Firestore is not initialized. Cannot update product.");
  }
  const dataToSave = mapProductToDocData(productData);
  const productDocRef = doc(db, 'products', productId);
  await updateDoc(productDocRef, dataToSave);
}

/**
 * Deletes a product from Firestore.
 * @param productId The ID of the product to delete.
 */
export async function deleteProduct(productId: string): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error("Firestore is not initialized. Cannot delete product.");
  }
  const productDocRef = doc(db, 'products', productId);
  await deleteDoc(productDocRef);
}

    