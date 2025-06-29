
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Upload, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ApiClient } from "@/lib/api-client";
import { v4 as uuidv4 } from 'uuid';

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  conversation: Message[];
}

const UploadDataset: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  
  const [datasetName, setDatasetName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [jsonContent, setJsonContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [uploadError, setUploadError] = useState("");

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setUploadError("");
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setJsonContent(content);
        
        // Parse the JSON to validate
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
          setUploadError("File must contain an array of conversations");
          return;
        }
        
        // Validate the structure
        const isValid = parsed.every((convo: any) => 
          convo.id && 
          Array.isArray(convo.conversation) && 
          convo.conversation.every((msg: any) => 
            typeof msg.role === 'string' && 
            (msg.role === 'user' || msg.role === 'assistant') && 
            typeof msg.content === 'string'
          )
        );
        
        if (!isValid) {
          setUploadError("Invalid conversation format");
          return;
        }
        
        setConversations(parsed);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        setUploadError("Invalid JSON format");
      }
    };
    
    reader.readAsText(file);
  };

  // Handle JSON input change
  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setJsonContent(content);
    setUploadError("");
    
    try {
      if (!content.trim()) {
        setConversations([]);
        return;
      }
      
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) {
        setUploadError("Content must be an array of conversations");
        return;
      }
      
      // Validate the structure
      const isValid = parsed.every((convo: any) => 
        convo.id && 
        Array.isArray(convo.conversation) && 
        convo.conversation.every((msg: any) => 
          typeof msg.role === 'string' && 
          (msg.role === 'user' || msg.role === 'assistant') && 
          typeof msg.content === 'string'
        )
      );
      
      if (!isValid) {
        setUploadError("Invalid conversation format");
        return;
      }
      
      setConversations(parsed);
    } catch (error) {
      setUploadError("Invalid JSON format");
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!datasetName.trim()) {
      toast.error("Please enter a dataset name");
      return;
    }
    
    if (conversations.length === 0) {
      toast.error("Please upload valid conversation data");
      return;
    }
    
    setIsLoading(true);
      try {
      // In a real app, this would call the API to upload the dataset
      // await new Promise(resolve => setTimeout(resolve, 1000));
      const datasetData = {
        "dataset": conversations, 
        "project_id": projectId, 
        "dataset_name": datasetName
      }
      console.log("Uploading dataset:", datasetData);
      const response = await ApiClient.post(`/datasets-create?dataset_id=${uuidv4()}`,datasetData)
      console.log("Dataset upload response:", response);

      toast.success(`Dataset "${datasetName}" uploaded successfully`);
      
      // Reset the form
      setDatasetName("");
      setJsonContent("");
      setFileName("");
      setConversations([]);
    } catch (error) {
      console.error("Error uploading dataset:", error);
      toast.error("Failed to upload dataset");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Upload Dataset</h2>
        <p className="text-muted-foreground mt-1">
          Upload a JSON file containing conversation data
        </p>
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
        
        <div className="orygin-card p-6">
          <Label>Upload JSON File</Label>
          <div className="mt-2">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JSON file (.json)
                </p>
              </label>
              
              {fileName && (
                <div className="mt-4 flex items-center justify-center text-sm">
                  <FileText className="h-4 w-4 mr-2 text-primary" />
                  {fileName}
                </div>
              )}
              
              {uploadError && (
                <p className="mt-2 text-sm text-destructive">{uploadError}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="orygin-card p-6">
          <Label htmlFor="json-content">Or Paste JSON Content</Label>
          <Textarea
            id="json-content"
            value={jsonContent}
            onChange={handleJsonChange}
            placeholder='[{"id": "23811", "conversation": [{"role": "user", "content": "Hello, how are you?"}, {"role": "assistant", "content": "I am doing well, thank you for asking!"}]}]'
            className="mt-1 min-h-40 font-mono text-sm"
          />
          {uploadError && (
            <p className="mt-2 text-sm text-destructive">{uploadError}</p>
          )}
          
          {conversations.length > 0 && !uploadError && (
            <p className="mt-2 text-sm text-green-500">
              {conversations.length} valid conversation{conversations.length !== 1 && "s"} found
            </p>
          )}
        </div>
        
        <div className="flex justify-end space-x-4">          <Button 
            variant="outline"
            type="button"
            onClick={() => {
              setDatasetName("");
              setJsonContent("");
              setFileName("");
              setConversations([]);
              setUploadError("");
            }}
          >
            Reset
          </Button>
          <Button 
            type="submit"
            className="bg-primary hover:bg-orygin-red-hover text-white"
            disabled={isLoading || conversations.length === 0}
          >
            {isLoading ? "Uploading..." : "Upload Dataset"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UploadDataset;
