import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { Plus, Trash2, Info, Edit3, Save, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { parameterApi, Parameter, mockData } from "@/services/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { ApiClient } from "@/lib/api-client";
import { v4 as uuidv4 } from 'uuid';

const CreateParameters: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
    const [isLoading, setIsLoading] = useState(false);
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [existingParameters, setExistingParameters] = useState<Parameter[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [parameterToDelete, setParameterToDelete] = useState<{ id: string; name: string; type: 'existing' | 'new' } | null>(null);
  // Edit functionality states
  const [editingParameter, setEditingParameter] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    tolerance: "0.5"
  });
  const [editToleranceError, setEditToleranceError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [newParameter, setNewParameter] = useState({
    name: "",
    description: "",
    tolerance: "0.5", // Store as string to allow free typing
  });
  const [toleranceError, setToleranceError] = useState("");
  useEffect(() => {    const fetchExistingParameters = async () => {
      try {
        const response = await ApiClient.get(`/parameters-list?project_id=${projectId}`);
        console.log("Existing Parameters API Response:", response);
          if (response.data && (response.data as any).parameters) {
          // Map the API response to match the Parameter interface
          const mappedParameters = (response.data as any).parameters.map((param: any) => ({
            id: param.parameter_id,
            name: param.name,
            description: param.description,
            tolerance: param.tolerance || 0.5, // API returns 'tolerance' in response
            created_at: param.created_at,
            project_id: projectId || ""
          }));
          setExistingParameters(mappedParameters);
        } else if (response.error) {
          console.error("API Error:", response.error);
          // Fallback to mock data if API returns error
          setExistingParameters(mockData.createMockParameters());
        } else {
          // Fallback to mock data if no data returned
          setExistingParameters(mockData.createMockParameters());
        }
      } catch (error) {
        console.error("Error fetching existing parameters:", error);
        // Fallback to mock data on error
        // setExistingParameters(mockData.createMockParameters());
      }
    };

    if (projectId) {
      fetchExistingParameters();
    }
  }, [projectId]);

  // Real-time tolerance validation
  const handleToleranceChange = (value: string) => {
    setNewParameter({ ...newParameter, tolerance: value });
    
    if (value.trim() === "") {
      setToleranceError("");
      return;
    }
    
    const num = parseFloat(value);
    if (isNaN(num)) {
      setToleranceError("Must be a valid number");
    } else if (num < 0 || num > 1) {
      setToleranceError("Must be between 0 and 1");
    } else {
      setToleranceError("");
    }
  };

  // Add a new parameter to the list
  const addParameter = () => {
    if (!newParameter.name.trim() || !newParameter.description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate tolerance
    const toleranceValue = parseFloat(newParameter.tolerance);
    if (isNaN(toleranceValue) || toleranceValue < 0 || toleranceValue > 1) {
      setToleranceError("Tolerance must be a number between 0 and 1");
      toast.error("Tolerance must be a number between 0 and 1");
      return;
    }
    setToleranceError(""); // Clear any previous error

    const parameterBody = {
      parameter_name: newParameter.name,
      parameter_description: newParameter.description,
      parameter_tolerance: toleranceValue,
    };
    const parameterId = uuidv4();
    const response = ApiClient.post(`/parameters-create?project_id=${projectId}&parameter_id=${parameterId}`, parameterBody)
    console.log("Add Parameter API Response:", response);
    setParameters([
      ...parameters,
      {
        id: parameterId,
        name: newParameter.name,
        description: newParameter.description,
        tolerance: toleranceValue, // Add tolerance to the parameter object
        created_at: new Date().toISOString(),
        project_id: projectId || "",
      }]);

    // const newId = `param_${Date.now()}`;
    // setParameters([
    //   ...parameters,
    //   {
    //     id: newId,
    //     name: newParameter.name,
    //     description: newParameter.description,
    //     project_id: projectId || "",
    //     created_at: new Date().toISOString(),
    //   },
    // ]);
    
    setNewParameter({ name: "", description: "", tolerance: "0.5" });
    setToleranceError(""); // Clear any error
  };

  // Handle delete parameter click - open confirmation dialog
  const handleDeleteClick = (id: string, name: string, type: 'existing' | 'new') => {
    setParameterToDelete({ id, name, type });
    setDeleteConfirmOpen(true);
  };

  // Delete parameter with API call (for existing parameters) or local removal (for new parameters)
  const deleteParameter = async () => {
    if (!parameterToDelete) return;

    if (parameterToDelete.type === 'existing') {
      // Delete existing parameter via API
      try {
        const response = await ApiClient.post(`/parameters-delete?parameter_id=${parameterToDelete.id}&project_id=${projectId}`, {});
        console.log("Delete Parameter API Response:", response);
        
        if (response.data || !response.error) {
          // Remove parameter from local state
          setExistingParameters(existingParameters.filter(param => param.id !== parameterToDelete.id));
          toast.success("Parameter deleted successfully");
        } else {
          console.error("API Error:", response.error);
          toast.error("Failed to delete parameter");
        }
      } catch (error) {
        console.error("Error deleting parameter:", error);
        toast.error("Failed to delete parameter");
      }
    } else {
      // Remove new parameter from local state only
      setParameters(parameters.filter(param => param.id !== parameterToDelete.id));
      toast.success("Parameter removed successfully");
    }

    setDeleteConfirmOpen(false);
    setParameterToDelete(null);
  };

  // Handle edit parameter
  const handleEditStart = (param: Parameter) => {
    setEditingParameter(param.id);
    setEditForm({
      name: param.name,
      description: param.description,
      tolerance: (param.tolerance || 0.5).toString()
    });
    setEditToleranceError("");
  };

  // Handle cancel edit
  const handleEditCancel = () => {
    setEditingParameter(null);
    setEditForm({ name: "", description: "", tolerance: "0.5" });
    setEditToleranceError("");
  };

  // Handle edit tolerance change
  const handleEditToleranceChange = (value: string) => {
    setEditForm({ ...editForm, tolerance: value });
    
    if (value.trim() === "") {
      setEditToleranceError("");
      return;
    }
    
    const num = parseFloat(value);
    if (isNaN(num)) {
      setEditToleranceError("Must be a valid number");
    } else if (num < 0 || num > 1) {
      setEditToleranceError("Must be between 0 and 1");
    } else {
      setEditToleranceError("");
    }
  };

  // Save edited parameter
  const saveEditedParameter = async () => {
    if (!editingParameter) return;

    if (!editForm.name.trim() || !editForm.description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate tolerance
    const toleranceValue = parseFloat(editForm.tolerance);
    if (isNaN(toleranceValue) || toleranceValue < 0 || toleranceValue > 1) {
      setEditToleranceError("Tolerance must be a number between 0 and 1");
      toast.error("Tolerance must be a number between 0 and 1");
      return;
    }

    setIsSaving(true);
    try {
      const updateBody = {
        parameter_name: editForm.name.trim(),
        parameter_description: editForm.description.trim(),
        parameter_tolerance: toleranceValue
      };

      const response = await ApiClient.post(`/parameters-update?parameter_id=${editingParameter}`, updateBody);
      console.log("Update Parameter API Response:", response);

      if (response.data || !response.error) {
        // Update local state
        setExistingParameters(existingParameters.map(param => 
          param.id === editingParameter 
            ? { ...param, name: editForm.name.trim(), description: editForm.description.trim(), tolerance: toleranceValue }
            : param
        ));
        
        toast.success("Parameter updated successfully!");
        handleEditCancel();
      } else {
        console.error("API Error:", response.error);
        toast.error("Failed to update parameter");
      }
    } catch (error) {
      console.error("Error updating parameter:", error);
      toast.error("Failed to update parameter");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Parameters</h2>
        <p className="text-muted-foreground mt-1">
          Define evaluation criteria for your experiments
        </p>
      </div>
      
      <div className="space-y-8">
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add New Parameter</CardTitle>
              <CardDescription>
                Define a new evaluation parameter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="param-name">Parameter Name</Label>
                <Input
                  id="param-name"
                  value={newParameter.name}
                  onChange={(e) => setNewParameter({ ...newParameter, name: e.target.value })}
                  placeholder="e.g., Response Quality"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="param-description">Description</Label>
                <Textarea
                  id="param-description"
                  value={newParameter.description}
                  onChange={(e) => setNewParameter({ ...newParameter, description: e.target.value })}
                  placeholder="Describe what this parameter evaluates..."
                  className="min-h-24"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="param-tolerance">Tolerance</Label>
                <Input
                  id="param-tolerance"
                  type="text"
                  value={newParameter.tolerance}
                  onChange={(e) => handleToleranceChange(e.target.value)}
                  placeholder="0.5"
                  className={toleranceError ? "border-red-500" : ""}
                />
                {toleranceError && (
                  <p className="text-xs text-red-500">{toleranceError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  How strictly this parameter will be judged (0 = extremely strict, 1 = very lenient)
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="button"
                onClick={addParameter}
                disabled={!newParameter.name.trim() || !newParameter.description.trim()}
                className="bg-primary hover:bg-orygin-red-hover text-white w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Parameter
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Parameters</CardTitle>
              <CardDescription>
                Parameters created for this project
              </CardDescription>
            </CardHeader>            <CardContent className="max-h-80 overflow-y-auto space-y-4">
              {existingParameters.map((param) => (
                <div key={param.id} className="p-3 border border-border rounded-md">
                  {editingParameter === param.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`edit-name-${param.id}`}>Parameter Name</Label>
                        <Input
                          id={`edit-name-${param.id}`}
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="e.g., Response Quality"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`edit-description-${param.id}`}>Description</Label>
                        <Textarea
                          id={`edit-description-${param.id}`}
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder="Describe what this parameter evaluates..."
                          className="min-h-20"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`edit-tolerance-${param.id}`}>Tolerance</Label>
                        <Input
                          id={`edit-tolerance-${param.id}`}
                          type="text"
                          value={editForm.tolerance}
                          onChange={(e) => handleEditToleranceChange(e.target.value)}
                          placeholder="0.5"
                          className={editToleranceError ? "border-red-500" : ""}
                        />
                        {editToleranceError && (
                          <p className="text-xs text-red-500">{editToleranceError}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          How strictly this parameter will be judged (0 = extremely strict, 1 = very lenient)
                        </p>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
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
                          onClick={saveEditedParameter}
                          disabled={isSaving || !editForm.name.trim() || !editForm.description.trim()}
                          className="bg-primary hover:bg-orygin-red-hover text-white"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{param.name}</h4>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2 cursor-help">
                                {param.description.length > 100 
                                  ? `${param.description.substring(0, 100)}...` 
                                  : param.description}
                              </p>
                            </TooltipTrigger>
                            {param.description.length > 100 && (
                              <TooltipContent className="max-w-md p-3">
                                <p className="text-sm">{param.description}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                        <p className="text-xs text-muted-foreground mt-1">
                          Tolerance: {param.tolerance?.toFixed(1) || '0.5'} {param.tolerance !== undefined && (param.tolerance <= 0.3 ? '(Strict)' : param.tolerance >= 0.7 ? '(Lenient)' : '(Moderate)')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditStart(param)}
                          className="h-5 w-5 text-muted-foreground hover:text-blue-600"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span className="sr-only">Edit parameter</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(param.id, param.name, 'existing')}
                          className="h-5 w-5 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="sr-only">Delete parameter</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Added Parameters</h3>
            <span className="text-sm text-muted-foreground">
              {parameters.length} parameter{parameters.length !== 1 && "s"}
            </span>
          </div>
          
          {parameters.length > 0 ? (
            <div className="space-y-4">
              {parameters.map((param) => (
                <div key={param.id} className="p-4 border border-border rounded-md flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-medium">{param.name}</h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm text-muted-foreground cursor-help">
                            {param.description.length > 100 
                              ? `${param.description.substring(0, 100)}...` 
                              : param.description}
                          </p>
                        </TooltipTrigger>
                        {param.description.length > 100 && (
                          <TooltipContent className="max-w-md p-3">
                            <p className="text-sm">{param.description}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                    <p className="text-xs text-muted-foreground">
                      Tolerance: {param.tolerance?.toFixed(1) || '0.5'} {param.tolerance !== undefined && (param.tolerance <= 0.3 ? '(Strict)' : param.tolerance >= 0.7 ? '(Lenient)' : '(Moderate)')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(param.id, param.name, 'new')}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove parameter</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-border rounded-md">
              <p className="text-muted-foreground">
                No parameters added yet. Add some parameters above.
              </p>
            </div>
          )}        </div>
      </div>

      {/* Delete Parameter Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the parameter
              "{parameterToDelete?.name}" 
              {parameterToDelete?.type === 'existing' ? 
                ' and remove it from your project.' : 
                ' from your current session.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setParameterToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteParameter}
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

export default CreateParameters;
