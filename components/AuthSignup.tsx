import React, { useState } from "react";
import { supabase } from "../supabaseClient";

const AuthSignup: React.FC = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setStatus("error");
      setMessage("Merci d’indiquer ton adresse e-mail.");
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/`
          : undefined;

      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        console.error("[AURUM AUTH] Error signInWithOtp (signup)", error);
        setStatus("error");
        setMessage(
          "Une brume technique empêche la création de ton espace. Réessaie dans un instant."
        );
        return;
      }

      setStatus("success");
      setMessage(
        "Un lien vient de t’être envoyé pour créer ou activer ton espace Aurum. Clique dessus dès que tu le reçois."
      );
    } catch (e) {
      console.error("[AURUM AUTH] Unexpected error (signup)", e);
      setStatus("error");
      setMessage(
        "Une brume technique empêche la création de ton espace. Réessaie dans un instant."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f2e8] px-4">
      <div className="w-full max-w-md bg-white/80 rounded-3xl shadow-sm p-8">
        <h1 className="text-2xl md:text-3xl font-serif text-center text-[#6c4a3a] mb-4">
          Créer ton espace Aurum
        </h1>
        <p className="text-center text-sm text-[#7d6a5a] mb-6">
          Inscris-toi avec ton e-mail.  
          Tu recevras un lien magique pour ouvrir ton espace et commencer à écrire.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-[#7d6a5a]">
            Adresse e-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-[#e0d2c0] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d9b678]"
              placeholder="toi@exemple.com"
              required
            />
          </label>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-3xl bg-[#d9b678] text-[#4d3828] font-medium py-2.5 text-sm hover:bg-[#e4c489] transition disabled:opacity-60"
          >
            {status === "loading" ? "Envoi du lien..." : "Recevoir le lien d’accès"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-sm text-center ${
              status === "error" ? "text-[#b02a2a]" : "text-[#4b5a2a]"
            }`}
          >
            {message}
          </p>
        )}

        <p className="mt-6 text-xs text-center text-[#a08c7a]">
          Aurum n’utilise pas de mot de passe : ton accès passe par un lien unique et sécurisé.
        </p>
      </div>
    </div>
  );
};

export default AuthSignup;
