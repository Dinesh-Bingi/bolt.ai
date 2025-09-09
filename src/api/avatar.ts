import { didApi } from '../lib/did';
import { supabase } from '../lib/supabase';

export class AvatarService {
  async createAvatar(userId: string, imageFile: File): Promise<string> {
    try {
      // Upload image to Supabase storage
      const fileName = `${userId}/avatar-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Save avatar info to database
      const { data: avatar, error } = await supabase
        .from('avatars')
        .insert({
          user_id: userId,
          image_url: publicUrl,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      return avatar.id;
    } catch (error) {
      console.error('Avatar creation failed:', error);
      throw new Error('Failed to create avatar');
    }
  }

  async generateTalkingAvatar(userId: string, text: string): Promise<string> {
    try {
      // Get user's active avatar and voice
      const { data: avatar } = await supabase
        .from('avatars')
        .select('image_url')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      const { data: voiceClone } = await supabase
        .from('voice_clones')
        .select('voice_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (!avatar || !voiceClone) {
        throw new Error('Avatar or voice clone not found');
      }

      // Generate speech audio
      const { elevenLabs } = await import('../lib/elevenlabs');
      const audioBuffer = await elevenLabs.generateSpeech(text, voiceClone.voice_id);
      
      // Upload audio to storage
      const audioFileName = `${userId}/speech-${Date.now()}.mp3`;
      const { data: audioUpload, error: audioError } = await supabase.storage
        .from('audio')
        .upload(audioFileName, audioBuffer, {
          contentType: 'audio/mpeg',
        });

      if (audioError) throw audioError;

      const { data: { publicUrl: audioUrl } } = supabase.storage
        .from('audio')
        .getPublicUrl(audioFileName);

      // Create talking avatar with D-ID
      const talkId = await didApi.createTalkingAvatar(avatar.image_url, audioUrl);
      
      return talkId;
    } catch (error) {
      console.error('Talking avatar generation failed:', error);
      throw new Error('Failed to generate talking avatar');
    }
  }

  async getAvatars(userId: string) {
    const { data, error } = await supabase
      .from('avatars')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const avatarService = new AvatarService();