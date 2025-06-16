import { useState, useEffect } from 'react';
import { Sidebar } from "@/components/common/sidebar";
import { MobileMenu } from "@/components/common/mobile-menu";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BookUser, Sparkles, Loader2, Check, Zap, Crown } from "lucide-react";
import { TrainingGoalOverview } from "@/components/training-plan/training-goal-overview";
import { TrainingPlanCalendar } from "@/components/training-plan/training-plan-calendar-new";
import { WorkoutDetailView } from "@/components/training-plan/workout-detail-view";
import { AIPlanGenerator } from "@/components/training-plan/ai-plan-generator";
import PlanAdjustmentTool from "@/components/training-plan/plan-adjustment-tool";
import { TrainingPlanRestrictions } from "@/components/training-plan/training-plan-restrictions";
import { StrengthTrainingSuggestion } from "@/components/training-plan/strength-training-suggestion";
import { CoachSelection } from "@/components/coaching/coach-selection";
import { CoachChat } from "@/components/coaching/coach-chat";
import { CoachBriefing } from "@/components/coaching/coach-briefing";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Coach, TrainingPlan } from '@shared/schema';
import { TrainingPlan as AITrainingPlan, PlanAdjustment } from '@/lib/ai-service';

// Interface for selected workout
interface Workout {
  id: number;
  type: string;
  description: string;
  duration: string;
  distance?: string;
  intensity: 'easy' | 'moderate' | 'hard' | 'recovery' | 'race';
  completed: boolean;
  warmUp?: string;
  mainSet?: string[];
  coolDown?: string;
  notes?: string;
}

export default function TrainingPlanPage() {
  const { hasSubscription, subscriptionType } = useSubscription();
  const hasAnnualSubscription = subscriptionType === 'annual';
  
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [coachView, setCoachView] = useState<'select' | 'chat'>('select');
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [coachSessionId, setCoachSessionId] = useState<string>('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [aiPlan, setAiPlan] = useState<AITrainingPlan | null>(null);
  const [planAdjustment, setPlanAdjustment] = useState<PlanAdjustment | null>(null);
  const [weekWorkouts, setWeekWorkouts] = useState<Array<{
    date: Date;
    workoutType: string;
    intensity: "easy" | "moderate" | "hard" | "rest" | "recovery";
    completed: boolean;
  }>>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Check if user has premium access
  const isPremiumUser = hasSubscription || user?.role === 'admin';
  
  // Fetch saved training plan
  const { data: savedTrainingPlan } = useQuery({
    queryKey: ['/api/training/saved-plan', user?.id],
    enabled: !!user?.id,
    retry: false,
  });
  
  // Check if user already has a generated plan
  const hasExistingPlan = savedTrainingPlan && (savedTrainingPlan as any)?.plan_data;
  
  // Mutation to clear saved training plan
  const clearTrainingPlan = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/training/saved-plan/${user?.id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/training/saved-plan', user?.id] });
      toast({
        title: "Training plan cleared",
        description: "You can now generate a new training plan.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear training plan. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Fetch available coaches
  const { 
    data: coaches = [] as Coach[], 
    isLoading: isLoadingCoaches,
    error: coachesError
  } = useQuery<Coach[]>({
    queryKey: ['/api/coaches'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/coaches');
      if (!response.ok) {
        throw new Error('Failed to fetch coaches');
      }
      return response.json();
    },
    enabled: selectedTab === 'coach'
  });
  
  // Fetch active coaching sessions
  const { 
    data: coachingSessions = [], 
    isLoading: isLoadingSessions
  } = useQuery({
    queryKey: ['/api/coaching-sessions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/coaching-sessions');
      if (!response.ok) {
        if (response.status === 403) {
          // User doesn't have a subscription
          return [];
        }
        throw new Error('Failed to fetch coaching sessions');
      }
      return response.json();
    },
    enabled: selectedTab === 'coach' && !!user
  });
  
  // Set up active session if available
  useEffect(() => {
    if (coachingSessions.length > 0 && selectedTab === 'coach') {
      const activeSession = coachingSessions[0]; // Most recent session
      
      // Find the coach for this session
      const sessionCoach = coaches.find((c: Coach) => c.id === activeSession.coach_id);
      if (sessionCoach) {
        setSelectedCoach(sessionCoach);
        setCoachSessionId(activeSession.id.toString());
        setCoachView('chat');
      }
    }
  }, [coachingSessions, coaches, selectedTab]);

  // Handle workout selection
  const handleWorkoutClick = (workout: Workout) => {
    setSelectedWorkout(workout);
  };

  // Return to calendar view
  const handleBackToCalendar = () => {
    setSelectedWorkout(null);
  };
  
  // Handle coach selection
  const handleCoachSelected = (coach: Coach, sessionId: string) => {
    setSelectedCoach(coach);
    setCoachSessionId(sessionId);
    setCoachView('chat');
  };
  
  // Back to coach selection
  const handleBackToCoachSelect = () => {
    setCoachView('select');
    setSelectedCoach(null);
    setCoachSessionId('');
  };
  
  // Handle AI training plan generation
  const handlePlanGenerated = (plan: AITrainingPlan) => {
    setAiPlan(plan);
    setIsGeneratingPlan(false);
    
    // Switch to schedule tab to show the generated plan
    setSelectedTab('schedule');
    
    // Would normally save the plan to the database here
  };
  
  // Handle AI plan adjustments
  const handlePlanAdjustment = (adjustedPlan: AITrainingPlan, insights: PlanAdjustment) => {
    setAiPlan(adjustedPlan);
    setPlanAdjustment(insights);
    
    toast({
      title: "Plan Adjusted Successfully",
      description: "Your training plan has been adjusted based on your performance data!",
    });
    
    // Switch to schedule tab to show the adjusted plan
    setSelectedTab('schedule');
    
    // Would normally save the adjusted plan and insights to the database here
  };
  
  // Check if user has active subscription (already defined above)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700">
      <div className="flex h-screen max-w-full overflow-hidden">
        <Sidebar />
        <MobileMenu />

        <main className="flex-1 overflow-y-auto pt-0 md:pt-4 pb-16 md:pb-4 px-4 md:px-6">
          {/* For mobile view padding to account for fixed header */}
          <div className="md:hidden pt-20"></div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold font-heading text-white drop-shadow-sm">Training Plan</h1>
              <p className="text-white/80 mt-1 drop-shadow-sm">View and manage your personalized training schedule</p>
            </div>
          
          {selectedTab === "schedule" && selectedWorkout && (
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Button 
                variant="outline" 
                onClick={handleBackToCalendar}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Schedule
              </Button>
            </div>
          )}
          
          {selectedTab === "coach" && coachView === 'chat' && (
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Button 
                variant="outline" 
                onClick={handleBackToCoachSelect}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Coaches
              </Button>
            </div>
          )}
          

        </div>

        {/* Training Plan Content */}
        <Tabs defaultValue="overview" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="ai-plan">AI Plan</TabsTrigger>
            <TabsTrigger value="adjust-plan" className="flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Adjust Plan
            </TabsTrigger>
            <TabsTrigger value="coach" className="flex items-center">
              <BookUser className="w-4 h-4 mr-2" />
              Human Coach
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <TrainingGoalOverview />
            
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-white drop-shadow-md">Training Plan Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                  <div className="text-sm text-white/80 font-medium mb-1 drop-shadow-md">Weekly Mileage</div>
                  <div className="text-2xl font-bold text-white drop-shadow-md">{aiPlan?.overview?.weeklyMileage || "32 miles"}</div>
                </div>
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                  <div className="text-sm text-white/80 font-medium mb-1 drop-shadow-md">Workouts Per Week</div>
                  <div className="text-2xl font-bold text-white drop-shadow-md">{aiPlan?.overview?.workoutsPerWeek || "5"} sessions</div>
                </div>
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                  <div className="text-sm text-white/80 font-medium mb-1 drop-shadow-md">Long Run</div>
                  <div className="text-2xl font-bold text-white drop-shadow-md">{aiPlan?.overview?.longRunDistance || "12 miles"}</div>
                </div>
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                  <div className="text-sm text-white/80 font-medium mb-1 drop-shadow-md">Quality Workouts</div>
                  <div className="text-2xl font-bold text-white drop-shadow-md">{aiPlan?.overview?.qualityWorkouts || "2"} per week</div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3 text-white drop-shadow-md">Training Philosophy</h3>
                <p className="text-white/80 drop-shadow-md">
                  {aiPlan?.philosophy || 
                  `This plan follows a balanced approach with progressive overload to prepare you for your marathon goal.
                  It includes a mix of easy running, speed work, tempo runs, and essential long runs, with appropriate recovery 
                  periods to maximize adaptation while minimizing injury risk.`}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="schedule">
            {selectedWorkout ? (
              <WorkoutDetailView />
            ) : (
              <>
                <TrainingPlanCalendar 
                  onWorkoutClick={handleWorkoutClick} 
                  hasSubscription={hasSubscription}
                  onWeekWorkoutsGenerated={setWeekWorkouts}
                />
                
                {/* Add strength training suggestion component */}
                {hasSubscription && weekWorkouts.length > 0 && (
                  <StrengthTrainingSuggestion
                    currentWeekSchedule={weekWorkouts}
                  />
                )}
                
                {!hasSubscription && aiPlan && (
                  <div className="mt-6 bg-yellow-400/20 backdrop-blur-lg border border-yellow-300/30 rounded-xl p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-yellow-400/30 p-2 rounded-full">
                        <Sparkles className="h-5 w-5 text-yellow-200 drop-shadow-md" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-1 text-white drop-shadow-md">Training Plan Preview</h3>
                        <p className="text-sm text-white/80 mb-4 drop-shadow-md">
                          Free users can view the first week of their training plan in detail. Upgrade to premium for the full plan with {aiPlan.weeklyPlans?.length || 'multiple'} weeks of detailed workouts, nutrition advice, and more.
                        </p>
                        <Button 
                          onClick={() => setSelectedTab("subscription")}
                          className="flex items-center"
                          size="sm"
                        >
                          Upgrade to Premium
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="ai-plan">
            <TrainingPlanRestrictions 
              hasExistingPlan={hasExistingPlan}
              isPremiumUser={isPremiumUser}
              onClearPlan={() => clearTrainingPlan.mutate()}
            />
            
            {/* Only show generator if user has premium access and no existing plan */}
            {isPremiumUser && !hasExistingPlan && (
              <div className="mt-6">
                <AIPlanGenerator 
                  onPlanGenerated={(plan) => {
                    handlePlanGenerated(plan);
                    setIsGeneratingPlan(true);
                  }} 
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="adjust-plan">
            {!hasSubscription ? (
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl p-8 text-center max-w-2xl mx-auto">
                <Zap className="h-12 w-12 mx-auto text-yellow-300 mb-4 drop-shadow-md" />
                <h2 className="text-2xl font-bold mb-2 text-white drop-shadow-md">Premium Feature</h2>
                <p className="text-white/80 mb-6 drop-shadow-md">
                  Get smart adjustments to your training plan based on your performance data, biometrics, and feedback.
                  <ul className="mt-3 space-y-1 text-left max-w-md mx-auto">
                    <li className="flex items-center">
                      <span className="bg-yellow-400/30 text-yellow-200 p-1 rounded-full mr-2 flex-shrink-0">
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="text-white/80">AI-powered plan adjustments</span>
                    </li>
                    <li className="flex items-center">
                      <span className="bg-yellow-400/30 text-yellow-200 p-1 rounded-full mr-2 flex-shrink-0">
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="text-white/80">Performance data analysis</span>
                    </li>
                    <li className="flex items-center">
                      <span className="bg-yellow-400/30 text-yellow-200 p-1 rounded-full mr-2 flex-shrink-0">
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="text-white/80">Personalized recommendations</span>
                    </li>
                  </ul>
                </p>
                <Button 
                  size="lg"
                  asChild
                >
                  <Link href="/subscription">Upgrade to Premium</Link>
                </Button>
              </div>
            ) : (
              <PlanAdjustmentTool onAdjustmentComplete={handlePlanAdjustment} />
            )}
          </TabsContent>

          {/* Human Coach Tab */}
          <TabsContent value="coach" className="space-y-6">
            {!hasAnnualSubscription ? (
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl p-8 text-center max-w-2xl mx-auto">
                <Crown className="h-12 w-12 mx-auto text-yellow-300 drop-shadow-md mb-4" />
                <h2 className="text-2xl font-bold mb-2 text-white drop-shadow-md">Annual Premium Required</h2>
                <p className="text-white/70 drop-shadow-md mb-6">
                  Human coach access is available only for Annual Premium subscribers. Get personalized guidance from certified running coaches.
                </p>
                <ul className="text-left mb-6 space-y-2 text-white/70 drop-shadow-md">
                  <li className="flex items-center">
                    <span className="bg-yellow-400/30 text-yellow-200 p-1 rounded-full mr-2 flex-shrink-0">
                      <Check className="h-3 w-3" />
                    </span>
                    Personalized adjustments based on workout completion
                  </li>
                  <li className="flex items-center">
                    <span className="bg-yellow-400/30 text-yellow-200 p-1 rounded-full mr-2 flex-shrink-0">
                      <Check className="h-3 w-3" />
                    </span>
                    Analysis of your biometric data and recovery status
                  </li>
                  <li className="flex items-center">
                    <span className="bg-yellow-400/30 text-yellow-200 p-1 rounded-full mr-2 flex-shrink-0">
                      <Check className="h-3 w-3" />
                    </span>
                    Training load optimization and performance insights
                  </li>
                </ul>
                <Button 
                  size="lg"
                  asChild
                  className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold"
                >
                  <Link href="/subscription">Upgrade to Annual Premium</Link>
                </Button>
              </div>
            ) : !aiPlan ? (
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl p-8 text-center max-w-2xl mx-auto">
                <Zap className="h-12 w-12 mx-auto text-white/60 drop-shadow-md mb-4" />
                <h2 className="text-2xl font-bold mb-2 text-white drop-shadow-md">No Training Plan Found</h2>
                <p className="text-white/70 drop-shadow-md mb-6">
                  You need to generate a training plan first before you can get AI adjustments to it.
                </p>
                <Button variant="default" onClick={() => setSelectedTab('ai-plan')} className="bg-blue-500 hover:bg-blue-400 text-white">
                  Generate a Training Plan
                </Button>
              </div>
            ) : (
              <PlanAdjustmentTool 
                currentPlan={aiPlan} 
                onApplyChanges={handlePlanAdjustment}
              />
            )}
          </TabsContent>
          
          <TabsContent value="coach">
            {!hasSubscription ? (
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl p-8 text-center max-w-2xl mx-auto">
                <BookUser className="h-12 w-12 mx-auto text-white/60 drop-shadow-md mb-4" />
                <h2 className="text-2xl font-bold mb-2 text-white drop-shadow-md">Premium Feature</h2>
                <p className="text-white/70 drop-shadow-md mb-6">
                  Access to human coaches is available to premium subscribers only. Upgrade your plan to connect with experienced coaches who can provide personalized guidance.
                </p>
                <Button 
                  size="lg"
                  asChild
                  className="bg-blue-500 hover:bg-blue-400 text-white"
                >
                  <Link href="/subscription">Upgrade to Premium</Link>
                </Button>
              </div>
            ) : coachView === 'select' ? (
              isLoadingCoaches ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              ) : (
                <CoachSelection 
                  onCoachSelected={handleCoachSelected}
                  subscriptionActive={hasSubscription}
                />
              )
            ) : (
              selectedCoach && coachSessionId && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Coach briefing - left sidebar */}
                  <div className="lg:col-span-1 h-full">
                    <div className="sticky top-6">
                      <CoachBriefing userId={user?.id || 1} />
                    </div>
                  </div>
                  
                  {/* Coach chat - main area */}
                  <div className="lg:col-span-2 h-full">
                    <CoachChat 
                      coach={selectedCoach} 
                      sessionId={coachSessionId} 
                    />
                  </div>
                </div>
              )
            )}
          </TabsContent>
        </Tabs>
        </main>
      </div>
    </div>
  );
}
