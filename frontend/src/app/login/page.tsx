'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/welcome');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not log in — try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-sand-light px-6">
      <div className="card p-8 w-full max-w-sm">
        <Link href="/" className="font-display text-xl font-semibold text-navy">
          Voyage
        </Link>
        <h1 className="font-display text-2xl font-semibold text-navy mt-4 mb-6">Welcome back</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            required
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            required
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-coral-dark text-sm">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p className="text-sm text-navy/60 mt-5">
          New here?{' '}
          <Link href="/register" className="text-coral font-semibold">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
