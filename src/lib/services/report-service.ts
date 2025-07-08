// This file uses the Firebase client SDK for report-related Firestore operations.

import { db } from '@/lib/firebase/client';
import { collection, getDocs, doc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import type { Report } from '@/lib/reports';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

/**
 * Maps a Firestore document to a structured Report object.
 * @param doc The Firestore document snapshot.
 * @returns A normalized Report object.
 */
function mapDocToReport(doc: QueryDocumentSnapshot<DocumentData>): Report {
    const data = doc.data();
    // Handle Firestore Timestamp correctly, providing a fallback for local/test data
    const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();

    return {
        id: doc.id,
        type: data.type || 'error',
        createdAt: createdAt,
        comment: data.comment || '',
        wantsContact: data.wantsContact || false,
        contactEmail: data.contactEmail || '',
        priority: data.priority || 'niska',
        errorType: data.errorType || 'drugo',
        productContext: data.productContext || 'N/A',
        status: data.status || 'new',
    } as Report;
}

/**
 * Fetches all reports from the Firestore 'reports' collection, ordered by creation date.
 * @returns A promise that resolves to an array of reports.
 */
export async function getReports(): Promise<Report[]> {
    try {
        const reportsCol = collection(db, 'reports');
        const q = query(reportsCol, orderBy("createdAt", "desc"));
        const reportSnapshot = await getDocs(q);
        return reportSnapshot.docs.map(mapDocToReport);
    } catch (error) {
        console.error("Error fetching reports from Firestore: ", error);
        return [];
    }
}

/**
 * Deletes a report from Firestore.
 * @param reportId The ID of the report to delete.
 */
export async function deleteReport(reportId: string): Promise<void> {
  const reportDocRef = doc(db, 'reports', reportId);
  await deleteDoc(reportDocRef);
}
