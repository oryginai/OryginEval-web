import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"; // Added ChevronDown and ChevronRight
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Types for the quick experiment flow
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  messages: Message[];
}

// Enhanced parameter interface for Home page
interface HomeParameter {
  id: string;
  name: string;
  description: string;
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
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [sampleConversations, setSampleConversations] = useState<Conversation[]>([
    { id: "sample-1", messages: [{ role: "user", content: "" }, { role: "assistant", content: "" }] }
  ]);
  const [botInstructions, setBotInstructions] = useState("");
  const [parameters, setParameters] = useState<HomeParameter[]>([]);
  const [isLoadingParameters, setIsLoadingParameters] = useState(false);  const [newParameter, setNewParameter] = useState({
    name: "",
    description: "",
  });

  // Fetch parameters when entering step 2
  useEffect(() => {
    if (step === 2 && projectId) {
      fetchParameters();
    }
  }, [step, projectId]);

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
  };  const startExperimentCreation = () => {
    setStep(0);
    setShowCreateFlow(true);
    setBotInstructions("");
    setPriceQuoted(false);
    setEstimatedPrice(null);
    setIsCalculatingCost(false);
    setDatasetId(null);
    setSampleConversations([
      { id: "sample-1", messages: [{ role: "user", content: "" }, { role: "assistant", content: "" }] }
    ]);
    setParameters([]); // Reset parameters - they will be fetched when step 2 is reached
    setNewParameter({ name: "", description: "" });
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

  // Remove a conversation
  const removeConversation = (index: number) => {
    const updatedConversations = sampleConversations.filter((_, i) => i !== index);
    setSampleConversations(updatedConversations);
  };  // Add a new parameter
  const addParameter = async () => {
    if (!newParameter.name.trim() || !newParameter.description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const parameterBody = {
        parameter_name: newParameter.name,
        parameter_description: newParameter.description,
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
          selected: true,
          isExpanded: true
        };
        setParameters([...parameters, newParam]);
        setNewParameter({ name: "", description: "" });
        toast.success("Parameter created successfully");
      } else {
        console.error("API Error:", response.error);
        toast.error("Failed to create parameter");
      }
    } catch (error) {
      console.error("Error creating parameter:", error);
      toast.error("Failed to create parameter");
    }  };

  // Remove a parameter
  const removeParameter = (index: number) => {
    const updatedParameters = parameters.filter((_, i) => i !== index);
    setParameters(updatedParameters);
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
  const handleNext = () => {
    // In a real app, this would call the API to synthesize a dataset based on the samples
    if (step === 0) {
      // Validate sample conversations
      const isValid = sampleConversations.every(convo => 
        convo.messages.every(msg => msg.content.trim().length > 0)
      );
      
      if (!isValid) {
        alert("Please fill in all conversation messages");
        return;
      }
        // Simulate API call to generate more conversations
      setTimeout(() => {
        // Add some mock generated conversations
        // In a real implementation, we would pass botInstructions to the API
        console.log("Bot instructions:", botInstructions);
        setSampleConversations([
          ...sampleConversations,
          ...mockData.createMockConversations(5)
        ]);
        setStep(1);
      }, 500);    } else if (step === 1) {
      // Validate selected conversations and simulate dataset creation
      // In a real app, this would call the API to create a dataset from the conversations
      const generatedDatasetId = uuidv4();
      setDatasetId(generatedDatasetId);
      console.log("Generated dataset ID:", generatedDatasetId);
      setStep(2);} else if (step === 2) {
      // Check if at least one parameter is selected
      const hasSelectedParam = parameters.some(param => param.selected);
      
      if (!hasSelectedParam) {
        alert("Please select at least one parameter");
        return;
      }
      
      // In a real app, this would create the experiment and redirect to results
      setTimeout(() => {
        setShowCreateFlow(false);
        // Navigate to the reports page with a mock experiment ID
        navigate(`/projects/${currentProject?.id}/report`);
      }, 500);
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
          onClick={() => setShowCreateFlow(false)}
        >
          Cancel
        </Button>
      </div>

      {step === 0 && (
        <div className="space-y-6">
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
                <CardTitle className="text-md">Bot Instructions</CardTitle>
                <CardDescription>
                  Provide information about how the bot should respond to help synthesize relevant conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="e.g., 'The bot is supposed to answer in short paragraphs', 'The bot should provide code examples', etc."
                  value={botInstructions}
                  onChange={(e) => setBotInstructions(e.target.value)}
                  className="min-h-20"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Review and edit the generated conversations. You can remove any that don't meet your requirements.
          </p>
          
          <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
            {sampleConversations.map((conversation, i) => (
              <div key={conversation.id} className="orygin-card p-4 relative">
                <div className="absolute top-2 right-2 flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeConversation(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <h3 className="text-sm font-medium mb-2">
                  {i < sampleConversations.length - mockData.createMockConversations(5).length ? 
                    "Sample Conversation" : "Generated Conversation"} {i + 1}
                </h3>
                
                <div className="space-y-3">
                  {conversation.messages.map((message, j) => (
                    <div key={`${conversation.id}-${j}`} className="space-y-1">
                      <Label className="text-xs capitalize">{message.role}</Label>
                      <Textarea
                        value={message.content}
                        onChange={(e) => updateMessage(i, j, e.target.value)}
                        placeholder={`${message.role === "user" ? "User message" : "Assistant response"}...`}
                        className="min-h-16"
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
        </div>
      )}        {step === 2 && (
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
                        <p className="text-sm text-muted-foreground">
                          {param.description}
                        </p>
                      </div>
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
        )}
        <Button
          onClick={handleNext}
          className={step === 2 && !priceQuoted 
            ? "bg-muted text-muted-foreground cursor-not-allowed" 
            : "bg-primary hover:bg-orygin-red-hover text-white"
          }
          disabled={step === 2 && !priceQuoted}
        >
          {step === 2 ? "Create Experiment" : "Next"}
        </Button>
      </div>
    </div>
  );
};

export default Home;
