import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NutritionPreferences from "@/components/nutrition/nutrition-preferences";
import MealPlanner from "@/components/nutrition/meal-planner";
import NutritionDashboard from "@/components/nutrition/nutrition-dashboard";
import { format } from "date-fns";

export default function NutritionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const today = format(new Date(), "yyyy-MM-dd");

  // Check if user has subscription
  const hasSubscription = user?.subscription_status === "active";

  // Fetch nutrition preferences
  const {
    data: preferences,
    isLoading: preferencesLoading,
    error: preferencesError
  } = useQuery({
    queryKey: ["/api/nutrition/preferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await apiRequest("GET", `/api/nutrition/preferences/${user.id}`);
      if (res.status === 404) return null;
      return await res.json();
    },
    enabled: !!user?.id,
  });

  // Fetch current meal plan
  const {
    data: mealPlan,
    isLoading: mealPlanLoading,
    error: mealPlanError
  } = useQuery({
    queryKey: ["/api/nutrition/meal-plans", user?.id, today],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await apiRequest("GET", `/api/nutrition/meal-plans/${user.id}/${today}`);
      if (res.status === 404) return null;
      return await res.json();
    },
    enabled: !!user?.id,
  });

  if (preferencesLoading || mealPlanLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Nutrition</h1>
        <p className="text-muted-foreground">
          Optimize your nutrition to support your training and recovery
        </p>
      </div>

      {!hasSubscription && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800">Subscription Required</AlertTitle>
          <AlertDescription className="text-amber-700">
            Advanced nutrition features like AI-generated meal plans require an active subscription.
            <Button variant="link" className="p-0 h-auto text-amber-700 font-semibold" onClick={() => window.location.href = "/subscription"}>
              Upgrade now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="meal-planner">Meal Planner</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <NutritionDashboard mealPlan={mealPlan} preferences={preferences} hasSubscription={hasSubscription} />
        </TabsContent>
        
        <TabsContent value="meal-planner">
          {hasSubscription ? (
            <MealPlanner 
              preferences={preferences} 
              existingMealPlan={mealPlan} 
              userId={user?.id || 0} 
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Premium Feature
                </CardTitle>
                <CardDescription>
                  AI-generated meal plans are available for subscribers only
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to access personalized meal plans tailored to your training schedule,
                  dietary preferences, and recovery needs.
                </p>
                <Button onClick={() => window.location.href = "/subscription"}>
                  Upgrade to Premium
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="preferences">
          <NutritionPreferences 
            existingPreferences={preferences} 
            userId={user?.id || 0} 
            onSaved={() => {
              queryClient.invalidateQueries({
                queryKey: ["/api/nutrition/preferences", user?.id],
              });
              toast({
                title: "Preferences Saved",
                description: "Your nutrition preferences have been updated.",
              });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}