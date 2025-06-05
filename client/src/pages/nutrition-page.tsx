import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { checkSubscriptionStatus } from "@/lib/queryClient";
import { AppLayout } from "@/components/common/app-layout";
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

  const hasSubscription = subscriptionData || false;

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
    retry: false, // Don't retry failed requests
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });

  useEffect(() => {
    if (mealPlanError) {
      console.warn("Meal plan not available:", mealPlanError);
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
      <AppLayout>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show upgrade prompt if user doesn't have subscription and tries to access meal planning
  if (!hasSubscription && activeTab === 'meal-planner') {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Utensils className="w-6 h-6 text-green-300" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                  Nutrition
                </h1>
                <p className="text-white/80 text-lg drop-shadow-md">
                  Fuel your training with personalized meal plans
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Utensils className="h-16 w-16 text-cyan-300" />
              <h2 className="text-2xl font-bold text-white drop-shadow-sm">Welcome to Personalized Nutrition</h2>
              <p className="text-white/80 max-w-lg drop-shadow-sm">
                Get personalized meal recommendations based on your training load, 
                dietary restrictions, and fitness goals.
              </p>
              
              <div className="mt-2 p-4 bg-white/10 border border-white/20 rounded-md max-w-lg backdrop-blur-sm">
                <p className="text-sm text-white drop-shadow-sm">
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
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Utensils className="w-6 h-6 text-green-300" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                Nutrition
              </h1>
              <p className="text-white/80 text-lg drop-shadow-md">
                Fuel your training with personalized meal plans
              </p>
            </div>
          </div>
        </div>
      
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">Overview</TabsTrigger>
            <TabsTrigger value="meal-planner" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">Meal Planner</TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">Preferences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-8">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl">
              <NutritionOverview />
            </div>
          </TabsContent>
          
          <TabsContent value="meal-planner" className="mt-8">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl">
              <SimpleMealPlan 
                onUpdateMealPlan={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/nutrition/meal-plans", user?.id, currentDate] });
                }} 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="preferences" className="mt-8">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl">
              <NutritionPreferences />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}