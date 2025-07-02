
import React, { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Types for the dataset
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
  const [numSamples, setNumSamples] = useState(10);
  
  // New states for dataset selection
  const [synthesisMethod, setSynthesisMethod] = useState<"manual" | "existing">("manual");
  const [existingDatasets, setExistingDatasets] = useState<Dataset[]>([]);
  const [selectedExistingDatasetId, setSelectedExistingDatasetId] = useState<string>("");
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
  
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
    // Fetch existing datasets when showing the form
    fetchExistingDatasets();
  };

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
        })),
        dataset_name: datasetName
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
      navigate(`/projects/${projectId}/datasets`);
      setIsLoading(false);
      
      // Then create the final dataset entry
      // const datasetData = {
      //   dataset: generatedConversations.map(convo => ({
      //     id: convo.id,
      //     conversation: convo.messages
      //   })),
      //   project_id: projectId,
      //   dataset_name: datasetName
      // };

      // const response = await ApiClient.post(`/datasets-create?dataset_id=${datasetId}`, datasetData);
      // console.log("Dataset save response:", response);

    //   if (response.data || !response.error) {
    //     toast.success(`Dataset "${datasetName}" saved successfully`);
    //     navigate(`/projects/${projectId}/datasets`);
    //   } else {
    //     throw new Error("Failed to save dataset");
    //   }
    } catch (error) {
      console.error("Error saving dataset:", error);
    //   toast.error("Failed to save dataset");
    // } finally {
    //   setIsLoading(false);
    }
  };  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!datasetName.trim()) {
      toast.error("Please enter a dataset name");
      return;
    }
    
    // Validate based on synthesis method
    if (synthesisMethod === "manual") {
      const invalidConversation = sampleConversations.find(convo => 
        convo.messages.some(msg => !msg.content.trim())
      );
      
      if (invalidConversation) {
        toast.error("Please fill in all conversation messages");
        return;
      }
    } else if (synthesisMethod === "existing") {
      if (!selectedExistingDatasetId) {
        toast.error("Please select an existing dataset");
        return;
      }
    }
    
    setIsLoading(true);
    
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
            extra_info: extraInfo,
            dataset_name: datasetName
          }
        );
      } else {
        // Call the datasets-extend API for existing dataset method
        response = await ApiClient.post(
          `/datasets-extend?dataset_id=${selectedExistingDatasetId}`,
          {
            num_samples: numSamples,
            extra_info: extraInfo,
            project_id: projectId,
            dataset_id_new: uuidv4()
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
            setNumSamples(10);
            setSynthesisMethod("manual");
            setSelectedExistingDatasetId("");
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

          <div className="orygin-card p-6">
            <Label className="text-base font-medium">Synthesis Method</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Choose how you want to create the new dataset
            </p>
            <RadioGroup
              value={synthesisMethod}
              onValueChange={(value: "manual" | "existing") => setSynthesisMethod(value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual" className="cursor-pointer">
                  Create from manual sample conversations
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" />
                <Label htmlFor="existing" className="cursor-pointer">
                  Extend from existing dataset
                </Label>
              </div>
            </RadioGroup>
          </div>

          {synthesisMethod === "existing" && (
            <>
              <div className="orygin-card p-6">
                <Label htmlFor="existing-dataset">Select Existing Dataset</Label>
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
                    <Label htmlFor="num-samples-existing">Number of New Samples</Label>
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
                      Specify how many new conversations to generate based on the existing dataset (1-100)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="extra-info-existing">Additional Information</Label>
                    <Textarea
                      id="extra-info-existing"
                      value={extraInfo}
                      onChange={(e) => setExtraInfo(e.target.value)}
                      placeholder="e.g., 'Focus on technical questions', 'Include more edge cases', 'Generate conversations about specific topics', etc."
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

            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-md">Dataset Configuration</CardTitle>
                <CardDescription>
                  Configure the dataset generation settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="num-samples-manual">Number of Samples</Label>
                  <Input
                    id="num-samples-manual"
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
                  <Label htmlFor="extra-info-manual">Additional Instructions</Label>
                  <Textarea
                    id="extra-info-manual"
                    value={extraInfo}
                    onChange={(e) => setExtraInfo(e.target.value)}
                    placeholder="e.g., 'The bot is supposed to answer in short paragraphs', 'The bot should provide code examples', etc."
                    className="min-h-20"
                  />
                  <p className="text-sm text-muted-foreground">
                    Provide information about how the bot should respond to help synthesize relevant conversations
                  </p>
                </div>
              </CardContent>
            </Card>
            </div>
          )}
          
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
