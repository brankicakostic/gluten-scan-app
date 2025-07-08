// This file uses the Firebase client SDK, but is intended for use in Server Components
// to fetch data from Firestore.

import { db } from '@/lib/firebase/client';
import { collection, getDocs, doc, getDoc, query, orderBy, limit } from 'firebase/firestore';
import type { Product } from '@/lib/products';

// The data in Firestore should be structured according to the Product type.
// This function assumes documents in the 'products' collection have fields matching the Product type.
// The document ID from Firestore will be used as the product's `id`.

/**
 * Fetches all products from the Firestore 'products' collection.
 * @returns A promise that resolves to an array of products.
 */
export async function getProducts(): Promise<Product[]> {
    try {
        const productsCol = collection(db, 'products');
        const q = query(productsCol, orderBy("name")); // Order by name for consistent results
        const productSnapshot = await getDocs(q);
        const productList = productSnapshot.docs.map(doc => {
            return {
                id: doc.id,
                ...doc.data()
            } as Product;
        });
        return productList;
    } catch (error) {
        console.error("Error fetching products from Firestore: ", error);
        return []; // Return an empty array on error
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
        // A simple query to get some products. In a real app, this might be based on a 'featured' flag.
        const q = query(productsCol, orderBy("name"), limit(count));
        const productSnapshot = await getDocs(q);
        const productList = productSnapshot.docs.map(doc => {
            return {
                id: doc.id,
                ...doc.data()
            } as Product;
        });
        return productList;
    } catch (error) {
        console.error("Error fetching featured products from Firestore: ", error);
        return []; // Return an empty array on error
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

        return {
            id: productSnap.id,
            ...productSnap.data()
        } as Product;
    } catch (error) {
        console.error(`Error fetching product with ID ${id}: `, error);
        return null;
    }
}
