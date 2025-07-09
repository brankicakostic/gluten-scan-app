import { getDb } from '@/lib/firebase/client';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import type { Event } from '@/lib/events';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

function mapDocToEvent(doc: QueryDocumentSnapshot<DocumentData> | DocumentData): Event {
    const data = doc.data() || {};
    const date = data.date instanceof Timestamp ? data.date.toDate() : new Date();
    const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();

    return {
        id: doc.id,
        title: data.title || 'Bez naslova',
        category: data.category || 'Ostalo',
        date: date,
        time: data.time || '',
        location: data.location || '',
        registrationLink: data.registrationLink || '',
        imageUrl: data.imageUrl || 'https://placehold.co/600x400.png',
        description: data.description || '',
        organizer: data.organizer || '',
        tags: data.tags || [],
        status: data.status || 'draft',
        createdAt: createdAt,
    };
}

function mapEventToDocData(event: Partial<Event>): DocumentData {
    const data: DocumentData = {};
    if (event.title) data.title = event.title;
    if (event.category) data.category = event.category;
    if (event.date) data.date = Timestamp.fromDate(new Date(event.date)); // Store as Timestamp
    if (event.time) data.time = event.time;
    if (event.location) data.location = event.location;
    if (typeof event.registrationLink !== 'undefined') data.registrationLink = event.registrationLink;
    if (event.imageUrl) data.imageUrl = event.imageUrl;
    if (event.description) data.description = event.description;
    if (typeof event.organizer !== 'undefined') data.organizer = event.organizer;
    if (event.tags) data.tags = event.tags;
    if (event.status) data.status = event.status;
    if (event.createdAt) data.createdAt = Timestamp.fromDate(new Date(event.createdAt));
    return data;
}


export async function getEvents(): Promise<Event[]> {
    const db = getDb();
    if (!db) return [];
    try {
        const eventsCol = collection(db, 'events');
        const q = query(eventsCol, orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(mapDocToEvent);
    } catch (error) {
        console.error("Error fetching events from Firestore: ", error);
        return [];
    }
}

export async function createEvent(eventData: Partial<Event>): Promise<string> {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized.");
    const dataToSave = mapEventToDocData({ ...eventData, createdAt: new Date() });
    const eventsCol = collection(db, 'events');
    const docRef = await addDoc(eventsCol, dataToSave);
    return docRef.id;
}

export async function updateEvent(eventId: string, eventData: Partial<Event>): Promise<void> {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized.");
    const dataToSave = mapEventToDocData(eventData);
    const eventDocRef = doc(db, 'events', eventId);
    await updateDoc(eventDocRef, dataToSave);
}

export async function deleteEvent(eventId: string): Promise<void> {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized.");
    const eventDocRef = doc(db, 'events', eventId);
    await deleteDoc(eventDocRef);
}
