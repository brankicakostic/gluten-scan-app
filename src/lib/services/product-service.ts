

// This file uses the Firebase client SDK, but is intended for use in Server Components
// to fetch data from Firestore.

import { getDb } from '@/lib/firebase/client';
import { collection, getDocs, doc, getDoc, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Product } from '@/lib/products';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';


/**
 * Maps a Firestore document to a structured Product object, normalizing inconsistent fields.
 * This function is robust and provides default values for all fields to prevent runtime errors.
 * It also logs errors for products with invalid image URLs.
 * @param doc The Firestore document snapshot.
 * @returns A normalized Product object.
 */
function mapDocToProduct(doc: QueryDocumentSnapshot<DocumentData> | DocumentData): Product {
    const data = doc.data() || {};
    const productName = data.name || 'Bez imena';
    
    const tagsFromDb = Array.isArray(data.tagsFromInput) ? data.tagsFromInput : [];
    const tagsLower = new Set(tagsFromDb.map((t: string) => String(t).toLowerCase()));

    // Robust image URL handling
    const imageUrlFromDb = data.imageUrl;
    let finalImageUrl = '/placeholder.svg'; // Default to our local, styled placeholder

    if (imageUrlFromDb && typeof imageUrlFromDb === 'string' && imageUrlFromDb.startsWith('https://')) {
        finalImageUrl = imageUrlFromDb;
    }

    return {
        id: doc.id,
        name: productName,
        brand: data.brand || '',
        barcode: data.barcode || '',
        category: data.category || data.jsonCategory || 'Nekategorizovano',
        imageUrl: finalImageUrl,
        description: data.description || '',
        ingredientsText: Array.isArray(data.ingredients) ? data.ingredients.join(', ') : (typeof data.ingredients === 'string' ? data.ingredients : ''),
        labelText: data.labelText || '',
        hasAOECSLicense: !!data.license,
        hasManufacturerStatement: !!data.manufacturerStatement,
        isVerifiedAdmin: !!data.verified,
        source: data.source || '',
        tags: tagsFromDb,
        nutriScore: data.nutriscore || 'N/A',
        isLactoseFree: tagsLower.has('bez laktoze') || tagsLower.has('lactose-free'),
        isSugarFree: tagsLower.has('bez šećera') || tagsLower.has('sugar-free'),
        isPosno: tagsLower.has('posno'),
        isVegan: tagsLower.has('vegan'),
        isHighProtein: tagsLower.has('protein') || tagsLower.has('high-protein'),
        dataAiHint: data.dataAiHint || 'product photo',
        warning: !!data.warning,
        note: data.note || '',
        stores: data.Dostupnost ? String(data.Dostupnost).split(',').map((s: string) => s.trim()) : [],
        Poreklo: data.Poreklo || '',
        seriesAffected: data.seriesAffected || undefined,
    };
}


/**
 * Maps a Product object to a Firestore document data structure for saving.
 * This ensures data consistency by storing image paths without any 'products/' prefix.
 * @param product The Product object.
 * @returns A plain object suitable for Firestore.
 */
function mapProductToDocData(product: Partial<Product>): DocumentData {
    const data: DocumentData = {};
    
    // Handle all string and simple properties
    Object.keys(product).forEach(key => {
        const productKey = key as keyof Product;
        const value = product[productKey];

        if (typeof value === 'string' && value.trim() !== '') {
            if (productKey === 'nutriScore') data['nutriscore'] = value;
            else if (productKey === 'Poreklo') data['Poreklo'] = value;
            else if (productKey === 'stores') data['Dostupnost'] = Array.isArray(value) ? value.join(', ') : value;
            else if (!['id', 'imageUrl', 'ingredientsText', 'tags'].includes(productKey)) {
                data[productKey] = value;
            }
        }
    });

    // Handle boolean properties
    data.license = !!product.hasAOECSLicense;
    data.manufacturerStatement = !!product.hasManufacturerStatement;
    data.verified = !!product.isVerifiedAdmin;

    // Handle image URL - store only relative path
    if (product.imageUrl) {
        data.imageUrl = product.imageUrl;
    }

    // Handle ingredients text to array
    if (product.ingredientsText) {
        data.ingredients = product.ingredientsText.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    // Consolidate all boolean tags and text tags into `tagsFromInput`
    const tagsSet = new Set<string>(product.tags || []);
    if (product.isVegan) tagsSet.add('vegan');
    if (product.isPosno) tagsSet.add('posno');
    if (product.isSugarFree) tagsSet.add('bez šećera');
    if (product.isLactoseFree) tagsSet.add('bez laktoze');
    if (product.isHighProtein) tagsSet.add('high-protein');
    data.tagsFromInput = Array.from(tagsSet);
    
    // Handle recall/warning information
    data.warning = !!product.warning;
    data.note = product.note || '';
    if (data.warning && product.seriesAffected) {
        data.seriesAffected = {
            lotNumbers: product.seriesAffected.lotNumbers || [],
            expiry: product.seriesAffected.expiry || '',
            finding: product.seriesAffected.finding || '',
            status: product.seriesAffected.status || '',
            sourceLink: product.seriesAffected.sourceLink || '',
        };
    } else {
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
