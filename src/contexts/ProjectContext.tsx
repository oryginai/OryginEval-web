
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Project, projectApi } from "@/services/api";
import { toast } from "@/components/ui/sonner";

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: Omit<Project, "id" | "created_at">) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  // Load project data if a projectId is provided in the URL
  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
  }, [projectId]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real app, this would fetch from API
      // For demo, use mock data
      const fetchedProjects = await projectApi.getProjects();
      setProjects(fetchedProjects.length > 0 ? fetchedProjects : projectApi.mockData.createMockProjects());
    } catch (err) {
      setError("Failed to fetch projects");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProject = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real app, this would fetch from API
      const project = await projectApi.getProject(id);
      setCurrentProject(project);
    } catch (err) {
      setError("Failed to fetch project");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (data: Omit<Project, "id" | "created_at">) => {
    try {
      setIsLoading(true);
      
      // In a real app, this would send to API
      const newProject = await projectApi.createProject(data);
      
      setProjects((prev) => [...prev, newProject]);
      setCurrentProject(newProject);
      toast.success("Project created successfully");
      
      return newProject;
    } catch (err) {
      setError("Failed to create project");
      toast.error("Failed to create project");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    try {
      setIsLoading(true);
      
      // In a real app, this would send to API
      const updatedProject = await projectApi.updateProject(id, data);
      
      setProjects((prev) => 
        prev.map((p) => (p.id === id ? updatedProject : p))
      );
      
      if (currentProject?.id === id) {
        setCurrentProject(updatedProject);
      }
      
      toast.success("Project updated successfully");
      return updatedProject;
    } catch (err) {
      setError("Failed to update project");
      toast.error("Failed to update project");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      setIsLoading(true);
      
      // In a real app, this would call API
      await projectApi.deleteProject(id);
      
      setProjects((prev) => prev.filter((p) => p.id !== id));
      
      if (currentProject?.id === id) {
        setCurrentProject(null);
        navigate("/projects");
      }
      
      toast.success("Project deleted successfully");
    } catch (err) {
      setError("Failed to delete project");
      toast.error("Failed to delete project");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        isLoading,
        error,
        fetchProjects,
        fetchProject,
        createProject,
        updateProject,
        deleteProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};
