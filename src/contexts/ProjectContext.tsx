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

export type Project = {
  id: string;
  name: string;
  api_key: string;
  test_endpoint: string;
  created_at: string;
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
      const res = await ApiClient.get<Project[]>('/projects-list', {
        account_id: user?.id || '',
      });
      if (res.data) {
        setProjects(res.data);
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
    data: Partial<Omit<Project, 'id' | 'created_at'>>,
  ) => {
    setIsLoading(true);
    try {
      const projectDataWithApiKey = {
        ...data,
        api_key:
          data.api_key ||
          `sk-local-${Math.random().toString(36).substring(2, 10)}`, // Ensure a local API key
      };

      const res = await ApiClient.post<Project>(
        `/projects-create?project_id=string&account_id=${user?.id || ''}`,
        projectDataWithApiKey,
      );
      if (res.data) {
        setProjects(prev => [...prev, res.data]);
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
