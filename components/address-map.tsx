'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

import type { AddressMapViewProps } from './address-map-view';
// Leaflet must be loaded client-side only
const MapView = dynamic<AddressMapViewProps>(() => import('./address-map-view'), { ssr: false });

interface AddressMapProps {
    address: string;
    city: string;
    department?: string;
}

interface Coords {
    lat: number;
    lon: number;
}

export function AddressMap({ address, city, department }: AddressMapProps) {
    const [coords, setCoords] = useState<Coords | null>(null);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');

    // Debounce address changes before geocoding
    useEffect(() => {
        const parts = [address, city, department].filter(Boolean);
        if (parts.length === 0) {
            setCoords(null);
            setQuery('');
            return;
        }
        const timer = setTimeout(() => setQuery(parts.join(', ')), 800);
        return () => clearTimeout(timer);
    }, [address, city, department]);

    useEffect(() => {
        if (!query) return;
        let cancelled = false;
        setLoading(true);

        fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
            { headers: { 'Accept-Language': 'fr' } }
        )
            .then((r) => r.json())
            .then((data) => {
                if (!cancelled && data[0]) {
                    setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [query]);

    if (!query) return null;

    return (
        <div className="mt-4 rounded-lg overflow-hidden border h-64 relative bg-muted">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/60 text-sm text-muted-foreground">
                    Chargement de la carte…
                </div>
            )}
            {coords && <MapView lat={coords.lat} lon={coords.lon} label={query} />}
        </div>
    );
}
