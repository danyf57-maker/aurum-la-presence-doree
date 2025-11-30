import { supabase } from "../supabaseClient";

const SESSION_KEY = "aurum_beta_anon_session_id";

function getOrCreateAnonSessionId(): string {
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function trackBetaSession(): Promise<void> {
  const anonSessionId = getOrCreateAnonSessionId();
  const userAgent = navigator.userAgent;

  if (!supabase) {
    console.warn("[AURUM BETA TRACKING] Supabase non configuré, session non enregistrée.");
    return;
  }

  try {
    const { error } = await supabase.from("beta_sessions").insert([
      {
        anon_session_id: anonSessionId,
        user_agent: userAgent,
      },
    ]);

    if (error) {
      console.error("[AURUM BETA TRACKING] Erreur insertion beta_sessions:", error);
    }
  } catch (err) {
    console.error("[AURUM BETA TRACKING] Exception lors du tracking de session:", err);
  }
}
