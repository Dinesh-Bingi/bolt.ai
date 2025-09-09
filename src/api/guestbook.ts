import { supabase } from '../lib/supabase';
import type { GuestbookEntry } from '../types';

export class GuestbookService {
  async addEntry(
    memorialId: string,
    authorName: string,
    message: string,
    type: 'message' | 'candle' | 'flower'
  ): Promise<GuestbookEntry> {
    try {
      const { data, error } = await supabase
        .from('guestbook')
        .insert({
          memorial_id: memorialId,
          author_name: authorName,
          message,
          type,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to add guestbook entry:', error);
      throw new Error('Failed to add guestbook entry');
    }
  }

  async getEntries(memorialId: string): Promise<GuestbookEntry[]> {
    try {
      const { data, error } = await supabase
        .from('guestbook')
        .select('*')
        .eq('memorial_id', memorialId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get guestbook entries:', error);
      throw new Error('Failed to get guestbook entries');
    }
  }

  async deleteEntry(entryId: string, userId: string): Promise<void> {
    try {
      // Verify the user owns the memorial
      const { data: memorial } = await supabase
        .from('memorials')
        .select('user_id')
        .eq('id', entryId)
        .single();

      if (memorial?.user_id !== userId) {
        throw new Error('Unauthorized');
      }

      const { error } = await supabase
        .from('guestbook')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete guestbook entry:', error);
      throw new Error('Failed to delete guestbook entry');
    }
  }
}

export const guestbookService = new GuestbookService();