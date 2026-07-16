'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, Trip } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { TripCard } from '@/components/TripCard';

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (searchParams.get('new') === '1') setShowForm(true);
  }, [searchParams]);

  const refreshTrips = () => {
    api
      .listTrips()
      .then(setTrips)
      .finally(() => setLoadingTrips(false));
  };

  useEffect(() => {
    if (!user) return;
    refreshTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-sand-light">
      <Navbar />
      <main className="max-w-5xl mx-auto px-5 py-8 md:px-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl font-semibold text-navy">Your trips</h1>
          <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
            + New trip
          </button>
        </div>

        {showForm && (
          <NewTripForm
            onCreated={(trip) => {
              setTrips((prev) => [trip, ...prev]);
              setShowForm(false);
            }}
          />
        )}

        {loadingTrips ? (
          <p className="text-navy/60">Loading trips…</p>
        ) : trips.length === 0 ? (
          <p className="text-navy/60">No trips yet — create your first one above.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onChanged={refreshTrips} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function NewTripForm({ onCreated }: { onCreated: (trip: Trip) => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [destination, setDestination] = useState('');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetTotal, setBudgetTotal] = useState('1000');
  const [currency, setCurrency] = useState('USD');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const trip = await api.createTrip({
        name: name || destination,
        destination,
        startDate,
        endDate,
        budgetTotal: Number(budgetTotal),
        currency
      });
      onCreated(trip);
    } catch {
      setError('Could not create trip — check the fields and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="card p-5 mb-6 grid sm:grid-cols-2 gap-3">
      <input
        placeholder="Destination (e.g. Lisbon, Portugal)"
        required
        className="input-field sm:col-span-2"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
      />
      <input
        placeholder="Trip name (optional)"
        className="input-field sm:col-span-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="date"
        required
        min={today}
        className="input-field"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <input
        type="date"
        required
        min={startDate || today}
        className="input-field"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />
      <input
        type="number"
        min={0}
        placeholder="Budget"
        className="input-field"
        value={budgetTotal}
        onChange={(e) => setBudgetTotal(e.target.value)}
      />
      <select className="input-field" value={currency} onChange={(e) => setCurrency(e.target.value)}>
        {['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD'].map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Creating…' : 'Create trip'}
        </button>
        {error && <p className="text-coral-dark text-sm">{error}</p>}
      </div>
    </form>
  );
}