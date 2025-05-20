
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
  createProject: (data: Omit<Project, "id" | "created_at">) => Promise<Project>;
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
      const data = await projectApi.getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      // Use sample data for demonstration
      setProjects([
        {
          id: "1",
          name: "Demo Project",
          api_key: "sk-demo1234567890",
          test_endpoint: "https://api.example.com/v1",
          created_at: new Date().toISOString(),
        },
      ]);
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

  const createProject = async (data: Omit<Project, "id" | "created_at">) => {
    setIsLoading(true);
    try {
      const newProject = await projectApi.createProject(data);
      setProjects((prev) => [...prev, newProject]);
      return newProject;
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
