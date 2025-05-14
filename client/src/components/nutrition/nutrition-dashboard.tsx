import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, PlusCircle, BarChart3, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { AIGeneratedMealPlan, NutritionPreference, generateMealPlan } from "@/lib/nutrition-ai-service";
import MealPlanDisplay from "./meal-plan-display";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface NutritionDashboardProps {
  mealPlan: AIGeneratedMealPlan | null;
  preferences: NutritionPreference | null;
  hasSubscription: boolean;
}

export default function NutritionDashboard({ 
  mealPlan, 
  preferences, 
  hasSubscription 
}: NutritionDashboardProps) {
  const [currentView, setCurrentView] = useState("today");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentDate = format(new Date(), "MMMM d, yyyy");
  
  const handleGenerateMealPlan = async () => {
    if (!preferences) {
      toast({
        title: "No preferences found",
        description: "Please set your nutrition preferences first",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const result = await generateMealPlan(
        preferences.user_id,
        preferences
      );
      
      if (result) {
        // Invalidate the meal plan query to refetch
        queryClient.invalidateQueries({ queryKey: [`/api/nutrition/meal-plan`, preferences.user_id] });
        
        toast({
          title: "Meal plan generated",
          description: "Your personalized weekly meal plan is ready!"
        });
      } else {
        toast({
          title: "Failed to generate meal plan",
          description: "Please try again later",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error generating meal plan:", error);
      toast({
        title: "Error",
        description: "Failed to generate meal plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Nutrition Dashboard</h2>
          <p className="text-sm text-muted-foreground">{currentDate}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="gap-1" disabled={!hasSubscription || isGenerating}>
            <CalendarIcon className="h-4 w-4 mr-1" /> Weekly Plan
          </Button>
          <Button 
            className="gap-1" 
            disabled={!hasSubscription || isGenerating}
            onClick={handleGenerateMealPlan}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-1" /> Generate New Plan
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Tabs
        defaultValue="today"
        value={currentView}
        onValueChange={setCurrentView}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="stats" disabled={!hasSubscription}>Analytics</TabsTrigger>
          <TabsTrigger value="history" disabled={!hasSubscription}>History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="today" className="py-4">
          {hasSubscription ? (
            mealPlan ? (
              <MealPlanDisplay plan={mealPlan} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Meal Plan Available</CardTitle>
                  <CardDescription>
                    You haven't generated a meal plan for today yet.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Generate a personalized meal plan based on your training load, nutrition preferences, and dietary restrictions.
                  </p>
                  <Button onClick={handleGenerateMealPlan} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4 mr-2" /> Generate Meal Plan
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Premium Feature</CardTitle>
                <CardDescription>
                  AI-powered meal plans are available for premium subscribers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Get personalized meal recommendations based on your training load, nutrition goals, and dietary preferences. 
                  Upgrade to a premium subscription to unlock this feature.
                </p>
                <Button>Upgrade to Premium</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Analytics</CardTitle>
              <CardDescription>
                Track your nutrition metrics over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Detailed nutrition analytics coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Meal History</CardTitle>
              <CardDescription>
                View your past meal plans and nutrition data
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Meal history tracking coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}