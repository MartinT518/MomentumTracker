import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Sidebar } from "@/components/common/sidebar";
import { MobileMenu } from "@/components/common/mobile-menu";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { AlertTriangle, Calendar, Heart, Loader2, Moon, Plus, Zap, RefreshCw, Wifi } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Define the schemas for form validation
const addHealthMetricSchema = z.object({
  metric_date: z.date(),
  hrv_score: z.string().transform((val) => parseInt(val)).optional(),
  resting_heart_rate: z.string().transform((val) => parseInt(val)).optional(),
  sleep_quality: z.string().transform((val) => parseInt(val)).optional(),
  sleep_duration: z.string().transform((val) => parseInt(val)).optional(),
  energy_level: z.string().transform((val) => parseInt(val)).optional(),
  stress_level: z.string().transform((val) => parseInt(val)).optional(),
  source: z.string().default("manual"),
  notes: z.string().optional()
});

type AddHealthMetricFormValues = z.infer<typeof addHealthMetricSchema>;

interface HealthMetric {
  id: number;
  user_id: number;
  metric_date: string;
  hrv_score: number | null;
  resting_heart_rate: number | null;
  sleep_quality: number | null;
  sleep_duration: number | null;
  energy_level: number | null;
  stress_level: number | null;
  source: string;
  notes: string | null;
  created_at: string;
}

export default function HealthMetricsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("7days");
  const [addMetricOpen, setAddMetricOpen] = useState(false);

  const getDateRange = () => {
    const end = endOfDay(new Date());
    let start;
    
    switch (timeRange) {
      case "7days":
        start = startOfDay(subDays(new Date(), 7));
        break;
      case "30days":
        start = startOfDay(subDays(new Date(), 30));
        break;
      case "90days":
        start = startOfDay(subDays(new Date(), 90));
        break;
      default:
        start = startOfDay(subDays(new Date(), 7));
    }
    
    return { start, end };
  };

  const { start, end } = getDateRange();

  const {
    data: healthMetrics = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ["/api/health-metrics", start.toISOString(), end.toISOString()],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/health-metrics?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
      return res.json();
    },
    staleTime: 300000, // 5 minutes
  });

  const addHealthMetricMutation = useMutation({
    mutationFn: async (formData: AddHealthMetricFormValues) => {
      const res = await apiRequest("POST", "/api/health-metrics", formData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Health metric added",
        description: "Your health data has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
      setAddMetricOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to add health metric",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<AddHealthMetricFormValues>({
    resolver: zodResolver(addHealthMetricSchema),
    defaultValues: {
      metric_date: new Date(),
      source: "manual",
      notes: "",
    },
  });

  const onSubmit = (values: AddHealthMetricFormValues) => {
    addHealthMetricMutation.mutateAsync(values);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const calculateEnergyLevel = (metric: HealthMetric) => {
    // A simple algorithm to calculate energy level from health metrics
    // You can enhance this with more sophisticated algorithms
    let energyScore = 50; // Base score
    
    if (metric.hrv_score) {
      // Higher HRV is generally better (adjust weights as needed)
      energyScore += (metric.hrv_score - 50) * 0.3;
    }
    
    if (metric.resting_heart_rate) {
      // Lower resting HR is generally better (adjust weights as needed)
      energyScore += (70 - metric.resting_heart_rate) * 0.3;
    }
    
    if (metric.sleep_quality) {
      // Higher sleep quality is better (scale of 1-10)
      energyScore += (metric.sleep_quality - 5) * 3;
    }
    
    if (metric.sleep_duration) {
      // Optimal sleep time is around 7-8 hours (420-480 minutes)
      const optimalSleep = 450;
      const sleepDiff = Math.abs(metric.sleep_duration - optimalSleep);
      energyScore -= sleepDiff * 0.1;
    }
    
    if (metric.stress_level) {
      // Lower stress is better (scale of 1-10)
      energyScore -= (metric.stress_level - 5) * 2;
    }
    
    // Ensure the score is within 0-100 range
    return Math.max(0, Math.min(100, Math.round(energyScore)));
  };

  const getTrainingRecommendation = (energyLevel: number) => {
    if (energyLevel >= 80) {
      return "Energy levels are optimal. Great day for high-intensity or long workouts.";
    } else if (energyLevel >= 60) {
      return "Energy levels are good. Moderate to high-intensity training recommended.";
    } else if (energyLevel >= 40) {
      return "Energy levels are moderate. Consider a light to moderate workout today.";
    } else {
      return "Energy levels are low. Rest or very light activity recommended.";
    }
  };

  const getLatestMetric = () => {
    if (!healthMetrics || healthMetrics.length === 0) return null;
    return healthMetrics.sort((a, b) => new Date(b.metric_date).getTime() - new Date(a.metric_date).getTime())[0];
  };

  const latestMetric = getLatestMetric();
  const energyLevel = latestMetric ? calculateEnergyLevel(latestMetric) : null;
  const recommendation = energyLevel ? getTrainingRecommendation(energyLevel) : "";

  const getEnergyColor = (level: number) => {
    if (level >= 80) return "text-green-500";
    if (level >= 60) return "text-yellow-500";
    if (level >= 40) return "text-orange-500";
    return "text-red-500";
  };

  // Data processing for charts
  const prepareTimeSeriesData = () => {
    if (!healthMetrics || healthMetrics.length === 0) return [];
    
    return [...healthMetrics]
      .sort((a, b) => new Date(a.metric_date).getTime() - new Date(b.metric_date).getTime())
      .map(metric => ({
        date: format(new Date(metric.metric_date), "MMM d"),
        hrv: metric.hrv_score || 0,
        restingHR: metric.resting_heart_rate || 0,
        sleepQuality: metric.sleep_quality || 0,
        sleepDuration: metric.sleep_duration ? metric.sleep_duration / 60 : 0, // Convert to hours
        stressLevel: metric.stress_level || 0,
        energyLevel: calculateEnergyLevel(metric)
      }));
  };

  const timeSeriesData = prepareTimeSeriesData();

  return (
    <div className="flex h-screen max-w-full overflow-hidden">
      <Sidebar />
      <MobileMenu />
      
      <main className="flex-1 overflow-y-auto bg-neutral-lighter pt-0 md:pt-4 pb-16 md:pb-4 px-4 md:px-6">
        {/* For mobile view padding to account for fixed header */}
        <div className="md:hidden pt-20"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Health Metrics</h1>
            <p className="text-muted-foreground">Track your biometric data and energy levels</p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Dialog open={addMetricOpen} onOpenChange={setAddMetricOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Health Data
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Health Metrics</DialogTitle>
                  <DialogDescription>
                    Enter your health metrics to track your recovery and energy levels.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="metric_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="hrv_score"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>HRV Score</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. 65"
                                {...field}
                                value={field.value || ""}
                                type="number"
                                min="0"
                                max="200"
                              />
                            </FormControl>
                            <FormDescription>Range: typically 20-100+</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="resting_heart_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resting Heart Rate</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. 58"
                                {...field}
                                value={field.value || ""}
                                type="number"
                                min="30"
                                max="120"
                              />
                            </FormControl>
                            <FormDescription>BPM when fully rested</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="sleep_quality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sleep Quality</FormLabel>
                            <FormControl>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value ? field.value.toString() : ""}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select rating" />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                                    <SelectItem key={value} value={value.toString()}>
                                      {value} - {value < 4 ? "Poor" : value < 7 ? "Average" : "Great"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>On a scale of 1-10</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="sleep_duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sleep Duration</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. 480"
                                {...field}
                                value={field.value || ""}
                                type="number"
                                min="0"
                                max="900"
                              />
                            </FormControl>
                            <FormDescription>In minutes (e.g. 480 = 8h)</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="stress_level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stress Level</FormLabel>
                            <FormControl>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value ? field.value.toString() : ""}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select rating" />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                                    <SelectItem key={value} value={value.toString()}>
                                      {value} - {value < 4 ? "Low" : value < 7 ? "Moderate" : "High"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>On a scale of 1-10</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Source</FormLabel>
                            <FormControl>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select source" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="manual">Manual Entry</SelectItem>
                                  <SelectItem value="garmin">Garmin</SelectItem>
                                  <SelectItem value="strava">Strava</SelectItem>
                                  <SelectItem value="polar">Polar</SelectItem>
                                  <SelectItem value="oura">Oura Ring</SelectItem>
                                  <SelectItem value="whoop">Whoop</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Any notes about today's metrics..."
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="submit" disabled={addHealthMetricMutation.isPending}>
                        {addHealthMetricMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Health Data
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="data">Raw Data</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center text-center p-6">
                    <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-medium">Error loading health metrics</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      There was a problem fetching your health data. Please try again later.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : healthMetrics.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center text-center p-6">
                    <Calendar className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-lg font-medium">No health metrics found</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Start tracking your health metrics to see insights here.
                    </p>
                    <Button className="mt-4" onClick={() => setAddMetricOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Health Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Today's Energy Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-medium">Today's Energy</CardTitle>
                      <div className="text-sm text-muted-foreground">
                        Last updated: {latestMetric ? formatDate(latestMetric.metric_date) : "N/A"}
                      </div>
                    </div>
                    <CardDescription>Your training readiness based on biometric data</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                      {/* Energy Level Gauge */}
                      <div className="flex flex-col items-center">
                        <div className="h-40 w-40 relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Score', value: energyLevel || 0 },
                                  { name: 'Remaining', value: 100 - (energyLevel || 0) }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={70}
                                startAngle={90}
                                endAngle={-270}
                                dataKey="value"
                              >
                                <Cell 
                                  key="cell-0" 
                                  fill={
                                    !energyLevel ? "#9ca3af" :
                                    energyLevel >= 80 ? "#22c55e" :
                                    energyLevel >= 60 ? "#eab308" :
                                    energyLevel >= 40 ? "#f97316" :
                                    "#ef4444"
                                  } 
                                />
                                <Cell key="cell-1" fill="#f3f4f6" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Zap className={`w-6 h-6 ${energyLevel ? getEnergyColor(energyLevel) : "text-gray-400"}`} />
                            <p className={`text-2xl font-bold ${energyLevel ? getEnergyColor(energyLevel) : "text-gray-400"}`}>
                              {energyLevel || "-"}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-medium mt-2">Energy Score</p>
                      </div>

                      {/* Recommendation & Metrics */}
                      <div className="flex-1 space-y-4">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-100">
                          <Zap className={`w-4 h-4 mr-2 ${energyLevel ? getEnergyColor(energyLevel) : "text-gray-400"}`} />
                          <span className={`font-medium ${energyLevel ? getEnergyColor(energyLevel) : "text-gray-400"}`}>
                            {!energyLevel ? "No data" :
                              energyLevel >= 80 ? "Optimal Energy" :
                              energyLevel >= 60 ? "Good Energy" :
                              energyLevel >= 40 ? "Moderate Energy" :
                              "Low Energy"
                            }
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{recommendation}</p>
                        
                        {latestMetric && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                            <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                              <Heart className="h-5 w-5 text-red-500 mb-1" />
                              <div className="text-xl font-medium">{latestMetric.hrv_score || "-"}</div>
                              <div className="text-xs text-muted-foreground">HRV Score</div>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                              <Heart className="h-5 w-5 text-purple-500 mb-1" />
                              <div className="text-xl font-medium">{latestMetric.resting_heart_rate || "-"}</div>
                              <div className="text-xs text-muted-foreground">Resting HR</div>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                              <Moon className="h-5 w-5 text-blue-500 mb-1" />
                              <div className="text-xl font-medium">{latestMetric.sleep_quality || "-"}/10</div>
                              <div className="text-xs text-muted-foreground">Sleep Quality</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Metrics Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Recent Health Trends</CardTitle>
                    <CardDescription>Your key health metrics over time</CardDescription>
                    <div className="flex space-x-2 mt-2">
                      <Button 
                        variant={timeRange === "7days" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimeRange("7days")}
                      >
                        7 Days
                      </Button>
                      <Button 
                        variant={timeRange === "30days" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimeRange("30days")}
                      >
                        30 Days
                      </Button>
                      <Button 
                        variant={timeRange === "90days" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimeRange("90days")}
                      >
                        90 Days
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={timeSeriesData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="energyLevel" 
                            name="Energy Score" 
                            stroke="#16a34a" 
                            activeDot={{ r: 8 }}
                            strokeWidth={2} 
                          />
                          <Line type="monotone" dataKey="hrv" name="HRV Score" stroke="#ef4444" />
                          <Line type="monotone" dataKey="restingHR" name="Resting HR" stroke="#a855f7" />
                          <Line type="monotone" dataKey="sleepQuality" name="Sleep Quality" stroke="#3b82f6" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          
          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Energy Level Analysis</CardTitle>
                <CardDescription>Track your energy level changes over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={timeSeriesData}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <defs>
                        <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="energyLevel" 
                        stroke="#22c55e" 
                        fillOpacity={1} 
                        fill="url(#colorEnergy)" 
                        name="Energy Level"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">HRV & Resting Heart Rate</CardTitle>
                  <CardDescription>Track your heart health metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={timeSeriesData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="hrv" name="HRV Score" stroke="#ef4444" />
                        <Line type="monotone" dataKey="restingHR" name="Resting HR" stroke="#a855f7" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Sleep Metrics</CardTitle>
                  <CardDescription>Track your sleep quality and duration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={timeSeriesData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 12]} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          yAxisId="left" 
                          type="monotone" 
                          dataKey="sleepQuality" 
                          name="Sleep Quality" 
                          stroke="#3b82f6" 
                        />
                        <Line 
                          yAxisId="right" 
                          type="monotone" 
                          dataKey="sleepDuration" 
                          name="Sleep Hours" 
                          stroke="#8884d8" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Raw Data Tab */}
          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-medium">Health Metrics Log</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setTimeRange("7days")}>
                      7 Days
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setTimeRange("30days")}>
                      30 Days
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setTimeRange("90days")}>
                      90 Days
                    </Button>
                  </div>
                </div>
                <CardDescription>Your recorded health data</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : healthMetrics.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No health data available for this period.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left font-medium py-2 px-4 border-b">Date</th>
                          <th className="text-left font-medium py-2 px-4 border-b">HRV</th>
                          <th className="text-left font-medium py-2 px-4 border-b">RHR</th>
                          <th className="text-left font-medium py-2 px-4 border-b">Sleep Quality</th>
                          <th className="text-left font-medium py-2 px-4 border-b">Sleep Hours</th>
                          <th className="text-left font-medium py-2 px-4 border-b">Stress</th>
                          <th className="text-left font-medium py-2 px-4 border-b">Source</th>
                          <th className="text-left font-medium py-2 px-4 border-b">Energy Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...healthMetrics]
                          .sort((a, b) => new Date(b.metric_date).getTime() - new Date(a.metric_date).getTime())
                          .map((metric) => (
                            <tr key={metric.id} className="hover:bg-neutral-50">
                              <td className="py-2 px-4 border-b">{formatDate(metric.metric_date)}</td>
                              <td className="py-2 px-4 border-b">{metric.hrv_score || "-"}</td>
                              <td className="py-2 px-4 border-b">{metric.resting_heart_rate || "-"}</td>
                              <td className="py-2 px-4 border-b">{metric.sleep_quality || "-"}/10</td>
                              <td className="py-2 px-4 border-b">
                                {metric.sleep_duration 
                                  ? `${Math.floor(metric.sleep_duration / 60)}h ${metric.sleep_duration % 60}m` 
                                  : "-"}
                              </td>
                              <td className="py-2 px-4 border-b">{metric.stress_level || "-"}/10</td>
                              <td className="py-2 px-4 border-b">
                                <div className="flex items-center">
                                  {metric.source === "manual" ? (
                                    <span className="capitalize">{metric.source}</span>
                                  ) : (
                                    <>
                                      <Wifi className="h-4 w-4 mr-1 text-blue-500" />
                                      <span className="capitalize">{metric.source}</span>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-4 border-b">
                                <div className={`font-medium ${getEnergyColor(calculateEnergyLevel(metric))}`}>
                                  {calculateEnergyLevel(metric)}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}