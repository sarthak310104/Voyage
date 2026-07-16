'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, Trip } from '@/lib/api';
import { TripPhotoStack } from '@/components/TripPhotoStack';

export default function WelcomePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .listTrips()
      .then(setTrips)
      .finally(() => setLoadingTrips(false));
  }, [user]);

  if (loading || !user) return null;

  const hasTrips = !loadingTrips && trips.length > 0;
  const isNewUser = !loadingTrips && trips.length === 0;

  return (
    <div className="min-h-screen bg-sand-light flex flex-col">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <span className="font-display text-xl font-semibold text-navy">Voyage</span>
        <button onClick={logout} className="btn-secondary text-sm">
          Log out
        </button>
      </header>

      <div className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-10 items-center w-full">
          <div className="max-w-md">
            <p className="text-coral font-semibold tracking-wide uppercase text-sm mb-3">
              {isNewUser ? "Let's get started" : 'Welcome back'}
            </p>
            <h1 className="font-display text-4xl font-semibold text-navy leading-tight mb-5">
              {isNewUser ? 'Plan your first trip' : 'Where to next?'}
            </h1>
            <p className="text-navy/70 text-lg mb-8">
              {isNewUser
                ? 'You do not have any trips yet — start one and your itinerary, budget, and packing list all come together in one place.'
                : 'Pick up a trip already in progress, or start something new.'}
            </p>
            <div className="flex flex-wrap gap-3">
              {hasTrips && (
                <Link href="/dashboard" className="btn-primary">
                  Select a trip
                </Link>
              )}
              <Link href="/dashboard?new=1" className={hasTrips ? 'btn-secondary' : 'btn-primary'}>
                Start a new trip
              </Link>
            </div>
          </div>

          <TripPhotoStack />
        </div>
      </div>
    </div>
  );
}