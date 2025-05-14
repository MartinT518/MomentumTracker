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
import { 
  AlertTriangle, 
  Calendar, 
  Heart, 
  Loader2, 
  Moon, 
  Plus, 
  Zap, 
  RefreshCw, 
  Wifi, 
  HelpCircle 
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Tooltip as RechartsTooltip,
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
  const [importGarminOpen, setImportGarminOpen] = useState(false);
  const [garminConsentGiven, setGarminConsentGiven] = useState(false);
  const [isImportingGarmin, setIsImportingGarmin] = useState(false);

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
  
  // Mutation for importing Garmin health data
  const importGarminDataMutation = useMutation({
    mutationFn: async () => {
      setIsImportingGarmin(true);
      const res = await apiRequest("POST", "/api/garmin/health-metrics/import", {
        consent: garminConsentGiven
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Garmin data imported",
        description: `Successfully imported ${data.count || 0} health metrics from Garmin.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
      setImportGarminOpen(false);
      setIsImportingGarmin(false);
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import data from Garmin. Please try again.",
        variant: "destructive",
      });
      setIsImportingGarmin(false);
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
    // Base score starts at 50 (neutral)
    let energyScore = 50;
    let factorsUsed = 0;
    
    // HRV contribution (higher is better) - most significant physiological indicator
    if (metric.hrv_score) {
      // Weight: 35% of the total calculation
      factorsUsed++;
      
      // Normalize HRV score based on typical ranges:
      // Below 30: Poor recovery
      // 30-50: Below average
      // 50-70: Average to good
      // 70-90: Very good
      // 90+: Excellent
      
      let hrvNormalized;
      if (metric.hrv_score < 30) {
        hrvNormalized = 20 + (metric.hrv_score / 30) * 20; // 20-40 range
      } else if (metric.hrv_score < 50) {
        hrvNormalized = 40 + ((metric.hrv_score - 30) / 20) * 20; // 40-60 range
      } else if (metric.hrv_score < 70) {
        hrvNormalized = 60 + ((metric.hrv_score - 50) / 20) * 20; // 60-80 range
      } else if (metric.hrv_score < 90) {
        hrvNormalized = 80 + ((metric.hrv_score - 70) / 20) * 15; // 80-95 range
      } else {
        hrvNormalized = 95 + ((metric.hrv_score - 90) / 30) * 5; // 95-100 range (caps at 100)
      }
      
      energyScore += (hrvNormalized - 50) * 0.35;
    }
    
    // Resting heart rate contribution (lower is better)
    if (metric.resting_heart_rate) {
      // Weight: 25% of the total calculation
      factorsUsed++;
      
      // RHR ranges:
      // Elite athletes: 40-50
      // Good fitness: 50-60
      // Average: 60-70
      // Below average: 70-80
      // Poor: 80+
      
      let rhrScore;
      if (metric.resting_heart_rate <= 40) {
        rhrScore = 95; // Elite, but potentially too low (overtraining)
      } else if (metric.resting_heart_rate <= 50) {
        rhrScore = 90; // Elite to excellent
      } else if (metric.resting_heart_rate <= 60) {
        rhrScore = 75; // Very good
      } else if (metric.resting_heart_rate <= 70) {
        rhrScore = 55; // Average
      } else if (metric.resting_heart_rate <= 80) {
        rhrScore = 35; // Below average
      } else if (metric.resting_heart_rate <= 90) {
        rhrScore = 20; // Poor
      } else {
        rhrScore = 10; // Very poor / concerning
      }
      
      energyScore += (rhrScore - 50) * 0.25;
    }
    
    // Sleep quality contribution (higher is better, scale 1-10)
    if (metric.sleep_quality) {
      // Weight: 20% of the total calculation
      factorsUsed++;
      
      // Direct mapping: scale 1-10 to 10-100
      const sleepQualityNormalized = metric.sleep_quality * 10;
      energyScore += (sleepQualityNormalized - 50) * 0.2;
    }
    
    // Sleep duration contribution (optimal around 7-9 hours)
    if (metric.sleep_duration) {
      // Weight: 10% of the total calculation
      factorsUsed++;
      
      // Sleep duration in hours (assuming input is in minutes)
      const sleepHours = metric.sleep_duration / 60;
      
      let sleepDurationScore;
      if (sleepHours >= 7 && sleepHours <= 9) {
        // Optimal sleep range - higher score for closer to 8
        sleepDurationScore = 100 - Math.abs(sleepHours - 8) * 10;
      } else if (sleepHours >= 6 && sleepHours < 7) {
        // Slightly under optimal
        sleepDurationScore = 65;
      } else if (sleepHours > 9 && sleepHours <= 10) {
        // Slightly over optimal
        sleepDurationScore = 70;
      } else if (sleepHours >= 5 && sleepHours < 6) {
        // Moderately under optimal
        sleepDurationScore = 45;
      } else if (sleepHours > 10) {
        // Too much sleep
        sleepDurationScore = 40;
      } else {
        // Significantly under optimal
        sleepDurationScore = 20;
      }
      
      energyScore += (sleepDurationScore - 50) * 0.1;
    }
    
    // Stress level contribution (lower is better, scale 1-10)
    if (metric.stress_level) {
      // Weight: 10% of the total calculation
      factorsUsed++;
      
      // Invert stress level (10 is now best, 1 is worst)
      const stressInverted = 11 - metric.stress_level;
      // Convert to 0-100 scale
      const stressNormalized = stressInverted * 10;
      
      energyScore += (stressNormalized - 50) * 0.1;
    }
    
    // Adjust if not all factors are present
    if (factorsUsed > 0 && factorsUsed < 5) {
      // Make a proportional adjustment based on available factors
      // More factors = more confidence in the score
      const missingFactorPenalty = (5 - factorsUsed) * 3;
      energyScore -= missingFactorPenalty;
    }
    
    // Ensure the score is within 0-100 range
    return Math.max(0, Math.min(100, Math.round(energyScore)));
  };

  const getTrainingRecommendation = (energyLevel: number) => {
    if (energyLevel >= 85) {
      return "Energy levels are excellent. Ideal day for high-intensity intervals, threshold work, or long endurance sessions. Your body is showing optimal recovery capacity.";
    } else if (energyLevel >= 70) {
      return "Energy levels are very good. Well-suited for quality workouts like tempo runs, hill repeats, or medium-long runs. Your body is showing good recovery.";
    } else if (energyLevel >= 55) {
      return "Energy levels are moderate. Focus on aerobic endurance at an easy to moderate effort. Consider reducing intensity while maintaining planned volume.";
    } else if (energyLevel >= 40) {
      return "Energy levels are below average. Prioritize recovery with easy runs or cross-training. Reduce workout volume and avoid high-intensity efforts today.";
    } else {
      return "Energy levels are low. Your body needs recovery. Consider a rest day, gentle yoga, or very light activity. Prioritize extra sleep and proper nutrition.";
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
    if (level >= 85) return "text-green-500";
    if (level >= 70) return "text-yellow-500";
    if (level >= 55) return "text-orange-500";
    if (level >= 40) return "text-amber-500";
    return "text-red-500";
  };
  
  const getDataQualityIndicator = (metric: HealthMetric) => {
    // Count how many metrics are available
    let availableMetrics = 0;
    let totalMetrics = 0;
    
    // Check each metric
    if (metric.hrv_score !== null) { availableMetrics++; }
    totalMetrics++;
    
    if (metric.resting_heart_rate !== null) { availableMetrics++; }
    totalMetrics++;
    
    if (metric.sleep_quality !== null) { availableMetrics++; }
    totalMetrics++;
    
    if (metric.sleep_duration !== null) { availableMetrics++; }
    totalMetrics++;
    
    if (metric.stress_level !== null) { availableMetrics++; }
    totalMetrics++;
    
    // Calculate percentage of available data
    const dataCompleteness = (availableMetrics / totalMetrics) * 100;
    
    // Determine data quality text and color
    let qualityLabel: string;
    let qualityColor: string;
    
    if (dataCompleteness === 100) {
      qualityLabel = "Complete data";
      qualityColor = "text-green-500";
    } else if (dataCompleteness >= 80) {
      qualityLabel = "Good data quality";
      qualityColor = "text-green-400";
    } else if (dataCompleteness >= 60) {
      qualityLabel = "Moderate data quality";
      qualityColor = "text-yellow-500";
    } else if (dataCompleteness >= 40) {
      qualityLabel = "Limited data quality";
      qualityColor = "text-orange-500";
    } else {
      qualityLabel = "Poor data quality";
      qualityColor = "text-red-500";
    }
    
    return (
      <div className="flex items-center space-x-1 text-xs">
        <div className={`w-2 h-2 rounded-full ${qualityColor.replace('text-', 'bg-')}`}></div>
        <span className={`${qualityColor}`}>{qualityLabel}</span>
        <span className="text-gray-400">({availableMetrics}/{totalMetrics} metrics)</span>
      </div>
    );
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
                                    energyLevel >= 85 ? "#22c55e" :
                                    energyLevel >= 70 ? "#eab308" :
                                    energyLevel >= 55 ? "#f97316" :
                                    energyLevel >= 40 ? "#d97706" :
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
                        <div className="flex items-center mt-2">
                          <p className="text-sm font-medium">Energy Score</p>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground ml-1 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-80">
                                <div className="space-y-2">
                                  <p>Your Energy Score represents overall recovery and readiness to train, calculated from multiple biometric factors:</p>
                                  <ul className="list-disc pl-4 space-y-1">
                                    <li>HRV Score (30%): Higher is better</li>
                                    <li>Resting HR (25%): Lower is better</li>
                                    <li>Sleep Quality (20%): Higher is better</li>
                                    <li>Sleep Duration (15%): Higher is better</li>
                                    <li>Stress Level (10%): Lower is better</li>
                                  </ul>
                                  <p>Training recommendations are based on this score to help optimize your workouts and recovery.</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>

                      {/* Recommendation & Metrics */}
                      <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                          <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-100">
                            <Zap className={`w-4 h-4 mr-2 ${energyLevel ? getEnergyColor(energyLevel) : "text-gray-400"}`} />
                            <span className={`font-medium ${energyLevel ? getEnergyColor(energyLevel) : "text-gray-400"}`}>
                              {!energyLevel ? "No data" :
                                energyLevel >= 85 ? "Excellent Energy" :
                                energyLevel >= 70 ? "Very Good Energy" :
                                energyLevel >= 55 ? "Moderate Energy" :
                                energyLevel >= 40 ? "Below Average Energy" :
                                "Low Energy"
                              }
                            </span>
                          </div>
                          
                          {latestMetric && getDataQualityIndicator(latestMetric)}
                        </div>
                        <p className="text-sm text-muted-foreground">{recommendation}</p>
                        
                        {latestMetric && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                            <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center mb-1">
                                <Heart className="h-5 w-5 text-red-500" />
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground ml-1 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-72">
                                      <p>Heart Rate Variability (HRV) measures the variation between heartbeats. Higher HRV generally indicates better recovery and readiness to train. Elite athletes typically show higher values.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <div className="text-xl font-medium">{latestMetric.hrv_score || "-"}</div>
                              <div className="text-xs text-muted-foreground">HRV Score</div>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center mb-1">
                                <Heart className="h-5 w-5 text-purple-500" />
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground ml-1 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-72">
                                      <p>Resting Heart Rate is your heart rate when completely at rest. Lower values typically indicate better cardiovascular fitness. Elite endurance athletes often have RHR between 40-50 bpm.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <div className="text-xl font-medium">{latestMetric.resting_heart_rate || "-"}</div>
                              <div className="text-xs text-muted-foreground">Resting HR</div>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center mb-1">
                                <Moon className="h-5 w-5 text-blue-500" />
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground ml-1 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-72">
                                      <p>Sleep Quality rates how restorative your sleep was on a scale of 1-10. Quality sleep is essential for recovery and adaptation to training. Higher scores indicate better recovery potential.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
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
                          <RechartsTooltip />
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