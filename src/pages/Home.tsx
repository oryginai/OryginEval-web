
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProject } from "@/contexts/ProjectContext";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [sampleConversations, setSampleConversations] = useState<Conversation[]>([
    { id: "sample-1", messages: [{ role: "user", content: "" }, { role: "assistant", content: "" }] }
  ]);
  const [parameters, setParameters] = useState([
    { id: "param-1", name: "Response Quality", description: "Evaluates the overall quality of the response" }
  ]);

  // Start the experiment creation flow
  const startExperimentCreation = () => {
    setStep(0);
    setShowCreateFlow(true);
    setSampleConversations([
      { id: "sample-1", messages: [{ role: "user", content: "" }, { role: "assistant", content: "" }] }
    ]);
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
    setParameters([
      ...parameters,
      { id: `param-${parameters.length + 1}`, name: "", description: "" }
    ]);
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
        setSampleConversations([
          ...sampleConversations,
          ...mockData.createMockConversations(5)
        ]);
        setStep(1);
      }, 500);
    } else if (step === 1) {
      // Validate selected conversations (all are selected by default)
      setStep(2);
    } else if (step === 2) {
      // Validate parameters
      const isValid = parameters.every(param => 
        param.name.trim().length > 0 && param.description.trim().length > 0
      );
      
      if (!isValid) {
        alert("Please fill in all parameter names and descriptions");
        return;
      }
      
      // In a real app, this would create the experiment and redirect to results
      setTimeout(() => {
        setShowCreateFlow(false);
        // Navigate to the dashboard with a mock experiment ID
        navigate(`/projects/${currentProject?.id}/dashboard/exp_1`);
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
            Define the parameters that will be used to evaluate the conversations. Each parameter should have a name and description.
          </p>
          
          <div className="space-y-4">
            {parameters.map((param, i) => (
              <div key={param.id} className="orygin-card p-4 relative">
                <div className="absolute top-2 right-2">
                  {parameters.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeParameter(i)}
                    >
                      ×
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`param-name-${i}`}>Parameter Name</Label>
                    <Input
                      id={`param-name-${i}`}
                      value={param.name}
                      onChange={(e) => updateParameter(i, "name", e.target.value)}
                      placeholder="e.g., Response Quality"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`param-desc-${i}`}>Description</Label>
                    <Textarea
                      id={`param-desc-${i}`}
                      value={param.description}
                      onChange={(e) => updateParameter(i, "description", e.target.value)}
                      placeholder="Describe what this parameter evaluates..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            onClick={addParameter}
            className="w-full border-dashed"
          >
            Add Another Parameter
          </Button>
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
          className="bg-primary hover:bg-orygin-red-hover text-white"
        >
          {step === 2 ? "Create Experiment" : "Next"}
        </Button>
      </div>
    </div>
  );
};

export default Home;
