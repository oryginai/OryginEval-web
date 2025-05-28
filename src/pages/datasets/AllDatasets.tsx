import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MoreVertical, Trash2, Database, Upload, FileText, Eye, ChevronDown, ChevronUp, Edit3, Save, X } from "lucide-react";
import { Dataset } from "@/services/api";
import { ApiClient } from "@/lib/api-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Types for conversations
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  messages: Message[];
}

const AllDatasets: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [isLoading, setIsLoading] = useState(true);  const [datasets, setDatasets] = useState<Dataset[]>([]);  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState<{ id: string; name: string } | null>(null);
  const [viewingDataset, setViewingDataset] = useState<string | null>(null);
  const [editingDataset, setEditingDataset] = useState<string | null>(null);
  const [editedConversations, setEditedConversations] = useState<Conversation[]>([]);
  const [isSaving, setIsSaving] = useState(false);
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
  // Handle view dataset toggle
  const handleViewToggle = (datasetId: string) => {
    setViewingDataset(viewingDataset === datasetId ? null : datasetId);
  };

  // Handle edit dataset
  const handleEditStart = (dataset: Dataset) => {
    setEditingDataset(dataset.id);
    setEditedConversations([...dataset.conversations]);
    setViewingDataset(dataset.id); // Also show the details
  };

  // Handle cancel edit
  const handleEditCancel = () => {
    setEditingDataset(null);
    setEditedConversations([]);
  };

  // Update a message in edited conversations
  const updateEditedMessage = (conversationIndex: number, messageIndex: number, content: string) => {
    const updatedConversations = [...editedConversations];
    updatedConversations[conversationIndex].messages[messageIndex].content = content;
    setEditedConversations(updatedConversations);
  };

  // Add a new message to an edited conversation
  const addEditedMessage = (conversationIndex: number) => {
    const updatedConversations = [...editedConversations];
    const lastMessage = updatedConversations[conversationIndex].messages.slice(-1)[0];
    const newRole = lastMessage.role === "user" ? "assistant" : "user";
    updatedConversations[conversationIndex].messages.push({
      role: newRole,
      content: ""
    });
    setEditedConversations(updatedConversations);
  };

  // Remove a message from an edited conversation
  const removeEditedMessage = (conversationIndex: number, messageIndex: number) => {
    const updatedConversations = [...editedConversations];
    // Ensure we always keep at least one message
    if (updatedConversations[conversationIndex].messages.length > 1) {
      updatedConversations[conversationIndex].messages.splice(messageIndex, 1);
      setEditedConversations(updatedConversations);
    }
  };

  // Remove an entire conversation
  const removeEditedConversation = (conversationIndex: number) => {
    const updatedConversations = editedConversations.filter((_, i) => i !== conversationIndex);
    setEditedConversations(updatedConversations);
  };

  // Add a new conversation
  const addEditedConversation = () => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      messages: [
        { role: "user", content: "" },
        { role: "assistant", content: "" }
      ]
    };
    setEditedConversations([...editedConversations, newConversation]);
  };

  // Save edited dataset
  const saveEditedDataset = async () => {
    if (!editingDataset) return;

    // Validate that all messages have content
    const isValid = editedConversations.every(conv => 
      conv.messages.every(msg => msg.content.trim().length > 0)
    );

    if (!isValid) {
      toast.error("Please fill in all conversation messages");
      return;
    }

    setIsSaving(true);
    try {
      // Prepare the dataset in the correct format for the API
      const datasetData = {
        dataset: editedConversations.map(conv => ({
          id: conv.id,
          conversation: conv.messages
        }))
      };

      console.log("Updating dataset with edited conversations:", datasetData);
      
      const response = await ApiClient.post(`/datasets-update?dataset_id=${editingDataset}`, datasetData);
      console.log("Dataset update response:", response);

      if (response.data && (response.data as any).status === "success") {
        // Update local state
        setDatasets(datasets.map(dataset => 
          dataset.id === editingDataset 
            ? { ...dataset, conversations: editedConversations }
            : dataset
        ));
        
        toast.success("Dataset updated successfully!");
        setEditingDataset(null);
        setEditedConversations([]);
      } else {
        toast.error("Failed to update dataset. Please try again.");
      }
    } catch (error) {
      console.error("Error updating dataset:", error);
      toast.error("Failed to update dataset. Please try again.");
    } finally {
      setIsSaving(false);
    }
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
                </TableHeader>                <TableBody>
                  {datasets.map((dataset) => (
                    <React.Fragment key={dataset.id}>
                      <TableRow>
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
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewToggle(dataset.id)}
                            >
                              {viewingDataset === dataset.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                              <span className="sr-only">
                                {viewingDataset === dataset.id ? "Hide details" : "View details"}
                              </span>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewToggle(dataset.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {viewingDataset === dataset.id ? "Hide Details" : "View Details"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditStart(dataset)}>
                                  <Edit3 className="mr-2 h-4 w-4" />
                                  Edit Dataset
                                </DropdownMenuItem>
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
                          </div>
                        </TableCell>
                      </TableRow>
                      {viewingDataset === dataset.id && (
                        <TableRow>                          <TableCell colSpan={4} className="p-0">
                            <div className="border-t p-6">                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-lg">Dataset Conversations</h4>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">
                                      {editingDataset === dataset.id ? editedConversations.length : dataset.conversations.length} conversations
                                    </Badge>
                                    {editingDataset === dataset.id ? (
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleEditCancel}
                                          disabled={isSaving}
                                        >
                                          <X className="h-4 w-4 mr-1" />
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={saveEditedDataset}
                                          disabled={isSaving}
                                          className="bg-primary hover:bg-orygin-red-hover text-white"
                                        >
                                          <Save className="h-4 w-4 mr-1" />
                                          {isSaving ? "Saving..." : "Save Changes"}
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditStart(dataset)}
                                      >
                                        <Edit3 className="h-4 w-4 mr-1" />
                                        Edit
                                      </Button>
                                    )}
                                  </div>
                                </div>                                
                                {editingDataset === dataset.id ? (
                                  // Edit Mode
                                  <>
                                    {editedConversations.length > 0 ? (
                                      <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {editedConversations.map((conversation, idx) => (
                                          <Card key={conversation.id || idx} className="border relative">
                                            <CardHeader className="pb-3">
                                              <div className="flex items-center justify-between">
                                                <CardTitle className="text-base font-semibold">
                                                  Conversation {idx + 1}
                                                </CardTitle>
                                                {editedConversations.length > 1 && (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeEditedConversation(idx)}
                                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                  >
                                                    <X className="h-4 w-4" />
                                                  </Button>
                                                )}
                                              </div>
                                            </CardHeader>
                                            <CardContent className="pt-4">
                                              <div className="space-y-3">
                                                {conversation.messages.map((message, msgIdx) => (
                                                  <div key={msgIdx} className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                      <Label className="text-xs capitalize">{message.role}</Label>
                                                      {conversation.messages.length > 1 && (
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={() => removeEditedMessage(idx, msgIdx)}
                                                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                        >
                                                          <X className="h-3 w-3" />
                                                        </Button>
                                                      )}
                                                    </div>
                                                    <Textarea
                                                      value={message.content}
                                                      onChange={(e) => updateEditedMessage(idx, msgIdx, e.target.value)}
                                                      placeholder={`${message.role === "user" ? "User message" : "Assistant response"}...`}
                                                      className="min-h-16"
                                                    />
                                                  </div>
                                                ))}
                                              </div>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addEditedMessage(idx)}
                                                className="mt-3"
                                              >
                                                Add Message
                                              </Button>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-12 text-muted-foreground">
                                        <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-base font-medium">No conversations in this dataset</p>
                                      </div>
                                    )}
                                    
                                    <Button
                                      variant="outline"
                                      onClick={addEditedConversation}
                                      className="w-full border-dashed mt-4"
                                    >
                                      Add New Conversation
                                    </Button>
                                  </>
                                ) : (
                                  // View Mode
                                  <>
                                    {dataset.conversations.length > 0 ? (
                                      <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {dataset.conversations.map((conversation, idx) => (
                                          <Card key={conversation.id || idx} className="border">
                                            <CardHeader className="pb-3">
                                              <CardTitle className="text-base font-semibold">
                                                Conversation {idx + 1}
                                              </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-4">
                                              <div className="space-y-2">
                                                {conversation.messages.map((message, msgIdx) => (
                                                  <div
                                                    key={msgIdx}
                                                    className={`p-3 rounded-lg border ${
                                                      message.role === 'user'
                                                        ? 'border-blue-500/50 bg-blue-500/10'
                                                        : 'border-green-500/50 bg-green-500/10'
                                                    }`}
                                                  >
                                                    <div className="font-semibold text-sm mb-2 capitalize opacity-80">
                                                      {message.role}:
                                                    </div>
                                                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                                      {message.content}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-12 text-muted-foreground">
                                        <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-base font-medium">No conversations in this dataset</p>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
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
