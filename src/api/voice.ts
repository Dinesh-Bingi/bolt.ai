import { elevenLabs } from '../lib/elevenlabs';
import { supabase } from '../lib/supabase';

export class VoiceService {
  async cloneVoice(userId: string, name: string, audioFiles: File[]): Promise<string> {
    try {
      const voiceId = await elevenLabs.cloneVoice(name, audioFiles);
      
      // Save voice clone info to database
      const { error } = await supabase
        .from('voice_clones')
        .insert({
          user_id: userId,
          voice_id: voiceId,
          name,
          is_active: true,
        });

      if (error) throw error;

      return voiceId;
    } catch (error) {
      console.error('Voice cloning failed:', error);
      throw new Error('Failed to clone voice');
    }
  }

  async generateSpeech(userId: string, text: string): Promise<ArrayBuffer> {
    try {
      // Get user's voice clone
      const { data: voiceClone } = await supabase
        .from('voice_clones')
        .select('voice_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (!voiceClone) {
        throw new Error('No voice clone found for user');
      }

      return await elevenLabs.generateSpeech(text, voiceClone.voice_id);
    } catch (error) {
      console.error('Speech generation failed:', error);
      throw new Error('Failed to generate speech');
    }
  }

  async getVoiceClones(userId: string) {
    const { data, error } = await supabase
      .from('voice_clones')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const voiceService = new VoiceService();