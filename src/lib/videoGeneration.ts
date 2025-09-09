import { didApi } from './did';
import { supabase } from './supabase';

export interface VideoGenerationRequest {
  userId: string;
  text: string;
  avatarImageUrl?: string;
  voiceId?: string;
}

export interface VideoGenerationResult {
  videoId: string;
  status: 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
}

export class VideoGenerationService {
  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    try {
      // Get user's avatar and voice if not provided
      let avatarUrl = request.avatarImageUrl;
      let voiceId = request.voiceId;

      if (!avatarUrl) {
        const { data: avatar } = await supabase
          .from('avatars')
          .select('image_url')
          .eq('user_id', request.userId)
          .eq('is_active', true)
          .single();
        
        avatarUrl = avatar?.image_url;
      }

      if (!voiceId) {
        const { data: voice } = await supabase
          .from('voice_clones')
          .select('voice_id')
          .eq('user_id', request.userId)
          .eq('is_active', true)
          .single();
        
        voiceId = voice?.voice_id;
      }

      if (!avatarUrl) {
        throw new Error('No avatar image found. Please upload an avatar first.');
      }

      if (!voiceId) {
        throw new Error('No voice clone found. Please upload voice samples first.');
      }

      // Generate audio first using ElevenLabs
      const audioResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: request.text,
          user_id: request.userId,
        }),
      });

      if (!audioResponse.ok) {
        throw new Error('Failed to generate voice audio');
      }

      const { audio_url } = await audioResponse.json();

      // Create talking avatar video with D-ID
      const talkId = await didApi.createTalkingAvatar(avatarUrl, audio_url);

      // Store video generation request
      const { data: videoRecord, error } = await supabase
        .from('video_generations')
        .insert({
          user_id: request.userId,
          talk_id: talkId,
          text: request.text,
          avatar_url: avatarUrl,
          audio_url,
          status: 'processing',
        })
        .select()
        .single();

      if (error) throw error;

      return {
        videoId: videoRecord.id,
        status: 'processing',
      };
    } catch (error) {
      console.error('Video generation failed:', error);
      throw new Error(`Video generation failed: ${error.message}`);
    }
  }

  async checkVideoStatus(videoId: string): Promise<VideoGenerationResult> {
    try {
      const { data: videoRecord } = await supabase
        .from('video_generations')
        .select('*')
        .eq('id', videoId)
        .single();

      if (!videoRecord) {
        throw new Error('Video record not found');
      }

      if (videoRecord.status === 'completed') {
        return {
          videoId,
          status: 'completed',
          videoUrl: videoRecord.video_url,
        };
      }

      if (videoRecord.status === 'failed') {
        return {
          videoId,
          status: 'failed',
          error: videoRecord.error_message,
        };
      }

      // Check D-ID status
      const talkStatus = await didApi.getTalkStatus(videoRecord.talk_id);
      
      if (talkStatus.status === 'done') {
        // Update database with completed video
        await supabase
          .from('video_generations')
          .update({
            status: 'completed',
            video_url: talkStatus.result_url,
            completed_at: new Date().toISOString(),
          })
          .eq('id', videoId);

        return {
          videoId,
          status: 'completed',
          videoUrl: talkStatus.result_url,
        };
      } else if (talkStatus.status === 'error') {
        // Update database with error
        await supabase
          .from('video_generations')
          .update({
            status: 'failed',
            error_message: talkStatus.error?.message || 'Video generation failed',
          })
          .eq('id', videoId);

        return {
          videoId,
          status: 'failed',
          error: talkStatus.error?.message || 'Video generation failed',
        };
      }

      return {
        videoId,
        status: 'processing',
      };
    } catch (error) {
      console.error('Video status check failed:', error);
      throw error;
    }
  }

  async getUserVideos(userId: string) {
    const { data, error } = await supabase
      .from('video_generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const videoGenerationService = new VideoGenerationService();