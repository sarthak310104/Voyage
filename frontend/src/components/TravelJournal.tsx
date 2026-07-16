'use client';

import { useState } from 'react';
import { api, Trip } from '@/lib/api';

interface Journal {
  title: string;
  narrative: string;
  highlights: string[];
}

export function TravelJournal({ trip }: { trip: Trip }) {
  const [journal, setJournal] = useState<Journal | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const [itinerary, expenses] = await Promise.all([
        api.listItinerary(trip.id),
        api.listExpenses(trip.id)
      ]);
      const result = await api.generateJournal({
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        itinerary: itinerary.map((i) => ({ day: i.day, title: i.title, notes: i.notes ?? '' })),
        expenses: expenses.map((e) => ({ description: e.description, amount: e.amount, category: e.category }))
      });
      setJournal(result);
    } catch {
      setError("Couldn't generate the journal — try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold text-navy">Travel journal</h2>
        <button onClick={generate} disabled={generating} className="btn-primary text-sm whitespace-nowrap">
          {generating ? 'Writing…' : journal ? '✨ Regenerate' : '✨ Generate journal'}
        </button>
      </div>

      {error && <p className="text-coral-dark text-sm mb-3">{error}</p>}

      {!journal && !generating && (
        <p className="text-navy/60">
          Turns this trip's itinerary and expenses into a short, AI-written journal entry —
          a preview of the "digital travel journal" the full spec describes for after a trip.
        </p>
      )}

      {journal && (
        <div className="card p-5 border border-sand-dark">
          <h3 className="font-display text-2xl font-semibold text-navy mb-3">{journal.title}</h3>
          <p className="text-navy/80 leading-relaxed whitespace-pre-line mb-4">{journal.narrative}</p>
          {journal.highlights.length > 0 && (
            <div className="border-t border-dashed border-sand-dark pt-3">
              <p className="text-xs uppercase tracking-widest text-navy/50 mb-2">Highlights</p>
              <ul className="flex flex-wrap gap-2">
                {journal.highlights.map((h, i) => (
                  <li key={i} className="bg-sand text-navy text-sm rounded-full px-3 py-1">
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
