// This file centralizes the Event type definition.
export interface Event {
  id: string; // Firestore document ID
  title: string;
  category: 'Radionica' | 'Festival' | 'Predavanje' | 'Sajam' | 'Ostalo';
  date: Date;
  time: string;
  location: string;
  registrationLink?: string;
  imageUrl: string;
  description: string;
  organizer?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'scheduled';
  createdAt: Date;
}
