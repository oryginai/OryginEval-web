import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { Plus, MoreVertical, Trash2, Database, Upload, FileText } from "lucide-react";
import { Dataset } from "@/services/api";
import { ApiClient } from "@/lib/api-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AllDatasets: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState<{ id: string; name: string } | null>(null);
  // Fetch datasets
  useEffect(() => {
    const fetchDatasets = async () => {
      setIsLoading(true);
      try {
        const response = await ApiClient.get('/datasets-list', { project_id: projectId });
        console.log("API Response:", response);
        
        // Type the response data
        const responseData = response.data as { status?: string; datasets?: any[] };
        
        // Transform API response to match frontend Dataset interface
        if (responseData && responseData.datasets && Array.isArray(responseData.datasets)) {
          const transformedDatasets: Dataset[] = responseData.datasets.map((dataset: any) => ({
            id: dataset.dataset_id,
            name: dataset.name || `Dataset ${dataset.dataset_id.slice(0, 8)}...`, // Use API name if available, otherwise generate one
            project_id: projectId || "",
            created_at: dataset.created_at,
            conversations: (dataset.dataset_json || []).map((conv: any) => ({
              id: conv.id,
              messages: (conv.conversation || []).map((msg: any) => ({
                role: msg.role,
                content: msg.content
              }))
            }))
          }));
          
          setDatasets(transformedDatasets);
        } else {
          console.warn("Unexpected API response structure:", response);
          setDatasets([]);
        }
      } catch (error) {
        console.error("Error fetching datasets:", error);
        toast.error("Failed to fetch datasets");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDatasets();
  }, [projectId]);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };
  
  // Handle delete dataset click - open confirmation dialog
  const handleDeleteClick = (id: string, name: string) => {
    setDatasetToDelete({ id, name });
    setDeleteConfirmOpen(true);
  };

  // Delete dataset with API call
  const deleteDataset = async () => {
    if (!datasetToDelete) return;

    try {
      const response = await ApiClient.post(`/datasets-delete?dataset_id=${datasetToDelete.id}&project_id=${projectId}`, {});
      console.log("Delete Dataset API Response:", response);
      
      if (response.data || !response.error) {
        // Remove dataset from local state
        setDatasets(datasets.filter(dataset => dataset.id !== datasetToDelete.id));
        toast.success("Dataset deleted successfully");
      } else {
        console.error("API Error:", response.error);
        toast.error("Failed to delete dataset");
      }
    } catch (error) {
      console.error("Error deleting dataset:", error);
      toast.error("Failed to delete dataset");
    } finally {
      setDeleteConfirmOpen(false);
      setDatasetToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">All Datasets</h2>
          <p className="text-muted-foreground mt-1">
            View and manage all datasets for this project
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate(`/projects/${projectId}/datasets/upload`)}
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
          <Button
            className="gap-2 bg-primary hover:bg-orygin-red-hover text-white"
            onClick={() => navigate(`/projects/${projectId}/datasets/synthesize`)}
          >
            <Plus className="h-4 w-4" />
            Create Dataset
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-32 animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : datasets.length > 0 ? (
        <div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Conversations</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datasets.map((dataset) => (
                    <TableRow key={dataset.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-muted-foreground" />
                          {dataset.name}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(dataset.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {dataset.conversations.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/projects/${projectId}/evaluation/create-experiment`)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Use in Experiment
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteClick(dataset.id, dataset.name)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="empty-state mt-12">
          <div className="p-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No Datasets Yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Start by creating or uploading a dataset
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate(`/projects/${projectId}/datasets/upload`)}
              >
                <Upload className="h-4 w-4" />
                Upload Dataset
              </Button>
              <Button
                className="gap-2 bg-primary hover:bg-orygin-red-hover text-white"
                onClick={() => navigate(`/projects/${projectId}/datasets/synthesize`)}
              >
                <Plus className="h-4 w-4" />
                Create Dataset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dataset Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the dataset
              "{datasetToDelete?.name}" and remove all its conversations from your project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDatasetToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteDataset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AllDatasets;
