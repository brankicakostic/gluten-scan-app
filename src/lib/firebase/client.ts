// This file configures the Firebase client SDK.
// It is safe to be used in both client and server components.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

// Check if projectId is provided. If not, Firebase cannot be initialized.
if (firebaseConfig.projectId) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.error("An error occurred during Firebase initialization:", error);
    // Ensure instances are null on error, to be handled by service-layer checks.
    app = null;
    db = null;
  }
} else {
  // This warning will appear in the server console if the config is missing.
  console.warn("Firebase 'projectId' is missing. Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID in your .env file. Firebase features will be disabled.");
}

// Export the potentially null instances.
export { app, db };
