import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapPickerProps {
  center: [number, number];
  zoom?: number;
  radius?: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
}

export default function MapPicker({ center, zoom = 13, radius, onLocationSelect }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>(center);

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  useEffect(() => {
    setPosition(center);
  }, [center]);

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '400px', width: '100%', cursor: 'crosshair' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onLocationSelect={handleLocationSelect} />
        <Marker position={position}>
          <Popup>
            <div className="text-sm">
              <div>Latitude: {position[0].toFixed(6)}</div>
              <div>Longitude: {position[1].toFixed(6)}</div>
              {radius && <div>Radius: {radius}m</div>}
            </div>
          </Popup>
        </Marker>
        {radius && (
          <Circle center={position} radius={radius} color="blue" fillColor="blue" fillOpacity={0.1} />
        )}
      </MapContainer>
      <div className="bg-gray-50 p-3 border-t border-gray-300 text-sm text-gray-600">
        <p>Click on the map to select location. Drag marker to adjust.</p>
      </div>
    </div>
  );
}
