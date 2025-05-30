import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Loader2, CheckCircle, ArrowRight, ArrowLeft, Target, Trophy, Zap, Users } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

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

  // Step order for navigation
  const stepOrder = [
    OnboardingStep.WELCOME,
    OnboardingStep.FITNESS_GOALS,
    OnboardingStep.EXPERIENCE,
    OnboardingStep.TRAINING_PREFERENCES,
    OnboardingStep.SUMMARY
  ];

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

  // Navigation handlers
  const handleNext = () => {
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleStepChange = (step: OnboardingStep) => {
    setCurrentStep(step);
  };

  const handleTabChange = (value: string) => {
    const step = tabToStepMap[value];
    if (step) {
      setCurrentStep(step);
    }
  };

  // If auth is loading, show loading spinner
  if (isAuthLoading || isStatusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If user is not logged in, redirect to auth page
  if (!user) {
    return <Redirect to="/auth" />;
  }

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

  if (isLoading || isStatusLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-300 mx-auto mb-4" />
          <p className="text-cyan-100">Setting up your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto py-8 px-4 min-h-screen flex items-center justify-center">
        <div className="max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-100 to-cyan-300 mb-4">
              Welcome to AetherRun
            </h1>
            <p className="text-xl text-cyan-100/80 max-w-2xl mx-auto">
              Let's personalize your running journey to help you achieve your fitness goals
            </p>
            <Badge className="mt-4 bg-cyan-500/20 text-cyan-100 border-cyan-400/30 backdrop-blur-sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              New Runner
            </Badge>
          </div>

          {/* Progress Section */}
          <div className="mb-8">
            <OnboardingProgress currentStep={currentStep} />
          </div>

          {/* Main Content Card */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardContent className="p-8">
              {/* Step Navigation */}
              <div className="flex justify-center mb-8">
                <div className="flex space-x-2 p-1 bg-white/5 rounded-full backdrop-blur-sm border border-white/10">
                  {[
                    { step: OnboardingStep.WELCOME, icon: Zap, label: "Welcome" },
                    { step: OnboardingStep.FITNESS_GOALS, icon: Target, label: "Goals" },
                    { step: OnboardingStep.EXPERIENCE, icon: Trophy, label: "Experience" },
                    { step: OnboardingStep.TRAINING_PREFERENCES, icon: Users, label: "Preferences" },
                    { step: OnboardingStep.SUMMARY, icon: CheckCircle, label: "Summary" }
                  ].map(({ step, icon: Icon, label }, index) => {
                    const isActive = currentStep === step;
                    const isCompleted = stepOrder.indexOf(currentStep) > index;
                    
                    return (
                      <button
                        key={step}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                          isActive
                            ? "bg-cyan-500/30 text-cyan-100 shadow-lg"
                            : isCompleted
                            ? "bg-green-500/20 text-green-200"
                            : "text-white/60 hover:text-white/80"
                        }`}
                        onClick={() => handleStepChange(step)}
                        disabled={!isCompleted && !isActive}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step Content */}
              <div className="min-h-[400px]">
                {currentStep === OnboardingStep.WELCOME && (
                  <WelcomeStep onNext={handleNext} user={user} />
                )}
                {currentStep === OnboardingStep.FITNESS_GOALS && (
                  <FitnessGoalsStep 
                    onNext={handleNext} 
                    onPrevious={handlePrevious}
                    onUpdateData={(data) => updateStepData(OnboardingStep.FITNESS_GOALS, data)}
                    initialData={onboardingData.fitnessGoals}
                  />
                )}
                {currentStep === OnboardingStep.EXPERIENCE && (
                  <ExperienceStep 
                    onNext={handleNext} 
                    onPrevious={handlePrevious}
                    onUpdateData={(data) => updateStepData(OnboardingStep.EXPERIENCE, data)}
                    initialData={onboardingData.experience}
                  />
                )}
                {currentStep === OnboardingStep.TRAINING_PREFERENCES && (
                  <TrainingPreferencesStep 
                    onNext={handleNext} 
                    onPrevious={handlePrevious}
                    onUpdateData={(data) => updateStepData(OnboardingStep.TRAINING_PREFERENCES, data)}
                    initialData={onboardingData.trainingPreferences}
                  />
                )}
                {currentStep === OnboardingStep.SUMMARY && (
                  <SummaryStep 
                    onPrevious={handlePrevious}
                    onComplete={handleComplete}
                    onboardingData={onboardingData}
                    isLoading={completeOnboardingMutation.isPending}
                  />
                )}
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={currentStep === OnboardingStep.WELCOME}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="text-sm text-white/60">
                  Step {stepOrder.indexOf(currentStep) + 1} of {stepOrder.length}
                </div>

                {currentStep === OnboardingStep.SUMMARY ? (
                  <Button 
                    onClick={() => handleComplete()}
                    disabled={completeOnboardingMutation.isPending}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0"
                  >
                    {completeOnboardingMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Complete Setup
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="text-center mt-6">
            <p className="text-white/60 text-sm">
              Take your time to provide accurate information for the best personalized experience
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}