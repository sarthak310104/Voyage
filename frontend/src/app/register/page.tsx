'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password, fullName);
      router.push('/welcome');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not create your account — try again.');
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
        <h1 className="font-display text-2xl font-semibold text-navy mt-4 mb-6">Create your account</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            required
            className="input-field"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
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
            placeholder="Password (min. 8 characters)"
            required
            minLength={8}
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-coral-dark text-sm">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-sm text-navy/60 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-coral font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
