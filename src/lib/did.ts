export class DIDApi {
  private apiKey: string;
  private baseUrl = 'https://api.d-id.com';

  constructor() {
    this.apiKey = import.meta.env.VITE_DID_API_KEY || '';
  }

  async createTalkingAvatar(imageUrl: string, audioUrl: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('D-ID API key not configured. Please add VITE_DID_API_KEY to your environment variables.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/talks`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_url: imageUrl,
          script: {
            type: 'audio',
            audio_url: audioUrl,
          },
          config: {
            fluent: true,
            pad_audio: 0.0,
            result_format: 'mp4',
            stitch: true,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('D-ID API error:', errorData);
        throw new Error('Failed to create talking avatar');
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Talking avatar creation failed:', error);
      throw new Error('Failed to create talking avatar');
    }
  }

  async getTalkStatus(talkId: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('D-ID API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/talks/${talkId}`, {
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get talk status');
      }

      return response.json();
    } catch (error) {
      console.error('Talk status check failed:', error);
      throw new Error('Failed to get talk status');
    }
  }
}

export const didApi = new DIDApi();