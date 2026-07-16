'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/welcome');
  }, [loading, user, router]);

  return (
    <main className="min-h-screen bg-sand-light">
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <span className="font-display text-2xl font-semibold text-navy">Voyage</span>
        <div className="flex gap-3">
          <Link href="/login" className="btn-secondary">
            Log in
          </Link>
          <Link href="/register" className="btn-primary">
            Get started
          </Link>
        </div>
      </nav>

      <section className="px-6 md:px-12 pt-10 pb-20 grid md:grid-cols-2 gap-10 items-center max-w-6xl mx-auto">
        <div>
          <p className="text-coral font-semibold tracking-wide uppercase text-sm mb-3">
            Plan · Explore · Remember
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-navy leading-tight mb-5">
            Every trip, held in one place — from the first idea to the last photo.
          </h1>
          <p className="text-navy/70 text-lg mb-8 max-w-md">
            Voyage brings collaborative itineraries, budgets, packing lists, and an AI
            travel assistant together, so planning stops living across six different apps.
          </p>
          <Link href="/register" className="btn-primary inline-block text-lg">
            Start planning →
          </Link>
        </div>

        <div className="card p-6 rotate-1 border border-sand-dark relative">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-sand-light border border-sand-dark" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-sand-light border border-sand-dark" />
          <p className="text-xs uppercase tracking-widest text-navy/50 mb-1">Boarding pass</p>
          <h3 className="font-display text-2xl font-semibold text-navy mb-4">Lisbon, Portugal</h3>
          <div className="flex justify-between text-sm text-navy/70 border-t border-dashed border-sand-dark pt-4">
            <div>
              <p className="text-navy/40 uppercase text-xs">Depart</p>
              <p className="font-semibold text-navy">Sep 12</p>
            </div>
            <div>
              <p className="text-navy/40 uppercase text-xs">Return</p>
              <p className="font-semibold text-navy">Sep 19</p>
            </div>
            <div>
              <p className="text-navy/40 uppercase text-xs">Travelers</p>
              <p className="font-semibold text-navy">3</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
