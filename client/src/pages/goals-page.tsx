import { Sidebar } from "@/components/common/sidebar";
import { MobileMenu } from "@/components/common/mobile-menu";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
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

  // Mock active goals data
  const activeGoals = [
    {
      id: 1,
      type: "race",
      distance: "Half Marathon",
      targetDate: "Nov 15, 2023",
      targetTime: "1:45:00",
      progress: 68,
      trainingPlan: "12-Week Half Marathon Plan",
      status: "on-track",
    },
    {
      id: 2,
      type: "weight",
      targetWeight: "150 lbs",
      startingWeight: "165 lbs",
      currentWeight: "157 lbs",
      progress: 53,
      status: "on-track",
    },
  ];

  // Mock completed goals data
  const completedGoals = [
    {
      id: 3,
      type: "race",
      distance: "10K",
      completedDate: "Jul 4, 2023",
      targetTime: "45:00",
      actualTime: "44:32",
      status: "achieved",
    },
    {
      id: 4,
      type: "custom",
      title: "Run 100 miles in July",
      completedDate: "Jul 31, 2023",
      target: "100 miles",
      actual: "112 miles",
      status: "exceeded",
    },
  ];

  const handleCreateGoal = () => {
    // In a real app, this would send data to an API
    toast({
      title: "Goal Created",
      description: `Your new ${newGoalType === "race" ? raceDistance + " race" : "weight loss"} goal has been created.`,
    });
    setCreateGoalOpen(false);
  };
  
  // Handler for viewing goal details
  const handleViewGoalDetails = (goal: any) => {
    setSelectedGoal(goal);
    setShowGoalDetail(true);
  };
  
  // Handler for closing goal details view
  const handleCloseGoalDetails = () => {
    setShowGoalDetail(false);
    setSelectedGoal(null);
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
    <div className="flex h-screen max-w-full overflow-hidden">
      <Sidebar />
      <MobileMenu />

      <main className="flex-1 overflow-y-auto bg-neutral-lighter pt-0 md:pt-4 pb-16 md:pb-4 px-4 md:px-6">
        {/* For mobile view padding to account for fixed header */}
        <div className="md:hidden pt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading text-neutral-darker">Goals</h1>
            <p className="text-neutral-medium mt-1">Set and track your running goals</p>
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
                
                <Tabs defaultValue="race" value={newGoalType} onValueChange={setNewGoalType} className="mt-4">
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
            </TabsList>
          </div>
          
          <TabsContent value="active">
            {activeGoals.length === 0 ? (
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
            {completedGoals.length === 0 ? (
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
        </Tabs>
        {/* Goal Detail Dialog */}
        <Dialog open={showGoalDetail} onOpenChange={setShowGoalDetail}>
          <DialogContent className="max-w-3xl">
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
                {selectedGoal && (
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
              </DialogDescription>
            </DialogHeader>

            {selectedGoal && (
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
                
                {/* Progress charts or related activities would go here */}
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
            
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseGoalDetails}>Close</Button>
              {selectedGoal && !selectedGoal.completedDate && (
                <Button>Edit Goal</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}