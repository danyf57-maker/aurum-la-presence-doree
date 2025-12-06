// services/deepseekService.ts

// DeepSeek-V3.2 : identifiant explicite pour toutes les requêtes
const DEEPSEEK_MODEL = "deepseek-v3.2";

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
      body: JSON.stringify({
        prompt,
        // DeepSeek-V3.2 : modèle forcé côté proxy Aurum
        model: DEEPSEEK_MODEL,
      }),
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

    try {
      const usedModel =
        (data as any)?.model ??
        (data as any)?.usage?.model ??
        (data as any)?.response?.model;
      if (usedModel) {
        console.debug("[DeepSeek] Model used by API:", usedModel);
      }
    } catch {
      // on ignore silencieusement si le format de réponse change
    }

    return text;
  } catch (error) {
    console.error("[AURUM] Erreur réseau en parlant au proxy Aurum:", error);
    return FALLBACK_DEMO_TEXT;
  }
}
