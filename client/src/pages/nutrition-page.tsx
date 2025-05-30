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
  const currentDate = format(new Date(), 'yyyy-MM-dd');

  // Check subscription status
  const { data: subscriptionData } = useQuery({
    queryKey: ['/api/user/subscription'],
    queryFn: async () => {
      const response = await checkSubscriptionStatus();
      return response;
    },
  });

  const hasSubscription = subscriptionData?.isActive || false;

  // Fetch nutrition preferences
  const { data: preferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['/api/nutrition/preferences', user?.id],
    queryFn: () => getNutritionPreferences(user!.id),
    enabled: !!user?.id,
  });

  // Fetch meal plan for today
  const { data: mealPlan, isLoading: isLoadingMealPlan, error: mealPlanError } = useQuery({
    queryKey: ['/api/nutrition/meal-plans', user?.id, currentDate],
    queryFn: () => getMealPlan(user!.id, currentDate),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (mealPlanError) {
      console.error("Error fetching meal plan:", mealPlanError);
    }
  }, [mealPlanError]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (isLoadingPreferences || isLoadingMealPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 text-white flex">
        <PageLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        </PageLayout>
      </div>
    );
  }

  // Show upgrade prompt if user doesn't have subscription and tries to access meal planning
  if (!hasSubscription && activeTab === 'meal-planner') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 text-white flex">
        <PageLayout>
          <PageTitle 
            title="Nutrition" 
            description="Fuel your training with personalized meal plans"
            className="text-white"
          />
          
          <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Utensils className="h-16 w-16 text-cyan-300" />
              <h2 className="text-2xl font-bold text-white">Welcome to Personalized Nutrition</h2>
              <p className="text-white/80 max-w-lg">
                Get personalized meal recommendations based on your training load, 
                dietary restrictions, and fitness goals.
              </p>
              
              <div className="mt-2 p-4 bg-white/10 border border-white/20 rounded-md max-w-lg backdrop-blur-sm">
                <p className="text-sm text-white">
                  <strong>Note:</strong> Personalized nutrition plans require a premium subscription. 
                  Please upgrade to generate AI-powered meal plans.
                </p>
              </div>
            </div>
            
            <div>
              <SimpleMealPlan 
                onUpdateMealPlan={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/nutrition/meal-plans", user?.id, currentDate] });
                }} 
              />
            </div>
          </div>
        </PageLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 text-white flex">
      <PageLayout>
        <PageTitle 
          title="Nutrition" 
          description="Fuel your training with personalized meal plans"
          className="text-white"
        />
      
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 bg-white/10 border-white/20">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="meal-planner" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">Meal Planner</TabsTrigger>
            <TabsTrigger value="preferences" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">Preferences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <NutritionOverview />
          </TabsContent>
          
          <TabsContent value="meal-planner" className="mt-6">
            <SimpleMealPlan 
              onUpdateMealPlan={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/nutrition/meal-plans", user?.id, currentDate] });
              }} 
            />
          </TabsContent>
          
          <TabsContent value="preferences" className="mt-6">
            <NutritionPreferences />
          </TabsContent>
        </Tabs>
      </PageLayout>
    </div>
  );
}