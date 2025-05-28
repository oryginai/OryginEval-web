
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClient } from "@/lib/api-client";
import { v4 as uuidv4 } from 'uuid';

// Types for the dataset
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  messages: Message[];
}

const SynthesizeDataset: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [datasetName, setDatasetName] = useState("");
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [step, setStep] = useState(0); // 0: form, 1: review generated
  const [isDatasetReady, setIsDatasetReady] = useState(false);
  const [generatedConversations, setGeneratedConversations] = useState<Conversation[]>([]);
  const [extraInfo, setExtraInfo] = useState("");
  const [sampleConversations, setSampleConversations] = useState<Conversation[]>([
    { 
      id: `sample-${Date.now()}`, 
      messages: [
        { role: "user", content: "" }, 
        { role: "assistant", content: "" }
      ] 
    }
  ]);

  const startCreation = () => {
    setShowForm(true);
  };

  // Add a new conversation sample
  const addConversation = () => {
    setSampleConversations([
      ...sampleConversations,
      { 
        id: `sample-${Date.now()}`, 
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
  // Remove a message
  const removeMessage = (conversationIndex: number, messageIndex: number) => {
    const updatedConversations = [...sampleConversations];
    // Ensure we always keep at least one message
    if (updatedConversations[conversationIndex].messages.length > 1) {
      updatedConversations[conversationIndex].messages.splice(messageIndex, 1);
      setSampleConversations(updatedConversations);
    }
  };

  // Update a message in generated conversations
  const updateGeneratedMessage = (conversationIndex: number, messageIndex: number, content: string) => {
    const updatedConversations = [...generatedConversations];
    updatedConversations[conversationIndex].messages[messageIndex].content = content;
    setGeneratedConversations(updatedConversations);
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

  // Remove a generated conversation
  const removeGeneratedConversation = (index: number) => {
    const updatedConversations = generatedConversations.filter((_, i) => i !== index);
    setGeneratedConversations(updatedConversations);
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
      }    } catch (error) {
      console.error("Error checking dataset status:", error);
      toast.error("Failed to check dataset status.");
    }
  };

  // Save edits to the dataset (for when going back or making updates)
  const saveEdits = async () => {
    if (!datasetId || generatedConversations.length === 0) {
      return true; // No edits to save
    }

    try {
      // Prepare the dataset in the correct format for the update endpoint
      const datasetData = {
        dataset: generatedConversations.map(convo => ({
          id: convo.id,
          conversation: convo.messages
        }))
      };

      console.log("Updating dataset with edited conversations:", datasetData);
      
      const response = await ApiClient.post(`/datasets-update?dataset_id=${datasetId}`, datasetData);
      console.log("Dataset update response:", response);

      if (response.data && (response.data as any).status === "success") {
        toast.success("Conversation edits saved!");
        return true;
      } else {
        toast.error("Failed to save conversation edits.");
        return false;
      }
    } catch (error) {
      console.error("Error updating dataset:", error);
      toast.error("Failed to save conversation edits.");
      return false;
    }
  };

  // Handle going back to step 0 (save edits first)
  const handleBack = async () => {
    if (generatedConversations.length > 0) {
      const saved = await saveEdits();
      if (!saved) {
        // If saving failed, ask user if they want to proceed anyway
        const proceed = confirm("Failed to save your edits. Do you want to go back anyway? Your changes will be lost.");
        if (!proceed) return;
      }
    }
    setStep(0);
  };
  // Save the final dataset
  const saveDataset = async () => {
    if (!datasetId || generatedConversations.length === 0) {
      toast.error("No dataset to save");
      return;
    }

    setIsLoading(true);
    
    try {
      // First, save any edits to the temporary dataset
      await saveEdits();
      
      // Then create the final dataset entry
      const datasetData = {
        dataset: generatedConversations.map(convo => ({
          id: convo.id,
          conversation: convo.messages
        })),
        project_id: projectId,
        name: datasetName
      };

      const response = await ApiClient.post(`/datasets-create?dataset_id=${datasetId}`, datasetData);
      console.log("Dataset save response:", response);

      if (response.data || !response.error) {
        toast.success(`Dataset "${datasetName}" saved successfully`);
        navigate(`/projects/${projectId}/datasets`);
      } else {
        throw new Error("Failed to save dataset");
      }
    } catch (error) {
      console.error("Error saving dataset:", error);
      toast.error("Failed to save dataset");
    } finally {
      setIsLoading(false);
    }
  };// Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!datasetName.trim()) {
      toast.error("Please enter a dataset name");
      return;
    }
    
    const invalidConversation = sampleConversations.find(convo => 
      convo.messages.some(msg => !msg.content.trim())
    );
    
    if (invalidConversation) {
      toast.error("Please fill in all conversation messages");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Generate a new dataset ID
      const newDatasetId = uuidv4();
      
      // Prepare the sample data in the correct format
      const sampleData = sampleConversations.map(convo => ({
        id: convo.id,
        conversation: convo.messages
      }));

      // Call the datasets-generate API
      const response = await ApiClient.post(
        `/datasets-generate?dataset_id=${newDatasetId}&project_id=${projectId}`,
        {
          sample_data: sampleData,
          num_samples: 3,
          extra_info: extraInfo
        }
      );

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
      setIsLoading(false);
    }
  };

  // If we're not showing the form yet, show the empty state
  if (!showForm) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold">Synthesize Dataset</h2>
          <p className="text-muted-foreground mt-1">
            Create sample conversations that will be used to generate a larger dataset
          </p>
        </div>
        
        <div className="empty-state mt-12">
          <div className="p-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Create New Dataset</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Start by creating sample conversations that will be used to synthesize a larger dataset
            </p>
            <Button
              onClick={startCreation}
              className="mt-6 gap-2 bg-primary hover:bg-orygin-red-hover text-white"
            >
              <Plus className="h-4 w-4" />
              Create Dataset
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Synthesize Dataset</h2>
          <p className="text-muted-foreground mt-1">
            {step === 0 
              ? "Create sample conversations that will be used to generate a larger dataset"
              : "Review and finalize the generated conversations"
            }
          </p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => {
            setShowForm(false);
            setStep(0);
            setDatasetId(null);
            setIsDatasetReady(false);
            setGeneratedConversations([]);
            setDatasetName("");
            setExtraInfo("");
            setSampleConversations([
              { 
                id: `sample-${Date.now()}`, 
                messages: [
                  { role: "user", content: "" }, 
                  { role: "assistant", content: "" }
                ] 
              }
            ]);
          }}
        >
          Cancel
        </Button>
      </div>
      
      {step === 0 && (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="orygin-card p-6">
            <Label htmlFor="dataset-name">Dataset Name</Label>
            <Input
              id="dataset-name"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              placeholder="Enter dataset name"
              className="mt-1"
            />
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Sample Conversations</h3>
            </div>
            
            {sampleConversations.map((conversation, i) => (
              <div key={conversation.id} className="orygin-card p-6 relative">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Conversation {i + 1}</h4>
                  {sampleConversations.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeConversation(i)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove conversation</span>
                    </Button>
                  )}
                </div>
                
                <div className="space-y-6">
                  {conversation.messages.map((message, j) => (
                    <div key={`${conversation.id}-${j}`} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm capitalize">{message.role}</Label>
                        {conversation.messages.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => removeMessage(i, j)}
                            type="button"
                          >
                            <span className="sr-only">Remove message</span>
                            ×
                          </Button>
                        )}
                      </div>
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
                  className="mt-4"
                  type="button"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Message
                </Button>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              onClick={addConversation}
              className="w-full border-dashed"
              type="button"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Another Conversation
            </Button>
          </div>

          <div className="orygin-card p-6">
            <Label htmlFor="extra-info">Additional Instructions</Label>
            <Textarea
              id="extra-info"
              value={extraInfo}
              onChange={(e) => setExtraInfo(e.target.value)}
              placeholder="Provide any additional context or instructions for generating conversations..."
              className="mt-1 min-h-20"
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button 
              type="submit"
              className="bg-primary hover:bg-orygin-red-hover text-white"
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate Dataset"}
            </Button>
          </div>
        </form>
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
              </div>              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline"
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Button 
                  onClick={saveDataset}
                  className="bg-primary hover:bg-orygin-red-hover text-white"
                  disabled={isLoading || generatedConversations.length === 0}
                >
                  {isLoading ? "Saving..." : "Save Dataset"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SynthesizeDataset;
