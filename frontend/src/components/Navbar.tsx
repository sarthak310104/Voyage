'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-5 py-4 md:px-10 border-b border-sand-dark bg-sand-light sticky top-0 z-10">
      <Link href="/dashboard" className="font-display text-xl font-semibold text-navy">
        Voyage
      </Link>
      <div className="flex items-center gap-3">
        {user && <span className="hidden sm:inline text-sm text-navy/60">{user.fullName}</span>}
        <button onClick={logout} className="btn-secondary text-sm py-1.5 px-3">
          Log out
        </button>
      </div>
    </header>
  );
}
