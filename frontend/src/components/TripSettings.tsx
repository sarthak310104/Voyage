'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Trip } from '@/lib/api';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD'];

export function TripSettings({ trip, onUpdated }: { trip: Trip; onUpdated: (trip: Trip) => void }) {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(trip.name);
  const [destination, setDestination] = useState(trip.destination);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [budgetTotal, setBudgetTotal] = useState(String(trip.budgetTotal));
  const [currency, setCurrency] = useState(trip.currency);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateTrip(trip.id, {
        name,
        destination,
        startDate,
        endDate,
        budgetTotal: Number(budgetTotal),
        currency
      });
      onUpdated(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes — try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteTrip = async () => {
    setDeleting(true);
    setError(null);
    try {
      await api.deleteTrip(trip.id);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this trip — try again.');
      setDeleting(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => setEditing(true)} className="btn-secondary text-sm">
          Edit trip
        </button>
        {!confirmingDelete ? (
          <button onClick={() => setConfirmingDelete(true)} className="btn-secondary text-sm text-coral-dark">
            Delete trip
          </button>
        ) : (
          <span className="flex items-center gap-2 text-sm">
            <span className="text-navy/70">Delete this trip permanently?</span>
            <button onClick={deleteTrip} disabled={deleting} className="text-coral-dark font-semibold">
              {deleting ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button onClick={() => setConfirmingDelete(false)} className="text-navy/50">
              Cancel
            </button>
          </span>
        )}
        {error && <span className="text-coral-dark text-sm">{error}</span>}
      </div>
    );
  }

  return (
    <form onSubmit={save} className="card p-4 border border-sand-dark mb-5 grid sm:grid-cols-2 gap-3">
      <input className="input-field sm:col-span-2" value={destination} onChange={(e) => setDestination(e.target.value)} />
      <input className="input-field sm:col-span-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Trip name" />
      <input className="input-field" type="date" min={today} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      <input className="input-field" type="date" min={startDate || today} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      <input
        className="input-field"
        type="number"
        min={0}
        value={budgetTotal}
        onChange={(e) => setBudgetTotal(e.target.value)}
      />
      <select className="input-field" value={currency} onChange={(e) => setCurrency(e.target.value)}>
        {CURRENCIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
          Cancel
        </button>
        {error && <span className="text-coral-dark text-sm">{error}</span>}
      </div>
    </form>
  );
}