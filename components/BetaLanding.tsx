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

      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/`
        : undefined;

      const { error: authError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (authError) {
        console.error("[AURUM BETA] Failed to send magic link", authError);
        setErrorMessage("Inscription prise en compte, mais l'envoi du lien a rencontré un souci. Vérifie ta boîte mail, ou réessaie plus tard.");
        // On continue tout de même la redirection.
      } else {
        console.log("[AURUM BETA] Magic link sent for", normalizedEmail);
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
    <div className="min-h-screen w-full bg-gradient-to-b from-[#FDFBF7] via-[#FAF6EE] to-[#F2EFE9] px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Hero */}
        <section className="bg-white/90 rounded-3xl shadow-lg border border-[#E5D0A8]/40 p-8 md:p-10 space-y-6 text-center">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-[#A08D75]">Aurum – Bêta privée</p>
            <h1 className="text-3xl md:text-4xl font-semibold text-[#5C554B]">
              Une présence dorée qui t’aide à mettre des mots sur ce que tu ressens.
            </h1>
            <p className="text-[#6F665B] text-base md:text-lg">
              Une présence dorée qui t’aide à mettre des mots sur ce que tu ressens… et à traverser les moments difficiles avec un peu plus de douceur.
            </p>
            <p className="text-[#6F665B] text-sm md:text-base">
              Un espace intime, des réponses bienveillantes, une IA pensée pour le calme – pas pour la performance.
            </p>
          </div>
          <div className="space-y-2">
            <a
              href="#beta-form"
              className="inline-flex justify-center items-center rounded-full bg-[#E5D0A8] text-[#5C554B] font-semibold px-6 py-3 shadow-md hover:shadow-lg transition"
            >
              Rejoindre la bêta privée
            </a>
            <p className="text-xs text-[#7d6a5a]">
              Accès gratuit, places limitées. Tu peux arrêter à tout moment.
            </p>
          </div>
        </section>

        {/* Pour qui */}
        <section className="bg-white/80 rounded-3xl shadow border border-[#E5D0A8]/30 p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-semibold text-[#5C554B] italic">Pour toi si…</h2>
          <ul className="space-y-2 text-[#5C554B]">
            <li className="flex items-start gap-2">
              <span className="mt-[6px] h-2 w-2 rounded-full bg-[#E5D0A8]" />
              <span>Tu as parfois du mal à poser des mots sur ce que tu ressens</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-[6px] h-2 w-2 rounded-full bg-[#E5D0A8]" />
              <span>Tu aimerais un espace où déverser ce que tu as sur le cœur, sans jugement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-[6px] h-2 w-2 rounded-full bg-[#E5D0A8]" />
              <span>Tu préfères une ambiance calme, lente, rassurante plutôt qu’un chatbot “productivité”</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-[6px] h-2 w-2 rounded-full bg-[#E5D0A8]" />
              <span>Tu as envie de participer à la création d’un outil émotionnel vraiment différent</span>
            </li>
          </ul>
          <p className="text-[#6F665B] text-sm">
            Aurum ne remplace ni un proche, ni un thérapeute. C’est une <strong>présence complémentaire</strong>, disponible quand tu en as besoin.
          </p>
        </section>

        {/* Ce que tu vas tester */}
        <section className="bg-white/80 rounded-3xl shadow border border-[#E5D0A8]/30 p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-semibold text-[#5C554B] italic">Concrètement, qu’est-ce que tu vas pouvoir faire ?</h2>
          <ul className="space-y-2 text-[#5C554B]">
            <li className="flex items-start gap-2">
              <span className="mt-[6px] h-2 w-2 rounded-full bg-[#E5D0A8]" />
              <span><strong>Écrire ce que tu traverses</strong> : peurs, doutes, fatigue, surcharge mentale…</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-[6px] h-2 w-2 rounded-full bg-[#E5D0A8]" />
              <span><strong>Recevoir des réponses douces et structurées</strong>, en français, adaptées à ton état du moment</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-[6px] h-2 w-2 rounded-full bg-[#E5D0A8]" />
              <span><strong>Garder une trace de tes échanges</strong> et voir peu à peu le fil de ton histoire</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-[6px] h-2 w-2 rounded-full bg-[#E5D0A8]" />
              <span><strong>Tester la voix d’Aurum</strong> (quand tu n’as pas l’énergie d’écrire)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-[6px] h-2 w-2 rounded-full bg-[#E5D0A8]" />
              <span><strong>Co-construire l’outil</strong> : tes retours influenceront directement la suite du produit</span>
            </li>
          </ul>
          <p className="text-[#6F665B] text-sm">
            Tu n’es pas “juste un utilisateur”, tu fais partie du <strong>cercle des premiers compagnons d’Aurum</strong>.
          </p>
        </section>

        {/* Pourquoi limité */}
        <section className="bg-white/80 rounded-3xl shadow border border-[#E5D0A8]/30 p-6 md:p-8 space-y-3">
          <h2 className="text-2xl font-semibold text-[#5C554B] italic">Pourquoi l’accès est limité ?</h2>
          <p className="text-[#6F665B]">Aurum est encore en construction. Limiter le nombre de personnes permet de :</p>
          <ul className="space-y-2 text-[#5C554B]">
            <li className="flex items-start gap-2">
              <span className="mt-[6px] h-2 w-2 rounded-full bg-[#E5D0A8]" />
              <span>Garder une <strong>expérience fluide et intime</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-[6px] h-2 w-2 rounded-full bg-[#E5D0A8]" />
              <span>Prendre le temps de <strong>lire les retours</strong> et ajuster la présence d’Aurum</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-[6px] h-2 w-2 rounded-full bg-[#E5D0A8]" />
              <span>Tester de nouvelles fonctionnalités (journal, voix, rituels) avec un groupe engagé</span>
            </li>
          </ul>
          <p className="text-[#6F665B] text-sm">
            Si tu entres maintenant, tu verras <strong>Aurum évoluer sous tes yeux</strong>… et un peu grâce à toi.
          </p>
        </section>

        {/* Comment rejoindre */}
        <section className="bg-white/80 rounded-3xl shadow border border-[#E5D0A8]/30 p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-semibold text-[#5C554B] italic">Comment rejoindre la bêta ?</h2>
          <ol className="list-decimal pl-5 space-y-2 text-[#5C554B]">
            <li>Tu laisses ton e-mail (et quelques mots si tu veux dire pourquoi tu es là).</li>
            <li>Tu reçois un lien d’accès sécurisé dans ta boîte mail.</li>
            <li>Tu peux revenir quand tu veux, depuis ton téléphone ou ton ordinateur.</li>
            <li>Si un jour tu ne veux plus utiliser Aurum, tu peux simplement arrêter.</li>
          </ol>
          <p className="text-[#6F665B] text-sm">
            Pas de carte bancaire, pas d’engagement. Juste toi, Aurum, et un espace pour respirer.
          </p>
        </section>

        {/* FAQ */}
        <section className="bg-white/80 rounded-3xl shadow border border-[#E5D0A8]/30 p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-semibold text-[#5C554B] italic">Questions fréquentes</h2>
          <div className="space-y-3 text-[#5C554B]">
            <div>
              <p className="font-semibold">Est-ce que tout est anonyme ?</p>
              <p className="text-sm text-[#6F665B]">Aurum ne te demande que ton e-mail pour te donner accès. Ce que tu écris reste entre toi et Aurum.</p>
            </div>
            <div>
              <p className="font-semibold">Est-ce que c’est une thérapie ?</p>
              <p className="text-sm text-[#6F665B]">Non. Aurum ne remplace ni un thérapeute, ni un médecin. C’est une présence en plus, pas un diagnostic.</p>
            </div>
            <div>
              <p className="font-semibold">Est-ce que la bêta est payante ?</p>
              <p className="text-sm text-[#6F665B]">Non, la bêta est gratuite. En échange, tes retours nous aident à l’améliorer.</p>
            </div>
          </div>
        </section>

        {/* Final CTA + Form */}
        <section id="beta-form" className="bg-white/90 rounded-3xl shadow-lg border border-[#E5D0A8]/40 p-8 md:p-10 space-y-6">
          <div className="space-y-3 text-center">
            <h3 className="text-2xl font-semibold text-[#5C554B] italic">
              Prêt(e) à faire partie du cercle des premiers compagnons d’Aurum ?
            </h3>
            <p className="text-[#6F665B]">
              Si oui, laisse simplement ton e-mail ci-dessous. On t’enverra ton lien d’accès personnel dès que possible.
            </p>
          </div>

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
              {isLoading ? 'Inscription en cours…' : 'Rejoindre la bêta privée'}
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
        </section>
      </div>
    </div>
  );
};
