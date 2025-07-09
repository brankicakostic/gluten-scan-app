// This file configures the Firebase client SDK.
// It is safe to be used in both client and server components.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

// Singleton instances, initialized to null. They will be populated by initializeFirebase.
let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

// The initialization function, which will be called lazily.
function initializeFirebase() {
  // If already initialized, do nothing.
  if (appInstance) return;

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  // This check now only runs when Firebase is first used, not on module load.
  if (!firebaseConfig.projectId) {
    throw new Error("Firebase 'projectId' is missing. Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID in your .env file.");
  }

  // Initialize the app, or get the existing one.
  appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  dbInstance = getFirestore(appInstance);
}

/**
 * Creates a proxy object that lazily initializes Firebase upon first property access.
 * This prevents the app from crashing during build or server-side rendering if
 * environment variables are not yet available.
 * @param getInstance A function that returns the initialized instance (e.g., () => dbInstance).
 * @returns A proxy that behaves like the instance but initializes it on demand.
 */
function createLazyProxy<T extends object>(getInstance: () => T | null): T {
  // The 'as T' cast is safe because the proxy will forward all properties to the real object.
  return new Proxy({}, {
    get(target, prop, receiver) {
      // Ensure initialization on any property access.
      initializeFirebase(); 
      const instance = getInstance();
      if (!instance) {
        // This should not happen if initializeFirebase works correctly.
        throw new Error('Firebase instance is not available after initialization.');
      }
      // Forward the property access to the real, initialized instance.
      return Reflect.get(instance, prop, receiver);
    }
  }) as T;
}

// Export lazy-loaded app and db instances using proxies.
// This maintains the original import syntax (`import { db } from '...'`) across the app,
// avoiding the need for widespread refactoring.
const db = createLazyProxy(() => dbInstance);
const app = createLazyProxy(() => appInstance);

export { app, db };
