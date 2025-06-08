import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProject } from "@/contexts/ProjectContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentProject } = useProject();
  const location = useLocation();

  // Determine title based on current route
  const getPageTitle = () => {
    const path = location.pathname;

    if (path === "/projects") return "Projects";
    if (!currentProject) return "Orygin Eval";

    if (path.includes("/datasets/synthesize")) return "Synthesize Dataset";
    if (path.includes("/datasets/upload")) return "Upload Dataset";
    if (path.includes("/evaluation/create-experiment")) return "Create Experiment";
    if (path.includes("/evaluation/create-parameters")) return "Create Parameters";
    if (path.includes("/evaluation/history")) return "Experiment History";
    if (path.includes("/dashboard")) return "Dashboard";
    if (path.includes("/home")) return "Home";

    return currentProject.name;
  };

  return (
    <header className="bg-secondary border-b border-border h-16 flex items-center px-6">
      <div className="flex-1">
        <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center space-x-4">
        {currentProject && (
          <div className="hidden md:block">
            <span className="text-muted-foreground text-sm mr-2">Project:</span>
            <span className="font-medium text-sm">{currentProject.name}</span>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-primary/30 text-foreground">
                  {user?.name?.[0].toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
