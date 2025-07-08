
// This file uses the Firebase client SDK, but is intended for use in Server Components
// to fetch data from Firestore.

import { db } from '@/lib/firebase/client';
import { collection, getDocs, doc, getDoc, query, orderBy, limit } from 'firebase/firestore';
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
    
    const fullPath = `products/${imageUrl}`;
    const encodedPath = encodeURIComponent(fullPath);
    
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
}

/**
 * Maps a Firestore document to a structured Product object, normalizing inconsistent fields.
 * @param doc The Firestore document snapshot.
 * @returns A normalized Product object.
 */
function mapDocToProduct(doc: QueryDocumentSnapshot<DocumentData>): Product {
    const data = doc.data();
    const productData: any = {
        id: doc.id,
        ...data,
        imageUrl: transformImageUrl(data.imageUrl),
    };

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
    if (data.tagsFromInput) {
        productData.tags = data.tagsFromInput;
        const tagsLower = new Set(data.tagsFromInput.map((t: string) => t.toLowerCase()));
        
        productData.isPosno = tagsLower.has('posno');
        productData.isSugarFree = tagsLower.has('bez šećera') || tagsLower.has('sugar-free');
        productData.isLactoseFree = tagsLower.has('bez laktoze') || tagsLower.has('lactose-free');
        productData.isVegan = tagsLower.has('vegan');
        productData.isHighProtein = tagsLower.has('protein') || tagsLower.has('high-protein');
    }

    return productData as Product;
}


/**
 * Fetches all products from the Firestore 'products' collection.
 * @returns A promise that resolves to an array of products.
 */
export async function getProducts(): Promise<Product[]> {
    try {
        const productsCol = collection(db, 'products');
        const q = query(productsCol, orderBy("name"));
        const productSnapshot = await getDocs(q);
        const productList = productSnapshot.docs.map(mapDocToProduct);
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
    try {
        const productsCol = collection(db, 'products');
        const q = query(productsCol, orderBy("name"), limit(count));
        const productSnapshot = await getDocs(q);
        const productList = productSnapshot.docs.map(mapDocToProduct);
        return productList;
    } catch (error) {
        console.error("Error fetching featured products from Firestore: ", error);
        return [];
    }
}

/**
 * Fetches a single product by its ID from the Firestore 'products' collection.
 * The ID is expected to be the Firestore document ID.
 * @param id The document ID of the product to fetch.
 * @returns A promise that resolves to the product object or null if not found.
 */
export async function getProductById(id: string): Promise<Product | null> {
    try {
        const productDocRef = doc(db, 'products', id);
        const productSnap = await getDoc(productDocRef);

        if (!productSnap.exists()) {
            console.warn(`Product with ID ${id} not found in Firestore.`);
            return null;
        }
        
        // Use the same mapping function for consistency
        return mapDocToProduct(productSnap as QueryDocumentSnapshot<DocumentData>);
    } catch (error) {
        console.error(`Error fetching product with ID ${id}: `, error);
        return null;
    }
}
