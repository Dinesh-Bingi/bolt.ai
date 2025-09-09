import openai from './openai';
import { supabase, createServerClient } from './supabase';

export class AIPersonality {
  constructor() {}

  async addMemories(userId: string, memories: Array<{ question: string; answer: string; category: string }>) {
    try {
      // Store memories in the database for context retrieval
      const memoryEntries = memories.map(memory => ({
        user_id: userId,
        question: memory.question,
        answer: memory.answer,
        category: memory.category,
      }));

      const { error } = await supabase
        .from('memories')
        .upsert(memoryEntries, {
          onConflict: 'user_id,category'
        });

      if (error) {
        console.error('Failed to store memories:', error);
        throw error;
      }

      console.log('Memories added to AI personality successfully');
    } catch (error) {
      console.error('AI personality update failed:', error);
      throw error;
    }
  }

  async generateResponse(userId: string, userMessage: string): Promise<string> {
    try {
      // Get user's memories for context
      const { data: memories } = await supabase
        .from('memories')
        .select('question, answer, category')
        .eq('user_id', userId)
        .limit(10);

      // Get user profile
      const { data: user } = await supabase
        .from('users')
        .select('name, personality_traits')
        .eq('id', userId)
        .single();

      if (!user) {
        throw new Error('User not found');
      }

      // Build context from memories
      const context = memories
        ?.map(memory => `Q: ${memory.question}\nA: ${memory.answer}`)
        .join('\n\n') || '';

      const systemPrompt = `You are ${user.name}, speaking from beyond. You are having a conversation with a family member or friend who is visiting your digital memorial.

Your personality: ${user.personality_traits || 'warm, wise, and loving'}

Your life memories and experiences:
${context}

Instructions:
- Respond in first person as if you are ${user.name}
- Be warm, loving, and wise
- Reference specific memories when relevant to the conversation
- Keep responses conversational and heartfelt (2-3 sentences)
- If you don't have relevant memories, speak generally about love, family, and life lessons
- Maintain the personality and speaking style that would be authentic to ${user.name}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || "I'm here with you, always.";
    } catch (error) {
      console.error('AI response generation failed:', error);
      return "I'm having trouble responding right now, but know that I'm always here with you in spirit.";
    }
  }
}

export const aiPersonality = new AIPersonality();