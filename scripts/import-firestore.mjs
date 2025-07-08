/**
 * @fileOverview Script to import product data from JSON into Firebase Firestore.
 *
 * To run this script:
 * 1. Download your Firebase service account key and save it as `serviceAccountKey.json` in the root directory.
 * 2. Run `npm install` to ensure `firebase-admin` is installed.
 * 3. Execute the script from the root directory: `node scripts/import-firestore.mjs`
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';

async function importData() {
  console.log('Starting Firestore data import...');

  // --- 1. Load Service Account Key ---
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(
      await readFile(new URL('../serviceAccountKey.json', import.meta.url))
    );
    console.log('✔ Service account key loaded.');
  } catch (error) {
    console.error('❌ Error: `serviceAccountKey.json` not found in the root directory.');
    console.error('Please download it from your Firebase project settings and place it in the project root.');
    process.exit(1);
  }

  // --- 2. Load Product Data ---
  let products;
  try {
    products = JSON.parse(
      await readFile(new URL('../products-for-database.json', import.meta.url))
    );
    console.log(`✔ Found ${products.length} products in JSON file.`);
  } catch (error) {
    console.error('❌ Error: Could not read `products-for-database.json`.');
    process.exit(1);
  }


  // --- 3. Initialize Firebase Admin ---
  try {
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('✔ Firebase Admin SDK initialized.');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    process.exit(1);
  }

  const db = getFirestore();
  const productsCollection = db.collection('products');
  let successCount = 0;
  let errorCount = 0;
  
  console.log('\nStarting product import into Firestore. This may take a moment...');

  // --- 4. Loop and Import ---
  for (const product of products) {
    // We need a barcode to use as the unique ID for each product document.
    if (!product.barcode) {
      console.warn(`⚠️ Skipping product "${product.name}" because it has no barcode.`);
      errorCount++;
      continue;
    }

    try {
      const docRef = productsCollection.doc(String(product.barcode));
      await docRef.set(product);
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`❌ Error importing ${product.name} (${product.barcode}):`, error.message);
    }
  }

  // --- 5. Log Summary ---
  console.log('---------------------------------');
  console.log('✅ Import finished.');
  console.log(`   - ${successCount} products successfully imported.`);
  console.log(`   - ${errorCount} products failed or were skipped.`);
  console.log('---------------------------------');
}

importData().catch(err => {
  console.error('\nAn unexpected error occurred during the import process:');
  console.error(err);
});
