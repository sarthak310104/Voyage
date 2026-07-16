export interface User {
  id: string;
  email: string;
  fullName: string;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budgetTotal: number;
  currency: string;
  ownerId: string;
  membershipStatus: 'owner' | 'accepted' | 'pending';
}

export interface ItineraryItem {
  id: string;
  tripId: string;
  day: number;
  title: string;
  notes: string;
  startTime: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  sortOrder: number;
}

export interface OptimizeDayResult {
  day: number;
  totalDistanceKm: number | null;
  items: ItineraryItem[];
}

export interface OptimizeResponse {
  days: OptimizeDayResult[];
}

export interface CurrencyConversion {
  from: string;
  to: string;
  amount: number;
  rate: number;
  convertedAmount: number;
  date: string;
}

export interface Weather {
  destination: string;
  latitude: number;
  longitude: number;
  temperatureC: number;
  windSpeedKmh: number;
  condition: string;
  observedAt: string;
}

export interface Expense {
  id: string;
  tripId: string;
  description: string;
  amount: number;
  category: string;
  paidBy: string;
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('voyage_token');
}

async function apiRequest<T>(base: string, path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {})
    }
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message ?? `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';
const AI_BASE = process.env.NEXT_PUBLIC_AI_BASE_URL ?? '/ai';

const core = <T,>(path: string, options?: RequestInit) => apiRequest<T>(API_BASE, path, options);
const ai = <T,>(path: string, options?: RequestInit) => apiRequest<T>(AI_BASE, path, options);

export const api = {
  // -- Auth (Java backend) --
  register: (email: string, password: string, fullName: string) =>
    core<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName })
    }),
  login: (email: string, password: string) =>
    core<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  me: () => core<User>('/auth/me'),

  // -- Trips (Java backend) --
  listTrips: () => core<Trip[]>('/trips'),
  getTrip: (id: string) => core<Trip>(`/trips/${id}`),
  createTrip: (input: Omit<Trip, 'id' | 'ownerId' | 'membershipStatus'>) =>
    core<Trip>('/trips', { method: 'POST', body: JSON.stringify(input) }),
  updateTrip: (tripId: string, patch: Partial<Omit<Trip, 'id' | 'ownerId' | 'membershipStatus'>>) =>
    core<Trip>(`/trips/${tripId}`, { method: 'PUT', body: JSON.stringify(patch) }),
  deleteTrip: (tripId: string) => core<void>(`/trips/${tripId}`, { method: 'DELETE' }),
  inviteToTrip: (tripId: string, email: string) =>
    core<void>(`/trips/${tripId}/invite`, { method: 'POST', body: JSON.stringify({ email }) }),
  acceptInvite: (tripId: string) => core<Trip>(`/trips/${tripId}/invite/accept`, { method: 'POST' }),
  declineInvite: (tripId: string) => core<void>(`/trips/${tripId}/invite/decline`, { method: 'POST' }),

  // -- Itinerary (Java backend) --
  listItinerary: (tripId: string) => core<ItineraryItem[]>(`/trips/${tripId}/itinerary`),
  addItineraryItem: (
    tripId: string,
    item: Omit<ItineraryItem, 'id' | 'tripId' | 'latitude' | 'longitude' | 'sortOrder'>
  ) =>
    core<ItineraryItem>(`/trips/${tripId}/itinerary`, { method: 'POST', body: JSON.stringify(item) }),
  deleteItineraryItem: (tripId: string, itemId: string) =>
    core<void>(`/trips/${tripId}/itinerary/${itemId}`, { method: 'DELETE' }),
  optimizeItinerary: (tripId: string) =>
    core<OptimizeResponse>(`/trips/${tripId}/itinerary/optimize`, { method: 'POST' }),

  // -- Expenses / budget (Java backend) --
  listExpenses: (tripId: string) => core<Expense[]>(`/trips/${tripId}/expenses`),
  addExpense: (tripId: string, expense: Omit<Expense, 'id' | 'tripId'>) =>
    core<Expense>(`/trips/${tripId}/expenses`, { method: 'POST', body: JSON.stringify(expense) }),

  // -- Currency (Java backend, proxies Frankfurter — live ECB rates) --
  convertCurrency: (from: string, to: string, amount: number) =>
    core<CurrencyConversion>(
      `/currency/convert?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${amount}`
    ),

  // -- Weather (Java backend, proxies Open-Meteo) --
  getWeather: (tripId: string) => core<Weather>(`/trips/${tripId}/weather`),

  // -- AI service --
  generateItinerary: (input: { destination: string; days: number; interests: string[] }) =>
    ai<{ itinerary: { day: number; title: string; notes: string; location: string }[] }>('/itinerary/generate', {
      method: 'POST',
      body: JSON.stringify(input)
    }),
  chatWithAssistant: (message: string, tripContext?: string) =>
    ai<{ reply: string }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, tripContext })
    }),
  suggestPacking: (input: { destination: string; days: number; season: string }) =>
    ai<{ items: string[] }>('/packing/suggest', {
      method: 'POST',
      body: JSON.stringify(input)
    }),

  generateJournal: (input: {
    destination: string;
    startDate: string;
    endDate: string;
    itinerary: { day: number; title: string; notes: string }[];
    expenses: { description: string; amount: number; category: string }[];
  }) =>
    ai<{ title: string; narrative: string; highlights: string[] }>('/journal/generate', {
      method: 'POST',
      body: JSON.stringify(input)
    })
};

export { ApiError };

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    // Intl throws if `currency` isn't a valid ISO 4217 code — fall back
    // to a plain number with the code prefixed rather than crashing.
    return `${currency} ${amount.toLocaleString()}`;
  }
}