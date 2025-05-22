import React, { createContext, useContext, useState, ReactNode } from "react";
import { projectApi } from "@/services/api";

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
  createProject: (data: Partial<Omit<Project, "id" | "created_at">>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      // Using setProjects with a functional update to safely check current state
      setProjects(currentProjects => {
        if (currentProjects.length === 0) {
          console.log("API call to fetch projects is currently disabled. Setting initial sample data as projects list is empty.");
          return [
            {
              id: "1",
              name: "Demo Project",
              api_key: "sk-demo1234567890",
              test_endpoint: "https://api.example.com/v1",
              created_at: new Date().toISOString(),
            },
          ];
        }
        // If projects already exist, don't overwrite them with demo data in local-only mode.
        console.log("Projects list already populated, fetchProjects (local-only) will not overwrite.");
        return currentProjects;
      });
    } catch (error) {
      // This catch is for errors during the setProjects logic or if any async ops were here
      console.error("Error in fetchProjects (local-only mode):", error);
      setProjects([]); // Fallback to empty list on error
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProject = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await projectApi.getProject(id);
      setCurrentProject(data);
    } catch (error) {
      console.error(`Failed to fetch project ${id}:`, error);
    } finally {
      setIsLoading(false);
    }
  };
  const createProject = async (data: Partial<Omit<Project, "id" | "created_at">>) => {
    setIsLoading(true);
    try {
      const projectDataWithApiKey = {
        ...data,
        api_key: data.api_key || `sk-local-${Math.random().toString(36).substring(2, 10)}`, // Ensure a local API key
      };
      
      // const newApiProject = await projectApi.createProject(projectDataWithApiKey as Omit<Project, "id" | "created_at">); // API call commented out

      // Create a new project object locally
      const newLocalProject: Project = {
        id: `local-${Date.now().toString()}`,
        name: projectDataWithApiKey.name!, // name is validated in Projects.tsx
        test_endpoint: projectDataWithApiKey.test_endpoint!, // test_endpoint is validated in Projects.tsx
        api_key: projectDataWithApiKey.api_key,
        created_at: new Date().toISOString(),
      };

      setProjects((prevProjects) => [...prevProjects, newLocalProject]);
      return newLocalProject;
    } catch (error) {
      // This catch block handles synchronous errors in the local creation process
      console.error("Error in local project creation process:", error);
      // UI-level toasts are handled in Projects.tsx, so no toast here for context errors.
      throw error; // Re-throw to allow Projects.tsx to catch it if needed
    } finally {
      setIsLoading(false);
    }
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    setIsLoading(true);
    try {
      const updatedProject = await projectApi.updateProject(id, data);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? updatedProject : p))
      );
      if (currentProject?.id === id) {
        setCurrentProject(updatedProject);
      }
      return updatedProject;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    setIsLoading(true);
    try {
      await projectApi.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (currentProject?.id === id) {
        setCurrentProject(null);
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
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};
