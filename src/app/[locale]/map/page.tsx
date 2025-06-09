
'use client';

import { useState, useEffect, useMemo, useId } from 'react';
import dynamic from 'next/dynamic';
import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MapPin, Store, Utensils, Factory, Loader2 } from 'lucide-react';
import type { LatLngExpression } from 'leaflet';

// Standalone loader component, defined outside MapPage
const MapContainerLoader = () => (
  <div className="h-full w-full flex items-center justify-center bg-muted">
    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
    <p className="ml-2 text-muted-foreground">Učitavanje mape...</p>
  </div>
);

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), {
  ssr: false,
  loading: () => <MapContainerLoader />, // This loader is for the component code itself
});
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

type LocationType = 'proizvodjac' | 'radnja' | 'restoran';

interface Location {
  id: string;
  name: string;
  type: LocationType;
  position: LatLngExpression;
  address: string;
  description: string;
  link?: string;
}

const staticLocations: Location[] = [
  {
    id: '1',
    name: 'Granum (Proizvođač)',
    type: 'proizvodjac',
    position: [44.8100, 20.4500],
    address: 'Kumodraška 249, Beograd',
    description: 'Proizvođač bezglutenskih proizvoda.',
    link: 'https://granum.rs/',
  },
  {
    id: '2',
    name: 'Bio Špajz (Radnja)',
    type: 'radnja',
    position: [44.8165, 20.4602],
    address: 'Kalenićeva 3, Beograd',
    description: 'Prodavnica zdrave hrane sa bezglutenskim asortimanom.',
    link: 'https://www.biospajz.rs/',
  },
  {
    id: '3',
    name: 'GlutenNo Pizzeria (Restoran)',
    type: 'restoran',
    position: [44.8040, 20.4651],
    address: 'Žorža Klemansoa 19, Beograd',
    description: 'Pica i pasta bez glutena.',
    link: 'https://gluteno.rs',
  },
];

const filterOptions: { id: LocationType; label: string; icon: React.ElementType }[] = [
  { id: 'proizvodjac', label: 'Proizvođači', icon: Factory },
  { id: 'radnja', label: 'Radnje', icon: Store },
  { id: 'restoran', label: 'Restorani', icon: Utensils },
];

export default function MapPage() {
  const [activeFilters, setActiveFilters] = useState<LocationType[]>(['proizvodjac', 'radnja', 'restoran']);
  const [isClient, setIsClient] = useState(false);
  const mapIdKey = useId(); // For unique key prop on MapContainer

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // This effect runs once on the client after initial mount
    if (isClient) { // Ensure Leaflet is imported and configured only on the client
        import('leaflet').then(L => {
        // @ts-ignore This is a common workaround for Leaflet icon path issues with bundlers
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default?.src || require('leaflet/dist/images/marker-icon-2x.png'),
            iconUrl: require('leaflet/dist/images/marker-icon.png').default?.src || require('leaflet/dist/images/marker-icon.png'),
            shadowUrl: require('leaflet/dist/images/marker-shadow.png').default?.src || require('leaflet/dist/images/marker-shadow.png'),
        });
        }).catch(error => console.error("Failed to load Leaflet for icon setup:", error));
    }
  }, [isClient]); // Run this effect when isClient changes

  const handleFilterChange = (type: LocationType) => {
    setActiveFilters(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const filteredLocations = useMemo(() => {
    return staticLocations.filter(location => activeFilters.includes(location.type));
  }, [activeFilters]);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarRail />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-6 md:p-8">
          <PageHeader
            title="Mapa Gluten-Free Lokacija"
            description="Pronađite proizvođače, radnje i restorane sa bezglutenskom ponudom."
            icon={MapPin}
          />

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filteri</CardTitle>
              <CardDescription>Prikaži željene tipove lokacija na mapi.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              {filterOptions.map(filter => (
                <div key={filter.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`filter-${filter.id}`}
                    checked={activeFilters.includes(filter.id)}
                    onCheckedChange={() => handleFilterChange(filter.id)}
                  />
                  <Label htmlFor={`filter-${filter.id}`} className="flex items-center gap-1.5 text-sm">
                    <filter.icon className="h-4 w-4" />
                    {filter.label}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0 h-[600px] w-full rounded-lg overflow-hidden">
              {isClient ? (
                <MapContainer
                  key={mapIdKey} // Ensures a new instance if MapPage itself is re-keyed or remounted
                  center={[44.8125, 20.4612]}
                  zoom={12}
                  scrollWheelZoom={true}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {/* Markers are rendered only when isClient is true (implicitly, as MapContainer is) */}
                  {filteredLocations.map(location => (
                    <Marker key={location.id} position={location.position}>
                      <Popup>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-md">{location.name}</h3>
                          <p className="text-xs text-muted-foreground">{location.address}</p>
                          <p className="text-sm">{location.description}</p>
                          {location.link && (
                            <a
                              href={location.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm"
                            >
                              Poseti sajt
                            </a>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              ) : (
                <MapContainerLoader /> // Explicitly show loader if not client (and component code might still be loading via dynamic)
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </div>
  );
}
