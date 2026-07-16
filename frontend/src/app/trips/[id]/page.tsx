'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, Trip } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { ItineraryTimeline } from '@/components/ItineraryTimeline';
import { BudgetTracker } from '@/components/BudgetTracker';
import { PackingChecklist } from '@/components/PackingChecklist';
import { AiAssistantChat } from '@/components/AiAssistantChat';
import { WeatherWidget } from '@/components/WeatherWidget';
import { TravelJournal } from '@/components/TravelJournal';
import { TripSettings } from '@/components/TripSettings';

// Leaflet needs `window`, so the map tab can only render client-side.
const MapTab = dynamic(() => import('@/components/MapTab').then((m) => m.MapTab), {
  ssr: false,
  loading: () => <p className="text-navy/60">Loading map…</p>
});

type Tab = 'itinerary' | 'budget' | 'packing' | 'journal' | 'map';

export default function TripDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tab, setTab] = useState<Tab>('itinerary');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    api.getTrip(params.id).then(setTrip);
  }, [user, params.id]);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || !inviteEmail.trim()) return;
    try {
      await api.inviteToTrip(trip.id, inviteEmail.trim());
      setInviteStatus(`Invited ${inviteEmail.trim()}`);
      setInviteEmail('');
    } catch {
      setInviteStatus('Could not send invite');
    }
  };

  if (loading || !user || !trip) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'itinerary', label: 'Itinerary' },
    { key: 'map', label: 'Map' },
    { key: 'budget', label: 'Budget' },
    { key: 'packing', label: 'Packing' },
    { key: 'journal', label: 'Journal' }
  ];

  return (
    <div className="min-h-screen bg-sand-light">
      <Navbar />
      <main className="max-w-4xl mx-auto px-5 py-8 md:px-10">
        <p className="text-xs uppercase tracking-widest text-navy/50 mb-1">Trip</p>
        <h1 className="font-display text-3xl font-semibold text-navy mb-4">{trip.destination}</h1>

        <div className="mb-5">
          <WeatherWidget trip={trip} />
        </div>

        {user.id === trip.ownerId && <TripSettings trip={trip} onUpdated={setTrip} />}

        <form onSubmit={sendInvite} className="flex flex-wrap gap-2 mb-6">
          <input
            className="input-field flex-1 min-w-[200px]"
            placeholder="Invite a collaborator by email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <button type="submit" className="btn-secondary whitespace-nowrap">
            Invite
          </button>
          {inviteStatus && <span className="text-sm text-navy/60 self-center">{inviteStatus}</span>}
        </form>

        <div className="flex gap-2 mb-6 border-b border-sand-dark">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
                tab === t.key ? 'border-coral text-navy' : 'border-transparent text-navy/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'itinerary' && <ItineraryTimeline trip={trip} />}
        {tab === 'map' && <MapTab trip={trip} />}
        {tab === 'budget' && <BudgetTracker trip={trip} />}
        {tab === 'packing' && <PackingChecklist trip={trip} />}
        {tab === 'journal' && <TravelJournal trip={trip} />}
      </main>
      <AiAssistantChat
        tripContext={`Trip to ${trip.destination}, ${trip.startDate} to ${trip.endDate}. Budget currency: ${trip.currency}. When the user asks about money, prices, or costs, assume amounts are in ${trip.currency} unless they say otherwise, and convert between currencies when asked.`}
      />
    </div>
  );
}