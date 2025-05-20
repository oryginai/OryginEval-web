
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
import { Separator } from "@/components/ui/separator";
import { Plus, Dices, Check, X, ArrowRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
import { experimentApi, Experiment, ExperimentResults, mockData, Parameter } from "@/services/api";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { projectId, experimentId } = useParams<{ projectId: string; experimentId: string }>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [results, setResults] = useState<ExperimentResults | null>(null);
  const [parameters, setParameters] = useState<Parameter[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // In a real app, these would be API calls
        const mockExperiments = mockData.createMockExperiments(5);
        const mockExperiment = mockExperiments[0]; // Use the first experiment with results
        setExperiment(mockExperiment);
        
        if (mockExperiment.results) {
          setResults(mockExperiment.results);
        }
        
        setParameters(mockData.createMockParameters());
      } catch (error) {
        console.error("Error fetching experiment data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [projectId, experimentId]);

  // Prepare chart data
  const parameterData = parameters.map(param => ({
    parameter: param.name,
    score: results?.parameter_scores[param.id] || 0,
    fullMark: 1
  }));
  
  const conversationScores = Object.entries(results?.conversation_scores || {}).map(
    ([id, score], index) => ({
      name: `Conv ${index + 1}`,
      score: score
    })
  );
  
  // Helper function to get letter grade
  const getGrade = (score: number) => {
    if (score >= 0.9) return "A";
    if (score >= 0.8) return "B";
    if (score >= 0.7) return "C";
    if (score >= 0.6) return "D";
    return "F";
  };
  
  // Calculate success metrics
  const successRate = results ? 
    Object.values(results.conversation_scores).filter(score => score >= 0.7).length / 
    Object.values(results.conversation_scores).length : 0;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : experiment && results ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">{experiment.name}</h2>
              <p className="text-muted-foreground">
                Evaluation completed on {new Date(experiment.created_at).toLocaleDateString()}
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
          
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Overall Score</CardTitle>
                <CardDescription>Combined evaluation rating</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold">
                    {Math.round(results.overall_score * 100)}%
                  </div>
                  <div className="h-20 w-20 rounded-full bg-primary/10 border-4 border-primary flex items-center justify-center">
                    <span className="text-3xl font-bold">
                      {getGrade(results.overall_score)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Success Rate</CardTitle>
                <CardDescription>Conversations scoring 70% or higher</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold">
                    {Math.round(successRate * 100)}%
                  </div>
                  <div className="flex gap-2">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
                      <X className="h-5 w-5 text-destructive" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Conversations</CardTitle>
                <CardDescription>Total conversations evaluated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold">
                    {Object.keys(results.conversation_scores).length}
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Dices className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
              <TabsTrigger value="conversations">Conversations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                  <CardDescription>
                    Overall performance across all parameters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart outerRadius={90} data={parameterData}>
                        <PolarGrid stroke="#333" />
                        <PolarAngleAxis 
                          dataKey="parameter"
                          tick={{ fill: "#888", fontSize: 12 }} 
                        />
                        <PolarRadiusAxis 
                          angle={30} 
                          domain={[0, 1]}
                          tick={{ fill: "#888" }}
                        />
                        <Radar
                          name="Score"
                          dataKey="score"
                          stroke="#ff3d3d"
                          fill="#ff3d3d"
                          fillOpacity={0.6}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "#1a1a1a", 
                            border: "1px solid #333",
                            borderRadius: "4px",
                            color: "#fff" 
                          }}
                          formatter={(value: number) => [`${Math.round(value * 100)}%`, "Score"]}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Parameter Scores</CardTitle>
                    <CardDescription>
                      Individual scores for each evaluation parameter
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={parameterData}
                          margin={{
                            top: 5, right: 30, left: 20, bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                          <XAxis 
                            type="number" 
                            domain={[0, 1]}
                            tickFormatter={(value) => `${Math.round(value * 100)}%`} 
                            tick={{ fill: "#888" }}
                          />
                          <YAxis 
                            dataKey="parameter" 
                            type="category" 
                            width={100} 
                            tick={{ fill: "#888" }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "#1a1a1a", 
                              border: "1px solid #333",
                              borderRadius: "4px",
                              color: "#fff"
                            }}
                            formatter={(value: number) => [`${Math.round(value * 100)}%`, "Score"]}
                          />
                          <Bar dataKey="score" fill="#ff3d3d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Conversation Performance</CardTitle>
                    <CardDescription>
                      Scores across all conversations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={conversationScores}
                          margin={{
                            top: 5, right: 30, left: 20, bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: "#888" }} 
                          />
                          <YAxis 
                            domain={[0, 1]} 
                            tickFormatter={(value) => `${Math.round(value * 100)}%`}
                            tick={{ fill: "#888" }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "#1a1a1a", 
                              border: "1px solid #333",
                              borderRadius: "4px",
                              color: "#fff"
                            }}
                            formatter={(value: number) => [`${Math.round(value * 100)}%`, "Score"]}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#ff3d3d" 
                            activeDot={{ r: 8 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="parameters" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Parameter Details</CardTitle>
                  <CardDescription>
                    Detailed breakdown of each evaluation parameter
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {parameters.map((param) => {
                      const score = results.parameter_scores[param.id] || 0;
                      
                      return (
                        <div key={param.id}>
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">{param.name}</h3>
                            <div className="flex items-center space-x-2">
                              <div className="text-sm font-mono">
                                {Math.round(score * 100)}%
                              </div>
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                score >= 0.7 ? "bg-green-500/20 text-green-500" : "bg-destructive/20 text-destructive"
                              }`}>
                                {getGrade(score)}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {param.description}
                          </p>
                          <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${Math.round(score * 100)}%` }}
                            ></div>
                          </div>
                          {param !== parameters[parameters.length - 1] && (
                            <Separator className="my-4" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="conversations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Conversation Scores</CardTitle>
                  <CardDescription>
                    Individual scores for each conversation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {conversationScores.map((item, index) => {
                      const score = item.score;
                      
                      return (
                        <div key={index}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`h-8 w-8 rounded-full mr-3 flex items-center justify-center ${
                                score >= 0.7 ? "bg-green-500/20 text-green-500" : "bg-destructive/20 text-destructive"
                              }`}>
                                {score >= 0.7 ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </div>
                              <h3 className="font-medium">Conversation {index + 1}</h3>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-sm font-mono">
                                {Math.round(score * 100)}%
                              </div>
                              <Button variant="ghost" size="icon">
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${score >= 0.7 ? "bg-green-500" : "bg-destructive"}`}
                              style={{ width: `${Math.round(score * 100)}%` }}
                            ></div>
                          </div>
                          {index < conversationScores.length - 1 && (
                            <Separator className="my-3" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="empty-state mt-12">
          <div className="p-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No experiment data</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Run an experiment to see evaluation results here
            </p>
            <Button
              onClick={() => navigate(`/projects/${projectId}/evaluation/create-experiment`)}
              className="mt-6 gap-2 bg-primary hover:bg-orygin-red-hover text-white"
            >
              <Plus className="h-4 w-4" />
              Create Experiment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
