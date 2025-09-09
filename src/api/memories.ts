import { supabase } from '../lib/supabase';
import { aiPersonality } from '../lib/ai-personality';
import type { Memory } from '../types';

export class MemoryService {
  async saveMemories(userId: string, memories: Record<string, string>): Promise<void> {
    try {
      const memoryEntries = Object.entries(memories).map(([category, answer]) => ({
        user_id: userId,
        question: this.getCategoryQuestion(category),
        answer,
        category: category as Memory['category'],
      }));

      console.log('Saving memory entries:', memoryEntries);

      const { error } = await supabase
        .from('memories')
        .upsert(memoryEntries, {
          onConflict: 'user_id,category'
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Add to vector store for AI personality
      try {
        await aiPersonality.addMemories(userId, memoryEntries);
      } catch (aiError) {
        console.warn('AI personality update failed:', aiError);
        // Don't fail the entire operation if AI update fails
      }
    } catch (error) {
      console.error('Save memories error:', error);
      throw new Error('Failed to save your memories. Please try again.');
    }
  }

  async getMemories(userId: string): Promise<Memory[]> {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async generateAIResponse(userId: string, message: string): Promise<string> {
    return await aiPersonality.generateResponse(userId, message);
  }

  private getCategoryQuestion(category: string): string {
    const questions: Record<string, string> = {
      childhood: 'Tell me about your childhood. What are your most cherished memories from growing up?',
      career: 'What was your career path? What work brought you the most fulfillment?',
      love: 'Tell me about love in your life. What relationships meant the most to you?',
      struggles: 'What were your greatest challenges? How did you overcome them?',
      values: 'What principles guided your life? What do you believe in most deeply?',
      advice: 'What advice would you give to future generations? What wisdom do you want to pass on?',
    };
    return questions[category] || 'Tell me about this aspect of your life.';
  }
}

export const memoryService = new MemoryService();