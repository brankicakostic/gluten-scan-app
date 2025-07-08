'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { deleteReport, updateReport } from '@/lib/services/report-service';

// Define the type for the data we expect from the client.
// This omits fields that are auto-generated on the server.
type ReportClientData = {
  type: 'error' | 'inquiry';
  comment?: string;
  wantsContact?: boolean;
  contactEmail?: string;
  priority?: 'niska' | 'srednja' | 'visoka';
  errorType?: 'sastav' | 'drugo' | 'podaci';
  productContext: string;
  productId?: string;
  productName?: string;
}

export async function addReportAction(reportData: ReportClientData) {
  try {
    const reportsCol = collection(db, 'reports');
    await addDoc(reportsCol, {
        ...reportData,
        createdAt: serverTimestamp(),
        status: 'new',
    });
    // Revalidate the admin path so the new report shows up immediately.
    revalidatePath('/[locale]/admin', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error in addReportAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
}

export async function deleteReportAction(reportId: string) {
    try {
        await deleteReport(reportId);
        revalidatePath('/[locale]/admin', 'page');
        return { success: true };
    } catch (error) {
        console.error('Error in deleteReportAction:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: errorMessage };
    }
}

export async function updateReportStatusAction(reportId: string, status: 'new' | 'in_progress' | 'resolved') {
    try {
        await updateReport(reportId, { status });
        revalidatePath('/[locale]/admin', 'page');
        return { success: true };
    } catch (error) {
        console.error('Error in updateReportStatusAction:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: errorMessage };
    }
}

export async function updateReportNotesAction(reportId: string, adminNotes: string) {
    try {
        await updateReport(reportId, { adminNotes });
        revalidatePath('/[locale]/admin', 'page');
        return { success: true };
    } catch (error) {
        console.error('Error in updateReportNotesAction:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: errorMessage };
    }
}
