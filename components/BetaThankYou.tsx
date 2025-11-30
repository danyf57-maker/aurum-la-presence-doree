import React from 'react';

export const BetaThankYou: React.FC = () => {
  const goHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#FDFBF7] via-[#FAF6EE] to-[#F2EFE9] px-4 py-12">
      <div className="max-w-xl w-full bg-white/90 rounded-3xl shadow-lg border border-[#E5D0A8]/40 p-8 space-y-6 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-[#A08D75]">Aurum – Bêta privée</p>
        <h1 className="text-3xl font-semibold text-[#5C554B]">
          Merci d’avoir rejoint la bêta Aurum 💛
        </h1>
        <div className="text-[#6F665B] space-y-3">
          <p>Ton inscription est bien enregistrée.</p>
          <p>Tu recevras bientôt un e-mail avec les prochaines étapes pour tester Aurum et partager ton ressenti.</p>
          <p>La bêta reste confidentielle : avançons ensemble, en douceur.</p>
        </div>
        <button
          onClick={goHome}
          className="mt-2 inline-flex items-center justify-center rounded-full bg-[#E5D0A8] text-[#5C554B] font-semibold px-6 py-3 shadow-md hover:shadow-lg transition"
        >
          Retourner à Aurum
        </button>
      </div>
    </div>
  );
};
