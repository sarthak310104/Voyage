'use client';

import { useState } from 'react';
import { api, Trip } from '@/lib/api';

interface PackingItem {
  id: string;
  label: string;
  checked: boolean;
}

export function PackingChecklist({ trip }: { trip: Trip }) {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [season, setSeason] = useState('summer');

  const days = Math.max(
    1,
    Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000) + 1
  );

  const addManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    setItems((prev) => [...prev, { id: crypto.randomUUID(), label: newItem.trim(), checked: false }]);
    setNewItem('');
  };

  const suggestWithAi = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const { items: suggestions } = await api.suggestPacking({ destination: trip.destination, days, season });
      setItems((prev) => [
        ...prev,
        ...suggestions.map((label) => ({ id: crypto.randomUUID(), label, checked: false }))
      ]);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Could not get suggestions — try again.');
    } finally {
      setGenerating(false);
    }
  };

  const toggle = (id: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-xl font-semibold text-navy">Packing checklist</h2>
        <div className="flex items-center gap-2">
          <select className="input-field text-sm" value={season} onChange={(e) => setSeason(e.target.value)}>
            {['summer', 'winter', 'spring', 'fall'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button onClick={suggestWithAi} disabled={generating} className="btn-primary text-sm whitespace-nowrap">
            {generating ? 'Thinking…' : '✨ AI-suggest'}
          </button>
        </div>
      </div>

      {genError && <p className="text-coral-dark text-sm mb-3">{genError}</p>}

      <form onSubmit={addManual} className="flex gap-2 mb-4">
        <input
          className="input-field"
          placeholder="Add an item"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <button type="submit" className="btn-secondary">
          Add
        </button>
      </form>

      {items.length === 0 ? (
        <p className="text-navy/60">No items yet — add one, or let AI suggest a packing list.</p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <label className="flex items-center gap-2 card p-3 border border-sand-dark cursor-pointer">
                <input type="checkbox" checked={item.checked} onChange={() => toggle(item.id)} />
                <span className={item.checked ? 'line-through text-navy/40' : 'text-navy'}>{item.label}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}