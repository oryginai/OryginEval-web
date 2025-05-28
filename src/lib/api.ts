import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Get auth headers with current session token
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('No authentication token available')
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
}

// Generic API request function
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// API methods
export const api = {
  // Projects
  getProjects: () => apiRequest('/projects'),
  
  createProject: (data: any) => apiRequest('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getProject: (id: string) => apiRequest(`/projects/${id}`),
  
  updateProject: (id: string, data: any) => apiRequest(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  deleteProject: (id: string) => apiRequest(`/projects/${id}`, {
    method: 'DELETE',
  }),

  // Evaluations
  getEvaluations: (projectId: string) => apiRequest(`/projects/${projectId}/evaluations`),
  
  createEvaluation: (projectId: string, data: any) => apiRequest(`/projects/${projectId}/evaluations`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getEvaluation: (projectId: string, evaluationId: string) => 
    apiRequest(`/projects/${projectId}/evaluations/${evaluationId}`),
} 