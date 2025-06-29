import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, ChevronDown, ChevronRight, RefreshCw, Edit3, Save, X } from "lucide-react"; // Added RefreshCw
import { Button } from "@/components/ui/button";
import { useProject } from "@/contexts/ProjectContext";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/sonner";
import { mockData, Parameter } from "@/services/api";
import { ApiClient } from "@/lib/api-client";
import { v4 as uuidv4 } from 'uuid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

// Types for the quick experiment flow
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  messages: Message[];
}

// Dataset interface for existing datasets selection
interface Dataset {
  id: string;
  name: string;
  project_id: string;
  created_at: string;
  conversations: Conversation[];
}

// Enhanced parameter interface for Home page
interface HomeParameter {
  id: string;
  name: string;
  description: string;
  tolerance?: number; // Range 0-1, where 0 is extremely strict and 1 is lenient
  selected: boolean;
  isExpanded: boolean;
}

const Home: React.FC = () => {
  const { currentProject } = useProject();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [step, setStep] = useState(0);
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [priceQuoted, setPriceQuoted] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [isGeneratingDataset, setIsGeneratingDataset] = useState(false);
  const [isDatasetReady, setIsDatasetReady] = useState(false);  
  const [generatedConversations, setGeneratedConversations] = useState<Conversation[]>([]);
  const [numSamples, setNumSamples] = useState(10);
  
  // New states for dataset selection
  const [synthesisMethod, setSynthesisMethod] = useState<"manual" | "existing">("manual");
  const [existingDatasets, setExistingDatasets] = useState<Dataset[]>([]);
  const [selectedExistingDatasetId, setSelectedExistingDatasetId] = useState<string>("");
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
  
  const [sampleConversations, setSampleConversations] = useState<Conversation[]>([
    { id: "sample-1", messages: [{ role: "user", content: "" }, { role: "assistant", content: "" }] }
  ]);
  const [botInstructions, setBotInstructions] = useState("");const [parameters, setParameters] = useState<HomeParameter[]>([]);
  const [workers, setWorkers] = useState<number>(10); // Default value of 10 workers
  const [isLoadingParameters, setIsLoadingParameters] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [parameterToDelete, setParameterToDelete] = useState<{ id: string; index: number } | null>(null);
  // Edit functionality states for Home page
  const [editingParameterId, setEditingParameterId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    tolerance: "0.5"
  });
  const [editToleranceError, setEditToleranceError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [newParameter, setNewParameter] = useState({
    name: "",
    description: "",
    tolerance: "0.5", // Store as string to allow free typing
  });
  const [toleranceError, setToleranceError] = useState("");

  // Fetch parameters when entering step 2
  useEffect(() => {
    if (step === 2 && projectId) {
      fetchParameters();
    }
  }, [step, projectId]);

  // Fetch existing datasets for selection
  const fetchExistingDatasets = async () => {
    setIsLoadingDatasets(true);
    try {
      const response = await ApiClient.get('/datasets-list', { project_id: projectId });
      console.log("Datasets API Response:", response);
      
      const responseData = response.data as { status?: string; datasets?: any[] };
      
      if (responseData && responseData.datasets && Array.isArray(responseData.datasets)) {
        const transformedDatasets: Dataset[] = responseData.datasets.map((dataset: any) => ({
          id: dataset.dataset_id,
          name: dataset.dataset_name || `Dataset ${dataset.dataset_id.slice(0, 8)}...`,
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
        
        setExistingDatasets(transformedDatasets);
      } else {
        console.warn("Unexpected API response structure:", response);
        setExistingDatasets([]);
      }
    } catch (error) {
      console.error("Error fetching existing datasets:", error);
      toast.error("Failed to fetch existing datasets");
      setExistingDatasets([]);
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  const fetchParameters = async () => {
    setIsLoadingParameters(true);
    try {
      const response = await ApiClient.get(`/parameters-list?project_id=${projectId}`);
      console.log("Fetch Parameters API Response:", response);
      
      if (response.data && (response.data as any).parameters) {
        // Map the API response to HomeParameter interface
        const mappedParameters = (response.data as any).parameters.map((param: any) => ({
          id: param.parameter_id,
          name: param.name,
          description: param.description,
          tolerance: param.tolerance || 0.5, // API returns 'tolerance' in response
          selected: true,
          isExpanded: false
        }));
        setParameters(mappedParameters);
      } else if (response.error) {
        console.error("API Error:", response.error);
        // Fallback to empty array
        setParameters([]);
      } else {
        // Fallback to empty array
        setParameters([]);
      }
    } catch (error) {
      console.error("Error fetching parameters:", error);
      setParameters([]);
    } finally {
      setIsLoadingParameters(false);
    }
  };

  // Check dataset generation status
  const checkDatasetStatus = async () => {
    if (!datasetId) return;

    try {
      const response = await ApiClient.get(`/datasets-details?dataset_id=${datasetId}`);
      console.log("Dataset details response:", response);

      if (response.data && (response.data as any).status === "success") {
        const dataset = (response.data as any).dataset;
        
        if (dataset && dataset.dataset_json && Array.isArray(dataset.dataset_json) && dataset.dataset_json.length > 0) {
          // Dataset is ready with data
          const conversations = dataset.dataset_json.map((conv: any) => ({
            id: conv.id,
            messages: conv.conversation
          }));
          
          setGeneratedConversations(conversations);
          setIsDatasetReady(true);
          toast.success("Dataset is ready! Generated conversations have been loaded.");
        } else {
          // Dataset exists but is empty (still generating)
          toast.info("Dataset is still being generated. Please try again in a moment.");
        }
      } else {
        toast.error("Failed to check dataset status.");
      }
    } catch (error) {
      console.error("Error checking dataset status:", error);
      toast.error("Failed to check dataset status.");
    }
  };  const startExperimentCreation = () => {
    setStep(0);
    setShowCreateFlow(true);
    setBotInstructions("");
    setPriceQuoted(false);
    setEstimatedPrice(null);
    setIsCalculatingCost(false);
    setDatasetId(null);
    setIsGeneratingDataset(false);    
    setIsDatasetReady(false);
    setGeneratedConversations([]);
    setNumSamples(10);
    setSynthesisMethod("manual");
    setSelectedExistingDatasetId("");
    // Fetch existing datasets when starting the flow
    fetchExistingDatasets();
    setSampleConversations([
      { id: "sample-1", messages: [{ role: "user", content: "" }, { role: "assistant", content: "" }] }
    ]);
    setParameters([]); // Reset parameters - they will be fetched when step 2 is reached
    setNewParameter({ name: "", description: "", tolerance: "0.5" });
    setToleranceError(""); // Clear any error
  };

  // Add a new conversation sample
  const addConversation = () => {
    setSampleConversations([
      ...sampleConversations,
      { 
        id: `sample-${sampleConversations.length + 1}`, 
        messages: [{ role: "user", content: "" }, { role: "assistant", content: "" }] 
      }
    ]);
  };
  // Update a message in a conversation
  const updateMessage = (conversationIndex: number, messageIndex: number, content: string) => {
    const updatedConversations = [...sampleConversations];
    updatedConversations[conversationIndex].messages[messageIndex].content = content;
    setSampleConversations(updatedConversations);
  };

  // Update a message in generated conversations
  const updateGeneratedMessage = (conversationIndex: number, messageIndex: number, content: string) => {
    const updatedConversations = [...generatedConversations];
    updatedConversations[conversationIndex].messages[messageIndex].content = content;
    setGeneratedConversations(updatedConversations);
  };

  // Add a new message to a conversation
  const addMessage = (conversationIndex: number) => {
    const updatedConversations = [...sampleConversations];
    const lastMessage = updatedConversations[conversationIndex].messages.slice(-1)[0];
    const newRole = lastMessage.role === "user" ? "assistant" : "user";
    updatedConversations[conversationIndex].messages.push({
      role: newRole,
      content: ""
    });
    setSampleConversations(updatedConversations);
  };

  // Add a new message to generated conversations
  const addGeneratedMessage = (conversationIndex: number) => {
    const updatedConversations = [...generatedConversations];
    const lastMessage = updatedConversations[conversationIndex].messages.slice(-1)[0];
    const newRole = lastMessage.role === "user" ? "assistant" : "user";
    updatedConversations[conversationIndex].messages.push({
      role: newRole,
      content: ""
    });
    setGeneratedConversations(updatedConversations);
  };

  // Remove a conversation
  const removeConversation = (index: number) => {
    const updatedConversations = sampleConversations.filter((_, i) => i !== index);
    setSampleConversations(updatedConversations);
  };

  // Remove a generated conversation
  const removeGeneratedConversation = (index: number) => {
    const updatedConversations = generatedConversations.filter((_, i) => i !== index);
    setGeneratedConversations(updatedConversations);
  };  // Real-time tolerance validation
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
  const addParameter = async () => {
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

    try {
      const parameterBody = {
        parameter_name: newParameter.name,
        parameter_description: newParameter.description,
        parameter_tolerance: toleranceValue,
      };
      const parameterId = uuidv4();
      const response = await ApiClient.post(`/parameters-create?project_id=${projectId}&parameter_id=${parameterId}`, parameterBody);
      console.log("Add Parameter API Response:", response);
      
      if (response.data || !response.error) {
        // Add the new parameter to local state
        const newParam: HomeParameter = {
          id: parameterId,
          name: newParameter.name,
          description: newParameter.description,
          tolerance: toleranceValue,
          selected: true,
          isExpanded: true
        };
        setParameters([...parameters, newParam]);
        setNewParameter({ name: "", description: "", tolerance: "0.5" });
        setToleranceError(""); // Clear any error
        toast.success("Parameter created successfully");
      } else {
        console.error("API Error:", response.error);
        toast.error("Failed to create parameter");
      }
    } catch (error) {
      console.error("Error creating parameter:", error);
      toast.error("Failed to create parameter");
    }  };
  // Handle delete parameter click - open confirmation dialog
  const handleDeleteClick = (index: number) => {
    const parameter = parameters[index];
    setParameterToDelete({ id: parameter.id, index });
    setDeleteConfirmOpen(true);
  };
  // Delete parameter with API call
  const deleteParameter = async () => {
    if (!parameterToDelete || !projectId) return;

    try {
      const response = await ApiClient.post(`/parameters-delete?parameter_id=${parameterToDelete.id}&project_id=${projectId}`, {});
      console.log("Delete Parameter API Response:", response);
      
      if (response.data || !response.error) {
        // Remove parameter from local state
        const updatedParameters = parameters.filter((_, i) => i !== parameterToDelete.index);
        setParameters(updatedParameters);
        toast.success("Parameter deleted successfully");
      } else {
        console.error("API Error:", response.error);
        toast.error("Failed to delete parameter");
      }
    } catch (error) {
      console.error("Error deleting parameter:", error);
      toast.error("Failed to delete parameter");
    } finally {
      setDeleteConfirmOpen(false);
      setParameterToDelete(null);
    }
  };

  // Remove a parameter (legacy function - now using delete confirmation)
  const removeParameter = (index: number) => {
    handleDeleteClick(index);
  };

  // Handle edit parameter for Home page
  const handleEditParameterStart = (param: HomeParameter) => {
    setEditingParameterId(param.id);
    setEditForm({
      name: param.name,
      description: param.description,
      tolerance: (param.tolerance || 0.5).toString()
    });
    setEditToleranceError("");
  };

  // Handle cancel edit for Home page
  const handleEditParameterCancel = () => {
    setEditingParameterId(null);
    setEditForm({ name: "", description: "", tolerance: "0.5" });
    setEditToleranceError("");
  };

  // Handle edit tolerance change for Home page
  const handleEditParameterToleranceChange = (value: string) => {
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

  // Save edited parameter for Home page
  const saveEditedParameter = async () => {
    if (!editingParameterId) return;

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

    setIsSavingEdit(true);
    try {
      const updateBody = {
        parameter_name: editForm.name.trim(),
        parameter_description: editForm.description.trim(),
        parameter_tolerance: toleranceValue
      };

      const response = await ApiClient.post(`/parameters-update?parameter_id=${editingParameterId}`, updateBody);
      console.log("Update Parameter API Response:", response);

      if (response.data || !response.error) {
        // Update local state
        setParameters(parameters.map(param => 
          param.id === editingParameterId 
            ? { ...param, name: editForm.name.trim(), description: editForm.description.trim(), tolerance: toleranceValue }
            : param
        ));
        
        toast.success("Parameter updated successfully!");
        handleEditParameterCancel();
      } else {
        console.error("API Error:", response.error);
        toast.error("Failed to update parameter");
      }
    } catch (error) {
      console.error("Error updating parameter:", error);
      toast.error("Failed to update parameter");
    } finally {
      setIsSavingEdit(false);
    }
  };
  
  // Toggle parameter selection
  const toggleParameter = (index: number) => {
    const updatedParameters = [...parameters];
    updatedParameters[index].selected = !updatedParameters[index].selected;
    setParameters(updatedParameters);
  };
  // Toggle parameter expansion
  const toggleParameterExpansion = (index: number) => {
    const isCurrentlyExpanded = parameters[index].isExpanded;

    setParameters(parameters.map((param, i) => {
      if (i === index) {
        return { ...param, isExpanded: !param.isExpanded };
      } else {
        // If we are expanding the current one, collapse others.
        // If we are collapsing the current one, others remain as they are.
        return { ...param, isExpanded: !isCurrentlyExpanded ? false : param.isExpanded };
      }
    }));  };

  // Calculate cost estimation
  const calculateCost = async () => {
    if (!datasetId) {
      toast.error("No dataset available for cost calculation");
      return;
    }

    const selectedParameterIds = parameters
      .filter(param => param.selected)
      .map(param => param.id);

    if (selectedParameterIds.length === 0) {
      toast.error("Please select at least one parameter");
      return;
    }

    setIsCalculatingCost(true);
    try {
      const payload = {
        dataset_id: datasetId,
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
  };
  // Handle next step in the wizard
  const handleNext = async () => {
    if (step === 0) {
      // Validate based on synthesis method
      if (synthesisMethod === "manual") {
        const isValid = sampleConversations.every(convo => 
          convo.messages.every(msg => msg.content.trim().length > 0)
        );
        
        if (!isValid) {
          alert("Please fill in all conversation messages");
          return;
        }
      } else if (synthesisMethod === "existing") {
        if (!selectedExistingDatasetId) {
          alert("Please select an existing dataset");
          return;
        }
      }

      setIsGeneratingDataset(true);
      
      try {
        // Generate a new dataset ID
        const newDatasetId = uuidv4();
        
        let response;
        
        if (synthesisMethod === "manual") {
          // Prepare the sample data in the correct format for manual method
          const sampleData = sampleConversations.map(convo => ({
            id: convo.id,
            conversation: convo.messages
          }));

          // Call the datasets-generate API
          response = await ApiClient.post(
            `/datasets-generate?dataset_id=${newDatasetId}&project_id=${projectId}`,
            {
              sample_data: sampleData,
              num_samples: numSamples,
              extra_info: botInstructions,
              dataset_name: `Quick Start Dataset ${Date.now()}`
            }
          );
        } else {
          // Call the datasets-extend API for existing dataset method
          response = await ApiClient.post(
            `/datasets-extend?dataset_id=${selectedExistingDatasetId}`,
            {
              num_samples: numSamples
              // extra_info: botInstructions,
            }
          );
        }

        console.log("Dataset generation response:", response);

        if (response.data && (response.data as any).status === "success") {
          setDatasetId(newDatasetId);
          setIsDatasetReady(false);
          setGeneratedConversations([]);
          setStep(1);
          toast.success("Dataset generation started! Please wait while we synthesize conversations.");
        } else {
          throw new Error("Failed to start dataset generation");
        }
      } catch (error) {
        console.error("Error starting dataset generation:", error);
        toast.error("Failed to start dataset generation. Please try again.");
      } finally {
        setIsGeneratingDataset(false);
      }    } else if (step === 1) {
      // Move to parameter selection if dataset is ready
      if (isDatasetReady) {
        // Save any edits made to generated conversations before proceeding
        if (generatedConversations.length > 0 && datasetId) {
          try {
            // Prepare the dataset in the correct format for the API
            const datasetData = {
              dataset: generatedConversations.map(convo => ({
                id: convo.id,
                conversation: convo.messages
              })),
              dataset_name: `Quick Start Dataset ${Date.now()}`
            };

            console.log("Updating dataset with edited conversations:", datasetData);
            
            const response = await ApiClient.post(`/datasets-update?dataset_id=${datasetId}`, datasetData);
            console.log("Dataset update response:", response);

            if (response.data && (response.data as any).status === "success") {
              toast.success("Conversations saved successfully!");
              setStep(2);
            } else {
              toast.error("Failed to save conversation edits. Please try again.");
              return;
            }
          } catch (error) {
            console.error("Error updating dataset:", error);
            toast.error("Failed to save conversation edits. Please try again.");
            return;
          }
        } else {
          setStep(2);
        }
      } else {
        toast.error("Please wait for the dataset to be ready before proceeding.");
      }    } else if (step === 2) {
      // Check if at least one parameter is selected
      const hasSelectedParam = parameters.some(param => param.selected);
      
      if (!hasSelectedParam) {
        alert("Please select at least one parameter");
        return;
      }
      
      // Create the experiment using the async API
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
        
        const experimentId = uuidv4();
        const selectedParameterIds = parameters
          .filter(param => param.selected)
          .map(param => param.id);
        
        const payload = {
          experiment_name: `Quick Experiment ${new Date().toLocaleDateString()}`,
          dataset_id: datasetId,
          parameter_ids: selectedParameterIds,
          labrat_json: labratJson,
          workers: workers
        };
        
        console.log("Labrat JSON from project details:", labratJson);
        console.log("Creating quick experiment with payload:", payload);
        
        const response = await ApiClient.post(
          `/experiments-create?project_id=${projectId}&experiment_id=${experimentId}`,
          payload
        );
        
        console.log("Quick experiment creation response:", response);
        
        if (response.data && (response.data as any).status === "success") {
          toast.success("Experiment created successfully! It's now running in the background.");
          setShowCreateFlow(false);
          // Navigate to the experiment history page
          navigate(`/projects/${projectId}/evaluation/history`);
        } else {
          throw new Error("Failed to create experiment");
        }
      } catch (error) {
        console.error("Error creating quick experiment:", error);
        toast.error("Failed to create experiment. Please try again.");
      }
    }
  };

  // Handle back button click
  const handleBack = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };

  // If not in creation flow, show the empty state
  if (!showCreateFlow) {
    return (
      <div>
        <div className="empty-state mt-12">
          <div className="p-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Create a Quick Experiment</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Start by creating sample conversations to evaluate your LLM.
            </p>
            <Button
              onClick={startExperimentCreation}
              className="mt-6 gap-2 bg-primary hover:bg-orygin-red-hover text-white"
            >
              <Plus className="h-4 w-4" />
              Quick Experiment
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Render step content based on current step
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            {step === 0 && "Create Sample Conversations"}
            {step === 1 && "Review Generated Conversations"}
            {step === 2 && "Define Evaluation Parameters"}
          </h2>
          <p className="text-muted-foreground">Step {step + 1} of 3</p>
        </div>
          <Button
          variant="outline"
          onClick={() => {
            setShowCreateFlow(false);
            setStep(0);
            setDatasetId(null);
            setIsGeneratingDataset(false);
            setIsDatasetReady(false);
            setGeneratedConversations([]);
            setNumSamples(10);
            setSynthesisMethod("manual");
            setSelectedExistingDatasetId("");
            setSampleConversations([
              { id: "sample-1", messages: [{ role: "user", content: "" }, { role: "assistant", content: "" }] }
            ]);
            setBotInstructions("");
            setParameters([]);
            setNewParameter({ name: "", description: "", tolerance: "0.5" });
            setToleranceError(""); // Clear any error
            setPriceQuoted(false);
            setEstimatedPrice(null);
          }}
        >
          Cancel
        </Button>
      </div>

      {step === 0 && (
        <div className="space-y-6">
          <div className="orygin-card p-6">
            <Label className="text-base font-medium">Synthesis Method</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Choose how you want to create the dataset for evaluation
            </p>
            <RadioGroup
              value={synthesisMethod}
              onValueChange={(value: "manual" | "existing") => setSynthesisMethod(value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual-home" />
                <Label htmlFor="manual-home" className="cursor-pointer">
                  Create from manual sample conversations
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing-home" />
                <Label htmlFor="existing-home" className="cursor-pointer">
                  Extend from existing dataset
                </Label>
              </div>
            </RadioGroup>
          </div>

          {synthesisMethod === "existing" && (
            <>
              <div className="orygin-card p-6">
                <Label htmlFor="existing-dataset-home">Select Existing Dataset</Label>
                <Select
                  value={selectedExistingDatasetId}
                  onValueChange={setSelectedExistingDatasetId}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={isLoadingDatasets ? "Loading datasets..." : "Select a dataset to extend"} />
                  </SelectTrigger>
                  <SelectContent>
                    {existingDatasets.map((dataset) => (
                      <SelectItem key={dataset.id} value={dataset.id}>
                        {dataset.name} ({dataset.conversations.length} conversations)
                      </SelectItem>
                    ))}
                    {existingDatasets.length === 0 && !isLoadingDatasets && (
                      <SelectItem value="no-datasets" disabled>
                        No datasets available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  The selected dataset will be used as a base to generate new conversations
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Dataset Extension Settings</CardTitle>
                  <CardDescription>Configure how many new conversations to generate and provide additional context</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="num-samples-existing">Number of Samples</Label>
                    <Input
                      id="num-samples-existing"
                      type="number"
                      min="1"
                      max="100"
                      value={numSamples}
                      onChange={(e) => setNumSamples(parseInt(e.target.value) || 1)}
                      placeholder="Enter number of new conversations to generate"
                    />
                    <p className="text-sm text-muted-foreground">
                      Specify how many total conversations to generate based on the existing dataset (1-100)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bot-instructions-existing">Additional Information</Label>
                    <Textarea
                      id="bot-instructions-existing"
                      placeholder="e.g., 'Focus on technical questions', 'Include more edge cases', 'Generate conversations about specific topics', etc."
                      value={botInstructions}
                      onChange={(e) => setBotInstructions(e.target.value)}
                      className="min-h-20"
                    />
                    <p className="text-sm text-muted-foreground">
                      Provide additional context or instructions to guide the generation of new conversations from the existing dataset
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {synthesisMethod === "manual" && (
            <>
              <p className="text-muted-foreground">
                Provide sample conversations between a user and your chatbot. These will be used to synthesize a larger dataset for evaluation.
              </p>
              
              <div className="space-y-6">
                {sampleConversations.map((conversation, i) => (
              <div key={conversation.id} className="orygin-card p-4 relative">
                <div className="absolute top-2 right-2">
                  {sampleConversations.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeConversation(i)}
                    >
                      ×
                    </Button>
                  )}
                </div>
                
                <h3 className="text-sm font-medium mb-2">Conversation {i + 1}</h3>
                
                <div className="space-y-3">
                  {conversation.messages.map((message, j) => (
                    <div key={`${conversation.id}-${j}`} className="space-y-1">
                      <Label className="text-xs capitalize">{message.role}</Label>
                      <Textarea
                        value={message.content}
                        onChange={(e) => updateMessage(i, j, e.target.value)}
                        placeholder={`${message.role === "user" ? "User message" : "Assistant response"}...`}
                        className="min-h-24"
                      />
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addMessage(i)} 
                  className="mt-3"
                >
                  Add Message
                </Button>
              </div>
            ))}
          </div>
            <Button 
            variant="outline" 
            onClick={addConversation}
            className="w-full border-dashed"
          >
            Add Another Conversation
          </Button>
          
          <div className="mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-md">Dataset Configuration</CardTitle>
                <CardDescription>
                  Configure the dataset generation settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="num-samples">Number of Samples</Label>
                  <Input
                    id="num-samples"
                    type="number"
                    min="1"
                    max="100"
                    value={numSamples}
                    onChange={(e) => setNumSamples(parseInt(e.target.value) || 1)}
                    placeholder="Enter number of conversations to generate"
                  />
                  <p className="text-sm text-muted-foreground">
                    Specify how many conversations to generate (1-100)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bot-instructions">Bot Instructions</Label>
                  <Textarea
                    id="bot-instructions"
                    placeholder="e.g., 'The bot is supposed to answer in short paragraphs', 'The bot should provide code examples', etc."
                    value={botInstructions}
                    onChange={(e) => setBotInstructions(e.target.value)}
                    className="min-h-20"
                  />
                  <p className="text-sm text-muted-foreground">
                    Provide information about how the bot should respond to help synthesize relevant conversations
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          </>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          {!isDatasetReady ? (
            <div className="text-center py-12">
              <Card>
                <CardHeader>
                  <CardTitle>Dataset Generation in Progress</CardTitle>
                  <CardDescription>
                    Your dataset is being synthesized. This may take a few minutes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                  </div>                  
                  <Button 
                    onClick={checkDatasetStatus}
                    variant="outline"
                    className="mt-4"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Status
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">
                Review and edit the generated conversations. You can remove any that don't meet your requirements.
              </p>
              
              <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
                {generatedConversations.map((conversation, i) => (
                  <div key={conversation.id} className="orygin-card p-4 relative">
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeGeneratedConversation(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <h3 className="text-sm font-medium mb-2">
                      Generated Conversation {i + 1}
                    </h3>
                    
                    <div className="space-y-3">
                      {conversation.messages.map((message, j) => (
                        <div key={`${conversation.id}-${j}`} className="space-y-1">
                          <Label className="text-xs capitalize">{message.role}</Label>
                          <Textarea
                            value={message.content}
                            onChange={(e) => updateGeneratedMessage(i, j, e.target.value)}
                            placeholder={`${message.role === "user" ? "User message" : "Assistant response"}...`}
                            className="min-h-16"
                          />
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addGeneratedMessage(i)} 
                      className="mt-3"
                    >
                      Add Message
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}{step === 2 && (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Select parameters to evaluate your conversations. You can also create new parameters for your specific evaluation needs.
          </p>
          
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Create New Parameter Card */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Parameter</CardTitle>
                <CardDescription>
                  Define a new evaluation parameter for this experiment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-param-name">Parameter Name</Label>
                  <Input
                    id="new-param-name"
                    value={newParameter.name}
                    onChange={(e) => setNewParameter({ ...newParameter, name: e.target.value })}
                    placeholder="e.g., Response Quality"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-param-description">Description</Label>
                  <Textarea
                    id="new-param-description"
                    value={newParameter.description}
                    onChange={(e) => setNewParameter({ ...newParameter, description: e.target.value })}
                    placeholder="Describe what this parameter evaluates..."
                    className="min-h-24"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-param-tolerance">Tolerance</Label>
                  <Input
                    id="new-param-tolerance"
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
                  Create Parameter
                </Button>
              </CardFooter>
            </Card>

            {/* Select Parameters Card */}
            <Card>
              <CardHeader>
                <CardTitle>Available Parameters</CardTitle>
                <CardDescription>
                  {isLoadingParameters ? "Loading parameters..." : `Select from ${parameters.length} available parameter${parameters.length !== 1 ? 's' : ''}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-80 overflow-y-auto space-y-4">
                {isLoadingParameters ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : parameters.length > 0 ? (
                  parameters.map((param, i) => (
                    <div key={param.id} className="flex items-start space-x-3 p-3 border border-border rounded-md">
                      {editingParameterId === param.id ? (
                        // Edit Mode
                        <div className="flex-1 space-y-3">
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
                              onChange={(e) => handleEditParameterToleranceChange(e.target.value)}
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
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleEditParameterCancel}
                              disabled={isSavingEdit}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={saveEditedParameter}
                              disabled={isSavingEdit || !editForm.name.trim() || !editForm.description.trim()}
                              className="bg-primary hover:bg-orygin-red-hover text-white"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              {isSavingEdit ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <>
                          <Checkbox
                            id={param.id}
                            checked={param.selected}
                            onCheckedChange={() => toggleParameter(i)}
                          />
                          <div className="flex-1 space-y-1">
                            <Label
                              htmlFor={param.id}
                              className="font-medium cursor-pointer"
                            >
                              {param.name}
                            </Label>
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
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditParameterStart(param)}
                              className="h-6 w-6 text-muted-foreground hover:text-blue-600"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span className="sr-only">Edit parameter</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeParameter(i)}
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span className="sr-only">Remove parameter</span>
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 border border-dashed border-border rounded-md">
                    <p className="text-muted-foreground">
                      No parameters available. Create your first parameter using the form on the left.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Selected Parameters Summary */}
          {/* {parameters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Parameters</CardTitle>
                <CardDescription>
                  {parameters.filter(p => p.selected).length} parameter{parameters.filter(p => p.selected).length !== 1 ? 's' : ''} selected for evaluation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {parameters.filter(p => p.selected).length > 0 ? (
                  <div className="space-y-2">
                    {parameters.filter(p => p.selected).map((param) => (
                      <div key={param.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <span className="font-medium">{param.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleParameter(parameters.findIndex(p => p.id === param.id))}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No parameters selected</p>
                )}
              </CardContent>
            </Card>
          )} */}
          
          {/* Estimated Price Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Experiment Configuration</CardTitle>
              <CardDescription>
                Configure additional settings for your experiment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workers">Number of Workers (Optional)</Label>
                  <Input
                    id="workers"
                    type="number"
                    min="1"
                    max="100"
                    value={workers}
                    onChange={(e) => setWorkers(parseInt(e.target.value) || 10)}
                    placeholder="10"
                  />
                  <p className="text-sm text-muted-foreground">
                    Number of parallel threads to use for running this experiment. Default is 10.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estimated Price Section */}
          <Card className="mt-6">
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
                  </div>                ) : (
                  <div className="flex justify-center">
                    <Button 
                      onClick={calculateCost}
                      disabled={isCalculatingCost || !datasetId || parameters.filter(p => p.selected).length === 0}
                      className="bg-primary hover:bg-orygin-red-hover text-white"
                    >
                      {isCalculatingCost ? "Calculating..." : "Estimate your cost"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
        <div className="flex justify-between py-4">
        {step > 0 ? (
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
        ) : (
          <div></div>
        )}        <Button
          onClick={handleNext}
          className={
            (step === 0 && isGeneratingDataset) || 
            (step === 1 && !isDatasetReady) || 
            (step === 2 && !priceQuoted)
            ? "bg-muted text-muted-foreground cursor-not-allowed" 
            : "bg-primary hover:bg-orygin-red-hover text-white"
          }
          disabled={
            (step === 0 && isGeneratingDataset) || 
            (step === 1 && !isDatasetReady) || 
            (step === 2 && !priceQuoted)
          }
        >
          {step === 0 && isGeneratingDataset 
            ? "Generating..." 
            : step === 2 
            ? "Create Experiment" 
            : "Next"}
        </Button>
      </div>

      {/* Delete Parameter Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the parameter
              and remove it from your project.
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

export default Home;
