import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

type ChatMessage = {
  id: string;
  role: 'user' | 'aurum';
  text: string;
  timestamp: number;
  pending?: boolean;
};

const HISTORY_KEY = 'aurum_chat_history';
const AURUM_CHAT_INSTRUCTION = `
Tu es Aurum, une présence intérieure calme et bienveillante.
- Tu réponds en français, avec douceur et simplicité.
- Tes réponses sont COURTES : 2 à 4 phrases maximum, sans puces.
- Tu reflètes ce que la personne vit, sans juger, sans donner d’ordres.
- Tu peux poser une petite question ouverte, mais jamais plus d’une à la fois.
- Tu évites le jargon psychologique et toute promesse de guérison.
- Tu n’évoques pas de diagnostic, ni de conseils médicaux ou psychiatriques.
- Tu peux inviter la personne à demander de l’aide à un humain si elle parle de détresse grave.
`.trim();

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isGoldenThreadOpen, setIsGoldenThreadOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSupabaseReady = useMemo(() => Boolean(supabase), []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        window.location.href = '/';
      } else {
        setUserEmail(data.user.email ?? null);
      }
    }).catch(() => {
      window.location.href = '/';
    });
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ChatMessage[];
        setMessages(parsed);
        return;
      } catch (err) {
        console.error('[AURUM CHAT] Failed to parse history', err);
      }
    }
    setMessages([{
      id: Date.now().toString(),
      role: 'aurum',
      text: "Bonjour, je suis là. Tu peux m’écrire ce que tu traverses, sans filtre.",
      timestamp: Date.now(),
    }]);
  }, []);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const replacePending = (text: string) => {
    setMessages((prev) => {
      const updated = [...prev];
      const pendingIndex = updated.findIndex((m) => m.pending);
      if (pendingIndex !== -1) {
        updated[pendingIndex] = {
          ...updated[pendingIndex],
          text,
          pending: false,
          timestamp: Date.now(),
        };
      } else {
        updated.push({
          id: Date.now().toString(),
          role: 'aurum',
          text,
          timestamp: Date.now(),
        });
      }
      return updated;
    });
  };

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isSending) return;
    if (!supabase) {
      console.error('[AURUM CHAT] Supabase non configuré.');
      return;
    }

    setIsSending(true);
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: (Date.now() + 1).toString(),
        role: 'aurum',
        text: 'Aurum réfléchit…',
        timestamp: Date.now(),
        pending: true,
      },
    ]);
    setInputValue('');

    const recent = [...messages, userMsg].filter((m) => !m.pending).slice(-8);
    const historyText = recent.map((m) => `${m.role === 'user' ? 'Utilisateur' : 'Aurum'}: ${m.text}`).join('\n');

    const prompt = `
${AURUM_CHAT_INSTRUCTION}

Historique récent :
${historyText}

Dernier message utilisateur :
"${trimmed}"
`.trim();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: { prompt },
        signal: controller.signal,
      });

      if (error) {
        console.error('[AURUM CHAT] ai-proxy error:', error);
        replacePending("Je n’arrive pas à répondre cette fois-ci, mais tu peux réessayer dans un instant.");
        return;
      }

      const completion = (data as any)?.completion ?? (data as any)?.text ?? (data as any)?.response ?? JSON.stringify(data);
      const cleaned = (completion || '')
        .replace(/^[*-]\s*/gm, '')
        .trim();
      replacePending(cleaned || "Je ressens un peu de brouillard, réessaie dans un instant.");
    } catch (err) {
      if ((err as any)?.name === 'AbortError') {
        console.error('[AURUM CHAT] ai-proxy timeout');
      } else {
        console.error('[AURUM CHAT] invoke exception:', err);
      }
      replacePending("Je n’arrive pas à répondre cette fois-ci, mais tu peux réessayer dans un instant.");
    } finally {
      clearTimeout(timeout);
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = async () => {
    if (!supabase) {
      window.location.href = '/';
      return;
    }
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (!isSupabaseReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <p className="text-[#6F665B]">Configuration Supabase manquante.</p>
      </div>
    );
  }

  const hasMessages = messages.length > 0;
  const hasUserMessage = messages.some((m) => m.role === 'user');

  return (
    <div className="aurum-shell">
      <div className="aurum-container">
        <header className="aurum-header">
          <div style={{ width: 120 }} />
          <h1 className="aurum-header-title">Discussion en or</h1>
          <button
            type="button"
            className="aurum-logout-btn"
            onClick={handleLogout}
          >
            Déconnexion
          </button>
        </header>

        <div className="aurum-chat-layout">
          <main className="aurum-chat-main">
            <section className="aurum-panel">
              <div className="aurum-panel-left-inner">
                <div className="aurum-scribe">
                  <span className="aurum-scribe-icon">✒️</span>
                  <span>Commence à écrire...</span>
                </div>

                <div className="aurum-chat-history">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`aurum-message-row ${msg.role === "user" ? "user" : "aurum"}`}
                    >
                      <div
                        className={`aurum-message-bubble ${
                          msg.role === "user" ? "user" : "aurum"
                        }`}
                      >
                        {msg.text}
                        {msg.pending && <span className="ml-2 text-xs italic text-[#7d6a5a]">…</span>}
                      </div>
                    </div>
                  ))}

                  {isSending && (
                    <div className="aurum-message-row aurum">
                      <div className="aurum-message-bubble aurum aurum-pending">
                        Aurum réfléchit...
                      </div>
                    </div>
                  )}

                  {!hasMessages && (
                    <div className="aurum-message-row aurum">
                      <div className="aurum-message-bubble aurum aurum-pending">
                        Commence à écrire…
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            </section>

            <section className="aurum-composer">
              {!hasUserMessage && (
                <p className="text-sm text-[#7a6a5a] mb-2 aurum-chat-hint">
                  Tu peux commencer en écrivant simplement comment tu te sens aujourd’hui.
                </p>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <div className="aurum-composer-inner">
                  <textarea
                    aria-label="Zone de message pour écrire à Aurum"
                    className="aurum-input"
                    placeholder="Écris à Aurum..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    aria-label="Envoyer"
                    className="aurum-send-btn"
                    disabled={isSending || !inputValue.trim()}
                  >
                    ✈
                  </button>
                </div>
              </form>
            </section>

            <footer className="aurum-footer">
              <a href="/legal">Mentions légales &amp; confidentialité</a>
            </footer>
          </main>

          {isGoldenThreadOpen && (
            <aside
              className="aurum-golden-thread"
              style={{ position: 'relative' }}
            >
              <header className="aurum-golden-thread-header">
                <h2 className="aurum-panel-right-title" style={{ margin: 0 }}>Le Fil d’Or</h2>
                <button
                  type="button"
                  onClick={() => setIsGoldenThreadOpen(false)}
                  aria-label="Fermer le Fil d'Or"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '20px',
                    color: '#7a6a5a',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </header>
              <p className="aurum-panel-right-text">
                Votre histoire commence ici. Prenez un moment pour écrire votre première entrée.
              </p>
              <p className="aurum-panel-right-email">
                {userEmail ? `Connecté avec : ${userEmail}` : "Connecté"}
              </p>
            </aside>
          )}

          {!isGoldenThreadOpen && (
            <button
              className="aurum-golden-thread-toggle"
              onClick={() => setIsGoldenThreadOpen(true)}
              aria-label="Ouvrir le Fil d'Or"
              type="button"
            >
              ☼
            </button>
          )}

          <div className="aurum-divider-vertical" />
        </div>
      </div>
    </div>
  );
};
