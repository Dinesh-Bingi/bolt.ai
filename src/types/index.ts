export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription?: 'free' | 'premium' | 'lifetime';
  created_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  category: 'childhood' | 'career' | 'love' | 'struggles' | 'values' | 'advice';
  created_at: string;
}

export interface Avatar {
  id: string;
  user_id: string;
  image_url: string;
  voice_clone_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface GuestbookEntry {
  id: string;
  memorial_id: string;
  author_name: string;
  message: string;
  type: 'message' | 'candle' | 'flower';
  created_at: string;
}