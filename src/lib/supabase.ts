import { createClient } from '@supabase/supabase-js';

// Set up Supabase client with environment variables for the URL and anon key.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if the required Supabase configuration is provided.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase configuration. Please check your environment variables.');
}

// Create a Supabase client instance with specific authentication settings.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true, // Automatically refresh the token when it expires
    persistSession: true, // Keep the session active even after page reloads
    detectSessionInUrl: true, // Check for session information in the URL (important for OAuth)
    flowType: 'implicit', // Use implicit flow for client-side applications
  },
});

// Define the structure of a Supabase user for better TypeScript support.
export interface SupabaseUser {
  id: string; // Unique identifier for the user
  email: string; // User's email address
  user_metadata: {
    full_name?: string; // User's full name (optional)
    name?: string; // User's name (optional)
    avatar_url?: string; // URL to the user's avatar image (optional)
    picture?: string; // URL to the user's profile picture (optional)
  };
}

// Define the structure of the user profile used in the application.
export interface UserProfile {
  id: string; // Unique identifier for the user
  name: string; // User's display name
  email: string; // User's email address
  avatar: string; // URL to the user's avatar image
}

// Utility functions for handling authentication operations.
export const authUtils = {
  // Retrieve the currently authenticated user Returns the user object if authenticated, or null if not.
  async getCurrentUser(): Promise<SupabaseUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Error fetching user:', error.message);
        return null; // Return null if there was an error fetching the user
      }

      return user as SupabaseUser; // Return the user object
    } catch (error) {
      console.error('Unexpected error fetching user:', error);
      return null; // Return null in case of an unexpected error
    }
  },
  //  Check if the user is currently authenticated. Returns true if authenticated, false otherwise.
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error checking authentication:', error.message);
        return false; // Return false if there was an error checking authentication
      }

      return !!session?.user; // Return true if a user session exists
    } catch (error) {
      console.error('Unexpected error checking authentication:', error);
      return false; // Return false in case of an unexpected error
    }
  },
  // Transform a Supabase user object into the application's user profile format.
  transformUser(supabaseUser: SupabaseUser): UserProfile {
    const name = supabaseUser.user_metadata?.full_name ||
      supabaseUser.user_metadata?.name ||
      supabaseUser.email?.split('@')[0] ||
      'User'; // Default to 'User' if no name is available

    const avatar = supabaseUser.user_metadata?.avatar_url ||
      supabaseUser.user_metadata?.picture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff3d3d&color=fff`; // Generate a default avatar if none is provided

    return {
      id: supabaseUser.id,
      name,
      email: supabaseUser.email,
      avatar,
    };
  },
  // Get the redirect URL based on the current environment.
  getRedirectUrl(): string {
    const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
    // Return the appropriate redirect URL based on whether the app is in development or production
    return `${window.location.origin}/projects`;
  },
};
