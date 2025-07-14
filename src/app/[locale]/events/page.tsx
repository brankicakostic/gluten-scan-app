import { getEvents } from '@/lib/services/event-service';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, Clock, Ticket, Info } from 'lucide-react';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const allEvents = await getEvents();
  // Only show published events to the public
  const publishedEvents = allEvents.filter(event => event.status === 'published');

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="Događaji i Radionice"
          description="Budite u toku sa predstojećim gluten-free događajima, radionicama i okupljanjima."
          icon={CalendarDays}
        />
        {publishedEvents.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {publishedEvents.map((event) => {
              const imageUrl = event.imageUrl && event.imageUrl.startsWith('http')
                ? event.imageUrl
                : '/placeholder.svg';
              return (
              <Card key={event.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="p-0">
                  <Image
                    src={imageUrl}
                    alt={event.title}
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover"
                    data-ai-hint="event workshop"
                  />
                </CardHeader>
                <CardContent className="p-6 flex-grow flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">{event.category}</span>
                  <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                  <CardDescription className="flex-grow">{event.description}</CardDescription>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      <span>{event.date.toLocaleDateString('sr-RS')}</span>
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
            )})}
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
