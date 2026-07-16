'use client';

import { useEffect, useState } from 'react';
import { api, Expense, formatCurrency, Trip } from '@/lib/api';
import { CurrencyConverter } from './CurrencyConverter';

export function BudgetTracker({ trip }: { trip: Trip }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api
      .listExpenses(trip.id)
      .then(setExpenses)
      .finally(() => setLoading(false));
  }, [trip.id]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = trip.budgetTotal - total;

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    setAdding(true);
    setAddError(null);
    try {
      const created = await api.addExpense(trip.id, {
        description: description.trim(),
        amount: Number(amount),
        category,
        paidBy: 'you'
      });
      setExpenses((prev) => [...prev, created]);
      setDescription('');
      setAmount('');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Could not add that expense — try again.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-navy mb-4">Budget</h2>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card p-4 border border-sand-dark text-center">
          <p className="text-xs uppercase text-navy/50">Total</p>
          <p className="font-display text-xl font-semibold text-navy">
            {formatCurrency(trip.budgetTotal, trip.currency)}
          </p>
        </div>
        <div className="card p-4 border border-sand-dark text-center">
          <p className="text-xs uppercase text-navy/50">Spent</p>
          <p className="font-display text-xl font-semibold text-coral">{formatCurrency(total, trip.currency)}</p>
        </div>
        <div className="card p-4 border border-sand-dark text-center">
          <p className="text-xs uppercase text-navy/50">Remaining</p>
          <p className={`font-display text-xl font-semibold ${remaining < 0 ? 'text-coral-dark' : 'text-teal'}`}>
            {formatCurrency(remaining, trip.currency)}
          </p>
        </div>
      </div>

      <form onSubmit={addExpense} className="flex flex-wrap gap-2 mb-2">
        <input
          className="input-field flex-1 min-w-[140px]"
          placeholder="Description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className="input-field w-28"
          type="number"
          min="0"
          step="0.01"
          placeholder="Amount"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <select className="input-field w-36" value={category} onChange={(e) => setCategory(e.target.value)}>
          {['Food', 'Lodging', 'Transport', 'Activities', 'Other'].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button type="submit" disabled={adding} className="btn-primary">
          {adding ? 'Adding…' : 'Add'}
        </button>
      </form>

      {addError && <p className="text-coral-dark text-sm mb-3">{addError}</p>}

      {loading ? (
        <p className="text-navy/60">Loading expenses…</p>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <div key={e.id} className="flex justify-between text-sm py-2 border-b border-sand-dark">
              <span className="text-navy">{e.description}</span>
              <span className="text-navy/60">
                {e.category} · {formatCurrency(e.amount, trip.currency)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <CurrencyConverter defaultFrom={trip.currency} />
      </div>
    </div>
  );
}