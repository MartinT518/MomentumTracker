import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PageTitle } from "@/components/common/page-title";
import { PageLayout } from "@/components/common/page-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Utensils } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NutritionDashboard from "@/components/nutrition/nutrition-dashboard";
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
  const { data: subscriptionStatus } = useQuery({
    queryKey: ["/api/user/subscription"],
    enabled: !!user,
  });
  
  const hasSubscription = !!subscriptionStatus?.isActive;

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
        
        <div className="flex flex-col items-center justify-center space-y-6 max-w-3xl mx-auto mt-12 py-12 px-6 bg-neutral-50 rounded-lg text-center">
          <Utensils className="h-16 w-16 text-primary" />
          <h2 className="text-2xl font-bold">Welcome to Personalized Nutrition</h2>
          <p className="text-neutral-dark max-w-lg">
            Set up your nutrition preferences to get personalized meal recommendations based on your training load, 
            dietary restrictions, and fitness goals.
          </p>
          
          <Button 
            size="lg" 
            onClick={handleGenerateMealPlan}
            className="mt-4"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Generating Meal Plan...
              </>
            ) : (
              "Get Started"
            )}
          </Button>
          
          {!hasSubscription && (
            <div className="mt-6 p-4 border border-amber-200 bg-amber-50 rounded-md max-w-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Personalized nutrition plans require a premium subscription. 
                You can set up your preferences now, but you'll need to upgrade to generate AI-powered meal plans.
              </p>
            </div>
          )}
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
          <NutritionDashboard 
            mealPlan={mealPlan} 
            preferences={preferences} 
            hasSubscription={hasSubscription}
          />
        </TabsContent>
        
        <TabsContent value="meal-planner" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Meal Planner</CardTitle>
              <CardDescription>
                Generate personalized meal plans based on your training and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-dark mb-4">
                Coming soon: AI-powered meal planning based on your training schedule and nutrition goals
              </p>
              <Button 
                variant="outline" 
                onClick={handleGenerateMealPlan}
                disabled={isGenerating || !hasSubscription}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...
                  </>
                ) : (
                  "Create Meal Plan"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Nutrition Preferences</CardTitle>
              <CardDescription>
                Set your dietary preferences to customize meal recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-dark mb-4">
                Coming soon: Customize your nutrition preferences including dietary restrictions, calorie goals, and favorite foods
              </p>
              <Button variant="outline" onClick={() => toast({ title: "Feature coming soon", description: "This feature is currently under development" })}>
                Update Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}