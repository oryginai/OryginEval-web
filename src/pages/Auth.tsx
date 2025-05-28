import React from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Auth: React.FC = () => {
  const { isAuthenticated, login, isLoading } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 orygin-card">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-primary">Orygin Eval</h1>
          <p className="text-muted-foreground">
            Evaluate your LLM performance with confidence
          </p>
        </div>

        <div className="space-y-6">
          <Button
            onClick={login}
            disabled={isLoading}
            className="w-full bg-card hover:bg-card/80 border border-border flex items-center justify-center gap-3 py-6 transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
              className="h-5 w-5"
              fill="currentColor"
            >
              <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
            </svg>
            <span>
              {isLoading ? "Signing in..." : "Continue with Google"}
            </span>
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </div>
        </div>

        {isLoading && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              Redirecting to Google...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
