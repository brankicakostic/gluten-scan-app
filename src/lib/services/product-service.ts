
// This file uses the Firebase client SDK, but is intended for use in Server Components
// to fetch data from Firestore.

import { db } from '@/lib/firebase/client';
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
    if (!imageUrl) {
        return 'https://placehold.co/400x200.png';
    }
    if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
        return imageUrl; 
    }

    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucket) {
        console.warn('Firebase storage bucket is not configured. Using placeholder for images.');
        return 'https://placehold.co/400x200.png';
    }
    
    // Assuming the path in DB is relative to a 'products' folder in storage
    const fullPath = `products/${imageUrl}`;
    const encodedPath = encodeURIComponent(fullPath);
    
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
}

/**
 * Maps a Firestore document to a structured Product object, normalizing inconsistent fields.
 * @param doc The Firestore document snapshot.
 * @returns A normalized Product object.
 */
function mapDocToProduct(doc: QueryDocumentSnapshot<DocumentData> | DocumentData): Product {
    const data = doc.data();
    
    const productData: any = {
        id: doc.id,
        ...data,
        name: data.name || 'Bez imena', // Ensure name is always a string to prevent crashes
        description: data.description || '', // Fallback for missing description
        imageUrl: transformImageUrl(data.imageUrl || ''),
    };

    // Normalize category field
    productData.category = data.category || data.jsonCategory || 'Nekategorizovano';

    // 1. Map ingredients array to ingredientsText string
    if (Array.isArray(data.ingredients)) {
        productData.ingredientsText = data.ingredients.join(', ');
    } else if (typeof data.ingredients === 'string') {
        productData.ingredientsText = data.ingredients;
    }

    // 2. Normalize nutriscore to nutriScore
    if (data.nutriscore) {
        productData.nutriScore = data.nutriscore;
    }

    // 3. Map boolean flags from the database
    productData.hasAOECSLicense = !!data.license;
    productData.hasManufacturerStatement = !!data.manufacturerStatement;
    productData.isVerifiedAdmin = !!data.verified;

    // 4. Map tagsFromInput to the 'tags' property and derive boolean dietary flags
    const tags = data.tagsFromInput || [];
    productData.tags = tags;
    const tagsLower = new Set(tags.map((t: string) => t.toLowerCase()));
    
    productData.isPosno = tagsLower.has('posno');
    productData.isSugarFree = tagsLower.has('bez šećera') || tagsLower.has('sugar-free');
    productData.isLactoseFree = tagsLower.has('bez laktoze') || tagsLower.has('lactose-free');
    productData.isVegan = tagsLower.has('vegan');
    productData.isHighProtein = tagsLower.has('protein') || tagsLower.has('high-protein');

    return productData as Product;
}

/**
 * Maps a Product object to a Firestore document data structure for saving.
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
    if (product.note) data.note = product.note;
    if (product.stores) data.stores = product.stores;

    // Handle image URL (storing only the relative path)
    if (product.imageUrl) {
        if (product.imageUrl.includes('firebasestorage')) {
             // Extract relative path if it's a full URL
             try {
                const url = new URL(product.imageUrl);
                const path = decodeURIComponent(url.pathname);
                const relativePath = path.substring(path.indexOf('/o/') + 3).replace('products/','');
                data.imageUrl = relativePath;
             } catch (e) {
                data.imageUrl = 'placeholder.png'; // fallback
             }
        } else if (!product.imageUrl.startsWith('http')) {
            data.imageUrl = product.imageUrl;
        }
    }

    // Boolean to database fields
    data.license = !!product.hasAOECSLicense;
    data.manufacturerStatement = !!product.hasManufacturerStatement;
    data.verified = !!product.isVerifiedAdmin;
    data.warning = !!product.warning;

    // ingredientsText string to ingredients array
    if (product.ingredientsText) {
        data.ingredients = product.ingredientsText.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    // Booleans to tagsFromInput array
    const tags = new Set<string>(product.tags || []);
    if (product.isVegan) tags.add('vegan'); else tags.delete('vegan');
    if (product.isPosno) tags.add('posno'); else tags.delete('posno');
    if (product.isSugarFree) tags.add('bez šećera'); else tags.delete('bez šećera');
    if (product.isLactoseFree) tags.add('bez laktoze'); else tags.delete('bez laktoze');
    if (product.isHighProtein) tags.add('protein'); else tags.delete('protein');
    data.tagsFromInput = Array.from(tags);

    return data;
}

/**
 * Fetches all products from the Firestore 'products' collection.
 * @returns A promise that resolves to an array of products.
 */
export async function getProducts(): Promise<Product[]> {
    if (!db) {
        console.warn("Firestore is not initialized. Skipping getProducts.");
        return [];
    }
    try {
        const productsCol = collection(db, 'products');
        // Removed orderBy to prevent issues with missing Firestore indexes. Sorting is now done in-memory.
        const q = query(productsCol);
        const productSnapshot = await getDocs(q);
        const productList = productSnapshot.docs
            .map(mapDocToProduct)
            .filter(p => p.name !== 'Bez imena'); // Filter out products that were missing a name
        
        // Sort products by name alphabetically in JavaScript, respecting Serbian locale
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
    if (!db) {
        console.warn("Firestore is not initialized. Skipping getFeaturedProducts.");
        return [];
    }
    try {
        const productsCol = collection(db, 'products');
        // Removed orderBy to prevent issues with missing Firestore indexes.
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
    if (!db) {
        console.warn(`Firestore is not initialized. Skipping getProductById for ID: ${id}.`);
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
    if (!db) {
        console.warn(`Firestore is not initialized. Skipping getProductByBarcode for barcode: ${barcode}.`);
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
  if (!db) {
    throw new Error("Firestore is not initialized. Cannot delete product.");
  }
  const productDocRef = doc(db, 'products', productId);
  await deleteDoc(productDocRef);
}
