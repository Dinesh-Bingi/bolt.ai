export class ElevenLabsAPI {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
  }

  async cloneVoice(name: string, audioFiles: File[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured. Please add VITE_ELEVENLABS_API_KEY to your environment variables.');
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', `Voice clone for ${name} - Legacy.ai`);
      
      audioFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch(`${this.baseUrl}/voices/add`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('ElevenLabs API error:', errorData);
        throw new Error('Failed to clone voice');
      }

      const data = await response.json();
      return data.voice_id;
    } catch (error) {
      console.error('Voice cloning failed:', error);
      throw new Error('Failed to clone voice');
    }
  }

  async generateSpeech(text: string, voiceId: string): Promise<ArrayBuffer> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs speech generation error:', errorText);
        throw new Error('Failed to generate speech');
      }

      return response.arrayBuffer();
    } catch (error) {
      console.error('Speech generation failed:', error);
      throw new Error('Failed to generate speech');
    }
  }

  async getVoices(): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get voices');
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Failed to get voices:', error);
      throw error;
    }
  }
}

export const elevenLabs = new ElevenLabsAPI();