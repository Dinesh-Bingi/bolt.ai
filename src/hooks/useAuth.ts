import { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription?: 'free' | 'premium' | 'lifetime';
  subscription_status?: 'active' | 'canceled' | 'past_due';
  personality_traits?: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthResponse {
  data?: any;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    isAuthenticated: false,
    error: null,
  });

  const [profileCache, setProfileCache] = useState<UserProfile | null>(null);

  const fetchUserProfile = useCallback(async (userId: string) => {
    if (profileCache?.id === userId) {
      return profileCache;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      setProfileCache(data);
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, [profileCache]);

  const updateAuthState = useCallback(async (user: User | null, session: Session | null) => {
    if (user) {
      const profile = await fetchUserProfile(user.id);
      setAuthState({
        user,
        profile,
        session,
        loading: false,
        isAuthenticated: true,
        error: null,
      });
    } else {
      setAuthState({
        user: null,
        profile: null,
        session: null,
        loading: false,
        isAuthenticated: false,
        error: null,
      });
      setProfileCache(null);
    }
  }, [fetchUserProfile]);

  const setError = useCallback((error: string | null) => {
    setAuthState(prev => ({ ...prev, error }));
  }, []);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        await updateAuthState(session?.user || null, session);
      } catch (error) {
        console.error('Error getting initial session:', error);
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error instanceof Error ? error.message : 'Authentication error'
        }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await updateAuthState(session?.user || null, session);
      }
    );

    return () => subscription.unsubscribe();
  }, [updateAuthState]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    setError(null);
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setError(error.message);
        return { error: error.message };
      }
      
      return { data, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Sign in failed';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<AuthResponse> => {
    setError(null);
    setAuthState(prev => ({ ...prev, loading: true }));
    
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
      
      if (error) {
        setError(error.message);
        return { error: error.message };
      }

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

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }
      
      return { data, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Sign up failed';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const signOut = useCallback(async (): Promise<AuthResponse> => {
    setError(null);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
        return { error: error.message };
      }
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Sign out failed';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResponse> => {
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        setError(error.message);
        return { error: error.message };
      }
      
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Password reset failed';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthResponse> => {
    setError(null);
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        setError(error.message);
        return { error: error.message };
      }
      
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Password update failed';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!authState.user) return { error: 'No user logged in' };

    setError(null);

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', authState.user.id)
        .select()
        .single();

      if (error) {
        setError(error.message);
        return { error: error.message };
      }

      setProfileCache(data);
      setAuthState(prev => ({
        ...prev,
        profile: data,
      }));

      return { data, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Profile update failed';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, [authState.user]);

  const refreshSession = useCallback(async (): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Session refresh failed';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, []);

  const memoizedValue = useMemo(() => ({
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshSession,
    setError,
  }), [authState, signIn, signUp, signOut, resetPassword, updatePassword, updateProfile, refreshSession, setError]);

  return memoizedValue;
};