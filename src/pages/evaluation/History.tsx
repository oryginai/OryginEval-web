
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, ExternalLink, Trash2, Check, Clock, AlertTriangle, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { ApiClient } from "@/lib/api-client";

// Interface for experiment data from API
interface ExperimentData {
  experiment_id: string;
  created_at: string;
  name: string;
  status: string;
  semantic_similarity_score: number;
}

const ExperimentHistory: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
    const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [experiments, setExperiments] = useState<ExperimentData[]>([]);  useEffect(() => {
    fetchExperiments();
  }, [projectId]);

  const fetchExperiments = async (isRefresh = false) => {
    if (!projectId) return;
    
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      const response = await ApiClient.get(`/experiments-list?project_id=${projectId}`);
      console.log("Experiments API Response:", response);
      
      if (response.data && (response.data as any).experiments) {
        const apiExperiments = (response.data as any).experiments;
          // Transform API response to our interface
        const transformedExperiments: ExperimentData[] = apiExperiments.map((exp: any) => {
          console.log("Processing experiment:", exp.experiment_id, "Has result:", !!exp.result, "Has results:", !!exp.results);
          
          // Calculate average semantic similarity score from results
          let semanticSimilarityScore = 0;
          let status = "running"; // Default to running
            // Check both 'result' and 'results' fields (API might use either)
          const resultsArray = exp.result || exp.results;
          if (resultsArray && Array.isArray(resultsArray) && resultsArray.length > 0) {
            console.log(`Experiment ${exp.experiment_id} has ${resultsArray.length} results - marking as completed`);
            // If experiment has results, it's completed
            status = "completed";
            
            const semanticScores = resultsArray
              .map((conv: any) => {
                const semanticEval = conv.evaluations?.find((evaluation: any) => 
                  evaluation.name === "Semantic Similarity"
                );
                return semanticEval ? semanticEval.score : 0;
              })
              .filter((score: number) => score > 0);
            
            if (semanticScores.length > 0) {
              semanticSimilarityScore = semanticScores.reduce((sum: number, score: number) => sum + score, 0) / semanticScores.length;
            }
          }
            return {
            experiment_id: exp.experiment_id,
            created_at: exp.created_at,
            name: exp.name || `Experiment ${exp.experiment_id.slice(0, 8)}...`,
            status: status,
            semantic_similarity_score: semanticSimilarityScore
          };
        });
          console.log("Transformed experiments:", transformedExperiments);
        
        // Force state update by creating a completely new array
        setExperiments([...transformedExperiments]);
        
        if (isRefresh) {
          const runningCount = transformedExperiments.filter(exp => exp.status === "running").length;
          const completedCount = transformedExperiments.filter(exp => exp.status === "completed").length;
          
          if (runningCount > 0) {
            toast.info(`${runningCount} experiment(s) still running, ${completedCount} completed.`);
          } else {
            toast.success("All experiments completed!");
          }
        }
      } else {
        console.warn("No experiments data in response");
        setExperiments([]);
      }
    } catch (error) {
      console.error("Error fetching experiments:", error);
      toast.error("Failed to fetch experiments");
      setExperiments([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check className="h-4 w-4 text-green-500" />;
      case "running":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      case "running":
        return "Running";
      case "failed":
        return "Failed";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "pending":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "running":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "failed":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-8">      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Experiment History</h2>
          <p className="text-muted-foreground mt-1">
            View and manage your evaluation experiments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchExperiments(true)}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          
          <Button
            onClick={() => navigate(`/projects/${projectId}/evaluation/create-experiment`)}
            className="gap-2 bg-primary hover:bg-orygin-red-hover text-white"
          >
            <Plus className="h-4 w-4" />
            New Experiment
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : experiments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Experiments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-32">Semantic Similarity</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experiments.map((experiment) => (
                  <TableRow key={experiment.experiment_id}>
                    <TableCell className="font-medium">
                      {experiment.name}
                    </TableCell>
                    <TableCell>                      <Badge
                        variant="outline"
                        className={`flex w-fit items-center gap-1 ${getStatusColor(experiment.status)}`}
                      >                        {getStatusIcon(experiment.status)}
                        <span>{getStatusLabel(experiment.status)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(experiment.created_at)}
                    </TableCell>                    <TableCell>
                      {experiment.status === "completed" && experiment.semantic_similarity_score > 0 ? (
                        <span className="font-mono">
                          {Math.round(experiment.semantic_similarity_score * 100)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/projects/${projectId}/report/${experiment.experiment_id}`)}
                            disabled={experiment.status === "running" || experiment.status === "pending"}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Results
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <Button
              variant="outline"
              onClick={() => navigate(`/projects/${projectId}/evaluation/create-experiment`)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Experiment
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="empty-state mt-12">
          <div className="p-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No experiments yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first experiment to start evaluating your LLM.
            </p>
            <Button
              onClick={() => navigate(`/projects/${projectId}/evaluation/create-experiment`)}
              className="mt-6 gap-2 bg-primary hover:bg-orygin-red-hover text-white"
            >
              <Plus className="h-4 w-4" />
              Create New Experiment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperimentHistory;
