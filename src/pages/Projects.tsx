import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MoreVertical, ExternalLink, Trash2, Edit3 } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { ApiClient } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const Projects: React.FC = () => {
  const {
    projects,
    fetchProjects,
    createProject,
    deleteProject,
    isLoading: contextIsLoading,
  } = useProject();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();  const [newProject, setNewProject] = useState({
    name: '',
    test_endpoint: '',
    headers: '',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Update project states
  const [editProject, setEditProject] = useState({
    id: '',
    name: '',
    endpoint: '',
    headers: '',
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  useEffect(() => {
    console.log('Projects.tsx useEffect - Auth state:', { isAuthenticated, user: user?.id, authLoading });
    
    // Only fetch projects if user is authenticated and not loading
    if (isAuthenticated && user?.id && !authLoading) {
      console.log('Calling fetchProjects for user:', user.id);
      fetchProjects();
    }
  }, [fetchProjects, isAuthenticated, user?.id, authLoading]);
  const handleCreateProject = async () => {
    const projectName = newProject.name.trim();
    const endpoint = newProject.test_endpoint.trim();

    if (!projectName || !endpoint) {
      toast.error('Project name and API endpoint are required.');
      return;
    }

    // Parse headers if provided
    let headersObject = {};
    if (newProject.headers.trim()) {
      try {
        headersObject = JSON.parse(newProject.headers.trim());
      } catch (error) {
        toast.error('Invalid JSON format for headers. Please provide valid JSON or leave empty.');
        return;
      }
    }

    setIsSubmittingCreate(true);
    try {
      const projectData = {
        name: projectName,
        labrat_json: {
          endpoint: endpoint,
          headers: headersObject
        }
      };
      await createProject(projectData);
      setNewProject({ name: '', test_endpoint: '', headers: '' });
      setIsDialogOpen(false);
      await fetchProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (projectToDelete) {
      try {
        await deleteProject(projectToDelete);
        setDeleteConfirmOpen(false);
        setProjectToDelete(null);
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  // Handle edit project click
  const handleEditClick = async (projectId: string) => {
    try {
      // Fetch project details
      const response = await ApiClient.get(`/projects-details?project_id=${projectId}`);
      console.log("Project details response:", response);
      
      if (response.data && (response.data as any).project) {
        const projectData = (response.data as any).project;
        setEditProject({
          id: projectId,
          name: projectData.project_name || '',
          endpoint: projectData.labrat_json?.endpoint || '',
          headers: JSON.stringify(projectData.labrat_json?.headers || {}, null, 2),
        });
        setIsEditDialogOpen(true);
      } else {
        toast.error('Failed to fetch project details');
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Failed to fetch project details');
    }
  };

  // Handle update project
  const handleUpdateProject = async () => {
    const projectName = editProject.name.trim();
    const endpoint = editProject.endpoint.trim();

    if (!projectName || !endpoint) {
      toast.error('Project name and API endpoint are required.');
      return;
    }

    // Parse headers if provided
    let headersObject = {};
    if (editProject.headers.trim()) {
      try {
        headersObject = JSON.parse(editProject.headers.trim());
      } catch (error) {
        toast.error('Invalid JSON format for headers. Please provide valid JSON or leave empty.');
        return;
      }
    }

    setIsSubmittingUpdate(true);
    try {
      // First, fetch the current project details to get existing IDs
      const detailsResponse = await ApiClient.get(`/projects-details?project_id=${editProject.id}`);
      
      if (!detailsResponse.data || !(detailsResponse.data as any).project) {
        throw new Error('Failed to fetch current project details');
      }

      const currentProject = (detailsResponse.data as any).project;
      
      // Prepare update payload with all required fields
      const updatePayload = {
        project_name: projectName,
        labrat: {
          endpoint: endpoint,
          headers: headersObject
        },
        dataset_ids: currentProject.dataset_ids || [],
        parameter_ids: currentProject.parameter_ids || [],
        experiment_ids: currentProject.experiment_ids || []
      };

      console.log("Updating project with payload:", updatePayload);
      
      const response = await ApiClient.post(`/projects-update?project_id=${editProject.id}`, updatePayload);
      
      if (response.data || !response.error) {
        toast.success('Project updated successfully!');
        setIsEditDialogOpen(false);
        setEditProject({ id: '', name: '', endpoint: '', headers: '' });
        await fetchProjects(); // Refresh the projects list
      } else {
        throw new Error((response.error as any)?.message || 'Failed to update project');
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error('Failed to update project. Please try again.');
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Projects</h2>
          <p className="text-muted-foreground mt-1">
            Manage your LLM evaluation projects
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary hover:bg-orygin-red-hover text-white">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Set up a new LLM evaluation project
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="My Awesome Model"
                  value={newProject.name}
                  onChange={e =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="test_endpoint">API Endpoint</Label>
                <Input
                  id="test_endpoint"
                  placeholder="https://api.example.com/v1/chat/completions"
                  value={newProject.test_endpoint}
                  onChange={e =>
                    setNewProject({
                      ...newProject,
                      test_endpoint: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="headers">Headers (Optional)</Label>
                <Textarea
                  id="headers"
                  placeholder='{"Authorization": "Bearer your-token", "Content-Type": "application/json"}'
                  value={newProject.headers}
                  onChange={e =>
                    setNewProject({
                      ...newProject,
                      headers: e.target.value,
                    })
                  }
                  className="min-h-[80px]"
                />
                <p className="text-sm text-muted-foreground">
                  Enter headers as JSON format. Leave empty if no custom headers needed.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmittingCreate}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={
                  !newProject.name.trim() ||
                  !newProject.test_endpoint.trim() ||
                  isSubmittingCreate
                }
                className="bg-primary hover:bg-orygin-red-hover text-white"
              >
                {isSubmittingCreate ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {contextIsLoading && projects.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="orygin-card animate-pulse">
              <div className="p-6 h-40"></div>
            </div>
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Card key={project.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleEditClick(project.id)}
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteClick(project.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="truncate">
                  Created on {formatDate(project.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2">
                  {/* No API key shown */}
                </div>
              </CardContent>
              <CardFooter>
                <Link to={`/projects/${project.id}/home`} className="w-full">
                  <Button className="w-full gap-2 border border-border">
                    <ExternalLink className="h-4 w-4" />
                    Open Project
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="empty-state mt-12">
          <div className="p-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first project to start evaluating your LLM.
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="mt-6 gap-2 bg-primary hover:bg-orygin-red-hover text-white"
            >
              <Plus className="h-4 w-4" />
              Create New Project
            </Button>
          </div>
        </div>      )}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              and all associated data including datasets, parameters, and experiments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update your project settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Project Name</Label>
              <Input
                id="edit-name"
                placeholder="My Awesome Model"
                value={editProject.name}
                onChange={e =>
                  setEditProject({ ...editProject, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-endpoint">API Endpoint</Label>
              <Input
                id="edit-endpoint"
                placeholder="https://api.example.com/v1/chat/completions"
                value={editProject.endpoint}
                onChange={e =>
                  setEditProject({
                    ...editProject,
                    endpoint: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-headers">Headers (Optional)</Label>
              <Textarea
                id="edit-headers"
                placeholder='{"Authorization": "Bearer your-token", "Content-Type": "application/json"}'
                value={editProject.headers}
                onChange={e =>
                  setEditProject({
                    ...editProject,
                    headers: e.target.value,
                  })
                }
                className="min-h-[80px]"
              />
              <p className="text-sm text-muted-foreground">
                Enter headers as JSON format. Leave empty if no custom headers needed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditProject({ id: '', name: '', endpoint: '', headers: '' });
              }}
              disabled={isSubmittingUpdate}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProject}
              disabled={
                !editProject.name.trim() ||
                !editProject.endpoint.trim() ||
                isSubmittingUpdate
              }
              className="bg-primary hover:bg-orygin-red-hover text-white"
            >
              {isSubmittingUpdate ? 'Updating...' : 'Update Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;
