import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase';
import { AuthService } from '@/services/auth';
import type { UserProfile } from '@/lib/supabase';

// Auth context type definition
interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for user and loading status
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Memoized auth state calculation
  const isAuthenticated = !!user;

  // Initialize user session on app load
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const isAuth = await AuthService.isAuthenticated();
      setUser(isAuth ? await AuthService.getCurrentUser() : null);
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle successful sign in
  const handleSignIn = useCallback(async (session: any) => {
    try {
      setIsLoading(true);
      const userProfile = await AuthService.getCurrentUser();
      if (userProfile) {
        setUser(userProfile);
        AuthService.handlePostLogin(userProfile.id).catch(error => {
          console.warn('Post-login setup failed:', error);
        });
        navigate('/projects', { replace: true });
        toast.success('Successfully logged in!', {
          description: `Welcome back, ${userProfile.name}`,
        });
      }
    } catch (error) {
      console.error('Sign in handling failed:', error);
      toast.error('Login completed but setup failed', {
        description: 'Please try refreshing the page.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Handle sign out
  const handleSignOut = useCallback(() => {
    setUser(null);
    setIsLoading(false);
    navigate('/auth', { replace: true });
  }, [navigate]);

  // Set up auth state change listener
  useEffect(() => {
    initializeAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN' && session) {
          await handleSignIn(session);
        } else if (event === 'SIGNED_OUT') {
          handleSignOut();
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [initializeAuth, handleSignIn, handleSignOut]);

  // Login with Google
  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      await AuthService.loginWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      toast.error('Login failed', {
        description: error instanceof Error ? error.message : 'Please try again later.',
      });
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await AuthService.logout();
      toast.success('Successfully logged out');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed', {
        description: error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Context value
  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
