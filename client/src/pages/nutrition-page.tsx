import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PageTitle } from "@/components/common/page-title";
import { PageLayout } from "@/components/common/page-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Chef } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NutritionDashboard from "@/components/nutrition/nutrition-dashboard";
import { getMealPlan, getNutritionPreferences, NutritionPreference } from "@/lib/nutrition-ai-service";
import { format } from "date-fns";

export default function NutritionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
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
    queryKey: ["/api/nutrition/meal-plan", user?.id, currentDate],
    queryFn: async () => {
      if (!user?.id) return null;
      return getMealPlan(user.id, currentDate);
    },
    enabled: !!user?.id,
  });

  const isLoading = preferencesLoading || mealPlanLoading;

  // Check if this is the first visit (no preferences set up)
  const isFirstVisit = !preferencesLoading && !preferences;

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
          <Chef className="h-16 w-16 text-primary" />
          <h2 className="text-2xl font-bold">Welcome to Personalized Nutrition</h2>
          <p className="text-neutral-dark max-w-lg">
            Set up your nutrition preferences to get personalized meal recommendations based on your training load, 
            dietary restrictions, and fitness goals.
          </p>
          
          <Button 
            size="lg" 
            onClick={() => setActiveTab("preferences")}
            className="mt-4"
          >
            Get Started
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
              <Button variant="outline" onClick={() => toast({ title: "Feature coming soon", description: "This feature is currently under development" })}>
                Create Meal Plan
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