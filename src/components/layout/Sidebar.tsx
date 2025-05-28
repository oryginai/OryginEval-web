import React, { useState, useMemo, useEffect } from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import {
  Home,
  Database,
  BarChart3,
  Settings,
  FileText,
  Plus,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProject } from "@/contexts/ProjectContext";

type MenuSection = {
  title: string;
  icon: React.ElementType;
  path: string;
  subSections?: { title: string; path: string }[];
};

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { currentProject } = useProject();
  const { projectId } = useParams<{ projectId: string }>();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const menuSections = useMemo(() => {
    const sections: MenuSection[] = [];

    // Projects section is always visible
    sections.push({
      title: "Projects",
      icon: Settings,
      path: "/projects",
    });

    // If we have a project selected, show project-specific sections
    if (projectId) {
      sections.push({
        title: "Home",
        icon: Home,
        path: `/projects/${projectId}/home`,
      });      
      
      sections.push({
        title: "Datasets",
        icon: Database,
        path: `/projects/${projectId}/datasets`,
        subSections: [
          { title: "All Datasets", path: `/projects/${projectId}/datasets` },
          { title: "Synthesize Dataset", path: `/projects/${projectId}/datasets/synthesize` },
          { title: "Upload Dataset", path: `/projects/${projectId}/datasets/upload` },
        ],
      });

      sections.push({
        title: "Evaluation",
        icon: BarChart3,
        path: `/projects/${projectId}/evaluation`,
        subSections: [
          { title: "Create Experiment", path: `/projects/${projectId}/evaluation/create-experiment` },
          { title: "Create Parameters", path: `/projects/${projectId}/evaluation/create-parameters` },
          { title: "History", path: `/projects/${projectId}/evaluation/history` },
        ],
      });      
      
      // sections.push({
      //   title: "Dashboard",
      //   icon: FileText,
      //   path: `/projects/${projectId}/dashboard`,
      // });
      
      // sections.push({
      //   title: "Report",
      //   icon: BarChart3,
      //   path: `/projects/${projectId}/report`,
      // });
    }

    return sections;
  }, [projectId]);

  // Check if a section should be open based on current route
  useEffect(() => {
    const newOpenState = { ...openSections };
    
    menuSections.forEach((section) => {
      if (section.subSections) {
        // Check if any subsection matches the current path
        const isActive = section.subSections.some(
          (subsection) => location.pathname === subsection.path
        );
        if (isActive) {
          newOpenState[section.title] = true;
        }
      }
    });
    
    setOpenSections(newOpenState);
  }, [location.pathname, menuSections]);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <aside className="w-64 bg-sidebar border-r border-border flex-shrink-0 h-screen overflow-y-auto scrollbar-hide">
      <div className="p-6 h-16 p border-b border-border">
        <h2 className="text-xl font-bold text-orygin-red">Orygin Eval</h2>
      </div>

      <nav className="p-3">
        <ul className="space-y-1">
          {menuSections.map((section) => (
            <li key={section.title}>
              {section.subSections ? (
                <div>
                  <button
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2 rounded-md text-left",
                      "hover:bg-sidebar-accent transition-colors",
                      // Modified condition for parent section highlighting
                      location.pathname === section.path && !section.subSections.some(sub => location.pathname === sub.path) 
                        ? "bg-sidebar-accent text-accent" 
                        : "text-sidebar-foreground" // Ensure default color if not exactly active
                    )}
                    onClick={() => toggleSection(section.title)}
                  >
                    <section.icon className="h-4 w-4" />
                    <span>{section.title}</span>
                    <svg
                      className={cn(
                        "ml-auto h-4 w-4 transition-transform",
                        openSections[section.title] && "transform rotate-180"
                      )}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {openSections[section.title] && (
                    <ul className="ml-6 mt-1 space-y-1">
                      {section.subSections.map((subSection) => (
                        <li key={subSection.title}>
                          <NavLink
                            to={subSection.path}
                            end
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md",
                                "hover:bg-sidebar-accent transition-colors",
                                isActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-sidebar-foreground"
                              )
                            }
                          >
                            {subSection.title === "Create Experiment" ||
                            subSection.title === "Create Parameters" ? (
                              <Plus className="h-3 w-3" />
                            ) : subSection.title === "History" ? (
                              <History className="h-3 w-3" />
                            ) : (
                              <div className="w-3" />
                            )}
                            <span className="text-sm">{subSection.title}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <NavLink
                  to={section.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md w-full",
                      "hover:bg-sidebar-accent transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-sidebar-foreground"
                    )
                  }
                >
                  <section.icon className="h-4 w-4" />
                  <span>{section.title}</span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
