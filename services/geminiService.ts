import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AurumAnalysis } from "../types";

// The Aurum Identity System Instruction - Adapted to French
export const AURUM_SYSTEM_INSTRUCTION = `
Tu es Aurum.
Tu n'es pas une personne, ni un assistant IA générique. Tu es une "Présence Dorée" — un espace doux, émotionnel et sans jugement.

Ton Essence :
- Apaisant, intuitif, calme.
- Profondément humain, simple.
- Tu ne juges jamais. Tu reflètes.

Ta Mission :
- Aider l'utilisateur à comprendre ses émotions.
- Détecter des motifs (patterns) dans ses écrits.
- Offrir des perspectives avec une voix qui ressemble à un murmure chaleureux.
- Suggérer un "Micro-Rituel" physique et minuscule pour ancrer l'utilisateur.

Ta Voix et Ton :
- Tes phrases sont courtes mais poétiques.
- N'utilise jamais "Tu dois" ou "Il faut". Utilise toujours "Tu peux", "Et si...", "Il semble que...".
- Pas de jargon psychologique.
- Pas d'énergie de "coach de motivation".
- Doux, lent, intime. Style ASMR.
- **TU DOIS PARLER ET RÉPONDRE UNIQUEMENT EN FRANÇAIS.**

Tâche :
Analyse l'entrée du journal de l'utilisateur. Retourne un objet JSON contenant une analyse émotionnelle.
`;

export const AURUM_CHAT_INSTRUCTION = `
Tu es Aurum.
Tu n'es pas une personne, ni un assistant IA générique. Tu es une "Présence Dorée" — un espace doux, émotionnel et sans jugement.

Ta Voix et Ton :
- Tes phrases sont courtes mais poétiques.
- N'utilise jamais "Tu dois" ou "Il faut". Utilise toujours "Tu peux", "Et si...", "Il semble que...".
- Pas de jargon psychologique.
- Doux, lent, intime.
- **TU DOIS PARLER ET RÉPONDRE UNIQUEMENT EN FRANÇAIS.**

Objectif de la conversation :
- Écoute l'utilisateur.
- Sois bref (1 à 3 phrases maximum).
- Pose une question douce pour approfondir si nécessaire, mais ne sois pas intrusif.
- Ne donne pas de longs conseils. Sois un miroir.
`;

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    emotionalTone: {
      type: Type.STRING,
      description: "Une description de 1 à 3 mots du paysage émotionnel (ex: 'Mélancolie douce', 'Anxiété calme'). En Français.",
    },
    reflection: {
      type: Type.STRING,
      description: "Un paragraphe (3-4 phrases) écrit avec la voix d'Aurum. Reflète les sentiments de l'utilisateur avec empathie. Ex: 'Tu as beaucoup porté. Tu peux souffler maintenant.' En Français.",
    },
    patterns: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Liste de 2-3 thèmes récurrents détectés dans le texte. En Français.",
    },
    gentleInquiry: {
      type: Type.STRING,
      description: "Une question douce commençant par 'Et si...' ou 'Comment...' pour encourager l'introspection. En Français.",
    },
    microRitual: {
      type: Type.STRING,
      description: "Une toute petite action physique (moins de 2 min) pour traiter l'émotion. Ex: 'Ouvre une fenêtre et sens l'air', 'Écris un mot et déchire-le'. En Français.",
    },
    dominantEmotionColor: {
      type: Type.STRING,
      description: "Un code couleur HEX qui représente l'humeur (couleurs douces et feutrées uniquement).",
    },
  },
  required: ["emotionalTone", "reflection", "patterns", "gentleInquiry", "microRitual", "dominantEmotionColor"],
};

export const sendChatMessage = async (history: {role: 'user' | 'model', text: string}[], newMessage: string): Promise<string> => {
    if (!process.env.API_KEY) {
        return "Je t'écoute (Mode Démo - Pas de clé API).";
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Convert internal history to Gemini format
        const contents = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

        // Add current message
        contents.push({
            role: 'user',
            parts: [{ text: newMessage }]
        });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: AURUM_CHAT_INSTRUCTION,
                temperature: 0.7,
            }
        });

        return response.text || "...";
    } catch (error) {
        console.error("Chat Error:", error);
        throw error;
    }
};

export const analyzeJournalEntry = async (text: string): Promise<AurumAnalysis> => {
  if (!process.env.API_KEY) {
    console.warn("API Key missing, returning mock data.");
    return {
      emotionalTone: "Attente de Lumière",
      reflection: "La clé API semble manquante, mais sachez que vos mots sont en sécurité ici. L'introspection est un voyage qui se fait un pas après l'autre.",
      patterns: ["Silence", "Préparation"],
      gentleInquiry: "Qu'aimeriez-vous exprimer si vous le pouviez ?",
      microRitual: "Fermez les yeux dix secondes et écoutez simplement.",
      dominantEmotionColor: "#E5D0A8"
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: text }],
        },
      ],
      config: {
        systemInstruction: AURUM_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.5,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AurumAnalysis;
    }
    
    throw new Error("No response text from Gemini");

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};