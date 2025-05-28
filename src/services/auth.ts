import { supabase, authUtils, type UserProfile } from '@/lib/supabase';
import { ApiClient } from '@/lib/api-client';

export interface AuthError {
    message: string;
    code?: string;
}

export class AuthService {
    // Google auth init, callback goes to /projects
    static async loginWithGoogle(): Promise<void> {
        try {
            const redirectUrl = authUtils.getRedirectUrl();
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) {
                throw new Error(`Google OAuth failed: ${error.message}`);
            }
            // This function will cause a redirect, so code after this won't execute
        } catch (error) {
            console.error('Google login failed:', error);
            throw error instanceof Error ? error : new Error('Unknown authentication error');
        }
    }

    // Signout is handled down here
    static async logout(): Promise<void> {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                throw new Error(`Logout failed: ${error.message}`);
            }
        } catch (error) {
            console.error('Logout failed:', error);
            throw error instanceof Error ? error : new Error('Unknown logout error');
        }
    }

    // Gets user profile
    static async getCurrentUser(): Promise<UserProfile | null> {
        try {
            const supabaseUser = await authUtils.getCurrentUser();
            return supabaseUser ? authUtils.transformUser(supabaseUser) : null;
        } catch (error) {
            console.error('Failed to get current user:', error);
            return null;
        }
    }

    // Validate authentication
    static async isAuthenticated(): Promise<boolean> {
        return authUtils.isAuthenticated();
    }

    // Register user 
    static async registerUserWithBackend(userId: string): Promise<void> {
        try {
            const response = await ApiClient.post<{ error?: string }>('/accounts-add', {
                account_id: userId
            });

            if (response.error) {
                console.log('Backend registration response:', response.error);
            }
        } catch (error) {
            console.warn('Backend registration failed (this may be normal):', error);
        }
    }
    static async handlePostLogin(userId: string): Promise<void> {
        try {
            await this.registerUserWithBackend(userId);
        } catch (error) {
            console.error('Post-login setup failed:', error);
        }
    }
} 