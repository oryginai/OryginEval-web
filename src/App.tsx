
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProjectProvider } from "@/contexts/ProjectContext";

// Layouts
import AppLayout from "@/components/layout/AppLayout";

// Pages
import Auth from "@/pages/Auth";
import Projects from "@/pages/Projects";
import Home from "@/pages/Home";
import SynthesizeDataset from "@/pages/datasets/SynthesizeDataset";
import UploadDataset from "@/pages/datasets/UploadDataset";
import AllDatasets from "@/pages/datasets/AllDatasets";
import CreateExperiment from "@/pages/evaluation/CreateExperiment";
import CreateParameters from "@/pages/evaluation/CreateParameters";
import ExperimentHistory from "@/pages/evaluation/History";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <ProjectProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected Routes */}              <Route element={<AppLayout />}>
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:projectId/home" element={<Home />} />
                <Route path="/projects/:projectId/datasets" element={<AllDatasets />} />
                <Route path="/projects/:projectId/datasets/synthesize" element={<SynthesizeDataset />} />
                <Route path="/projects/:projectId/datasets/upload" element={<UploadDataset />} />
                <Route path="/projects/:projectId/evaluation/create-experiment" element={<CreateExperiment />} />
                <Route path="/projects/:projectId/evaluation/create-parameters" element={<CreateParameters />} />
                <Route path="/projects/:projectId/evaluation/history" element={<ExperimentHistory />} />
                <Route path="/projects/:projectId/dashboard" element={<Dashboard />} />
                <Route path="/projects/:projectId/dashboard/:experimentId" element={<Dashboard />} />
              </Route>
              
              {/* Redirect to auth by default */}
              <Route path="/" element={<Navigate to="/auth" replace />} />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ProjectProvider>
        </AuthProvider>
      </BrowserRouter>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
