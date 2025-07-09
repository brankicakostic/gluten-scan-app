'use server';

import { revalidatePath } from 'next/cache';
import { createEvent, updateEvent, deleteEvent } from '@/lib/services/event-service';
import type { Event } from '@/lib/events';

type EventFormData = Omit<Event, 'id' | 'createdAt'> & { id?: string };

export async function addEventAction(eventData: EventFormData) {
    try {
        const newEventId = await createEvent(eventData);
        revalidatePath('/[locale]/admin', 'page');
        revalidatePath('/[locale]/events', 'page');
        return { success: true, id: newEventId };
    } catch (error) {
        console.error('Error in addEventAction:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: errorMessage };
    }
}

export async function updateEventAction(eventId: string, eventData: Partial<EventFormData>) {
    try {
        await updateEvent(eventId, eventData);
        revalidatePath('/[locale]/admin', 'page');
        revalidatePath('/[locale]/events', 'page');
        return { success: true };
    } catch (error) {
        console.error('Error in updateEventAction:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: errorMessage };
    }
}

export async function deleteEventAction(eventId: string) {
    try {
        await deleteEvent(eventId);
        revalidatePath('/[locale]/admin', 'page');
        revalidatePath('/[locale]/events', 'page');
        return { success: true };
    } catch (error) {
        console.error('Error in deleteEventAction:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: errorMessage };
    }
}
