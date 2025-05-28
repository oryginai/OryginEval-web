import { supabase } from './supabase';

// API Client with Supabase integration
export class ApiClient {
  private static baseURL = '/api';

  /**
   * Get authentication headers with current session token
   */
  private static async getAuthHeaders(): Promise<HeadersInit> {
    try {
      console.log('[API_CLIENT] Getting auth headers...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[API_CLIENT] Session error:', error);
        return { 'Content-Type': 'application/json' };
      }

      if (!session?.access_token) {
        console.warn('[API_CLIENT] No access token available');
        return { 'Content-Type': 'application/json' };
      }

      console.log('[API_CLIENT] Auth headers retrieved successfully');
      return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error('[API_CLIENT] Error getting auth headers:', error);
      return { 'Content-Type': 'application/json' };
    }
  }

  /**
   * Make authenticated API request with comprehensive error handling
   */
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      console.log('[API_CLIENT] Making request to:', endpoint);
      
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      // Handle different response statuses
      if (response.status === 401) {
        console.error('[API_CLIENT] Unauthorized request - authentication required');
        throw new Error('Authentication required');
      }

      if (response.status === 403) {
        console.error('[API_CLIENT] Forbidden request - insufficient permissions');
        throw new Error('Insufficient permissions');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API_CLIENT] Request failed:', response.status, errorText);
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      // Handle response parsing
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('[API_CLIENT] Request successful');
        return data;
      } else {
        console.log('[API_CLIENT] Request successful (no JSON response)');
        return {} as T;
      }
    } catch (error) {
      console.error('[API_CLIENT] Request failed for', endpoint, ':', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  static async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  static async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  static async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  static async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  static async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}
