// services/deepseekService.ts

const FALLBACK_DEMO_TEXT =
  "Aurum ne peut pas se connecter à l’IA pour le moment. " +
  "Je reste quand même avec toi, écris ce que tu ressens.";

export async function askDeepseek(prompt: string): Promise<string> {
  const apiUrl = import.meta.env.VITE_AURUM_API_URL;

  if (!apiUrl) {
    console.warn("[AURUM] VITE_AURUM_API_URL manquant, passage en mode démo.");
    return "Je t’écoute (Mode Démo - Pas de clé API).";
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      console.error("[AURUM] Erreur HTTP du proxy Aurum:", response.status);
      return FALLBACK_DEMO_TEXT;
    }

    const data = await response.json().catch((e) => {
      console.error("[AURUM] Impossible de parser la réponse JSON du proxy:", e);
      return null;
    });

    const text =
      data?.text && typeof data.text === "string"
        ? data.text
        : FALLBACK_DEMO_TEXT;

    return text;
  } catch (error) {
    console.error("[AURUM] Erreur réseau en parlant au proxy Aurum:", error);
    return FALLBACK_DEMO_TEXT;
  }
}
