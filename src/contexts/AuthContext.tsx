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
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
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
          name: session?.user.user_metadata?.full_name || session?.user.email?.split('@')[0] || 'User',
          email: session?.user.email as string,
          avatar: session?.user.user_metadata?.avatar_url || 
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    session?.user.user_metadata?.full_name || session?.user.email?.split('@')[0] || 'User'
                  )}&background=ff3d3d&color=fff`,
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
          name: session?.user.user_metadata?.full_name || session?.user.email?.split('@')[0] || 'User',
          email: session?.user.email as string,
          avatar: session?.user.user_metadata?.avatar_url || 
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    session?.user.user_metadata?.full_name || session?.user.email?.split('@')[0] || 'User'
                  )}&background=ff3d3d&color=fff`,
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

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };  // Sign up with email and password
  const signUpWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/projects`,
      },
    });
    
    if (error) throw error;
    
    // Debug logging to see what Supabase returns
    console.log('SignUp Response:', {
      user: data.user,
      session: data.session,
      user_id: data.user?.id,
      email_confirmed_at: data.user?.email_confirmed_at,
      created_at: data.user?.created_at
    });
      // Handle different signup scenarios:
    // - If user and session exist: immediate signin (email confirmation disabled)
    // - If user exists but no session: check if it's a duplicate or new signup
    if (data.user && !data.session) {
      // Check if this is a truly new user vs existing user
      // New users will have created_at very recent (within last few seconds)
      const userCreatedAt = new Date(data.user.created_at);
      const now = new Date();
      const timeDifference = now.getTime() - userCreatedAt.getTime();
      const isNewUser = timeDifference < 5000; // Less than 5 seconds ago
      
      // If user was created more than 5 seconds ago, it's likely an existing account
      if (!isNewUser && data.user.email_confirmed_at !== null) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      
      // For new users or unconfirmed existing users, let them proceed
      // They should check their email for confirmation
    }
  };
  // Reset password
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?type=recovery`,
    });
    if (error) throw error;
  };

  // Update password (for password reset flow)
  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
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
        loginWithEmail: signInWithEmail,
        signUpWithEmail: signUpWithEmail,
        resetPassword: resetPassword,
        updatePassword: updatePassword,
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
