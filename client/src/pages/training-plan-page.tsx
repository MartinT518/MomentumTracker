import { useState, useEffect } from 'react';
import { Sidebar } from "@/components/common/sidebar";
import { MobileMenu } from "@/components/common/mobile-menu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BookUser, Sparkles, Loader2, Check, Zap } from "lucide-react";
import { TrainingGoalOverview } from "@/components/training-plan/training-goal-overview";
import { TrainingPlanCalendar } from "@/components/training-plan/training-plan-calendar-new";
import { WorkoutDetailView } from "@/components/training-plan/workout-detail-view";
import { AIPlanGenerator } from "@/components/training-plan/ai-plan-generator";
import PlanAdjustmentTool from "@/components/training-plan/plan-adjustment-tool";
import { CoachSelection } from "@/components/coaching/coach-selection";
import { CoachChat } from "@/components/coaching/coach-chat";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
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
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [coachView, setCoachView] = useState<'select' | 'chat'>('select');
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [coachSessionId, setCoachSessionId] = useState<string>('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [aiPlan, setAiPlan] = useState<AITrainingPlan | null>(null);
  const [planAdjustment, setPlanAdjustment] = useState<PlanAdjustment | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
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
  
  // Check if user has active subscription
  const hasSubscription = user?.subscription_status === 'active';

  return (
    <div className="flex h-screen max-w-full overflow-hidden">
      <Sidebar />
      <MobileMenu />

      <main className="flex-1 overflow-y-auto bg-neutral-lighter pt-0 md:pt-4 pb-16 md:pb-4 px-4 md:px-6">
        {/* For mobile view padding to account for fixed header */}
        <div className="md:hidden pt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading text-neutral-darker">Training Plan</h1>
            <p className="text-neutral-medium mt-1">View and manage your personalized training schedule</p>
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
          
          {selectedTab !== "ai-plan" && !isGeneratingPlan && (
            <div className="mt-4 md:mt-0">
              <Button 
                onClick={() => setSelectedTab("ai-plan")}
                className="flex items-center"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate AI Plan
              </Button>
            </div>
          )}
          
          {isGeneratingPlan && (
            <div className="mt-4 md:mt-0">
              <Button disabled className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Plan...
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
            <TabsTrigger value="coach" className="flex items-center">
              <BookUser className="w-4 h-4 mr-2" />
              Human Coach
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <TrainingGoalOverview />
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Training Plan Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 font-medium mb-1">Weekly Mileage</div>
                  <div className="text-2xl font-bold">{aiPlan?.overview?.weeklyMileage || "32 miles"}</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium mb-1">Workouts Per Week</div>
                  <div className="text-2xl font-bold">{aiPlan?.overview?.workoutsPerWeek || "5"} sessions</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium mb-1">Long Run</div>
                  <div className="text-2xl font-bold">{aiPlan?.overview?.longRunDistance || "12 miles"}</div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-yellow-600 font-medium mb-1">Quality Workouts</div>
                  <div className="text-2xl font-bold">{aiPlan?.overview?.qualityWorkouts || "2"} per week</div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Training Philosophy</h3>
                <p className="text-neutral-700">
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
                <TrainingPlanCalendar onWorkoutClick={handleWorkoutClick} hasSubscription={hasSubscription} />
                
                {!hasSubscription && aiPlan && (
                  <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-yellow-100 p-2 rounded-full">
                        <Sparkles className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-1">Training Plan Preview</h3>
                        <p className="text-sm text-muted-foreground mb-4">
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
            {!hasSubscription ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center max-w-2xl mx-auto">
                <Sparkles className="h-12 w-12 mx-auto text-primary/60 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Premium Feature</h2>
                <p className="text-muted-foreground mb-6">
                  Free users can see one week of AI-generated training plans. Upgrade to premium for full access to:
                  <ul className="mt-3 space-y-1 text-left max-w-md mx-auto">
                    <li className="flex items-center">
                      <span className="bg-primary/20 text-primary p-1 rounded-full mr-2 flex-shrink-0">
                        <Check className="h-3 w-3" />
                      </span>
                      Complete multi-week training plans
                    </li>
                    <li className="flex items-center">
                      <span className="bg-primary/20 text-primary p-1 rounded-full mr-2 flex-shrink-0">
                        <Check className="h-3 w-3" />
                      </span>
                      Detailed workouts with warm-up and cool-down routines
                    </li>
                    <li className="flex items-center">
                      <span className="bg-primary/20 text-primary p-1 rounded-full mr-2 flex-shrink-0">
                        <Check className="h-3 w-3" />
                      </span>
                      Nutritional guidance and recovery strategies
                    </li>
                  </ul>
                </p>
                <Button 
                  onClick={() => setSelectedTab("subscription")}
                  size="lg"
                >
                  Upgrade to Premium
                </Button>
              </div>
            ) : (
              <AIPlanGenerator 
                onPlanGenerated={(plan) => {
                  handlePlanGenerated(plan);
                  setIsGeneratingPlan(true);
                }} 
              />
            )}
          </TabsContent>
          
          <TabsContent value="coach">
            {!hasSubscription ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center max-w-2xl mx-auto">
                <BookUser className="h-12 w-12 mx-auto text-primary/60 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Premium Feature</h2>
                <p className="text-muted-foreground mb-6">
                  Access to human coaches is available to premium subscribers only. Upgrade your plan to connect with experienced coaches who can provide personalized guidance.
                </p>
                <Button 
                  onClick={() => setSelectedTab("subscription")}
                  size="lg"
                >
                  Upgrade to Premium
                </Button>
              </div>
            ) : coachView === 'select' ? (
              isLoadingCoaches ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <CoachSelection 
                  onCoachSelected={handleCoachSelected}
                  subscriptionActive={hasSubscription}
                />
              )
            ) : (
              selectedCoach && coachSessionId && (
                <CoachChat 
                  coach={selectedCoach} 
                  sessionId={coachSessionId} 
                />
              )
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
