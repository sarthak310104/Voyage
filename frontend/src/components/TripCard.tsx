'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, formatCurrency, type Trip } from '@/lib/api';

export function TripCard({ trip, onChanged }: { trip: Trip; onChanged: () => void }) {
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const [responding, setResponding] = useState<'accept' | 'decline' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const respond = async (action: 'accept' | 'decline') => {
    setResponding(action);
    setError(null);
    try {
      if (action === 'accept') await api.acceptInvite(trip.id);
      else await api.declineInvite(trip.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not respond to this invite — try again.');
      setResponding(null);
    }
  };

  const dateAndBudget = (
    <div className="flex justify-between text-sm text-navy/70 border-t border-dashed border-sand-dark pt-3">
      <div>
        <p className="text-navy/40 uppercase text-xs">Dates</p>
        <p className="font-semibold text-navy">
          {fmt(start)} – {fmt(end)}
        </p>
      </div>
      <div>
        <p className="text-navy/40 uppercase text-xs">Budget</p>
        <p className="font-semibold text-navy">{formatCurrency(trip.budgetTotal, trip.currency)}</p>
      </div>
    </div>
  );

  if (trip.membershipStatus === 'pending') {
    return (
      <div className="card p-5 border border-coral/40">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs uppercase tracking-widest text-coral-dark font-semibold">Invite pending</p>
        </div>
        <h3 className="font-display text-xl font-semibold text-navy mb-3">{trip.destination}</h3>
        {dateAndBudget}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => respond('accept')}
            disabled={responding !== null}
            className="btn-primary text-sm"
          >
            {responding === 'accept' ? 'Accepting…' : 'Accept'}
          </button>
          <button
            onClick={() => respond('decline')}
            disabled={responding !== null}
            className="btn-secondary text-sm"
          >
            {responding === 'decline' ? 'Declining…' : 'Decline'}
          </button>
        </div>
        {error && <p className="text-coral-dark text-xs mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="card p-5 block border border-sand-dark hover:-translate-y-0.5 transition-transform"
    >
      <p className="text-xs uppercase tracking-widest text-navy/50 mb-1">
        {trip.membershipStatus === 'accepted' ? 'Shared trip' : 'Trip'}
      </p>
      <h3 className="font-display text-xl font-semibold text-navy mb-3">{trip.destination}</h3>
      {dateAndBudget}
    </Link>
  );
}