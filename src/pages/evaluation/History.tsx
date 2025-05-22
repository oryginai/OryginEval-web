
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
import { Plus, MoreVertical, ExternalLink, Trash2, Check, Clock, AlertTriangle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { experimentApi, Experiment, mockData } from "@/services/api";

const ExperimentHistory: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [experiments, setExperiments] = useState<Experiment[]>([]);

  useEffect(() => {
    const fetchExperiments = async () => {
      try {
        setIsLoading(true);
        // In a real app, this would fetch from the API
        // const data = await experimentApi.getExperiments(projectId || "");
        const mockExperiments = mockData.createMockExperiments(5);
        setExperiments(mockExperiments);
      } catch (error) {
        console.error("Error fetching experiments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExperiments();
  }, [projectId]);

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
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "running":
        return <AlertCircle className="h-4 w-4 text-primary" />;
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
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "running":
        return "bg-primary/10 text-primary border-primary/20";
      case "failed":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Experiment History</h2>
          <p className="text-muted-foreground mt-1">
            View and manage your evaluation experiments
          </p>
        </div>

        <Button
          onClick={() => navigate(`/projects/${projectId}/evaluation/create-experiment`)}
          className="gap-2 bg-primary hover:bg-orygin-red-hover text-white"
        >
          <Plus className="h-4 w-4" />
          New Experiment
        </Button>
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
                  <TableHead className="w-20">Score</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experiments.map((experiment) => (
                  <TableRow key={experiment.id}>
                    <TableCell className="font-medium">
                      {experiment.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`flex w-fit items-center gap-1 ${getStatusColor(experiment.status)}`}
                      >
                        {getStatusIcon(experiment.status)}
                        <span>{getStatusLabel(experiment.status)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(experiment.created_at)}
                    </TableCell>
                    <TableCell>
                      {experiment.results ? (
                        <span className="font-mono">
                          {Math.round(experiment.results.overall_score * 100)}%
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
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">                          <DropdownMenuItem
                            onClick={() => navigate(`/projects/${projectId}/report/${experiment.id}`)}
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
