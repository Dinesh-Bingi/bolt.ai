import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface Memorial {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string;
  is_public: boolean;
  created_at: string;
}

export class MemorialService {
  async createMemorial(userId: string, title: string, description: string): Promise<Memorial> {
    try {
      const slug = this.generateSlug(title);
      
      const { data, error } = await supabase
        .from('memorials')
        .insert({
          user_id: userId,
          slug,
          title,
          description,
          is_public: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create memorial:', error);
      throw new Error('Failed to create memorial');
    }
  }

  async getMemorialBySlug(slug: string): Promise<Memorial | null> {
    try {
      const { data, error } = await supabase
        .from('memorials')
        .select(`
          *,
          users (
            name,
            email
          ),
          avatars (
            image_url,
            is_active
          )
        `)
        .eq('slug', slug)
        .eq('is_public', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to get memorial:', error);
      throw new Error('Failed to get memorial');
    }
  }

  async getUserMemorial(userId: string): Promise<Memorial | null> {
    try {
      const { data, error } = await supabase
        .from('memorials')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to get user memorial:', error);
      throw new Error('Failed to get user memorial');
    }
  }

  async updateMemorial(memorialId: string, updates: Partial<Memorial>): Promise<void> {
    try {
      const { error } = await supabase
        .from('memorials')
        .update(updates)
        .eq('id', memorialId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update memorial:', error);
      throw new Error('Failed to update memorial');
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + uuidv4().slice(0, 8);
  }
}

export const memorialService = new MemorialService();