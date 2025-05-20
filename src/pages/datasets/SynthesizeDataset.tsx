
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { Plus, Trash2 } from "lucide-react";

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

  // Handle form submission
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
      // In a real app, this would call the API to synthesize the dataset
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Dataset synthesized successfully");
      navigate(`/projects/${projectId}/datasets`);
    } catch (error) {
      console.error("Error synthesizing dataset:", error);
      toast.error("Failed to synthesize dataset");
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
            Create sample conversations that will be used to generate a larger dataset
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
        
        <div className="flex justify-end space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setShowForm(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            className="bg-primary hover:bg-orygin-red-hover text-white"
            disabled={isLoading}
          >
            {isLoading ? "Synthesizing..." : "Synthesize Dataset"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SynthesizeDataset;
