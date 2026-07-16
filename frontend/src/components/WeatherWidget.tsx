'use client';

import { useEffect, useState } from 'react';
import { api, Trip, Weather } from '@/lib/api';

const ICONS: Record<string, string> = {
  clear: '☀️',
  cloud: '☁️',
  overcast: '☁️',
  fog: '🌫️',
  drizzle: '🌦️',
  rain: '🌧️',
  snow: '❄️',
  shower: '🌧️',
  thunder: '⛈️'
};

function iconFor(condition: string): string {
  const key = Object.keys(ICONS).find((k) => condition.toLowerCase().includes(k));
  return key ? ICONS[key] : '🌡️';
}

export function WeatherWidget({ trip }: { trip: Trip }) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getWeather(trip.id)
      .then(setWeather)
      .catch(() => setError("Couldn't fetch live weather right now"))
      .finally(() => setLoading(false));
  }, [trip.id]);

  if (loading) {
    return <div className="card p-4 border border-sand-dark text-sm text-navy/50">Checking the skies…</div>;
  }

  if (error || !weather) {
    return (
      <div className="card p-4 border border-sand-dark text-sm text-navy/50">
        {error ?? "Couldn't fetch live weather right now"}
      </div>
    );
  }

  return (
    <div className="card p-4 border border-sand-dark flex items-center gap-4">
      <span className="text-3xl">{iconFor(weather.condition)}</span>
      <div>
        <p className="font-display text-xl font-semibold text-navy">
          {Math.round(weather.temperatureC)}°C in {weather.destination}
        </p>
        <p className="text-sm text-navy/60">
          {weather.condition} · wind {Math.round(weather.windSpeedKmh)} km/h
        </p>
      </div>
    </div>
  );
}
