import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { ApiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';

export type Project = {
  id: string;
  name: string;
  // api_key: string;
  // test_endpoint: string;
  created_at: string;
  dataset_ids?: string[];
  parameter_ids?: string[];
  experiment_ids?: string[];
  labrat_json?: {
    endpoint: string;
    headers: Record<string, string>;
  };
};

type ProjectContextType = {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (
    data: Partial<Omit<Project, 'id' | 'created_at'>>,
  ) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuth();

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.get<any>('/projects-list', {
        account_id: user?.id || '',
      });
      console.log('API Response:', res);
      console.log("Data:", res.data);
      console.log('ok', res.data.projects);
      if (res.data) {
        const transformedProjects = res.data.projects.map((project: any) => ({
          id: project.project_id,
          name: project.project_name || 'Untitled Project',
          created_at: project.created_at,
          dataset_ids: project.dataset_ids || [],
          parameter_ids: project.parameter_ids || [],
          experiment_ids: project.experiment_ids || [],
          labrat_json: project.labrat_json || { endpoint: '', headers: {} },
        }));
        setProjects(transformedProjects);
      } else {
        toast.error(res.error?.message || 'Failed to fetch projects');
        setProjects([]);
      }
    } catch (error) {
      console.error('Error in fetchProjects (local-only mode):', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const fetchProject = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await ApiClient.get<Project>('/projects-details', {
        project_id: id,
      });
      if (res.data) {
        setCurrentProject(res.data);
      } else {
        toast.error(res.error?.message || 'Failed to fetch project');
        setCurrentProject(null);
      }
    } catch (error) {
      console.error(`Failed to fetch project ${id}:`, error);
    } finally {
      setIsLoading(false);
    }
  };
  const createProject = async (
    data: Partial<Omit<Project, 'id' | 'created_at'>>,  ) => {
    setIsLoading(true);
    try {
      const projectDataWithApiKey = {
        'project_name': data.name || '',
        'labrat': {'endpoint': data.labrat_json?.endpoint || ''}
      };

      const projectId = uuidv4();
      const res = await ApiClient.post<Project>(
        `/projects-create?project_id=${projectId}&account_id=${user?.id || ''}`,
        projectDataWithApiKey,
      );
      if (res.data) {
        setProjects(prev => [...prev, res.data]);

        // Create the default parameters for the new project
        const parameterBody1 = {parameter_name: "Hallucination",parameter_description: "Measures how much the output contains false or made-up information.",};
        const parameterId1 = uuidv4();
        const response1 = ApiClient.post(`/parameters-create?project_id=${projectId}&parameter_id=${parameterId1}`, parameterBody1)
        console.log("Add Parameter API Response:", response1);
        const parameterBody2 = {parameter_name: "Relevance",parameter_description: "Assesses how well the response aligns with the prompt or topic.",};
        const parameterId2 = uuidv4();
        const response2 = ApiClient.post(`/parameters-create?project_id=${projectId}&parameter_id=${parameterId2}`, parameterBody2)
        console.log("Add Parameter API Response:", response2);
        const parameterBody3 = {parameter_name: "Toxicity",parameter_description: "Indicates the presence of harmful or inappropriate language.",};
        const parameterId3 = uuidv4();
        const response3 = ApiClient.post(`/parameters-create?project_id=${projectId}&parameter_id=${parameterId3}`, parameterBody3)
        console.log("Add Parameter API Response:", response3);


      } else {
        toast.error(res.error?.message || 'Failed to create project');
      }
      return res.data;
    } catch (error) {
      console.error('Error in local project creation process:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    setIsLoading(true);
    try {
      const res = await ApiClient.put<Project>(
        `/projects-update?project_id=${id}`,
        data,
      );
      if (res.data) {
        setProjects(prev => prev.map(p => (p.id === id ? res.data : p)));
        if (currentProject?.id === id) {
          setCurrentProject(res.data);
        }
      } else {
        toast.error(res.error?.message || 'Failed to update project');
      }
      return res.data;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await ApiClient.delete<Project>(
        `/projects-delete?project_id=${id}`,
      );
      if (res.data) {
        setProjects(prev => prev.filter(p => p.id !== id));
        if (currentProject?.id === id) {
          setCurrentProject(null);
        }
      } else {
        toast.error(res.error?.message || 'Failed to delete project');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    projects,
    currentProject,
    isLoading,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
