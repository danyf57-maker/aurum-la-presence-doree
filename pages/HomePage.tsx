import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

type Status = 'idle' | 'loading' | 'success' | 'error';

export const HomePage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isAdult, setIsAdult] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const isEmailValid = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdult) {
      setStatus('error');
      setMessage("Aurum est réservé aux personnes majeures.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!isEmailValid(trimmedEmail)) {
      setStatus('error');
      setMessage("Merci d’indiquer une adresse e-mail valide.");
      return;
    }

    if (!supabase) {
      setStatus('error');
      setMessage("Le service est momentanément indisponible.");
      return;
    }

    setStatus('loading');
    setMessage(null);

    try {
      const redirectTo = `${window.location.origin}/chat`;
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        console.error('[AURUM AUTH] Error sending magic link:', error);
        setStatus('error');
        setMessage("Impossible d’envoyer le lien, réessaie dans quelques instants.");
        return;
      }

      setStatus('success');
      setMessage("Lien envoyé, vérifie ta boîte mail (pense aux spams).");
    } catch (err) {
      console.error('[AURUM AUTH] Unexpected error:', err);
      setStatus('error');
      setMessage("Impossible d’envoyer le lien, réessaie dans quelques instants.");
    }
  };

  const isLoading = status === 'loading';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#FAF6EE] to-[#F2EFE9] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full bg-white/90 rounded-3xl shadow-lg border border-[#E5D0A8]/40 p-8 space-y-6">
        <div className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-[#A08D75]">Aurum</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-[#5C554B]">Ton espace intérieur avec Aurum</h1>
          <p className="text-[#6F665B] text-base">
            Aurum est une présence calme qui t’aide à mettre des mots sur ce que tu traverses. Tu lui écris comme dans un journal, et il te répond avec douceur, sans jugement.
          </p>
          <p className="text-sm text-[#7d6a5a]">
            Tu recevras un lien sécurisé par e-mail pour ouvrir ton espace, sans mot de passe à retenir.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="flex items-center gap-2 text-sm text-[#5C554B]">
            <input
              type="checkbox"
              checked={isAdult}
              onChange={(e) => setIsAdult(e.target.checked)}
              className="h-4 w-4 rounded border-[#E5D0A8]"
            />
            J’ai 18 ans ou plus.
          </label>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#5C554B]" htmlFor="email">
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full rounded-xl border border-[#E5D0A8]/60 bg-white px-4 py-3 text-[#5C554B] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E5D0A8]"
              placeholder="toi@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-[#E5D0A8] text-[#5C554B] font-semibold py-3 shadow-md hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Envoi du lien en cours…" : "Recevoir mon lien Aurum"}
          </button>

          {message && (
            <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-green-700'}`}>
              {message}
            </p>
          )}
        </form>

        <div className="text-sm text-[#6F665B] space-y-1">
          <p>• Tes échanges restent privés et sécurisés.</p>
          <p>• Aurum ne remplace pas un suivi médical ou psychologique.</p>
          <p>• Réservé aux personnes majeures.</p>
        </div>

        <div className="text-center text-sm text-[#7d6a5a]">
          <a href="/legal" className="underline hover:text-[#5C554B]">Mentions légales & confidentialité</a>
        </div>
      </div>
    </div>
  );
};
