'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '@/lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export function AiAssistantChat({ tripContext }: { tripContext: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setSending(true);
    try {
      const { reply } = await api.chatWithAssistant(userMessage, tripContext);
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: "Sorry, I couldn't reach the assistant just now." }
      ]);
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 btn-primary rounded-full w-14 h-14 flex items-center justify-center text-2xl shadow-lg"
        aria-label="Open travel assistant"
      >
        💬
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 w-[92vw] max-w-sm h-[70vh] max-h-[520px] card border border-sand-dark flex flex-col shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-sand-dark">
        <p className="font-display font-semibold text-navy">Travel assistant</p>
        <button onClick={() => setOpen(false)} className="text-navy/50" aria-label="Close">
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-navy/50 text-sm">Ask me about this trip — restaurants, routes, what to see nearby.</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm rounded-2xl px-3 py-2 max-w-[85%] w-fit ${
              m.role === 'user' ? 'bg-coral text-white ml-auto' : 'bg-sand text-navy chat-markdown'
            }`}
          >
            {m.role === 'assistant' ? <ReactMarkdown>{m.text}</ReactMarkdown> : m.text}
          </div>
        ))}
        {sending && <p className="text-navy/40 text-sm">Thinking…</p>}
      </div>
      <form onSubmit={send} className="flex gap-2 p-3 border-t border-sand-dark">
        <input
          className="input-field text-sm"
          placeholder="Message the assistant…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary text-sm">
          Send
        </button>
      </form>
    </div>
  );
}