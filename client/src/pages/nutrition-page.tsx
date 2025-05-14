import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { checkSubscriptionStatus } from "@/lib/queryClient";
import { PageTitle } from "@/components/common/page-title";
import { PageLayout } from "@/components/common/page-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Utensils } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SimpleMealPlan } from "@/components/nutrition/simple-meal-plan"; 
import { NutritionOverview } from "@/components/nutrition/nutrition-overview";
import { NutritionPreferences } from "@/components/nutrition/nutrition-preferences";
import { getMealPlan, getNutritionPreferences, NutritionPreference, generateMealPlan } from "@/lib/nutrition-ai-service";
import { format } from "date-fns";

export default function NutritionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  
  // Check subscription status - will be used to gate premium features
  const { data: subscriptionStatus } = useQuery<{status?: string, isActive?: boolean}>({
    queryKey: ["/api/user/subscription"],
    enabled: !!user,
  });
  
  // Direct subscription check with a fallback
  const [hasSubscription, setHasSubscription] = useState(false);
  
  // Use our direct check function or fallback to data from the query
  useEffect(() => {
    async function checkStatus() {
      try {
        // Use our direct check first
        const isActive = await checkSubscriptionStatus();
        setHasSubscription(isActive);
      } catch (error) {
        // Fallback to query data if direct check fails
        const isActive = subscriptionStatus?.status === 'active' || !!subscriptionStatus?.isActive;
        setHasSubscription(isActive);
      }
    }
    
    if (user) {
      checkStatus();
    }
  }, [user, subscriptionStatus]);

  // Fetch nutrition preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ["/api/nutrition/preferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return getNutritionPreferences(user.id);
    },
    enabled: !!user?.id,
  });

  // Fetch current meal plan
  const { data: mealPlan, isLoading: mealPlanLoading } = useQuery({
    queryKey: ["/api/nutrition/meal-plans", user?.id, currentDate],
    queryFn: async () => {
      if (!user?.id) return null;
      return getMealPlan(user.id, currentDate);
    },
    enabled: !!user?.id,
  });

  const isLoading = preferencesLoading || mealPlanLoading;

  // Check if this is the first visit (no preferences set up)
  const isFirstVisit = !preferencesLoading && !preferences;

  // Handle generating meal plan
  const handleGenerateMealPlan = async () => {
    if (!user?.id) {
      toast({
        title: "Not logged in",
        description: "Please log in to generate a meal plan",
        variant: "destructive"
      });
      return;
    }

    // Temporarily disabled subscription check for testing
    // if (!hasSubscription) {
    //   toast({
    //     title: "Premium feature",
    //     description: "Please upgrade to a premium subscription to use this feature",
    //     variant: "destructive"
    //   });
    //   return;
    // }

    setIsGenerating(true);

    try {
      console.log("Starting meal plan generation process...");
      
      // Create a default nutrition preference if none exists
      const defaultPreference = {
        id: 0,
        user_id: user.id,
        dietary_restrictions: [], 
        excluded_foods: [],
        preferred_foods: ["chicken", "rice", "vegetables", "fruit", "nuts", "eggs"],
        calorie_target: 2500, // Better default for runners
        protein_target: 140, // In grams (not percentage)
        carbs_target: 350, // In grams
        fat_target: 70, // In grams
        meal_count: 4,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      console.log("Using preferences:", preferences || defaultPreference);

      // Use our AI service to generate a real meal plan
      const result = await generateMealPlan(
        user.id,
        preferences || defaultPreference,
        { 
          calories_burned: 600, // Default calories burned
          workout_type: "Running", // Default workout type
          duration_minutes: 60 // Default duration
        }
      );
      
      console.log("AI meal plan generated:", result);
      
      if (result) {
        // Refresh the meal plan data in the cache
        queryClient.invalidateQueries({ queryKey: ["/api/nutrition/meal-plans", user.id, currentDate] });
        
        // Switch to overview tab to show the new plan
        setActiveTab("overview");
        
        toast({
          title: "Meal Plan Generated",
          description: "Your personalized meal plan is ready."
        });
      }
      
    } catch (error: any) {
      console.error("Error generating meal plan:", error);
      
      let errorMessage = "Failed to generate meal plan. Please try again.";
      
      // Handle quota exceeded errors with better user feedback
      if (error?.message && error.message.includes("quota exceeded")) {
        errorMessage = error.message;
      } else if (error?.message && error.message.includes("AI service")) {
        errorMessage = "Our AI service is experiencing high demand. We're working on it.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  // First-time setup view
  if (isFirstVisit) {
    return (
      <PageLayout>
        <PageTitle 
          title="Nutrition" 
          description="Get personalized meal plans based on your training needs"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="flex flex-col items-center justify-center space-y-6 py-12 px-6 bg-neutral-50 rounded-lg text-center">
            <Utensils className="h-16 w-16 text-primary" />
            <h2 className="text-2xl font-bold">Welcome to Personalized Nutrition</h2>
            <p className="text-neutral-dark max-w-lg">
              Get personalized meal recommendations based on your training load, 
              dietary restrictions, and fitness goals.
            </p>
            
            {!hasSubscription && (
              <div className="mt-2 p-4 border border-amber-200 bg-amber-50 rounded-md max-w-lg">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Personalized nutrition plans require a premium subscription. 
                  Please upgrade to generate AI-powered meal plans.
                </p>
              </div>
            )}
          </div>
          
          <div>
            <SimpleMealPlan 
              onUpdateMealPlan={() => {
                // Refresh the meal plan data when a new one is generated
                queryClient.invalidateQueries({ queryKey: ["/api/nutrition/meal-plans", user?.id, currentDate] });
              }} 
            />
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageTitle 
        title="Nutrition" 
        description="Fuel your training with personalized meal plans"
      />
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full mt-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="meal-planner">Meal Planner</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <NutritionOverview />
        </TabsContent>
        
        <TabsContent value="meal-planner" className="mt-6">
          <SimpleMealPlan 
            onUpdateMealPlan={() => {
              // Refresh the meal plan data when a new one is generated
              queryClient.invalidateQueries({ queryKey: ["/api/nutrition/meal-plans", user?.id, currentDate] });
            }} 
          />
        </TabsContent>
        
        <TabsContent value="preferences" className="mt-6">
          <NutritionPreferences />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}