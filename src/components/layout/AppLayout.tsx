import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "./Header";

const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    console.log('[APP_LAYOUT] Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground text-sm">Loading your session...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    console.log('[APP_LAYOUT] Not authenticated, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Render the main app layout
  console.log('[APP_LAYOUT] Rendering authenticated layout');
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="orygin-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
