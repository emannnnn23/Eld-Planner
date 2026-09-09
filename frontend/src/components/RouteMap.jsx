import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map, Navigation } from 'lucide-react';

const createCustomIcon = (color, label) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 2px 8px ${color}80, 0 0 16px ${color}40;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-weight: bold;
        font-size: 12px;
        font-family: 'Inter', sans-serif;
      ">
        ${label}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

const icons = {
  start: createCustomIcon('#10b981', '📍'),
  pickup: createCustomIcon('#06b6d4', '📦'),
  fuel: createCustomIcon('#f59e0b', '⛽'),
  break_30min: createCustomIcon('#3b82f6', '☕'),
  reset_10hr: createCustomIcon('#8b5cf6', '🛏️'),
  restart_34hr: createCustomIcon('#ec4899', '🔄'),
  dropoff: createCustomIcon('#10b981', '🏁')
};

const stopTypeLabels = {
  start: 'Starting Point',
  pickup: 'Pickup (Loading)',
  fuel: 'Fuel Stop',
  break_30min: '30-Min Rest Break',
  reset_10hr: '10-Hour Off-Duty Reset',
  restart_34hr: '34-Hour Cycle Restart',
  dropoff: 'Dropoff (Delivery)'
};

function FitBounds({ geometry }) {
  const map = useMap();
  useEffect(() => {
    if (geometry && geometry.length > 0) {
      try {
        const bounds = L.latLngBounds(geometry);
        map.fitBounds(bounds, { padding: [50, 50] });
      } catch (err) {
        console.error('Fit bounds error:', err);
      }
    }
  }, [geometry, map]);
  return null;
}

export default function RouteMap({ route, stops }) {
  if (!route || !route.geometry || route.geometry.length === 0) {
    return (
      <div className="glass-card flex items-center justify-center" style={{ height: '450px' }}>
        <div className="text-center p-5">
          <div className="icon-container mx-auto mb-4" style={{ width: '64px', height: '64px', borderRadius: '16px' }}>
            <Map size={32} />
          </div>
          <h3 className="text-h2 mb-1">Your Route Map</h3>
          <p className="text-sm text-muted max-w-xs mx-auto">
            Enter your trip details on the left and click "Plan Trip" to see your route with all stops plotted here.
          </p>
        </div>
      </div>
    );
  }

  const centerLat = route.geometry[0][0];
  const centerLng = route.geometry[0][1];

  return (
    <div className="glass-card animate-fade-in-delay">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-h2 flex items-center gap-2">
          <Map size={20} className="text-accent" />
          <span>Route Map</span>
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1">
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} /> Start / Drop
          </span>
          <span className="flex items-center gap-1">
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#06b6d4' }} /> Pickup
          </span>
          <span className="flex items-center gap-1">
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} /> Fuel
          </span>
          <span className="flex items-center gap-1">
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8b5cf6' }} /> Rest
          </span>
        </div>
      </div>

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={6}
        scrollWheelZoom={true}
        className="map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <FitBounds geometry={route.geometry} />

        <Polyline
          positions={route.geometry}
          pathOptions={{ color: 'var(--accent)', weight: 4, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }}
        />

        {stops && stops.map((stop, idx) => {
          if (!stop.lat || !stop.lng) return null;
          const icon = icons[stop.type] || icons.start;
          const typeLabel = stopTypeLabels[stop.type] || stop.type;

          return (
            <Marker key={idx} position={[stop.lat, stop.lng]} icon={icon}>
              <Popup>
                <div style={{ padding: '4px', minWidth: '220px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginBottom: '6px' }}>
                    {typeLabel}
                  </div>
                  <div style={{ fontSize: '12px', color: '#4b5563', fontWeight: '500', marginBottom: '6px' }}>{stop.location}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.4' }}>
                    <div>📅 <span style={{ fontWeight: '600', color: '#374151' }}>Arrive:</span> {new Date(stop.arrive).toLocaleString()}</div>
                    <div>🚀 <span style={{ fontWeight: '600', color: '#374151' }}>Depart:</span> {new Date(stop.depart).toLocaleString()}</div>
                  </div>
                  {stop.description && (
                    <div style={{ fontSize: '11px', color: '#047857', fontWeight: '500', marginTop: '6px', background: '#ecfdf5', borderRadius: '4px', padding: '4px 8px' }}>
                      {stop.description}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
