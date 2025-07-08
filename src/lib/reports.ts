// This file centralizes the Report type definition.
export interface Report {
  id: string; // Firestore document ID
  type: 'error' | 'inquiry';
  createdAt: Date;
  comment?: string;
  wantsContact?: boolean;
  contactEmail?: string;
  priority?: 'niska' | 'srednja' | 'visoka';
  errorType?: 'sastav' | 'drugo';
  productContext: string; // The declaration text that was analyzed
  status: 'new' | 'viewed' | 'resolved';
}
