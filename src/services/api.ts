import { toast } from '@/components/ui/sonner';

// Base API URL - would be set from environment variables in a real app
const API_BASE_URL = '/api';

// Types for API responses and requests
export interface Project {
  id: string;
  name: string;
  api_key: string;
  test_endpoint: string;
  created_at: string;
}

export interface Dataset {
  id: string;
  name: string;
  project_id: string;
  conversations: Conversation[];
  created_at: string;
}

export interface Parameter {
  id: string;
  name: string;
  description: string;
  project_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  messages: Message[];
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Experiment {
  id: string;
  name: string;
  project_id: string;
  dataset_id: string;
  parameters: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  results?: ExperimentResults;
  created_at: string;
}

export interface ExperimentResults {
  overall_score: number;
  parameter_scores: Record<string, number>;
  conversation_scores: Record<string, number>;
  details: any; // Detailed results structure will depend on the backend
}

// Helper function for making API requests
async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    toast.error('API request failed', {
      description: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Project-related API functions
export const projectApi = {
  getProjects: () => apiRequest<Project[]>('/projects'),
  getProject: (id: string) => apiRequest<Project>(`/projects/${id}`),
  createProject: (data: Omit<Project, 'id' | 'created_at'>) =>
    apiRequest<Project>('/projects', 'POST', data),
  updateProject: (id: string, data: Partial<Project>) =>
    apiRequest<Project>(`/projects/${id}`, 'PUT', data),
  deleteProject: (id: string) => apiRequest<void>(`/projects/${id}`, 'DELETE'),
};

// Dataset-related API functions
export const datasetApi = {
  getDatasets: (projectId: string) =>
    apiRequest<Dataset[]>(`/projects/${projectId}/datasets`),
  getDataset: (projectId: string, datasetId: string) =>
    apiRequest<Dataset>(`/projects/${projectId}/datasets/${datasetId}`),
  createDataset: (projectId: string, name: string) =>
    apiRequest<Dataset>(`/projects/${projectId}/datasets`, 'POST', { name }),
  synthesizeDataset: (projectId: string, sampleConversations: Conversation[]) =>
    apiRequest<Dataset>(`/projects/${projectId}/datasets/synthesize`, 'POST', {
      conversations: sampleConversations,
    }),
  uploadDataset: (
    projectId: string,
    name: string,
    conversations: Conversation[],
  ) =>
    apiRequest<Dataset>(`/projects/${projectId}/datasets/upload`, 'POST', {
      name,
      conversations,
    }),
  updateDataset: (
    projectId: string,
    datasetId: string,
    conversations: Conversation[],
  ) =>
    apiRequest<Dataset>(`/projects/${projectId}/datasets/${datasetId}`, 'PUT', {
      conversations,
    }),
  deleteDataset: (projectId: string, datasetId: string) =>
    apiRequest<void>(`/projects/${projectId}/datasets/${datasetId}`, 'DELETE'),
};

// Parameter-related API functions
export const parameterApi = {
  getParameters: (projectId: string) =>
    apiRequest<Parameter[]>(`/projects/${projectId}/parameters`),
  getParameter: (projectId: string, parameterId: string) =>
    apiRequest<Parameter>(`/projects/${projectId}/parameters/${parameterId}`),
  createParameter: (projectId: string, name: string, description: string) =>
    apiRequest<Parameter>(`/projects/${projectId}/parameters`, 'POST', {
      name,
      description,
    }),
  updateParameter: (
    projectId: string,
    parameterId: string,
    data: Partial<Parameter>,
  ) =>
    apiRequest<Parameter>(
      `/projects/${projectId}/parameters/${parameterId}`,
      'PUT',
      data,
    ),
  deleteParameter: (projectId: string, parameterId: string) =>
    apiRequest<void>(
      `/projects/${projectId}/parameters/${parameterId}`,
      'DELETE',
    ),
};

// Experiment-related API functions
export const experimentApi = {
  getExperiments: (projectId: string) =>
    apiRequest<Experiment[]>(`/projects/${projectId}/experiments`),
  getExperiment: (projectId: string, experimentId: string) =>
    apiRequest<Experiment>(
      `/projects/${projectId}/experiments/${experimentId}`,
    ),
  createExperiment: (
    projectId: string,
    name: string,
    datasetId: string,
    parameterIds: string[],
  ) =>
    apiRequest<Experiment>(`/projects/${projectId}/experiments`, 'POST', {
      name,
      dataset_id: datasetId,
      parameter_ids: parameterIds,
    }),
  getExperimentResults: (projectId: string, experimentId: string) =>
    apiRequest<ExperimentResults>(
      `/projects/${projectId}/experiments/${experimentId}/results`,
    ),
};

// Mock data functions - these would be removed in a real implementation
export const mockData = {
  createMockProjects: (count = 3): Project[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `proj_${i + 1}`,
      name: `Demo Project ${i + 1}`,
      api_key: `sk-demo-${Math.random().toString(36).substring(2, 10)}`,
      test_endpoint: 'https://api.example.com/v1/chat/completions',
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
    }));
  },
  createMockConversations: (count = 5): Conversation[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `conv_${i + 1}`,
      messages: [
        {
          role: 'user',
          content: "How can I improve my chatbot's performance?",
        },
        {
          role: 'assistant',
          content:
            "To improve your chatbot's performance, consider refining your prompts, using a more capable model, and implementing feedback loops to learn from user interactions.",
        },
        {
          role: 'user',
          content: 'What metrics should I track?',
        },
        {
          role: 'assistant',
          content:
            "You should track metrics like response accuracy, user satisfaction ratings, conversation completion rate, and average resolution time to gauge your chatbot's effectiveness.",
        },
      ],
    }));
  },
  createMockParameters: (count = 3): Parameter[] => {
    const defaultParams = [
      {
        name: 'Semantic Similarity',
        description:
          'Measures how similar the generated responses are to the expected responses',
      },
      {
        name: 'Hallucination',
        description:
          'Assesses the tendency of the model to generate false or misleading information',
      },
      {
        name: 'Toxicity',
        description:
          'Evaluates the likelihood of the model generating harmful or offensive content',
      },
    ];

    return defaultParams.slice(0, count).map((param, i) => ({
      id: `param_${i + 1}`,
      name: param.name,
      description: param.description,
      project_id: 'proj_1',
      created_at: new Date().toISOString(),
    }));
  },
  createMockExperiments: (count = 3): Experiment[] => {
    const statuses: ('running' | 'completed' | 'failed')[] = [
      'completed',
      'running',
    ];

    return Array.from({ length: count }, (_, i) => ({
      id: `exp_${i + 1}`,
      name: `Experiment ${i + 1}`,
      project_id: 'proj_1',
      dataset_id: 'dataset_1',
      parameters: [`param_1`, `param_2`, `param_3`],
      status: statuses[i % statuses.length],
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
      results:
        i === 0
          ? {
              overall_score: 0.76,
              parameter_scores: {
                param_1: 0.82,
                param_2: 0.65,
                param_3: 0.81,
              },
              conversation_scores: {
                conv_1: 0.78,
                conv_2: 0.75,
                conv_3: 0.81,
                conv_4: 0.69,
                conv_5: 0.77,
              },
              details: {},
            }
          : undefined,
    }));
  },
};

// Add a text file with API documentation
export const API_DOCS = `
API ENDPOINTS USED IN ORYGIN EVAL:

1. Authentication
   - POST /api/auth/google - Login with Google
   - GET /api/auth/logout - Logout user
   - GET /api/auth/user - Get current user

2. Projects
   - GET /api/projects - List all projects
   - GET /api/projects/:id - Get project by ID
   - POST /api/projects - Create a new project
   - PUT /api/projects/:id - Update project
   - DELETE /api/projects/:id - Delete project

3. Datasets
   - GET /api/projects/:projectId/datasets - List datasets
   - GET /api/projects/:projectId/datasets/:id - Get dataset by ID
   - POST /api/projects/:projectId/datasets - Create empty dataset
   - POST /api/projects/:projectId/datasets/synthesize - Create dataset from sample conversations
   - POST /api/projects/:projectId/datasets/upload - Upload custom dataset
   - PUT /api/projects/:projectId/datasets/:id - Update dataset
   - DELETE /api/projects/:projectId/datasets/:id - Delete dataset

4. Parameters
   - GET /api/projects/:projectId/parameters - List parameters
   - GET /api/projects/:projectId/parameters/:id - Get parameter by ID
   - POST /api/projects/:projectId/parameters - Create new parameter
   - PUT /api/projects/:projectId/parameters/:id - Update parameter
   - DELETE /api/projects/:projectId/parameters/:id - Delete parameter

5. Experiments
   - GET /api/projects/:projectId/experiments - List experiments
   - GET /api/projects/:projectId/experiments/:id - Get experiment by ID
   - POST /api/projects/:projectId/experiments - Create new experiment
   - GET /api/projects/:projectId/experiments/:id/results - Get experiment results
`;
