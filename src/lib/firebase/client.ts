// This file configures the Firebase client SDK.
// It is safe to be used in both client and server components.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

// Singleton instances, initialized to null.
let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let hasInitializationAttempted = false;

// The initialization function.
function initializeFirebase() {
  // Only attempt to initialize once.
  if (hasInitializationAttempted) return;
  hasInitializationAttempted = true;

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  // Check for the essential projectId.
  if (!firebaseConfig.projectId) {
    console.error("Firebase 'projectId' is missing. Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID in your .env file. Firebase features will be disabled.");
    return; // Exit without initializing.
  }

  try {
    // Initialize the app, or get the existing one.
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    dbInstance = getFirestore(appInstance);
  } catch (error) {
      console.error("An error occurred during Firebase initialization:", error);
      // Ensure instances are null if initialization fails.
      appInstance = null;
      dbInstance = null;
  }
}

/**
 * Creates a proxy object that lazily initializes Firebase upon first property access.
 */
function createLazyProxy<T extends object>(getInstance: () => T | null): T {
  return new Proxy({}, {
    get(target, prop, receiver) {
      initializeFirebase(); 
      const instance = getInstance();
      
      // If initialization failed, the instance will be null.
      // Reflect.get on a null/undefined target will throw a TypeError.
      // This TypeError should be caught by the try/catch blocks in the service files.
      if (!instance) {
          // This check is to provide a slightly more helpful error in the console
          // before the TypeError is thrown.
          if (prop !== 'then') { // Avoid logging on promise checks
            console.error(`Firebase not initialized. Cannot access property "${String(prop)}". Please check your .env configuration.`);
          }
      }
      
      // The non-null assertion operator (!) is used here because if instance is null,
      // we want the code to throw a TypeError, which will then be caught upstream.
      return Reflect.get(instance!, prop, receiver);
    }
  }) as T;
}

// Export lazy-loaded app and db instances.
const db = createLazyProxy(() => dbInstance);
const app = createLazyProxy(() => appInstance);

export { app, db };