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

const AllDatasets: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [datasets, setDatasets] = useState<Dataset[]>([]);

  // Fetch datasets
  useEffect(() => {
    const fetchDatasets = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would call the API
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data
        const mockDatasets: Dataset[] = [
          {
            id: "dataset1",
            name: "Customer Support Conversations",
            project_id: projectId || "",
            created_at: new Date().toISOString(),
            conversations: Array(25).fill(null).map((_, i) => ({
              id: `conv_${i}`,
              messages: [
                { role: "user", content: "Sample user message" },
                { role: "assistant", content: "Sample assistant response" }
              ]
            }))
          },
          {
            id: "dataset2",
            name: "Product Q&A",
            project_id: projectId || "",
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            conversations: Array(15).fill(null).map((_, i) => ({
              id: `conv_${i}`,
              messages: [
                { role: "user", content: "Sample user message" },
                { role: "assistant", content: "Sample assistant response" }
              ]
            }))
          },
          {
            id: "dataset3",
            name: "Technical Support",
            project_id: projectId || "",
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            conversations: Array(32).fill(null).map((_, i) => ({
              id: `conv_${i}`,
              messages: [
                { role: "user", content: "Sample user message" },
                { role: "assistant", content: "Sample assistant response" }
              ]
            }))
          }
        ];
        
        setDatasets(mockDatasets);
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
  
  // Delete dataset (mock)
  const deleteDataset = (id: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 500)), 
      {
        loading: "Deleting dataset...",
        success: () => {
          setDatasets(datasets.filter(dataset => dataset.id !== id));
          return "Dataset deleted successfully";
        },
        error: "Failed to delete dataset"
      }
    );
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
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/projects/${projectId}/evaluation/create-experiment`)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Use in Experiment
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteDataset(dataset.id)}>
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
    </div>
  );
};

export default AllDatasets;
