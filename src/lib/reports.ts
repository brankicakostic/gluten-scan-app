// This file centralizes the Report type definition.
export interface Report {
  id: string; // Firestore document ID
  type: 'error' | 'inquiry';
  createdAt: Date;
  comment?: string;
  wantsContact?: boolean;
  contactEmail?: string;
  priority?: 'niska' | 'srednja' | 'visoka';
  errorType?: 'sastav' | 'drugo' | 'podaci';
  productContext: string; // The declaration text that was analyzed OR product name
  productId?: string; // ID of the product being reported
  productName?: string; // Name of the product being reported
  status: 'new' | 'viewed' | 'resolved';
}
