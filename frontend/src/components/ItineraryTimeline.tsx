'use client';

import { useEffect, useState } from 'react';
import { api, ItineraryItem, Trip } from '@/lib/api';

export function ItineraryTimeline({ trip }: { trip: Trip }) {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [distances, setDistances] = useState<Record<number, number | null>>({});
  const [interests, setInterests] = useState('food, history, walking');

  useEffect(() => {
    api
      .listItinerary(trip.id)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [trip.id]);

  const days = Math.max(
    1,
    Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000) + 1
  );

  const generateWithAi = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const { itinerary } = await api.generateItinerary({
        destination: trip.destination,
        days,
        interests: interests.split(',').map((s) => s.trim()).filter(Boolean)
      });
      const created: ItineraryItem[] = [];
      for (const day of itinerary) {
        const item = await api.addItineraryItem(trip.id, {
          day: day.day,
          title: day.title,
          notes: day.notes,
          startTime: null,
          location: day.location || null
        });
        created.push(item);
      }
      setItems((prev) => [...prev, ...created]);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Could not generate an itinerary — try again.');
    } finally {
      setGenerating(false);
    }
  };

  const optimizeRoute = async () => {
    setOptimizing(true);
    setOptimizeError(null);
    try {
      const result = await api.optimizeItinerary(trip.id);
      const allItems = result.days.flatMap((d) => d.items);
      setItems(allItems);
      setDistances(Object.fromEntries(result.days.map((d) => [d.day, d.totalDistanceKm])));
    } catch (e) {
      setOptimizeError(e instanceof Error ? e.message : 'Could not optimize the route — try again.');
    } finally {
      setOptimizing(false);
    }
  };

  const grouped = items.reduce<Record<number, ItineraryItem[]>>((acc, item) => {
    (acc[item.day] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-xl font-semibold text-navy">Itinerary</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            className="input-field text-sm"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="Interests (comma-separated)"
          />
          <button onClick={generateWithAi} disabled={generating} className="btn-primary text-sm whitespace-nowrap">
            {generating ? 'Generating…' : '✨ AI-generate'}
          </button>
          <button
            onClick={optimizeRoute}
            disabled={optimizing || items.length === 0}
            className="btn-secondary text-sm whitespace-nowrap"
          >
            {optimizing ? 'Optimizing…' : '🧭 Optimize route'}
          </button>
        </div>
      </div>

      {genError && <p className="text-coral-dark text-sm mb-3">{genError}</p>}
      {optimizeError && <p className="text-coral-dark text-sm mb-3">{optimizeError}</p>}

      {loading ? (
        <p className="text-navy/60">Loading itinerary…</p>
      ) : items.length === 0 ? (
        <p className="text-navy/60">
          No itinerary items yet — use "AI-generate" for a starting point, or add days manually.
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([day, dayItems]) => {
              const dist = distances[Number(day)];
              return (
                <div key={day}>
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-coral font-semibold text-sm uppercase tracking-wide">Day {day}</p>
                    {dist != null && (
                      <span className="text-xs text-navy/50">~{dist.toFixed(1)} km between stops</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {[...dayItems]
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((item, i) => (
                        <div key={item.id} className="card p-4 border border-sand-dark flex gap-3">
                          <span className="text-navy/30 font-display font-semibold text-sm w-5 shrink-0">
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-navy">{item.title}</p>
                            {item.location && <p className="text-navy/50 text-xs mt-0.5">📍 {item.location}</p>}
                            {item.notes && <p className="text-navy/60 text-sm mt-1">{item.notes}</p>}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}