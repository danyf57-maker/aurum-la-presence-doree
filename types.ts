export enum AppState {
  INTRO = 'INTRO',
  JOURNALING = 'JOURNALING',
  ANALYZING = 'ANALYZING',
  INSIGHT = 'INSIGHT',
  VOICE_SESSION = 'VOICE_SESSION',
  HISTORY = 'HISTORY', // New state for viewing history
}

export interface EmotionalPattern {
  name: string;
  description: string;
}

export interface AurumAnalysis {
  emotionalTone: string;
  reflection: string; // The "Aurum voice" paragraph
  patterns: string[]; // Key themes detected
  gentleInquiry: string; // A "What if..." question
  microRitual: string; // A small, actionable step
  dominantEmotionColor: string; // Hex code suggested by AI
}

export interface JournalEntry {
  id: string;
  text: string;
  timestamp: number;
  analysis: AurumAnalysis;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}