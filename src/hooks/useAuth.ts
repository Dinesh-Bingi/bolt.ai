import { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_status?: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isAuthenticated: false,
  });

  const [profileCache, setProfileCache] = useState<UserProfile | null>(null);

  const fetchUserProfile = useCallback(async (userId: string) => {
    if (profileCache?.id === userId) {
      return profileCache;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
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

  const updateAuthState = useCallback(async (user: User | null) => {
    if (user) {
      const profile = await fetchUserProfile(user.id);
      setAuthState({
        user,
        profile,
        loading: false,
        isAuthenticated: true,
      });
    } else {
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        isAuthenticated: false,
      });
      setProfileCache(null);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        await updateAuthState(session?.user || null);
      } catch (error) {
        console.error('Error getting initial session:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await updateAuthState(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, [updateAuthState]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!authState.user) return { error: new Error('No user logged in') };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', authState.user.id)
        .select()
        .single();

      if (error) throw error;

      setProfileCache(data);
      setAuthState(prev => ({
        ...prev,
        profile: data,
      }));

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, [authState.user]);

  const memoizedValue = useMemo(() => ({
    ...authState,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }), [authState, signIn, signUp, signOut, updateProfile]);

  return memoizedValue;
};