import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

// Import onboarding step components
import WelcomeStep from "@/components/onboarding/welcome-step";
import FitnessGoalsStep from "@/components/onboarding/fitness-goals-step";
import ExperienceStep from "@/components/onboarding/experience-step";
import TrainingPreferencesStep from "@/components/onboarding/training-preferences-step";
import SummaryStep from "@/components/onboarding/summary-step";

// Onboarding steps
enum OnboardingStep {
  WELCOME = "welcome",
  FITNESS_GOALS = "fitness-goals",
  EXPERIENCE = "experience",
  TRAINING_PREFERENCES = "training-preferences",
  SUMMARY = "summary",
}

// Mapping from step to tab value
const stepToTabMap = {
  [OnboardingStep.WELCOME]: "1",
  [OnboardingStep.FITNESS_GOALS]: "2",
  [OnboardingStep.EXPERIENCE]: "3",
  [OnboardingStep.TRAINING_PREFERENCES]: "4",
  [OnboardingStep.SUMMARY]: "5",
};

// Mapping from tab value to step
const tabToStepMap = {
  "1": OnboardingStep.WELCOME,
  "2": OnboardingStep.FITNESS_GOALS,
  "3": OnboardingStep.EXPERIENCE,
  "4": OnboardingStep.TRAINING_PREFERENCES,
  "5": OnboardingStep.SUMMARY,
};

// Component to track the onboarding progress
function OnboardingProgress({ currentStep }: { currentStep: OnboardingStep }) {
  // Calculate progress percentage
  const totalSteps = Object.keys(OnboardingStep).length;
  const currentStepIndex = Object.values(OnboardingStep).indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <div className="w-full px-4 py-2">
      <div className="flex justify-between mb-2 text-sm text-muted-foreground">
        <span>Getting Started</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}

// Main Onboarding Page Component
export default function OnboardingPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.WELCOME);
  
  // State to store user's onboarding data
  const [onboardingData, setOnboardingData] = useState({
    fitnessGoals: null,
    experience: null,
    trainingPreferences: null
  });

  // Fetch onboarding status
  const { data: onboardingStatus, isLoading: isStatusLoading } = useQuery({
    queryKey: ["/api/onboarding/status"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/onboarding/status");
        return await res.json();
      } catch (error) {
        // If 404, it means the user hasn't started onboarding yet, which is fine
        if (error instanceof Error && error.message.includes("404")) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!user, // Only run if user is logged in
  });

  // Complete the onboarding process
  const completeOnboardingMutation = useMutation({
    mutationFn: async (profileUpdates?: any) => {
      const res = await apiRequest("POST", "/api/onboarding/complete", {
        profile_updates: profileUpdates
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Onboarding completed!",
        description: "Your personalized experience is ready.",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      // Redirect to dashboard
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error completing onboarding",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if onboarding is already completed, redirect to dashboard
  useEffect(() => {
    if (onboardingStatus && onboardingStatus.completed) {
      setLocation("/dashboard");
    }
  }, [onboardingStatus, setLocation]);

  // If auth is loading, show loading spinner
  if (isAuthLoading || isStatusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is not logged in, redirect to auth page
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Handle next step
  const handleNext = () => {
    const currentIndex = Object.values(OnboardingStep).indexOf(currentStep);
    const nextStep = Object.values(OnboardingStep)[currentIndex + 1];
    
    if (nextStep) {
      setCurrentStep(nextStep);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    const currentIndex = Object.values(OnboardingStep).indexOf(currentStep);
    const previousStep = Object.values(OnboardingStep)[currentIndex - 1];
    
    if (previousStep) {
      setCurrentStep(previousStep);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    const step = tabToStepMap[value as keyof typeof tabToStepMap];
    setCurrentStep(step);
  };

  // Handle completing the onboarding process
  const handleComplete = (profileUpdates?: any) => {
    completeOnboardingMutation.mutate(profileUpdates);
  };

  // Update onboarding data for a specific step
  const updateStepData = (step: OnboardingStep, data: any) => {
    setOnboardingData(prev => {
      switch (step) {
        case OnboardingStep.FITNESS_GOALS:
          return { ...prev, fitnessGoals: data };
        case OnboardingStep.EXPERIENCE:
          return { ...prev, experience: data };
        case OnboardingStep.TRAINING_PREFERENCES:
          return { ...prev, trainingPreferences: data };
        default:
          return prev;
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-10">
        <Card className="w-full shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Welcome to MomentumRun</CardTitle>
              <Badge variant="outline" className="px-3 py-1">
                <span className="mr-1 text-primary">
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                </span>
                <span>New User</span>
              </Badge>
            </div>
            <CardDescription>
              Let's personalize your experience to help you achieve your fitness goals.
            </CardDescription>
            <Separator />
          </CardHeader>
          
          <OnboardingProgress currentStep={currentStep} />
          
          <Tabs 
            value={stepToTabMap[currentStep]} 
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid grid-cols-5 mx-4">
              <TabsTrigger value="1">Welcome</TabsTrigger>
              <TabsTrigger value="2">Goals</TabsTrigger>
              <TabsTrigger value="3">Experience</TabsTrigger>
              <TabsTrigger value="4">Preferences</TabsTrigger>
              <TabsTrigger value="5">Summary</TabsTrigger>
            </TabsList>
            
            <CardContent className="p-6">
              <TabsContent value="1">
                <WelcomeStep 
                  onNext={handleNext} 
                  user={user} 
                />
              </TabsContent>
              
              <TabsContent value="2">
                <FitnessGoalsStep 
                  onNext={handleNext} 
                  onPrevious={handlePrevious}
                  onUpdateData={(data) => updateStepData(OnboardingStep.FITNESS_GOALS, data)}
                  initialData={onboardingData.fitnessGoals}
                />
              </TabsContent>
              
              <TabsContent value="3">
                <ExperienceStep 
                  onNext={handleNext} 
                  onPrevious={handlePrevious}
                  onUpdateData={(data) => updateStepData(OnboardingStep.EXPERIENCE, data)}
                  initialData={onboardingData.experience}
                />
              </TabsContent>
              
              <TabsContent value="4">
                <TrainingPreferencesStep 
                  onNext={handleNext} 
                  onPrevious={handlePrevious}
                  onUpdateData={(data) => updateStepData(OnboardingStep.TRAINING_PREFERENCES, data)}
                  initialData={onboardingData.trainingPreferences}
                />
              </TabsContent>
              
              <TabsContent value="5">
                <SummaryStep 
                  onPrevious={handlePrevious}
                  onComplete={handleComplete}
                  onboardingData={onboardingData}
                  isLoading={completeOnboardingMutation.isPending}
                />
              </TabsContent>
            </CardContent>
            
            <CardFooter className="flex justify-between border-t p-4">
              <div className="text-sm text-muted-foreground">
                Take your time to provide accurate information for the best experience.
              </div>
              {currentStep === OnboardingStep.SUMMARY && (
                <Button 
                  variant="default" 
                  onClick={() => handleComplete()}
                  disabled={completeOnboardingMutation.isPending}
                >
                  {completeOnboardingMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Complete Setup
                </Button>
              )}
            </CardFooter>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}