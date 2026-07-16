'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD'];

export function CurrencyConverter({ defaultFrom }: { defaultFrom: string }) {
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultFrom === 'USD' ? 'EUR' : 'USD');
  const [result, setResult] = useState<{ convertedAmount: number; rate: number; date: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const convert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.convertCurrency(from, to, Number(amount));
      setResult({ convertedAmount: res.convertedAmount, rate: res.rate, date: res.date });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fetch a live rate — try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4 border border-sand-dark">
      <p className="text-xs uppercase tracking-widest text-navy/50 mb-3">Live currency converter</p>
      <form onSubmit={convert} className="flex flex-wrap items-center gap-2">
        <input
          className="input-field w-24"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <select className="input-field w-24" value={from} onChange={(e) => setFrom(e.target.value)}>
          {CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span className="text-navy/40">→</span>
        <select className="input-field w-24" value={to} onChange={(e) => setTo(e.target.value)}>
          {CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button type="submit" disabled={loading} className="btn-secondary">
          {loading ? 'Converting…' : 'Convert'}
        </button>
      </form>
      {error && <p className="text-coral-dark text-sm mt-2">{error}</p>}
      {result && (
        <p className="text-navy mt-3">
          <span className="font-display text-lg font-semibold">
            {amount} {from} = {result.convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {to}
          </span>
          <br />
          <span className="text-xs text-navy/50">
            rate {result.rate.toFixed(4)} · {result.date === 'same-currency' ? 'same currency' : result.date}
          </span>
        </p>
      )}
    </div>
  );
}