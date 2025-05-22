import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"; // Added ChevronDown and ChevronRight
import { Button } from "@/components/ui/button";
import { useProject } from "@/contexts/ProjectContext";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { mockData } from "@/services/api";
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

const Home: React.FC = () => {
  const { currentProject } = useProject();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [priceQuoted, setPriceQuoted] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [sampleConversations, setSampleConversations] = useState<Conversation[]>([
    { id: "sample-1", messages: [{ role: "user", content: "" }, { role: "assistant", content: "" }] }
  ]);
  const [botInstructions, setBotInstructions] = useState("");
  const initialParameters = [
    {
      id: "param-1",
      name: "Semantic Similarity",
      description: "Measures how closely the assistant\\\'s response matches the intended meaning or context of the user\\\'s message.",
      selected: true,
      isExpanded: false
    },
    {
      id: "param-2",
      name: "Hallucination",
      description: "Checks if the assistant generates information that is not supported by the input or is factually incorrect.",
      selected: true,
      isExpanded: false
    },
    {
      id: "param-3",
      name: "Toxicity",
      description: "Evaluates whether the assistant\\\'s response contains harmful, offensive, or inappropriate language.",
      selected: true,
      isExpanded: false
    },
    {
      id: "param-4", 
      name: "Accuracy",
      description: "Measures the factual correctness and relevance of the information provided.",
      selected: true, 
      isExpanded: true // "Accuracy" is expanded by default
    }
  ];
  const [parameters, setParameters] = useState(initialParameters);

  const startExperimentCreation = () => {
    setStep(0);
    setShowCreateFlow(true);
    setBotInstructions("");
    setPriceQuoted(false);
    setEstimatedPrice(null);
    setSampleConversations([
      { id: "sample-1", messages: [{ role: "user", content: "" }, { role: "assistant", content: "" }] }
    ]);
    setParameters(initialParameters); // Reset parameters, "Accuracy" will be expanded as per initialParameters
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
  };
  // Add a new parameter
  const addParameter = () => {
    const newParamId = `param-${parameters.length + 1}`;
    setParameters(
      parameters.map(p => ({ ...p, isExpanded: false })).concat([
        { 
          id: newParamId, 
          name: "", 
          description: "", 
          selected: true, 
          isExpanded: true // New parameter is expanded by default
        }
      ])
    );
  };

  // Update a parameter
  const updateParameter = (index: number, field: "name" | "description", value: string) => {
    const updatedParameters = [...parameters];
    updatedParameters[index][field] = value;
    setParameters(updatedParameters);
  };
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
    const isCustomParameter = index >= 3;
    if (!isCustomParameter) return; // Do nothing for default parameters

    const isCurrentlyExpanded = parameters[index].isExpanded;

    setParameters(parameters.map((param, i) => {
      if (i < 3) return param; // Default parameters are untouched

      if (i === index) {
        return { ...param, isExpanded: !param.isExpanded };
      } else {
        // If we are expanding the current one, collapse others.
        // If we are collapsing the current one, others remain as they are.
        return { ...param, isExpanded: !isCurrentlyExpanded ? false : param.isExpanded };
      }
    }));
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
      }, 500);
    } else if (step === 1) {
      // Validate selected conversations (all are selected by default)
      setStep(2);    } else if (step === 2) {
      // Validate parameters
      const customParameters = parameters.slice(3); // Skip the default parameters
      const isValid = customParameters.every(param => 
        param.name.trim().length > 0 && param.description.trim().length > 0
      );
      
      // Check if at least one parameter is selected
      const hasSelectedParam = parameters.some(param => param.selected);
      
      if (!isValid) {
        alert("Please fill in all parameter names and descriptions");
        return;
      }
      
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
      )}
        {step === 2 && (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Define the parameters that will be used to evaluate the conversations. Select which parameters you want to include in this experiment.
          </p>
          
          <Card>
            <CardHeader>
              <CardTitle>Select Parameters</CardTitle>
              <CardDescription>
                Choose the parameters to evaluate against
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Default parameters (first 3) cannot be edited or removed */}
                {parameters.slice(0, 3).map((param, i) => (
                  <div
                    key={param.id}
                    className="flex items-start space-x-3 py-2"
                  >
                    <Checkbox
                      id={param.id}
                      checked={param.selected}
                      onCheckedChange={() => toggleParameter(i)}
                      disabled={true} // Default parameters are always selected
                    />
                    <div className="space-y-1">
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
                  </div>
                ))}
                
                {/* Custom parameters (after the first 3) can be edited and removed */}
                {parameters.slice(3).map((param, i) => {
                  const actualIndex = i + 3;
                  // Determine if this parameter is the one currently being edited (last one or explicitly expanded)
                  const isCurrentlyEditing = param.isExpanded;

                  return (
                    <div key={param.id} className={`orygin-card p-4 relative ${isCurrentlyEditing ? 'expanded-parameter' : 'collapsed-parameter'}`}>
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={param.id}
                          checked={param.selected}
                          onCheckedChange={() => toggleParameter(actualIndex)}
                        />
                        <div className="flex-1 space-y-1 cursor-pointer" onClick={() => toggleParameterExpansion(actualIndex)}>
                          <div className="flex justify-between items-center">
                            <Label
                              htmlFor={param.id} // Keep this for accessibility, though click is on div
                              className="font-medium"
                            >
                              {param.name || "New Parameter"}
                            </Label>
                            {/* Icon to indicate expandable/collapsible state */}
                            {isCurrentlyEditing ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          {isCurrentlyEditing && (
                            <p className="text-sm text-muted-foreground">
                              {param.description || "(No description)"}
                            </p>
                          )}
                        </div>
                        {isCurrentlyEditing && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive self-start"
                            onClick={(e) => { e.stopPropagation(); removeParameter(actualIndex); }}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                      {isCurrentlyEditing && (
                        <div className="mt-3 space-y-3 pl-7"> {/* Indent content when expanded */}
                          <div>
                            <Label htmlFor={`param-name-${actualIndex}`}>Parameter Name</Label>
                            <Input
                              id={`param-name-${actualIndex}`}
                              value={param.name}
                              onChange={(e) => updateParameter(actualIndex, "name", e.target.value)}
                              placeholder="e.g., Response Quality"
                              className="mt-1"
                              onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to toggle expansion
                            />
                          </div>
                          <div>
                            <Label htmlFor={`param-desc-${actualIndex}`}>Description</Label>
                            <Textarea
                              id={`param-desc-${actualIndex}`}
                              value={param.description}
                              onChange={(e) => updateParameter(actualIndex, "description", e.target.value)}
                              placeholder="Describe what this parameter evaluates..."
                              className="mt-1"
                              onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to toggle expansion
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
                <Button 
                variant="outline" 
                onClick={addParameter}
                className="w-full border-dashed mt-4"
              >
                Add Another Parameter
              </Button>
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
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <Button 
                      onClick={() => {
                        setEstimatedPrice(100);
                        setPriceQuoted(true);
                      }}
                      className="bg-primary hover:bg-orygin-red-hover text-white"
                    >
                      Estimate your cost
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
