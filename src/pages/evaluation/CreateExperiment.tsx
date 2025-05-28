
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, FileText, Database, RefreshCw } from "lucide-react";
import { Dataset, Parameter } from "@/services/api";
import { ApiClient } from "@/lib/api-client";
import { v4 as uuidv4 } from 'uuid';
import { useProject } from "@/contexts/ProjectContext";

const CreateExperiment: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProject();
    const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [experimentName, setExperimentName] = useState("");
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");  const [selectedParameterIds, setSelectedParameterIds] = useState<string[]>([]);
  
  // Cost calculation state
  const [priceQuoted, setPriceQuoted] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  
  // Fetch datasets and parameters from API
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [parameters, setParameters] = useState<Parameter[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch datasets
        const datasetsResponse = await ApiClient.get('/datasets-list', { project_id: projectId });
        console.log("Datasets API Response:", datasetsResponse);
        
        if (datasetsResponse.data && (datasetsResponse.data as any).datasets) {
          // Transform API response to match frontend Dataset interface
          const transformedDatasets: Dataset[] = (datasetsResponse.data as any).datasets.map((dataset: any) => ({
            id: dataset.dataset_id,
            name: dataset.name || `Dataset ${dataset.dataset_id.slice(0, 8)}...`,
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
        }

        // Fetch parameters
        const parametersResponse = await ApiClient.get(`/parameters-list?project_id=${projectId}`);
        console.log("Parameters API Response:", parametersResponse);
        
        if (parametersResponse.data && (parametersResponse.data as any).parameters) {
          // Map the API response to Parameter interface
          const mappedParameters: Parameter[] = (parametersResponse.data as any).parameters.map((param: any) => ({
            id: param.parameter_id,
            name: param.name,
            description: param.description,
            project_id: projectId || "",
            created_at: param.created_at || new Date().toISOString()
          }));
          setParameters(mappedParameters);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch datasets and parameters");
      } finally {
        setIsLoadingData(false);
      }
    };
    
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  const startExperimentCreation = () => {
    setShowForm(true);
  };
  // Toggle parameter selection
  const toggleParameter = (parameterId: string) => {
    setSelectedParameterIds((prev) => {
      if (prev.includes(parameterId)) {
        return prev.filter((id) => id !== parameterId);
      } else {
        return [...prev, parameterId];
      }
    });
    // Reset price calculation when parameters change
    setPriceQuoted(false);
    setEstimatedPrice(null);
  };

  // Calculate cost estimation
  const calculateCost = async () => {
    if (!selectedDatasetId) {
      toast.error("Please select a dataset first");
      return;
    }

    if (selectedParameterIds.length === 0) {
      toast.error("Please select at least one parameter");
      return;
    }

    setIsCalculatingCost(true);
    try {
      const payload = {
        dataset_id: selectedDatasetId,
        parameter_ids: selectedParameterIds
      };
      console.log("Calculating cost with payload:", payload);
      const response = await ApiClient.post('/experiments-calculate-cost', payload);
      console.log("Calculate Cost API Response:", response);

      if (response.data && (response.data as any).cost !== undefined) {
        setEstimatedPrice((response.data as any).cost);
        setPriceQuoted(true);
        toast.success("Cost calculated successfully");
      } else {
        console.error("API Error:", response.error);
        toast.error("Failed to calculate cost");
      }
    } catch (error) {
      console.error("Error calculating cost:", error);
      toast.error("Failed to calculate cost");
    } finally {
      setIsCalculatingCost(false);
    }
  };// Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!experimentName.trim()) {
      toast.error("Please enter an experiment name");
      return;
    }
    
    if (!selectedDatasetId) {
      toast.error("Please select a dataset");
      return;
    }
      if (selectedParameterIds.length === 0) {
      toast.error("Please select at least one parameter");
      return;
    }
    
    if (!priceQuoted) {
      toast.error("Please calculate the cost estimate before creating the experiment");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First, fetch the latest project details to get the labrat endpoint
      const projectDetailsResponse = await ApiClient.get(`/projects-details?project_id=${projectId}`);
      console.log("Project details response:", projectDetailsResponse);
      
      let labratJson = { endpoint: '', headers: {} };
      
      if (projectDetailsResponse.data && (projectDetailsResponse.data as any).project) {
        const projectData = (projectDetailsResponse.data as any).project;
        labratJson = {
          endpoint: projectData.labrat_json?.endpoint || '',
          headers: projectData.labrat_json?.headers || {}
        };
      } else {
        console.warn("Could not fetch project details, using fallback labrat data");
        labratJson = {
          endpoint: currentProject?.labrat_json?.endpoint || '',
          headers: currentProject?.labrat_json?.headers || {}
        };
      }
      
      // Generate a unique experiment ID
      const experimentId = uuidv4();
      // Prepare the request payload
      const payload = {
        experiment_name: experimentName,
        dataset_id: selectedDatasetId,
        parameter_ids: selectedParameterIds,
        labrat_json: labratJson
      };
      
      console.log("Labrat JSON from project details:", labratJson);
      console.log("Creating experiment with payload:", payload);
      
      // Call the async experiment creation API
      const response = await ApiClient.post(
        `/experiments-create?project_id=${projectId}&experiment_id=${experimentId}`,
        payload
      );
      
      console.log("Experiment creation response:", response);
      
      if (response.data && (response.data as any).status === "success") {
        toast.success(`Experiment "${experimentName}" created successfully! It's now running in the background.`);
        
        // Navigate to the history page to show the running experiment
        navigate(`/projects/${projectId}/evaluation/history`);
      } else {
        throw new Error("Failed to create experiment");
      }
    } catch (error) {
      console.error("Error creating experiment:", error);
      toast.error("Failed to create experiment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // If we're still loading data, show loading state
  if (isLoadingData) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold">Experiments</h2>
          <p className="text-muted-foreground mt-1">
            Set up a new evaluation experiment
          </p>
        </div>
        
        <div className="empty-state mt-12">
          <div className="p-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Loading...</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Fetching datasets and parameters
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If not showing the form and we have datasets/parameters, show the empty state
  if (!showForm && datasets.length > 0 && parameters.length > 0) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold">Experiments</h2>
          <p className="text-muted-foreground mt-1">
            Set up a new evaluation experiment
          </p>
        </div>
        
        <div className="empty-state mt-12">
          <div className="p-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Create New Experiment</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Set up a new evaluation experiment for your LLM
            </p>
            <Button
              onClick={startExperimentCreation}
              className="mt-6 gap-2 bg-primary hover:bg-orygin-red-hover text-white"
            >
              <Plus className="h-4 w-4" />
              Create Experiment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If we're missing datasets or parameters, show the missing requirements state
  if (datasets.length === 0 || parameters.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold">Create Experiment</h2>
          <p className="text-muted-foreground mt-1">
            Set up a new evaluation experiment
          </p>
        </div>

        <div className="empty-state mt-12">
          <div className="p-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              {datasets.length === 0 && parameters.length === 0
                ? "Missing Requirements"
                : datasets.length === 0
                ? "No Datasets Available"
                : "No Parameters Available"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {datasets.length === 0
                ? "You need to create a dataset before creating an experiment."
                : "You need to define parameters before creating an experiment."}
            </p>
            <Button
              onClick={() =>
                navigate(
                  datasets.length === 0
                    ? `/projects/${projectId}/datasets/synthesize`
                    : `/projects/${projectId}/evaluation/create-parameters`
                )
              }
              className="mt-6 gap-2 bg-primary hover:bg-orygin-red-hover text-white"
            >
              <Plus className="h-4 w-4" />
              {datasets.length === 0 ? "Create Dataset" : "Create Parameters"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show the experiment creation form
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Create Experiment</h2>
          <p className="text-muted-foreground mt-1">
            Set up a new evaluation experiment
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowForm(false)}
        >
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Experiment Details</CardTitle>
            <CardDescription>
              Basic information about your experiment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Experiment Name</Label>
                <Input
                  id="name"
                  value={experimentName}
                  onChange={(e) => setExperimentName(e.target.value)}
                  placeholder="e.g., GPT-4 Evaluation Round 1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Dataset</CardTitle>
            <CardDescription>
              Choose a dataset to evaluate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">              <Select
                value={selectedDatasetId}
                onValueChange={(value) => {
                  setSelectedDatasetId(value);
                  // Reset price calculation when dataset changes
                  setPriceQuoted(false);
                  setEstimatedPrice(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      <div className="flex items-center">
                        <Database className="h-4 w-4 mr-2 text-muted-foreground" />
                        {dataset.name}
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({dataset.conversations.length} conversations)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedDatasetId && (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="preview">
                    <AccordionTrigger className="text-sm">
                      <span className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Preview Dataset
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
                        {datasets
                          .find((d) => d.id === selectedDatasetId)
                          ?.conversations.slice(0, 3)
                          .map((conversation, i) => (
                            <div
                              key={conversation.id}
                              className="text-sm border border-border rounded-md p-3"
                            >
                              <div className="font-medium mb-2">
                                Conversation {i + 1}
                              </div>
                              {conversation.messages
                                .slice(0, 2)
                                .map((message, j) => (
                                  <div
                                    key={j}
                                    className={`p-2 rounded-md mb-2 ${
                                      message.role === "user"
                                        ? "bg-muted"
                                        : "bg-secondary"
                                    }`}
                                  >
                                    <div className="text-xs font-medium capitalize mb-1">
                                      {message.role}
                                    </div>
                                    <div className="text-xs">
                                      {message.content}
                                    </div>
                                  </div>
                                ))}
                              {conversation.messages.length > 2 && (
                                <div className="text-xs text-muted-foreground italic">
                                  {conversation.messages.length - 2} more
                                  messages...
                                </div>
                              )}
                            </div>
                          ))}
                        <div className="text-xs text-center text-muted-foreground py-2">
                          Showing 3 of{" "}
                          {datasets.find((d) => d.id === selectedDatasetId)
                            ?.conversations.length || 0}{" "}
                          conversations
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Parameters</CardTitle>
            <CardDescription>
              Choose the parameters to evaluate against
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {parameters.map((parameter) => (
                <div
                  key={parameter.id}
                  className="flex items-start space-x-3 py-2"
                >
                  <Checkbox
                    id={parameter.id}
                    checked={selectedParameterIds.includes(parameter.id)}
                    onCheckedChange={() => toggleParameter(parameter.id)}
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor={parameter.id}
                      className="font-medium cursor-pointer"
                    >
                      {parameter.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {parameter.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>        </Card>

        {/* Cost Estimation Card */}
        <Card>
          <CardHeader>
            <CardTitle>Estimated Price</CardTitle>
            <CardDescription>
              Get a price estimate for running this experiment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              {estimatedPrice !== null ? (
                <div className="rounded-md bg-muted p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Estimated Cost:</span>
                    <span className="text-xl font-bold">${estimatedPrice.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    This estimate is based on the selected parameters and the number of conversations in your dataset.
                  </p>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={calculateCost}
                      disabled={isCalculatingCost || !selectedDatasetId || selectedParameterIds.length === 0}
                      className="gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${isCalculatingCost ? 'animate-spin' : ''}`} />
                      Recalculate
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Button 
                    onClick={calculateCost}
                    disabled={isCalculatingCost || !selectedDatasetId || selectedParameterIds.length === 0}
                    className="bg-primary hover:bg-orygin-red-hover text-white"
                  >
                    {isCalculatingCost ? "Calculating..." : "Estimate your cost"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => setShowForm(false)}
            type="button"
          >
            Cancel
          </Button>          <Button
            type="submit"
            className={!priceQuoted 
              ? "bg-muted text-muted-foreground cursor-not-allowed" 
              : "bg-primary hover:bg-orygin-red-hover text-white"
            }
            disabled={isLoading || !priceQuoted}
          >
            {isLoading ? "Creating..." : "Create Experiment"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateExperiment;
