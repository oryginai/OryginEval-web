import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { ApiClient } from '@/lib/api-client';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser({
          id: session?.user.id,
          name: session?.user.user_metadata?.full_name || 'User',
          email: session?.user.email as string,
          avatar: session?.user.user_metadata?.avatar_url || 'User',
        });
        
        // Create account on backend when user logs in
        try {
          console.log('Supabase user ID:', session.user.id);
          const response = await ApiClient.post('/accounts-add', { 'account_id': session.user.id });
          console.log('API Response:', response);
        } catch (error) {
          console.error('Error creating account:', error);
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        setUser({
          id: session?.user.id,
          name: session?.user.user_metadata?.full_name || 'User',
          email: session?.user.email as string,
          avatar: session?.user.user_metadata?.avatar_url || 'User',
        });
        
        // Create account on backend when user logs in
        try {
          console.log('Supabase user ID:', session.user.id);
          const response = await ApiClient.post('/accounts-add', { 'account_id': session.user.id });
          console.log('API Response:', response);
        } catch (error) {
          console.error('Error creating account:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/projects`,
      },
    });
    if (error) throw error;
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: loading,
        isAuthenticated: !!session,
        login: signInWithGoogle,
        logout: signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
