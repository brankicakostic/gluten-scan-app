
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MapPin, Store, Utensils, Factory } from 'lucide-react'; // Icons for map and filters
import type { LatLngExpression } from 'leaflet';

// Dynamically import React Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// It's important to manage Leaflet's Icon default paths, especially when using bundlers like Webpack (used by Next.js)
// This ensures marker icons are loaded correctly.
useEffect(() => {
  if (typeof window !== 'undefined') {
    // Dynamically import Leaflet only on the client side
    import('leaflet').then(L => {
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
        iconUrl: require('leaflet/dist/images/marker-icon.png').default,
        shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
      });
    });
  }
}, []);


// Define types for locations and filters
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
    position: [44.8100, 20.4500], // Approx. Belgrade, adjust as needed
    address: 'Kumodraška 249, Beograd',
    description: 'Proizvođač bezglutenskih proizvoda.',
    link: 'https://granum.rs/',
  },
  {
    id: '2',
    name: 'Bio Špajz (Radnja)',
    type: 'radnja',
    position: [44.8165, 20.4602], // Approx. Belgrade, adjust as needed
    address: 'Kalenićeva 3, Beograd',
    description: 'Prodavnica zdrave hrane sa bezglutenskim asortimanom.',
    link: 'https://www.biospajz.rs/',
  },
  {
    id: '3',
    name: 'GlutenNo Pizzeria (Restoran)',
    type: 'restoran',
    position: [44.8040, 20.4651], // Approx. Belgrade, adjust as needed
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

// export const metadata: Metadata = { // Metadata needs to be in a server component or generated via generateMetadata
//   title: 'Mapa Gluten-Free Lokacija | Gluten Detective',
//   description: 'Pronađite proizvođače, radnje i restorane sa bezglutenskom ponudom.',
// };

export default function MapPage() {
  const [activeFilters, setActiveFilters] = useState<LocationType[]>(['proizvodjac', 'radnja', 'restoran']);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Ensure Leaflet components only render on client
  }, []);

  const handleFilterChange = (type: LocationType) => {
    setActiveFilters(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const filteredLocations = useMemo(() => {
    return staticLocations.filter(location => activeFilters.includes(location.type));
  }, [activeFilters]);

  if (!isClient) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <SidebarRail />
        <SidebarInset>
          <SiteHeader />
          <main className="flex-1 p-6 md:p-8">
            <PageHeader title="Mapa Lokacija" description="Učitavanje mape..." icon={MapPin} />
            <div className="h-[500px] w-full bg-muted rounded-lg flex items-center justify-center">
              <p>Mapa se učitava...</p>
            </div>
          </main>
        </SidebarInset>
      </div>
    );
  }
  
  // Default icon setup (can be done once globally or per map instance if needed)
  // This should be done before any Marker is rendered.
  // Ensure this runs only on the client.
  if (typeof window !== 'undefined') {
      const L = require('leaflet');
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default.src,
        iconUrl: require('leaflet/dist/images/marker-icon.png').default.src,
        shadowUrl: require('leaflet/dist/images/marker-shadow.png').default.src,
      });
  }


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
              {isClient && (
                <MapContainer center={[44.8125, 20.4612]} zoom={12} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
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
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </div>
  );
}

// Helper function to generate metadata - should be outside client component or in a server parent
// This will not work directly in a 'use client' file.
// For App Router, metadata should be exported from page.tsx (server component)
// If this MapPage needs to be a client component entirely, metadata must be handled by its parent server component.
// For now, I will comment it out from here. If you want to set metadata, we'd need a server component wrapper.
// export async function generateMetadata(): Promise<Metadata> {
//   return {
//     title: 'Mapa Gluten-Free Lokacija | Gluten Detective',
//     description: 'Pronađite proizvođače, radnje i restorane sa bezglutenskom ponudom.',
//   };
// }
