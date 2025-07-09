// This file configures the Firebase client SDK.
// It is safe to be used in both client and server components.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

let db: Firestore | null = null;
let initialized = false;

/**
 * Initializes the Firebase app and Firestore instance.
 * This function is designed to run only once.
 * If initialization fails (e.g., missing config), it logs an error
 * and ensures the db instance remains null.
 * @returns The initialized Firestore instance or null if initialization fails.
 */
function initializeFirebase(): Firestore | null {
    if (initialized) {
        return db;
    }
    initialized = true; // Mark as attempted

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };

    if (!firebaseConfig.projectId) {
        console.warn("Firebase 'projectId' is missing. Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID in your .env file. Firebase features will be disabled.");
        db = null;
        return null;
    }

    try {
        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        db = getFirestore(app);
        return db;
    } catch (error) {
        console.error("An error occurred during Firebase initialization:", error);
        db = null;
        return null;
    }
}

/**
 * A getter function for the Firestore database instance.
 * It ensures that Firebase is initialized before returning the instance.
 * @returns The Firestore instance or null if it's not available.
 */
export const getDb = (): Firestore | null => {
    // This will either return the already initialized instance
    // or attempt to initialize it on the first call.
    return initializeFirebase();
};
