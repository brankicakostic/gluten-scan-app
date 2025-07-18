'use client';

import { useState, useEffect, useMemo, useId } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MapPin, Store, Utensils, Factory, Loader2 } from 'lucide-react';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet'; // Import L directly

// CDN URLs for Leaflet default icons
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

// Standalone loader component
const MapViewLoader = ({ message }: { message: string }) => (
  <div className="h-full w-full flex items-center justify-center bg-muted">
    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
    <p className="ml-2 text-muted-foreground">{message}</p>
  </div>
);

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), {
  ssr: false,
  loading: () => <MapViewLoader message="Učitavanje kontejnera mape..." />,
});
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { 
  ssr: false,
  loading: () => <MapViewLoader message="Učitavanje sloja mape..." />,
});
const LeafletMarker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { 
  ssr: false,
});
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { 
  ssr: false 
});

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
  const [leafletIconsConfigured, setLeafletIconsConfigured] = useState(false);
  const mapIdKey = useId(); 

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      // @ts-ignore This is a common workaround for Leaflet's icon path issue with bundlers when not using CDN
      // delete L.Icon.Default.prototype._getIconUrl; 
      // With CDN URLs, the above delete is often not necessary but kept for safety if there are mixed icon types.
      // However, for pure CDN setup, it's cleaner to remove it.
      
      // Attempt to remove the _getIconUrl method if it exists, which can interfere.
      // This is often needed when Leaflet tries to guess icon paths.
      if (L.Icon.Default.prototype._getIconUrl) {
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;
      }

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: iconRetinaUrl,
        iconUrl: iconUrl,
        shadowUrl: shadowUrl,
      });
      setLeafletIconsConfigured(true);
      console.log("Leaflet icons configured using CDN URLs.");
    }
  }, [isClient]);

  const handleFilterChange = (type: LocationType) => {
    setActiveFilters(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const filteredLocations = useMemo(() => {
    return staticLocations.filter(location => activeFilters.includes(location.type));
  }, [activeFilters]);

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
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
            {isClient && leafletIconsConfigured ? (
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
                {filteredLocations.map(location => (
                  <LeafletMarker key={location.id} position={location.position}>
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
                  </LeafletMarker>
                ))}
              </MapContainer>
            ) : (
              <MapViewLoader message={!isClient ? "Učitavanje podataka mape..." : "Konfigurisanje ikonica mape..."} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
