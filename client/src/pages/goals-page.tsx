import { Sidebar } from "@/components/common/sidebar";
import { MobileMenu } from "@/components/common/mobile-menu";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { GoalAchievementDemo } from "@/components/goals/goal-achievement-demo";
import { TestAchievement } from "@/components/goals/test-achievement";
import { GoalVisualization } from "@/components/goals/goal-visualization";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { calculatePace, predictTime, formatTimeImprovement } from "@/lib/pace-calculator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import {
  Trophy,
  Calendar as CalendarIcon,
  Timer,
  Flag,
  Bookmark,
  Goal,
  ThumbsUp,
  MoreHorizontal,
  Heart,
  Clock,
  TrendingUp,
  Plus,
  Weight,
  Star,
  Award,
} from "lucide-react";

export default function GoalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("active");
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [newGoalType, setNewGoalType] = useState("race");
  const [raceDistance, setRaceDistance] = useState("5k");
  const [targetDate, setTargetDate] = useState<Date | undefined>(
    new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000) // ~3 months from now
  );
  const [targetTime, setTargetTime] = useState("");
  const [weightLossAmount, setWeightLossAmount] = useState("");
  const [startingWeight, setStartingWeight] = useState("");
  const [experience, setExperience] = useState("intermediate");
  
  // State for goal detail view
  const [selectedGoal, setSelectedGoal] = useState<any | null>(null);
  const [showGoalDetail, setShowGoalDetail] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Function to handle goal type changes and reset form fields appropriately
  const handleGoalTypeChange = (newType: string) => {
    setNewGoalType(newType);
    
    // Reset form fields based on the new goal type
    if (newType === "race") {
      setRaceDistance("5k");
      setTargetTime("00:25:00");
      setExperience("intermediate");
      // Keep the target date
    } else if (newType === "weight") {
      setStartingWeight("160");
      setWeightLossAmount("10");
      // Keep the target date
    } else if (newType === "fitness" || newType === "custom") {
      // Reset fields for fitness goals
      // Keep the target date
    }
  };

  // Fetch goals from API using React Query
  const { 
    data: goalsData = [], 
    isLoading: isLoadingGoals,
    error: goalsError,
    refetch: refetchGoals
  } = useQuery({
    queryKey: ['/api/goals'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/goals');
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }
      return response.json();
    },
    enabled: !!user // Only fetch if user is logged in
  });
  
  // Process the goals data
  const processGoalsData = (goals: any[]) => {
    // Map database schema to UI format
    return goals.map(goal => {
      // Common properties
      const processedGoal: any = {
        id: goal.id,
        type: goal.goal_type === 'race' ? 'race' : (goal.goal_type === 'weight_loss' ? 'weight' : 'custom'),
        targetDate: goal.target_date ? new Date(goal.target_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : undefined,
        progress: Math.floor(Math.random() * 100), // TODO: Calculate actual progress
        status: goal.status === 'completed' ? (Math.random() > 0.5 ? 'achieved' : 'exceeded') : 'on-track', // TODO: Calculate actual status
      };
      
      // Goal type specific properties
      if (processedGoal.type === 'race') {
        processedGoal.distance = goal.race_distance || '5K';
        processedGoal.targetTime = goal.target_time || '00:30:00';
        processedGoal.trainingPlan = `${goal.time_frame || '12'}-Week ${processedGoal.distance} Plan`;
      } else if (processedGoal.type === 'weight') {
        // For weight goals, calculate from weekly_mileage which was used to store current_weight
        const currentWeight = goal.weekly_mileage || 165;
        const targetValue = goal.target_value || 15;
        
        processedGoal.startingWeight = `${currentWeight} lbs`;
        processedGoal.targetWeight = `${currentWeight - targetValue} lbs`;
        processedGoal.currentWeight = `${Math.round(currentWeight - (targetValue * (processedGoal.progress / 100)))} lbs`;
      } else {
        // Custom goal
        processedGoal.title = "Custom fitness goal";
        processedGoal.target = `${goal.target_value || 100} ${goal.target_unit || 'miles'}`;
        processedGoal.actual = `${Math.round((goal.target_value || 100) * (processedGoal.progress / 100))} ${goal.target_unit || 'miles'}`;
      }
      
      // For completed goals
      if (goal.status === 'completed') {
        processedGoal.completedDate = goal.updated_at ? new Date(goal.updated_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : processedGoal.targetDate;
        
        if (processedGoal.type === 'race') {
          processedGoal.actualTime = processedGoal.status === 'achieved' ? 
            processedGoal.targetTime : 
            // Make it a bit better than target
            processedGoal.targetTime.replace(/^(\d+):(\d+):(\d+)$/, (_: string, h: string, m: string, s: string) => {
              return `${h}:${parseInt(m) - 2}:${s}`;
            });
        }
      }
      
      return processedGoal;
    });
  };
  
  // Split goals into active and completed
  const activeGoals = processGoalsData(goalsData.filter((goal: any) => goal.status === 'active'));
  const completedGoals = processGoalsData(goalsData.filter((goal: any) => goal.status === 'completed'));

  const handleCreateGoal = async () => {
    try {
      // Prepare the data based on the goal type
      let goalData: any = {
        primary_goal: newGoalType,
        goal_date: targetDate?.toISOString(),
      };
      
      if (newGoalType === "race") {
        goalData = {
          ...goalData,
          goal_event_type: raceDistance,
          goal_time: targetTime,
          has_target_race: true,
          experience_level: experience,
        };
      } else if (newGoalType === "weight") {
        goalData = {
          ...goalData,
          weight_goal: "weight_loss",
          current_weight: startingWeight,
          target_weight: (parseFloat(startingWeight) - parseFloat(weightLossAmount)).toString(),
        };
      }

      // Send the data to the API using our API request utility
      const response = await apiRequest('POST', '/api/goals', goalData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create goal');
      }
      
      toast({
        title: "Goal Created",
        description: `Your new ${newGoalType === "race" ? raceDistance + " race" : "weight loss"} goal has been created.`,
      });
      
      // Refresh the goals list
      refetchGoals();
      
      setCreateGoalOpen(false);
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create goal',
        variant: "destructive",
      });
    }
  };
  
  // Handler for viewing goal details and visualization
  const handleViewGoalDetails = (goal: any) => {
    setSelectedGoal(goal);
    setShowGoalDetail(true);
    setIsEditMode(false);
  };
  
  // Handler for closing goal details view
  const handleCloseGoalDetails = () => {
    setShowGoalDetail(false);
    setSelectedGoal(null);
    setIsEditMode(false);
  };
  
  // Handler for editing a goal
  const handleEditGoal = () => {
    setIsEditMode(true);
    
    // Pre-populate form fields based on the selected goal
    if (selectedGoal) {
      setNewGoalType(selectedGoal.type || "");
      
      if (selectedGoal.type === "race") {
        setRaceDistance(selectedGoal.distance || "");
        setTargetTime(selectedGoal.targetTime || "");
        setExperience(selectedGoal.experience || "intermediate");
        
        // Convert target date string to Date object if it exists
        if (selectedGoal.targetDate) {
          setTargetDate(new Date(selectedGoal.targetDate));
        }
      } else if (selectedGoal.type === "weight") {
        setStartingWeight(selectedGoal.startingWeight || "");
        setWeightLossAmount((parseFloat(selectedGoal.startingWeight) - parseFloat(selectedGoal.targetWeight)).toString() || "");
        
        // Convert target date string to Date object if it exists
        if (selectedGoal.targetDate) {
          setTargetDate(new Date(selectedGoal.targetDate));
        }
      }
    }
  };
  
  // Handler for updating a goal
  const handleUpdateGoal = async () => {
    if (!selectedGoal) return;
    
    try {
      // Prepare the data based on the goal type
      let goalData: any = {
        goal_type: newGoalType,
        target_date: targetDate?.toISOString(),
      };
      
      if (newGoalType === "race") {
        goalData = {
          ...goalData,
          race_distance: raceDistance,
          target_time: targetTime,
          experience_level: experience,
        };
      } else if (newGoalType === "weight") {
        const targetWeight = (parseFloat(startingWeight) - parseFloat(weightLossAmount)).toString();
        goalData = {
          ...goalData,
          target_value: targetWeight,
          target_unit: "lbs",
        };
      }
      
      // Send the data to the API
      const response = await apiRequest('PUT', `/api/goals/${selectedGoal.id}`, goalData);
      
      if (!response.ok) {
        throw new Error('Failed to update goal');
      }
      
      // Get the updated goal data
      const updatedGoalFromApi = await response.json();
      
      // Transform API format to UI format
      const transformedGoal = {
        ...selectedGoal,
        type: updatedGoalFromApi.goal_type,
        targetDate: updatedGoalFromApi.target_date
      };
      
      // Add type-specific properties
      if (updatedGoalFromApi.goal_type === 'race') {
        transformedGoal.distance = updatedGoalFromApi.race_distance;
        transformedGoal.targetTime = updatedGoalFromApi.target_time;
        transformedGoal.experience = updatedGoalFromApi.experience_level;
      } else if (updatedGoalFromApi.goal_type === 'weight') {
        transformedGoal.targetWeight = updatedGoalFromApi.target_value;
        
        // If we have the weight loss amount and starting weight, update them too
        if (startingWeight) {
          transformedGoal.startingWeight = startingWeight;
          
          // Calculate weight difference
          if (transformedGoal.targetWeight) {
            transformedGoal.weightLossAmount = (
              parseFloat(startingWeight) - parseFloat(transformedGoal.targetWeight)
            ).toString();
          }
        }
      }
      
      toast({
        title: "Goal updated",
        description: "Your goal has been successfully updated."
      });
      
      // Update selected goal with new data
      setSelectedGoal(transformedGoal);
      
      // Refresh goals data and reset form
      refetchGoals();
      setIsEditMode(false);
    } catch (error: any) {
      toast({
        title: "Error updating goal",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on-track":
        return <Badge className="bg-green-100 text-green-800">On Track</Badge>;
      case "at-risk":
        return <Badge className="bg-yellow-100 text-yellow-800">At Risk</Badge>;
      case "behind":
        return <Badge className="bg-red-100 text-red-800">Behind</Badge>;
      case "achieved":
        return <Badge className="bg-blue-100 text-blue-800">Achieved</Badge>;
      case "exceeded":
        return <Badge className="bg-purple-100 text-purple-800">Exceeded</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getGoalTypeIcon = (type: string, className?: string) => {
    const iconClass = className || "h-5 w-5";
    switch (type) {
      case "race":
        return <Flag className={iconClass} />;
      case "weight":
        return <Weight className={iconClass} />;
      case "custom":
        return <Goal className={iconClass} />;
      default:
        return <Star className={iconClass} />;
    }
  };

  const getRaceDistanceBadge = (distance: string) => {
    switch (distance) {
      case "5K":
        return <Badge className="bg-primary/20 text-primary">5K</Badge>;
      case "10K":
        return <Badge className="bg-primary/20 text-primary">10K</Badge>;
      case "Half Marathon":
        return <Badge className="bg-blue-100 text-blue-800">Half Marathon</Badge>;
      case "Marathon":
        return <Badge className="bg-purple-100 text-purple-800">Marathon</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{distance}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700">
      <div className="flex h-screen max-w-full overflow-hidden">
        <Sidebar style={{display: "flex"}} />
        <MobileMenu />

        <main className="flex-1 overflow-y-auto pt-0 md:pt-4 pb-16 md:pb-4 px-4 md:px-6">
          {/* For mobile view padding to account for fixed header */}
          <div className="md:hidden pt-20"></div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold font-heading text-white">Goals</h1>
              <p className="text-white/80 mt-1">Set and track your running goals</p>
            </div>
          <div className="mt-4 md:mt-0">
            <Dialog open={createGoalOpen} onOpenChange={setCreateGoalOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Goal</DialogTitle>
                  <DialogDescription>Set a new goal to help drive your training</DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="race" value={newGoalType} onValueChange={handleGoalTypeChange} className="mt-4">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="race" className="flex items-center">
                      <Flag className="mr-2 h-4 w-4" />
                      Race Goal
                    </TabsTrigger>
                    <TabsTrigger value="weight" className="flex items-center">
                      <Weight className="mr-2 h-4 w-4" />
                      Weight Loss
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="race" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="race-distance">Race Distance</Label>
                      <Select value={raceDistance} onValueChange={setRaceDistance}>
                        <SelectTrigger id="race-distance">
                          <SelectValue placeholder="Select distance" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5k">5K</SelectItem>
                          <SelectItem value="10k">10K</SelectItem>
                          <SelectItem value="half-marathon">Half Marathon</SelectItem>
                          <SelectItem value="marathon">Marathon</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Target Race Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {targetDate ? format(targetDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={targetDate}
                            onSelect={setTargetDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="target-time">Target Time</Label>
                      <Input
                        id="target-time"
                        placeholder="e.g. 00:45:00"
                        value={targetTime}
                        onChange={(e) => setTargetTime(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Format: hh:mm:ss</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="experience-level">Experience Level</Label>
                      <Select value={experience} onValueChange={setExperience}>
                        <SelectTrigger id="experience-level">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="weight" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-weight">Current Weight (lbs)</Label>
                      <Input
                        id="current-weight"
                        type="number"
                        placeholder="e.g. 170"
                        value={startingWeight}
                        onChange={(e) => setStartingWeight(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="weight-loss">Target Weight Loss (lbs)</Label>
                      <Input
                        id="weight-loss"
                        type="number"
                        placeholder="e.g. 15"
                        value={weightLossAmount}
                        onChange={(e) => setWeightLossAmount(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Target Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {targetDate ? format(targetDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={targetDate}
                            onSelect={setTargetDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      We'll generate a personalized running plan to help you reach your weight loss goal
                    </p>
                  </TabsContent>
                </Tabs>
                
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setCreateGoalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGoal}>Create Goal</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Goals Content */}
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="active" className="flex items-center">
                <Flag className="mr-2 h-4 w-4" />
                Active Goals
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center">
                <ThumbsUp className="mr-2 h-4 w-4" />
                Completed
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center">
                <Award className="mr-2 h-4 w-4" />
                Achievements
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="active">
            {isLoadingGoals ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-neutral-medium">Loading your goals...</p>
                </CardContent>
              </Card>
            ) : goalsError ? (
              <Card>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2 text-red-500">Error loading goals</h3>
                  <p className="text-neutral-medium mb-4">There was a problem loading your goals. Please try again.</p>
                  <Button onClick={() => refetchGoals()}>Retry</Button>
                </CardContent>
              </Card>
            ) : activeGoals.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">No active goals</h3>
                  <p className="text-neutral-medium mb-4">Create your first goal to start tracking your progress</p>
                  <Button onClick={() => setCreateGoalOpen(true)}>Create Goal</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeGoals.map((goal) => (
                  <Card key={goal.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          {getGoalTypeIcon(goal.type)}
                          <CardTitle className="ml-2 text-lg font-semibold">
                            {goal.type === "race" ? goal.distance : "Weight Loss Goal"}
                          </CardTitle>
                        </div>
                        {getStatusBadge(goal.status)}
                      </div>
                      {goal.type === "race" && (
                        <CardDescription>
                          Target: {goal.targetTime} • {goal.targetDate}
                        </CardDescription>
                      )}
                      {goal.type === "weight" && (
                        <CardDescription>
                          {goal.startingWeight} → {goal.targetWeight}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex flex-col space-y-1 mt-2">
                        <div className="flex justify-between text-sm">
                          <span>{goal.progress}% Complete</span>
                          <span>
                            {goal.type === "race" ? goal.trainingPlan :
                              `Current: ${goal.currentWeight}`}
                          </span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                      </div>
                      
                      <div className="flex items-center mt-4 text-sm text-muted-foreground">
                        {goal.type === "race" ? (
                          <>
                            <Clock className="h-4 w-4 mr-1.5" />
                            <span>Training on schedule</span>
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-4 w-4 mr-1.5" />
                            <span>-8 lbs so far</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 justify-between">
                      <Button variant="ghost" size="sm">Edit Goal</Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewGoalDetails(goal)}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed">
            {/* Achievement Demo Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Goal Achievement Celebrations</h3>
              <GoalAchievementDemo />
            </div>
            
            <h3 className="text-xl font-semibold mb-4">Completed Goals</h3>
            {isLoadingGoals ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-neutral-medium">Loading completed goals...</p>
                </CardContent>
              </Card>
            ) : goalsError ? (
              <Card>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2 text-red-500">Error loading goals</h3>
                  <p className="text-neutral-medium mb-4">There was a problem loading your goals. Please try again.</p>
                  <Button onClick={() => refetchGoals()}>Retry</Button>
                </CardContent>
              </Card>
            ) : completedGoals.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">No completed goals yet</h3>
                  <p className="text-neutral-medium">Complete your first goal to see it here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {completedGoals.map((goal) => (
                  <Card key={goal.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          {getGoalTypeIcon(goal.type)}
                          <CardTitle className="ml-2 text-lg font-semibold">
                            {goal.type === "race" ? goal.distance : goal.title}
                          </CardTitle>
                        </div>
                        {getStatusBadge(goal.status)}
                      </div>
                      <CardDescription>
                        Completed: {goal.completedDate}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="mt-2 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-neutral-50 p-2 rounded-md">
                            <div className="text-xs text-neutral-500">Target</div>
                            <div className="font-medium">
                              {goal.type === "race" ? goal.targetTime : goal.target}
                            </div>
                          </div>
                          <div className="bg-neutral-50 p-2 rounded-md">
                            <div className="text-xs text-neutral-500">Actual</div>
                            <div className="font-medium">
                              {goal.type === "race" ? goal.actualTime : goal.actual}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center mt-4 text-sm text-muted-foreground">
                        <Award className="h-4 w-4 mr-1.5 text-yellow-500" />
                        <span>
                          {goal.status === "achieved" ? "Goal achieved! Great work!" : "Goal exceeded! Outstanding!"}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleViewGoalDetails(goal)}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="achievements">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Achievement Test Interface</CardTitle>
                  <CardDescription>
                    Use this interface to test the achievement popup functionality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TestAchievement />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        {/* Goal Detail Dialog */}
        <Dialog open={showGoalDetail} onOpenChange={setShowGoalDetail}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {selectedGoal && (
                  <>
                    {getGoalTypeIcon(selectedGoal.type, "h-5 w-5 mr-2")}
                    {selectedGoal.type === "race" 
                      ? `${selectedGoal.distance} Race Goal` 
                      : selectedGoal.type === "weight" 
                        ? "Weight Loss Goal" 
                        : selectedGoal.title}
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {selectedGoal && !isEditMode && (
                  <>
                    {selectedGoal.status && getStatusBadge(selectedGoal.status)}
                    <span className="ml-2">
                      {selectedGoal.type === "race" 
                        ? `Target: ${selectedGoal.targetTime}` 
                        : selectedGoal.type === "weight" 
                          ? `Target: ${selectedGoal.targetWeight}` 
                          : selectedGoal.target}
                    </span>
                  </>
                )}
                {isEditMode && selectedGoal && (
                  <span className="text-amber-500">Editing goal details</span>
                )}
              </DialogDescription>
            </DialogHeader>

            {selectedGoal && !isEditMode && (
              <div className="py-4">
                {/* Goal stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="bg-neutral-50 rounded-lg p-3">
                    <div className="text-sm text-neutral-500 mb-1">Status</div>
                    <div className="font-semibold flex items-center">
                      {selectedGoal.status === "on-track" && <ThumbsUp className="w-4 h-4 mr-1 text-green-500" />}
                      {selectedGoal.status === "at-risk" && <Clock className="w-4 h-4 mr-1 text-yellow-500" />}
                      {selectedGoal.status === "behind" && <ThumbsUp className="w-4 h-4 mr-1 text-red-500" />}
                      {selectedGoal.status === "achieved" && <Award className="w-4 h-4 mr-1 text-blue-500" />}
                      {selectedGoal.status === "exceeded" && <Trophy className="w-4 h-4 mr-1 text-purple-500" />}
                      {selectedGoal.status.charAt(0).toUpperCase() + selectedGoal.status.slice(1).replace('-', ' ')}
                    </div>
                  </div>
                  
                  <div className="bg-neutral-50 rounded-lg p-3">
                    <div className="text-sm text-neutral-500 mb-1">
                      {selectedGoal.completedDate ? "Completed" : "Target Date"}
                    </div>
                    <div className="font-semibold">
                      {selectedGoal.completedDate || selectedGoal.targetDate}
                    </div>
                  </div>
                  
                  {selectedGoal.progress !== undefined && (
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <div className="text-sm text-neutral-500 mb-1">Progress</div>
                      <div className="font-semibold">{selectedGoal.progress}%</div>
                    </div>
                  )}
                  
                  {selectedGoal.type === "race" && (
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <div className="text-sm text-neutral-500 mb-1">
                        {selectedGoal.actualTime ? "Actual Time" : "Target Time"}
                      </div>
                      <div className="font-semibold">
                        {selectedGoal.actualTime || selectedGoal.targetTime}
                      </div>
                    </div>
                  )}
                  
                  {selectedGoal.type === "weight" && (
                    <>
                      <div className="bg-neutral-50 rounded-lg p-3">
                        <div className="text-sm text-neutral-500 mb-1">Starting Weight</div>
                        <div className="font-semibold">{selectedGoal.startingWeight}</div>
                      </div>
                      
                      <div className="bg-neutral-50 rounded-lg p-3">
                        <div className="text-sm text-neutral-500 mb-1">Current Weight</div>
                        <div className="font-semibold">{selectedGoal.currentWeight}</div>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Goal Visualization Component */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Interactive Goal Visualization</h3>
                  <GoalVisualization goal={selectedGoal} />
                </div>
                
                {/* Race pace prediction section */}
                {selectedGoal.type === "race" && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Race Predictions</h3>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">Target Pace: {calculatePace(selectedGoal.targetTime || "00:25:00", selectedGoal.distance || "5k")}</CardTitle>
                        <CardDescription>
                          Equivalent performances at other distances
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedGoal.distance !== "5k" && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">5K:</span>
                              <span className="font-medium">
                                {predictTime(selectedGoal.targetTime || "00:25:00", selectedGoal.distance || "10k", "5k")}
                              </span>
                            </div>
                          )}
                          {selectedGoal.distance !== "10k" && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">10K:</span>
                              <span className="font-medium">
                                {predictTime(selectedGoal.targetTime || "00:25:00", selectedGoal.distance || "5k", "10k")}
                              </span>
                            </div>
                          )}
                          {selectedGoal.distance !== "half-marathon" && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Half Marathon:</span>
                              <span className="font-medium">
                                {predictTime(selectedGoal.targetTime || "00:25:00", selectedGoal.distance || "5k", "half-marathon")}
                              </span>
                            </div>
                          )}
                          {selectedGoal.distance !== "marathon" && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Marathon:</span>
                              <span className="font-medium">
                                {predictTime(selectedGoal.targetTime || "00:25:00", selectedGoal.distance || "5k", "marathon")}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                {/* Training plan section for active race goals */}
                {selectedGoal.type === "race" && selectedGoal.trainingPlan && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Training Plan</h3>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">{selectedGoal.trainingPlan}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-neutral-medium">
                          Your personalized training plan to help you reach your race goal. 
                          Includes a mix of easy runs, tempo work, and long runs to build endurance and speed.
                        </p>
                        <Button variant="outline" size="sm" className="mt-3">
                          <Bookmark className="w-4 h-4 mr-2" />
                          View Full Plan
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                {/* Related activities section */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Related Activities</h3>
                  {selectedGoal.type === "race" ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <div>
                          <div className="font-medium">Long Run</div>
                          <div className="text-sm text-neutral-500">Jul 23, 2023</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">10.2 miles</div>
                          <div className="text-sm text-neutral-500">1:32:45</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <div>
                          <div className="font-medium">Tempo Run</div>
                          <div className="text-sm text-neutral-500">Jul 19, 2023</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">6 miles</div>
                          <div className="text-sm text-neutral-500">48:12</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <div>
                          <div className="font-medium">Weight Check-in</div>
                          <div className="text-sm text-neutral-500">Jul 28, 2023</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">157 lbs</div>
                          <div className="text-sm text-neutral-500">-2 lbs (week)</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <div>
                          <div className="font-medium">Weight Check-in</div>
                          <div className="text-sm text-neutral-500">Jul 21, 2023</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">159 lbs</div>
                          <div className="text-sm text-neutral-500">-1.5 lbs (week)</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Notes and recommendations */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Coach's Notes</h3>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm">
                        {selectedGoal.type === "race" ? (
                          selectedGoal.status === "achieved" || selectedGoal.status === "exceeded" ? (
                            "Congratulations on completing your race goal! You've shown great dedication and progress in your training. Consider setting a more challenging goal for your next race."
                          ) : (
                            "Your training is progressing well. Continue to focus on consistent weekly mileage and don't forget to incorporate recovery days. Your long runs are key to building endurance for race day."
                          )
                        ) : (
                          selectedGoal.status === "achieved" || selectedGoal.status === "exceeded" ? (
                            "Great job reaching your weight loss target! Focus now on maintaining your progress with a sustainable nutrition and exercise routine."
                          ) : (
                            "You're making steady progress toward your weight loss goal. Remember that consistency is key - both with your running schedule and nutrition choices."
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            
            {selectedGoal && isEditMode && (
              <div className="py-4">
                <div className="space-y-4 p-4 border rounded-lg bg-neutral-50">
                  <div className="space-y-2">
                    <Label htmlFor="goal-type">Goal Type</Label>
                    <Select 
                      value={newGoalType}
                      onValueChange={handleGoalTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a goal type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="race">Race</SelectItem>
                        <SelectItem value="weight">Weight Loss</SelectItem>
                        <SelectItem value="fitness">General Fitness</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Changing goal type will reset specific goal settings</p>
                  </div>
                  
                  {newGoalType === "race" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="race-distance">Race Distance</Label>
                        <Select 
                          value={raceDistance}
                          onValueChange={setRaceDistance}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select race distance" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5k">5K</SelectItem>
                            <SelectItem value="10k">10K</SelectItem>
                            <SelectItem value="half-marathon">Half Marathon</SelectItem>
                            <SelectItem value="marathon">Marathon</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="target-time">Target Time (hh:mm:ss)</Label>
                        <Input 
                          id="target-time" 
                          value={targetTime}
                          onChange={(e) => setTargetTime(e.target.value)}
                          placeholder="e.g. 1:45:30" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="experience">Experience Level</Label>
                        <Select 
                          value={experience}
                          onValueChange={setExperience}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  
                  {newGoalType === "weight" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="starting-weight">Current Weight (lbs)</Label>
                        <Input 
                          id="starting-weight" 
                          value={startingWeight}
                          onChange={(e) => setStartingWeight(e.target.value)}
                          placeholder="e.g. 180" 
                          type="number"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="weight-loss">Weight Loss Goal (lbs)</Label>
                        <Input 
                          id="weight-loss" 
                          value={weightLossAmount}
                          onChange={(e) => setWeightLossAmount(e.target.value)}
                          placeholder="e.g. 15" 
                          type="number"
                        />
                        <p className="text-xs text-muted-foreground">
                          Target Weight: {startingWeight && weightLossAmount 
                          ? (parseFloat(startingWeight) - parseFloat(weightLossAmount)).toFixed(1) 
                          : '---'} lbs
                        </p>
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="target-date">Target Date</Label>
                    <Input 
                      id="target-date" 
                      value={targetDate?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setTargetDate(new Date(e.target.value))}
                      type="date" 
                    />
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseGoalDetails}>Close</Button>
              {isEditMode ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditMode(false)}>Cancel</Button>
                  <Button onClick={handleUpdateGoal}>Save Changes</Button>
                </>
              ) : (
                selectedGoal && !selectedGoal.completedDate && (
                  <Button onClick={handleEditGoal}>Edit Goal</Button>
                )
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      </div>
    </div>
  );
}