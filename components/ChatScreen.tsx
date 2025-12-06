// components/ChatScreen.tsx
import React, { useState, FormEvent } from 'react';
import type { Message } from '../types';

interface ChatScreenProps {
  messages: Message[];
  onSend: (text: string) => Promise<void> | void;
  isLoading?: boolean;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  onSend,
  isLoading = false,
}) => {
  const [input, setInput] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    await onSend(trimmed);
  }

  return (
    <div className="flex h-full w-full flex-col bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-800 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-[0_0_25px_rgba(251,191,36,0.7)]" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wide text-amber-200">
                Aurum — La Présence Dorée
              </span>
              <span className="text-xs text-slate-400">
                Parle, écris, laisse remonter ce qui vient. Aurum écoute.
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Zone de messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto flex h-full max-w-2xl flex-col gap-3">
          {messages.length === 0 && (
            <div className="mt-10 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-4 py-6 text-sm text-slate-400">
              <p className="mb-2">
                Commence par quelques phrases sur ta journée, ce qui te pèse, ce
                qui te manque, ou ce qui t’apaise.
              </p>
              <p>Aurum te répondra en douceur, sans jugement.</p>
            </div>
          )}

          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex w-full ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed sm:px-4 sm:py-2.5 ${
                    isUser
                      ? 'bg-amber-400 text-slate-950 rounded-br-sm'
                      : 'bg-slate-900/70 border border-slate-800 text-slate-100 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex w-full justify-start">
              <div className="rounded-2xl rounded-bl-sm border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
                  Aurum écoute…
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Zone d'entrée */}
      <footer className="border-t border-slate-800 bg-slate-950/95 px-4 py-3 sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl items-end gap-3"
        >
          <div className="flex-1">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-2 focus-within:border-amber-300/80 focus-within:bg-slate-900">
              <textarea
                className="h-16 w-full resize-none bg-transparent text-sm text-slate-50 outline-none placeholder:text-slate-500 sm:h-20"
                placeholder="Écris ici ce qui traverse ton esprit, sans te censurer…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="inline-flex h-10 items-center justify-center rounded-full bg-amber-400 px-4 text-sm font-semibold text-slate-950 shadow-[0_0_18px_rgba(251,191,36,0.65)] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300 disabled:shadow-none"
          >
            Envoyer
          </button>
        </form>
      </footer>
    </div>
  );
};
