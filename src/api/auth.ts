import { supabase } from '../lib/supabase';

export interface AuthResponse {
  user: any;
  session: any;
  error?: string;
}

export class AuthService {
  async signUp(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;

      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name,
            subscription: 'free',
          });

        if (profileError) throw profileError;
      }

      return { user: data.user, session: data.session };
    } catch (error: any) {
      return { user: null, session: null, error: error.message };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { user: data.user, session: data.session };
    } catch (error: any) {
      return { user: null, session: null, error: error.message };
    }
  }

  async signOut(): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }
}

export const authService = new AuthService();