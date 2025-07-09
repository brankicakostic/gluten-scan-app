
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, Clock, Ticket, Info } from 'lucide-react';
import Image from 'next/image';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  imageUrl: string;
  dataAiHint: string;
  registrationLink?: string;
  type: 'Radionica' | 'Događaj' | 'Online Webinar';
}

const placeholderEvents: Event[] = [
  {
    id: '1',
    title: 'Radionica bezglutenskog pečenja hleba',
    date: '20. Oktobar 2024.',
    time: '18:00h',
    location: 'Kreativni Centar, Beograd',
    description: 'Naučite tajne savršenog bezglutenskog hleba sa našim iskusnim pekarima. Svi materijali su obezbeđeni.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'baking workshop bread',
    registrationLink: '#',
    type: 'Radionica',
  },
  {
    id: '2',
    title: 'Online Webinar: Nutricionizam i Celijakija',
    date: '05. Novembar 2024.',
    time: '19:00h',
    location: 'Online (Zoom)',
    description: 'Pridružite nam se na online webinaru sa nutricionistom gde ćemo razgovarati o balansiranoj ishrani bez glutena.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'online webinar laptop',
    registrationLink: '#',
    type: 'Online Webinar',
  },
  {
    id: '3',
    title: 'Gluten-Free Food Festival',
    date: '01. Decembar 2024.',
    time: '12:00h - 20:00h',
    location: 'Dorćol Platz, Beograd',
    description: 'Veliki festival bezglutenske hrane! Probajte proizvode najboljih domaćih proizvođača, učestvujte u nagradnim igrama i uživajte u druženju.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'food festival people',
    type: 'Događaj',
  },
];


export default function EventsPage() {

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <PageHeader 
          title="Događaji i Radionice"
          description="Budite u toku sa predstojećim gluten-free događajima, radionicama i okupljanjima."
          icon={CalendarDays}
        />
        
        {placeholderEvents.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {placeholderEvents.map((event) => (
              <Card key={event.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="p-0">
                  <Image 
                    src={event.imageUrl} 
                    alt={event.title} 
                    width={400} 
                    height={200} 
                    className="w-full h-48 object-cover"
                    data-ai-hint={event.dataAiHint}
                  />
                </CardHeader>
                <CardContent className="p-6 flex-grow flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">{event.type}</span>
                  <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                  <CardDescription className="flex-grow">{event.description}</CardDescription>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{event.time}</span>
                    </div>
                     <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  {event.registrationLink ? (
                     <Button asChild className="w-full">
                      <a href={event.registrationLink} target="_blank" rel="noopener noreferrer">
                        <Ticket className="mr-2 h-4 w-4" />
                        Prijavi se / Saznaj više
                      </a>
                    </Button>
                  ) : (
                     <Button variant="secondary" className="w-full" disabled>
                        <Info className="mr-2 h-4 w-4" />
                        Uskoro više informacija
                     </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
           <div className="text-center py-12 text-muted-foreground">
            <CalendarDays className="mx-auto h-16 w-16 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Trenutno nema najavljenih događaja</h3>
            <p>Molimo Vas, proverite uskoro ponovo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
