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
      <div className="glass-card h-[450px] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
            <Map className="w-8 h-8 text-cyan-400" />
          </div>
          <h3 className="text-white font-semibold mb-1">Your Route Map</h3>
          <p className="text-sm text-gray-400 max-w-xs">
            Enter your trip details on the left and click "Plan Trip" to see your route with all stops plotted here.
          </p>
        </div>
      </div>
    );
  }

  const centerLat = route.geometry[0][0];
  const centerLng = route.geometry[0][1];

  return (
    <div className="glass-card p-4 shadow-2xl animate-fade-in-delay">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Map className="w-5 h-5 text-cyan-400" />
          <span>Route Map</span>
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Start / Drop
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Pickup
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Fuel
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Rest
          </span>
        </div>
      </div>

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={6}
        scrollWheelZoom={true}
        className="rounded-xl overflow-hidden border border-gray-800"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <FitBounds geometry={route.geometry} />

        <Polyline
          positions={route.geometry}
          pathOptions={{ color: '#06b6d4', weight: 4, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }}
        />

        {stops && stops.map((stop, idx) => {
          if (!stop.lat || !stop.lng) return null;
          const icon = icons[stop.type] || icons.start;
          const typeLabel = stopTypeLabels[stop.type] || stop.type;

          return (
            <Marker key={idx} position={[stop.lat, stop.lng]} icon={icon}>
              <Popup>
                <div className="p-1 min-w-[220px]">
                  <div className="font-bold text-sm text-gray-900 border-b border-gray-200 pb-1.5 mb-1.5">
                    {typeLabel}
                  </div>
                  <div className="text-xs text-gray-600 font-medium mb-1.5">{stop.location}</div>
                  <div className="text-[11px] text-gray-500 space-y-1">
                    <div>📅 <span className="font-semibold text-gray-700">Arrive:</span> {new Date(stop.arrive).toLocaleString()}</div>
                    <div>🚀 <span className="font-semibold text-gray-700">Depart:</span> {new Date(stop.depart).toLocaleString()}</div>
                  </div>
                  {stop.description && (
                    <div className="text-[11px] text-emerald-700 font-medium mt-1.5 bg-emerald-50 rounded px-2 py-1">
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
