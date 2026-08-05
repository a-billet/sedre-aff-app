'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon paths when bundled with webpack/Next.js
const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

function FlyTo({ lat, lon }: { lat: number; lon: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lon], 15, { duration: 0.8 });
    }, [lat, lon, map]);
    return null;
}

export interface AddressMapViewProps {
    lat: number;
    lon: number;
    label: string;
}

export default function AddressMapView({ lat, lon, label }: AddressMapViewProps) {
    return (
        <MapContainer
            center={[lat, lon]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lon]} icon={icon}>
                <Popup>{label}</Popup>
            </Marker>
            <FlyTo lat={lat} lon={lon} />
        </MapContainer>
    );
}
