
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { Plus, Trash2, Info } from "lucide-react";
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

const CreateParameters: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  
  const [isLoading, setIsLoading] = useState(false);
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [existingParameters, setExistingParameters] = useState<Parameter[]>([]);
  const [newParameter, setNewParameter] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    // In a real app, this would fetch existing parameters from the API
    setExistingParameters(mockData.createMockParameters());
  }, [projectId]);

  // Add a new parameter to the list
  const addParameter = () => {
    if (!newParameter.name.trim() || !newParameter.description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    
    const newId = `param_${Date.now()}`;
    setParameters([
      ...parameters,
      {
        id: newId,
        name: newParameter.name,
        description: newParameter.description,
        project_id: projectId || "",
        created_at: new Date().toISOString(),
      },
    ]);
    
    setNewParameter({ name: "", description: "" });
  };

  // Remove a parameter from the list
  const removeParameter = (id: string) => {
    setParameters(parameters.filter((param) => param.id !== id));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (parameters.length === 0) {
      toast.error("Please add at least one parameter");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, this would call the API to create the parameters
      for (const param of parameters) {
        await parameterApi.createParameter(
          projectId || "",
          param.name,
          param.description
        );
      }
      
      toast.success("Parameters created successfully");
      navigate(`/projects/${projectId}/evaluation`);
    } catch (error) {
      console.error("Error creating parameters:", error);
      toast.error("Failed to create parameters");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Create Parameters</h2>
        <p className="text-muted-foreground mt-1">
          Define evaluation criteria for your experiments
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
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
              <CardTitle>Existing Parameters</CardTitle>
              <CardDescription>
                Pre-defined parameters you can use
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-80 overflow-y-auto space-y-4">
              {existingParameters.map((param) => (
                <div key={param.id} className="p-3 border border-border rounded-md">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium">{param.name}</h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground">
                            <Info className="h-3 w-3" />
                            <span className="sr-only">Info</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          {param.description}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {param.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Your Parameters</h3>
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
                    <p className="text-sm text-muted-foreground">
                      {param.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeParameter(param.id)}
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
          )}
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/projects/${projectId}/evaluation`)}
            type="button"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            className="bg-primary hover:bg-orygin-red-hover text-white"
            disabled={isLoading || parameters.length === 0}
          >
            {isLoading ? "Saving..." : "Save Parameters"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateParameters;
