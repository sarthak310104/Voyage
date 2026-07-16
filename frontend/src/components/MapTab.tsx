'use client';

import { useEffect, useState } from 'react';
import { api, ItineraryItem, Trip } from '@/lib/api';
import { MapView } from './MapView';

export function MapTab({ trip }: { trip: Trip }) {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listItinerary(trip.id)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [trip.id]);

  if (loading) return <p className="text-navy/60">Loading map…</p>;

  return <MapView items={items} />;
}