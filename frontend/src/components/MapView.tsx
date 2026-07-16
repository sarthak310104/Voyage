'use client';

import { useEffect, useMemo, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ItineraryItem } from '@/lib/api';

// Leaflet's default marker icon paths break under bundlers like Next.js/webpack
// (they resolve to hashed asset URLs that don't exist) — the standard fix is to
// point the default icon at CDN-hosted images instead.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const DAY_COLORS = ['#FF6B4A', '#2A9D8F', '#14213D', '#E1502F', '#3FBFAE', '#1F2E52'];

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
    } else {
      map.fitBounds(points, { padding: [30, 30] });
    }
  }, [map, points]);
  return null;
}

export function MapView({ items }: { items: ItineraryItem[] }) {
  const withCoords = useMemo(
    () => items.filter((i): i is ItineraryItem & { latitude: number; longitude: number } =>
      i.latitude != null && i.longitude != null
    ),
    [items]
  );

  const byDay = useMemo(() => {
    const grouped = new Map<number, typeof withCoords>();
    for (const item of withCoords) {
      const list = grouped.get(item.day) ?? [];
      list.push(item);
      grouped.set(item.day, list);
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return grouped;
  }, [withCoords]);

  const allPoints: [number, number][] = withCoords.map((i) => [i.latitude, i.longitude]);

  if (withCoords.length === 0) {
    return (
      <div className="card p-8 border border-sand-dark text-center text-navy/60">
        No geocoded stops yet — add itinerary items with a specific location (AI-generated items
        usually include one), then come back here.
      </div>
    );
  }

  return (
    <div>
      <div className="card border border-sand-dark overflow-hidden" style={{ height: 420 }}>
        <MapContainer center={allPoints[0]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={allPoints} />
          {Array.from(byDay.entries()).map(([day, dayItems], dayIndex) => {
            const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
            const linePoints: [number, number][] = dayItems.map((i) => [i.latitude, i.longitude]);
            return (
              <Fragment key={day}>
                {linePoints.length > 1 && <Polyline positions={linePoints} pathOptions={{ color, weight: 3 }} />}
                {dayItems.map((item, i) => (
                  <Marker key={item.id} position={[item.latitude, item.longitude]}>
                    <Popup>
                      <strong>
                        Day {day} · Stop {i + 1}
                      </strong>
                      <br />
                      {item.title}
                      {item.location && (
                        <>
                          <br />
                          <span style={{ color: '#666' }}>{item.location}</span>
                        </>
                      )}
                    </Popup>
                  </Marker>
                ))}
              </Fragment>
            );
          })}
        </MapContainer>
      </div>
      <div className="flex flex-wrap gap-3 mt-3">
        {Array.from(byDay.keys()).map((day, i) => (
          <span key={day} className="flex items-center gap-1.5 text-xs text-navy/60">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: DAY_COLORS[i % DAY_COLORS.length] }}
            />
            Day {day}
          </span>
        ))}
      </div>
    </div>
  );
}