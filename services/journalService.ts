import { supabase } from '../supabaseClient';
import type { JournalEntry } from '../types';

export async function saveJournalEntryToSupabase(entry: JournalEntry): Promise<void> {
  if (!supabase) {
    console.warn('Supabase client not initialized. Skipping remote save.');
    return;
  }

  const { error } = await supabase
    .from('journal_entries')
    .insert({
      id: entry.id,
      text: entry.text,
      timestamp: entry.timestamp,
      analysis: entry.analysis,
    });

  if (error) {
    console.error('Failed to save journal entry to Supabase', error);
  }
}

export async function getJournalEntriesFromSupabase(): Promise<JournalEntry[]> {
  if (!supabase) {
    console.warn('Supabase client not initialized. Skipping remote fetch.');
    return [];
  }

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Failed to load journal entries from Supabase', error);
    return [];
  }

  if (!data) return [];

  return data.map((row) => ({
    id: row.id,
    text: row.text,
    timestamp: row.timestamp,
    analysis: row.analysis,
  })) as JournalEntry[];
}
