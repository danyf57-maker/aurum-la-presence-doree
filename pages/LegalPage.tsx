import React from 'react';

export const LegalPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#FAF6EE] to-[#F2EFE9] flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full bg-white/90 rounded-3xl shadow-lg border border-[#E5D0A8]/40 p-8 space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-[#A08D75]">Aurum</p>
          <h1 className="text-3xl font-semibold text-[#5C554B]">Mentions légales & confidentialité</h1>
        </div>

        <section className="space-y-2 text-[#5C554B]">
          <h2 className="text-xl font-semibold">Responsable de la publication</h2>
          <p>
            Aurum – La Présence Dorée. Contact : support@aurum.app (adresse à adapter).
          </p>
        </section>

        <section className="space-y-2 text-[#5C554B]">
          <h2 className="text-xl font-semibold">Hébergement</h2>
          <p>
            Front hébergé sur Cloudflare Pages. Services backend hébergés sur Supabase et les Edge Functions associées.
          </p>
        </section>

        <section className="space-y-2 text-[#5C554B]">
          <h2 className="text-xl font-semibold">Avertissement</h2>
          <p>
            Aurum ne remplace pas un diagnostic ni un suivi médical ou psychologique. En cas de détresse, contacte les services d’urgence ou un professionnel de santé.
          </p>
        </section>

        <section className="space-y-2 text-[#5C554B]">
          <h2 className="text-xl font-semibold">Données & confidentialité</h2>
          <p>
            L’accès se fait par e-mail et lien sécurisé (Supabase Auth). Les échanges peuvent être stockés dans Supabase et traités par l’IA pour générer des réponses. Aucune donnée n’est partagée à des tiers en dehors des services nécessaires au fonctionnement (hébergement, authentification, IA).
          </p>
        </section>

        <div className="text-center">
          <a href="/" className="underline text-[#7d6a5a] hover:text-[#5C554B]">Retourner à l’accueil</a>
        </div>
      </div>
    </div>
  );
};
