import React, { useState, FormEvent } from 'react';
import { supabase } from '../supabaseClient';

type Status = 'idle' | 'loading' | 'success' | 'error';

const isEmailValid = (value: string) => /\S+@\S+\.\S+/.test(value);

export const BetaLanding: React.FC = () => {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedEmail = email.trim();
    const normalizedReason = reason.trim();

    if (!normalizedEmail || !isEmailValid(normalizedEmail)) {
      setStatus('error');
      setErrorMessage("Merci d’indiquer une adresse e-mail valide.");
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    if (!supabase) {
      console.warn('[AURUM BETA] Supabase non configuré');
      setStatus('error');
      setErrorMessage("Le service est momentanément indisponible.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('beta_signups')
        .insert([{ email: normalizedEmail, reason: normalizedReason || null }])
        .select()
        .single();

      if (error) {
        console.error('[AURUM BETA] Erreur lors de l’inscription:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        const message = error.message?.toLowerCase() ?? '';
        if (message.includes('duplicate')) {
          setErrorMessage("Cet e-mail est déjà inscrit à la bêta Aurum 💛");
        } else if (message.includes('row-level security')) {
          setErrorMessage("La bêta privée Aurum est complète pour le moment 💛");
        } else {
          setErrorMessage("Une brume technique empêche l’inscription. Réessaie dans un instant.");
        }

        setStatus('error');
        return;
      }

      if (!data) {
        console.error('[AURUM BETA] Insert beta_signups sans données retournées.');
        setErrorMessage("Une brume technique empêche l’inscription. Réessaie dans un instant.");
        setStatus('error');
        return;
      }

      setStatus('success');
      setReason('');
      window.location.href = '/beta/merci';
    } catch (err) {
      console.error('[AURUM BETA] Exception lors de l’inscription:', err);
      setErrorMessage("Une brume technique empêche l’inscription. Réessaie dans un instant.");
      setStatus('error');
    }
  };

  const isLoading = status === 'loading';

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#FDFBF7] via-[#FAF6EE] to-[#F2EFE9] px-4 py-12">
      <div className="max-w-xl w-full bg-white/90 rounded-3xl shadow-lg border border-[#E5D0A8]/40 p-8 space-y-6">
        <div className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-[#A08D75]">Aurum</p>
          <h1 className="text-3xl font-semibold text-[#5C554B]">Aurum – Bêta privée</h1>
          <p className="text-[#6F665B]">
            Une présence dorée qui t’aide à mettre des mots sur ce que tu ressens.
          </p>
        </div>

        <ul className="space-y-2 text-[#5C554B]">
          <li className="flex items-start gap-2">
            <span className="mt-[6px] h-2 w-2 rounded-full bg-[#E5D0A8]" />
            <span>Un espace pour écrire ce que tu traverses.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-[6px] h-2 w-2 rounded-full bg-[#E5D0A8]" />
            <span>Des réponses douces, en français, sans jugement.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-[6px] h-2 w-2 rounded-full bg-[#E5D0A8]" />
            <span>Une bêta limitée, gratuite, pour co-construire Aurum.</span>
          </li>
        </ul>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#5C554B]" htmlFor="email">
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full rounded-xl border border-[#E5D0A8]/60 bg-white px-4 py-3 text-[#5C554B] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E5D0A8]"
              placeholder="prenom@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#5C554B]" htmlFor="reason">
              Pourquoi veux-tu tester Aurum ?
            </label>
            <textarea
              id="reason"
              className="w-full min-h-[120px] rounded-xl border border-[#E5D0A8]/60 bg-white px-4 py-3 text-[#5C554B] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E5D0A8]"
              placeholder="Dis-moi en une ou deux phrases ce qui t’attire dans Aurum…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-[#E5D0A8] text-[#5C554B] font-semibold py-3 shadow-md hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Rejoindre la bêta privée
          </button>

          <div className="text-sm">
            {status === 'loading' && (
              <p className="text-[#6F665B]">Inscription en cours…</p>
            )}
            {status === 'success' && (
              <p className="text-green-600">
                Merci, ta demande d’accès à la bêta est bien enregistrée. Tu recevras un e-mail très bientôt.
              </p>
            )}
            {status === 'error' && errorMessage && (
              <p className="text-red-600">{errorMessage}</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
