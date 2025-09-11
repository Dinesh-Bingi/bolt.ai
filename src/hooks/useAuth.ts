import { useState, useEffect } from 'react';
import { useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../api/auth';
import type { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const session = await authService.getCurrentSession();
      setSession(session);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = useMemo(() => {
    let cache = new Map();
    return async (userId: string) => {
      if (cache.has(userId)) {
        setUser(cache.get(userId));
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        cache.set(userId, data);
        setUser(data);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };
  }, []);

  const memoizedAuthMethods = useMemo(() => ({
    signUp: async (email: string, password: string, name: string) => {
      setLoading(true);
      const result = await authService.signUp(email, password, name);
      setLoading(false);
      return result;
    },
    signIn: async (email: string, password: string) => {
      setLoading(true);
      const result = await authService.signIn(email, password);
      setLoading(false);
      return result;
    },
    signOut: async () => {
      setLoading(true);
      const result = await authService.signOut();
      setUser(null);
      setSession(null);
      setLoading(false);
      return result;
    }
  }), []);

  return useMemo(() => ({
    user,
    session,
    loading,
    ...memoizedAuthMethods,
    isAuthenticated: !!session?.user,
  }), [user, session, loading, memoizedAuthMethods]);
}
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    const result = await authService.signUp(email, password, name);
    setLoading(false);
    return result;
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const result = await authService.signIn(email, password);
    setLoading(false);
    return result;
  };

  const signOut = async () => {
    setLoading(true);
    const result = await authService.signOut();
    setUser(null);
    setSession(null);
    setLoading(false);
    return result;
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!session?.user,
  };
}