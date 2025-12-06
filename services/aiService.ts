// services/aiService.ts
import type { Message } from '../types';

const API_BASE =
  (import.meta as any).env?.VITE_AURUM_AI_API_BASE ?? '/api';

/**
 * Envoie un nouveau message utilisateur au backend IA
 * et récupère la réponse du modèle sous forme de Message.
 */
export async function sendChatMessage(
  messages: Message[],
  newText: string
): Promise<Message> {
  const payload = {
    history: messages.map((m) => ({ role: m.role, text: m.text })),
    userMessage: newText,
  };

  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error('sendChatMessage | HTTP error', res.status, await res.text());
    throw new Error('Erreur IA (chat)');
  }

  const data: { reply: string } = await res.json();

  return {
    id: crypto.randomUUID(),
    role: 'model',
    text: data.reply,
  };
}
