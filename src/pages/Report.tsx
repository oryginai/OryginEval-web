import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Plus, Timer, AlertTriangle, Smile, ListChecks, Lightbulb, Target, ShieldAlert, TrendingUp, BarChartHorizontalBig, Info, LineChart as LineChartLucide, Radar as RadarLucide, Download } from "lucide-react"; // Aliased LineChart and Radar
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip, // Renamed to avoid conflict with shadcn/ui Tooltip
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { ApiClient } from "@/lib/api-client";

// Define interfaces for the new data structure
interface EvaluationDetail {
  name: string;
  score: number;
  comment: string;
}

interface EvalResult {
  convoid: string;
  response_time: number;
  evaluations: EvaluationDetail[];
}

interface OverallEvalResults {
  conversations_tested: number;
  average_response_time: number;
  Hallucination: number;
  "Semantic Similarity": number;
  "Accuracy Score"?: number; // Added as per request, optional
  "Toxicity Score"?: number; // Added as per request, optional
}

interface ReportData {
  overall_eval_results: OverallEvalResults;
  insights: string[];
  eval_results: EvalResult[];
}

const Report: React.FC = () => {
  const navigate = useNavigate();
  const { projectId, experimentId } = useParams<{ projectId: string; experimentId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [experimentName, setExperimentName] = useState<string>("");
  useEffect(() => {
    const fetchExperimentDetails = async () => {
      if (!experimentId) {
        setError("No experiment ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch experiment details
        const response = await ApiClient.get(`/experiments-details?experiment_id=${experimentId}`);
        console.log("Experiment details API Response:", response);
        console.log("Response data:", response.data);
        console.log("Experiment object:", (response.data as any)?.experiment);
        console.log("Result check:", (response.data as any)?.experiment?.result);
        
        if (response.data && (response.data as any).experiment && (response.data as any).experiment.result && Array.isArray((response.data as any).experiment.result)) {
          const apiData = (response.data as any).experiment;
          
          // Set experiment name from API response
          setExperimentName(apiData.experiment_name || apiData.name || `Experiment ${experimentId}`);
          
          // Fetch project name if project_id is available
          if (apiData.project_id || projectId) {
            try {
              const projectResponse = await ApiClient.get(`/projects-details?project_id=${apiData.project_id || projectId}`);
              if (projectResponse.data && (projectResponse.data as any).project) {
                setProjectName((projectResponse.data as any).project.project_name || (projectResponse.data as any).project.name || `Project ${apiData.project_id || projectId}`);
              }
            } catch (projectError) {
              console.warn("Failed to fetch project details:", projectError);
              setProjectName(`Project ${apiData.project_id || projectId}`);
            }
          }
          
          // Transform API response to ReportData interface
          const transformedData: ReportData = transformApiResponseToReportData(apiData);
          setReportData(transformedData);
        } else {
          console.error("API Response structure issue:", {
            hasData: !!response.data,
            hasExperiment: !!(response.data as any)?.experiment,
            hasResult: !!(response.data as any)?.experiment?.result,
            resultType: typeof (response.data as any)?.experiment?.result,
            isArray: Array.isArray((response.data as any)?.experiment?.result)
          });
          throw new Error("No experiment data found");
        }
      } catch (error) {
        console.error("Error fetching experiment details:", error);
        setError("Failed to load experiment details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExperimentDetails();
  }, [experimentId, projectId]);

  // Helper function to transform API response to ReportData interface
  const transformApiResponseToReportData = (apiData: any): ReportData => {
    const results = apiData.result || [];
    
    // Calculate overall metrics from individual conversation results
    const totalConversations = results.length;
    let totalResponseTime = 0;
    let hallucinationScores: number[] = [];
    let semanticSimilarityScores: number[] = [];
    let accuracyScores: number[] = [];
    let toxicityScores: number[] = [];
    
    const evalResults: EvalResult[] = results.map((conv: any) => {
      totalResponseTime += conv.response_time || 0;
        const evaluations: EvaluationDetail[] = (conv.evaluations || []).map((evaluation: any) => {
        const score = evaluation.score || 0;
        
        // Collect scores for overall calculation
        switch (evaluation.name) {
          case "Hallucination":
            hallucinationScores.push(score);
            break;
          case "Semantic Similarity":
            semanticSimilarityScores.push(score);
            break;
          case "Accuracy Score":
          case "Accuracy":
            accuracyScores.push(score);
            break;
          case "Toxicity Score":
          case "Toxicity":
            toxicityScores.push(score);
            break;
        }
        
        return {
          name: evaluation.name,
          score: score,
          comment: evaluation.comment || ""
        };
      });
      
      return {
        convoid: conv.convoid || conv.conversationId || "Unknown",
        response_time: conv.response_time || 0,
        evaluations
      };
    });
    
    // Calculate averages
    const avgResponseTime = totalConversations > 0 ? totalResponseTime / totalConversations : 0;
    const avgHallucination = hallucinationScores.length > 0 
      ? hallucinationScores.reduce((sum, score) => sum + score, 0) / hallucinationScores.length 
      : 0;
    const avgSemanticSimilarity = semanticSimilarityScores.length > 0 
      ? semanticSimilarityScores.reduce((sum, score) => sum + score, 0) / semanticSimilarityScores.length 
      : 0;
    const avgAccuracy = accuracyScores.length > 0 
      ? accuracyScores.reduce((sum, score) => sum + score, 0) / accuracyScores.length 
      : 0;
    const avgToxicity = toxicityScores.length > 0 
      ? toxicityScores.reduce((sum, score) => sum + score, 0) / toxicityScores.length 
      : 0;
    
    // Generate insights based on the data
    const insights = generateInsights(avgHallucination, avgSemanticSimilarity, avgAccuracy, avgToxicity, evalResults);
    
    return {
      overall_eval_results: {
        conversations_tested: totalConversations,
        average_response_time: avgResponseTime,
        Hallucination: avgHallucination,
        "Semantic Similarity": avgSemanticSimilarity,
        "Accuracy Score": avgAccuracy,
        "Toxicity Score": avgToxicity
      },
      insights,
      eval_results: evalResults
    };
  };

  // Helper function to generate insights
  const generateInsights = (
    hallucination: number, 
    semanticSimilarity: number, 
    accuracy: number, 
    toxicity: number,
    evalResults: EvalResult[]
  ): string[] => {
    const insights: string[] = [];
    
    if (hallucination > 0.3) {
      insights.push("Hallucination scores are elevated, indicating the model may be generating inaccurate or fabricated information.");
    } else if (hallucination < 0.1) {
      insights.push("Hallucination scores are low, suggesting the model's responses are generally grounded and accurate.");
    }
    
    if (semanticSimilarity > 0.9) {
      insights.push("Semantic similarity scores are excellent, indicating strong alignment with expected responses.");
    } else if (semanticSimilarity < 0.7) {
      insights.push("Semantic similarity scores suggest room for improvement in response relevance and alignment.");
    }
    
    if (accuracy > 0.8) {
      insights.push("High accuracy scores demonstrate strong performance in providing correct information.");
    } else if (accuracy < 0.6) {
      insights.push("Accuracy scores indicate significant room for improvement in response correctness.");
    }
    
    if (toxicity > 0.1) {
      insights.push("Toxicity levels require attention to ensure appropriate and safe responses.");
    } else {
      insights.push("Toxicity scores are low, indicating appropriate and safe response generation.");
    }
    
    // Response time insights
    const avgResponseTime = evalResults.reduce((sum, result) => sum + result.response_time, 0) / evalResults.length;
    if (avgResponseTime > 5) {
      insights.push("Response times are above average and may impact user experience.");
    } else if (avgResponseTime < 2) {
      insights.push("Response times are excellent, providing quick user interactions.");
    }
    
    return insights.length > 0 ? insights : ["Analysis complete. Review individual metrics for detailed performance insights."];
  };
  // Helper function to get parameter score cards
  const getParameterScoreCards = (reportData: ReportData) => {
    const parameters: Array<{
      name: string;
      value: string;
      note: string;
      grade: string;
      gradeColor: string;
      IconComponent: any;
    }> = [];    // Get unique parameter names from eval results (excluding Semantic Similarity)
    const uniqueParams = new Set<string>();
    reportData.eval_results.forEach(result => {
      result.evaluations.forEach(evaluation => {
        // Exclude Semantic Similarity from parameter cards
        if (evaluation.name !== "Semantic Similarity") {
          uniqueParams.add(evaluation.name);
        }
      });
    });

    uniqueParams.forEach(paramName => {
      // Calculate average score for this parameter
      const scores = reportData.eval_results
        .flatMap(result => result.evaluations)
        .filter(evaluation => evaluation.name === paramName)
        .map(evaluation => evaluation.score);
      
      const avgScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;

      const grade = getGrade(avgScore);
      const IconComponent = getParameterIcon(paramName);

      parameters.push({
        name: paramName,
        value: avgScore.toFixed(2),
        note: getParameterNote(paramName),
        grade: grade.grade,
        gradeColor: grade.color === "text-green-500" ? "bg-green-100 text-green-800" :
                   grade.color === "text-blue-500" ? "bg-blue-100 text-blue-800" :
                   grade.color === "text-yellow-500" ? "bg-yellow-100 text-yellow-800" :
                   grade.color === "text-orange-500" ? "bg-orange-100 text-orange-800" :
                   "bg-red-100 text-red-800",
        IconComponent
      });
    });

    return parameters;
  };

  // Helper function to get icon for parameter
  const getParameterIcon = (paramName: string) => {
    switch (paramName.toLowerCase()) {
      case "hallucination":
        return AlertTriangle;
      case "semantic similarity":
        return Smile;
      case "accuracy score":
      case "accuracy":
        return Target;
      case "toxicity score":
      case "toxicity":
        return ShieldAlert;
      default:
        return TrendingUp;
    }
  };

  // Helper function to get note for parameter
  const getParameterNote = (paramName: string): string => {
    switch (paramName.toLowerCase()) {
      case "hallucination":
        return "Lower is better (0-1 scale)";
      case "semantic similarity":
        return "Higher is better (0-1 scale)";
      case "accuracy score":
      case "accuracy":
        return "Higher is better (0-1 scale)";
      case "toxicity score":
      case "toxicity":
        return "Lower is better (0-1 scale)";
      default:
        return "Parameter score (0-1 scale)";
    }
  };
  // Helper function to get letter grade and color
  const getGrade = (score: number): { grade: string; color: string } => {
    if (score >= 0.9) return { grade: "A", color: "text-green-500" };
    if (score >= 0.8) return { grade: "B", color: "text-blue-500" };
    if (score >= 0.7) return { grade: "C", color: "text-yellow-500" };
    if (score >= 0.6) return { grade: "D", color: "text-orange-500" };
    return { grade: "F", color: "text-red-500" };
  };

  // Helper function to get parameters for table display
  const getParametersForTable = (reportData: ReportData) => {
    if (!reportData || reportData.eval_results.length === 0) return [];

    // Get all unique parameter names from evaluations
    const allParams = new Set<string>();
    reportData.eval_results.forEach(result => {
      result.evaluations.forEach(evaluation => {
        allParams.add(evaluation.name);
      });
    });

    const paramArray = Array.from(allParams);
    
    // Define parameter priority order (most important first)
    const priorityOrder = [
      "Semantic Similarity",
      "Hallucination", 
      "Accuracy",
      "Accuracy Score",
      "Toxicity",
      "Toxicity Score"
    ];

    // Sort parameters by priority, then alphabetically
    const sortedParams = paramArray.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a);
      const bIndex = priorityOrder.indexOf(b);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      } else if (aIndex !== -1) {
        return -1;
      } else if (bIndex !== -1) {
        return 1;
      } else {
        return a.localeCompare(b);
      }
    });

    // Limit parameters based on screen space
    // For mobile: max 2 parameters
    // For tablet: max 3 parameters  
    // For desktop: max 4 parameters
    const maxParams = window.innerWidth < 768 ? 2 : window.innerWidth < 1024 ? 3 : 4;
    
    return sortedParams.slice(0, Math.min(maxParams, sortedParams.length));
  };
  // Helper function to get abbreviated parameter name for table headers
  const getAbbreviatedParamName = (paramName: string): string => {
    const abbreviations: { [key: string]: string } = {
      "Semantic Similarity": "Sem. Similarity",
      "Hallucination": "Hallucination",
      "Accuracy Score": "Accuracy",
      "Accuracy": "Accuracy",
      "Toxicity Score": "Toxicity",
      "Toxicity": "Toxicity"
    };
    
    return abbreviations[paramName] || (paramName.length > 12 ? paramName.substring(0, 10) + "..." : paramName);
  };
  // Function to download JSON report with new structure
  const downloadJsonReport = () => {
    if (!reportData) return;

    // Get all unique parameter names and their average scores
    const uniqueParams = new Set<string>();
    reportData.eval_results.forEach(result => {
      result.evaluations.forEach(evaluation => {
        uniqueParams.add(evaluation.name);
      });
    });

    // Calculate average scores for all parameters dynamically
    const parameterScores: { [key: string]: number } = {};
    uniqueParams.forEach(paramName => {
      const scores = reportData.eval_results
        .flatMap(result => result.evaluations)
        .filter(evaluation => evaluation.name === paramName)
        .map(evaluation => evaluation.score);
      
      const avgScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;
      
      // Convert parameter name to snake_case for consistency
      const paramKey = paramName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      parameterScores[paramKey] = avgScore;
    });

    // Create the new JSON structure according to requirements
    const jsonReport = {
      metadata: {
        experiment_name: experimentName,
        project_name: projectName,
        export_date: new Date().toISOString(),
        // report_version: "2.0"
      },
      report_data: {
        // Overall metrics first
        conversations_tested: reportData.overall_eval_results.conversations_tested,
        avg_response_time: reportData.overall_eval_results.average_response_time,
        semantic_similarity: reportData.overall_eval_results["Semantic Similarity"],
        
        // Dynamic parameter scores for all parameters
        parameter_scores: parameterScores,
        
        // Then insights
        insights: reportData.insights,
        
        // Finally simulation data (renamed from eval_results)
        simulation_data: reportData.eval_results
      }
    };

    // Create and download the file
    const blob = new Blob([JSON.stringify(jsonReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `evaluation-report-${experimentId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };// Prepare chart data - dynamically based on actual parameters from API response
  const overallMetricsForChart = reportData
    ? (() => {
        // Get unique parameter names from eval results (including Semantic Similarity for radar chart)
        const uniqueParams = new Set<string>();
        reportData.eval_results.forEach(result => {
          result.evaluations.forEach(evaluation => {
            uniqueParams.add(evaluation.name);
          });
        });

        // Create chart data for each parameter
        return Array.from(uniqueParams).map(paramName => {
          // Calculate average score for this parameter
          const scores = reportData.eval_results
            .flatMap(result => result.evaluations)
            .filter(evaluation => evaluation.name === paramName)
            .map(evaluation => evaluation.score);
          
          const avgScore = scores.length > 0 
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
            : 0;

          // For parameters where lower is better (like Toxicity), invert the score for better visualization
          const displayScore = paramName.toLowerCase().includes('toxicity') || 
                              paramName.toLowerCase().includes('hallucination')
            ? 1 - avgScore  // Invert so higher bars represent better performance
            : avgScore;

          return {
            subject: paramName,
            score: displayScore,
            fullMark: 1
          };
        });
      })()
    : [];
  const conversationScoresForChart = reportData
    ? reportData.eval_results.map((conv) => ({
        name: conv.convoid.replace("convoid", "C"), // Shorten name
        "Semantic Similarity": conv.evaluations.find((e) => e.name === "Semantic Similarity")?.score || 0,
      }))
    : [];

  const responseTimesForChart = reportData
    ? reportData.eval_results.map((conv) => ({
        name: conv.convoid.replace("convoid", "C"), // Shorten name
        "Response Time (s)": conv.response_time,
      }))
    : [];
  const overallMetricsCardsData = reportData ? [
    { title: "Conversations Tested", value: reportData.overall_eval_results.conversations_tested.toString(), IconComponent: ListChecks, note: "Total interactions evaluated" },
    { title: "Avg. Response Time", value: `${reportData.overall_eval_results.average_response_time.toFixed(2)}s`, IconComponent: Timer, note: "Average bot response speed" },
    { title: "Semantic Similarity", value: reportData.overall_eval_results["Semantic Similarity"].toFixed(2), IconComponent: Smile, note: "Higher is better (0-1 scale)" },
  ] : [];


  if (isLoading) {
    return (
      <div className="space-y-6 p-6 md:p-10">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse mb-6"></div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-10 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse mt-6">
            <CardHeader><div className="h-6 bg-muted rounded w-1/4"></div></CardHeader>
            <CardContent><div className="h-20 bg-muted rounded"></div></CardContent>
        </Card>
      </div>
    );
  }
  if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-6">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Info className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {error || "No Report Data Available"}
        </h3>
        <p className="text-muted-foreground mb-6">
          {error 
            ? "There was an issue loading the experiment data. Please try again."
            : "There was an issue loading the report data or no data exists."
          }
        </p>
        <div className="flex gap-4">
          <Button
            onClick={() => navigate(`/projects/${projectId}/evaluation/history`)}
            variant="outline"
          >
            Back to Experiments
          </Button>
          <Button
            onClick={() => navigate(`/projects/${projectId}/evaluation/create-experiment`)}
            className="gap-2 bg-primary hover:bg-orygin-red-hover text-white"
          >
            <Plus className="h-4 w-4" />
            Create New Experiment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-8 p-4 md:p-8">        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Evaluation Report</h1>
            <p className="text-muted-foreground">
              Detailed analysis of the latest evaluation run.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={downloadJsonReport}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download Report
            </Button>
            <Button
              onClick={() => navigate(`/projects/${projectId}/evaluation/create-experiment`)}
              className="gap-2 bg-primary hover:bg-orygin-red-hover text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              New Experiment
            </Button>
          </div>
        </div>

        {/* Parameter Score Cards */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Parameter Scores</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {getParameterScoreCards(reportData).map((param, index) => (
              <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {param.name}
                  </CardTitle>
                  <param.IconComponent className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{param.value}</div>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-muted-foreground">{param.note}</p>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${param.gradeColor}`}>
                      {param.grade}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>        {/* Overall Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {overallMetricsCardsData.map((metric, index) => (
            <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <metric.IconComponent className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metric.value}</div>
                <p className="text-xs text-muted-foreground pt-1">{metric.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
            <TabsTrigger value="overview">Overview & Insights</TabsTrigger>
            <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
            <TabsTrigger value="conversations">Conversation Details</TabsTrigger>
          </TabsList>

          {/* Overview & Insights Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-6 w-6 text-primary" />
                  Key Insights
                </CardTitle>
                <CardDescription>
                  Actionable observations from the evaluation results.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 list-disc list-inside text-muted-foreground">
                  {reportData.insights.map((insight, index) => (
                    <li key={index} className="pl-2">{insight}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
              {/* Only show radar chart if there are 3 or more parameters */}
            {overallMetricsForChart.length >= 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <RadarLucide className="h-6 w-6 text-primary" />
                      Overall Metric Scores
                  </CardTitle>
                  <CardDescription>Visual representation of overall performance metrics.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={overallMetricsForChart}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 1]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", color: "hsl(var(--popover-foreground))" }}
                          formatter={(value: number, name: string) => [`${(value * 100).toFixed(0)}%`, name]}
                          labelFormatter={(label: string) => <span style={{ fontWeight: 'bold' }}>{label}</span>}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Visualizations Tab */}
          <TabsContent value="visualizations" className="space-y-6">
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChartLucide className="h-6 w-6 text-primary" />
                    Response Time Distribution
                  </CardTitle>
                  <CardDescription>Response times for each conversation.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={responseTimesForChart} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <YAxis tickFormatter={(value) => `${value}s`} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", color: "hsl(var(--popover-foreground))" }}
                          formatter={(value: number) => [`${value.toFixed(2)}s`, "Response Time"]}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                        <Line type="monotone" dataKey="Response Time (s)" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChartHorizontalBig className="h-6 w-6 text-primary" />
                    Scores per Conversation
                  </CardTitle>
                  <CardDescription>Semantic Similarity scores across conversations.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={conversationScoresForChart} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", color: "hsl(var(--popover-foreground))" }}
                          formatter={(value: number, name: string) => [`${(value * 100).toFixed(0)}%`, name]}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                        <Bar dataKey="Semantic Similarity" fill="hsl(var(--primary))" name="Semantic Similarity" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>          {/* Conversation Details Tab */}
          <TabsContent value="conversations">
            <Card>
              <CardHeader>
                <CardTitle>Conversation Breakdown</CardTitle>
                <CardDescription>
                  Detailed scores and comments for each conversation. Showing top parameters for screen optimization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] w-full rounded-md border border-border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-[100px]">Convo ID</TableHead>
                        <TableHead className="text-center">Resp. Time (s)</TableHead>
                        {getParametersForTable(reportData).map((paramName) => (
                          <TableHead key={paramName} className="text-center min-w-[120px]">
                            {getAbbreviatedParamName(paramName)}
                          </TableHead>
                        ))}
                        <TableHead className="text-right w-[100px]">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.eval_results.map((conv) => {
                        const tableParams = getParametersForTable(reportData);
                        
                        return (
                          <TableRow key={conv.convoid}>
                            <TableCell className="font-medium">{conv.convoid}</TableCell>
                            <TableCell className="text-center">{conv.response_time.toFixed(2)}</TableCell>
                            
                            {tableParams.map((paramName) => {
                              const evaluation = conv.evaluations.find(e => e.name === paramName);
                              const grade = evaluation ? getGrade(evaluation.score) : { grade: 'N/A', color: 'text-muted-foreground' };
                              
                              return (
                                <TableCell key={paramName} className="text-center">
                                  <span className={`font-semibold ${grade.color}`}>
                                    {evaluation ? evaluation.score.toFixed(2) : 'N/A'}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-1">({grade.grade})</span>
                                </TableCell>
                              );
                            })}
                            
                            <TableCell className="text-right">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs text-sm p-3 bg-popover text-popover-foreground border-border shadow-lg rounded-md">
                                  <div className="space-y-2">
                                    {conv.evaluations.map((evaluation, index) => (
                                      <div key={index}>
                                        <p className="font-semibold">{evaluation.name}:</p>
                                        <p className="text-xs">{evaluation.comment || 'No comment available'}</p>
                                      </div>
                                    ))}
                                    {conv.evaluations.length === 0 && <p>No evaluations available.</p>}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default Report;
