import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from "@/components/ui/separator";
import { Loader2, UtensilsCrossed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';

interface SimpleMealPlanProps {
  onUpdateMealPlan?: () => void;
}

interface Ingredient {
  name: string;
  amount: string;
}

interface MealMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  name: string;
  mealType: string;
  ingredients: Ingredient[];
  macros: MealMacros;
  instructions: string;
}

interface DailyPlan {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: Meal[];
}

export interface MealPlanResponse {
  dailyPlan: DailyPlan;
}

export function SimpleMealPlan({ onUpdateMealPlan }: SimpleMealPlanProps) {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [generating, setGenerating] = useState(false);

  // Query for fetching the meal plan
  const { 
    data: mealPlan,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<MealPlanResponse>({
    queryKey: ['/api/nutrition/simple-meal-plan'],
    queryFn: async () => {
      setGenerating(true);
      try {
        const response = await fetch('/api/nutrition/simple-meal-plan');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate meal plan');
        }
        return response.json();
      } finally {
        setGenerating(false);
      }
    },
    enabled: false, // Don't run the query automatically
    retry: false,
    staleTime: Infinity // Once we get a meal plan, it doesn't go stale
  });

  const handleGenerateMealPlan = () => {
    refetch();
    if (onUpdateMealPlan) {
      onUpdateMealPlan();
    }
  };

  if (isAuthLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Personalized Meal Plan</CardTitle>
          <CardDescription>Login to generate a meal plan tailored to your needs</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button disabled>Login to Generate</Button>
        </CardFooter>
      </Card>
    );
  }

  if (generating || isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Generating Your Meal Plan</CardTitle>
          <CardDescription>Our AI is creating a personalized meal plan just for you...</CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Error Generating Meal Plan</CardTitle>
          <CardDescription className="text-red-500">
            {error instanceof Error ? error.message : 'An error occurred. Please try again.'}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={handleGenerateMealPlan}>Try Again</Button>
        </CardFooter>
      </Card>
    );
  }

  if (!mealPlan) {
    return (
      <Card className="w-full -ml-4">
        <CardHeader>
          <CardTitle>Personalized Meal Plan</CardTitle>
          <CardDescription>Generate a meal plan tailored to your body metrics, activity level, and dietary restrictions</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6 min-h-[200px] text-center gap-4">
          <UtensilsCrossed className="h-16 w-16 text-muted-foreground mb-2" />
          <p className="text-muted-foreground max-w-md">
            Your personal meal plan will be based on your weight, height, activity level, and dietary preferences such as keto, vegan, or lactose-intolerance.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleGenerateMealPlan} size="lg">
            Generate Meal Plan
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const { dailyPlan } = mealPlan;

  return (
    <Card className="w-full -ml-4">
      <CardHeader>
        <CardTitle>Your Daily Meal Plan</CardTitle>
        <CardDescription>
          Personalized for your {dailyPlan.totalCalories} calorie target with{' '}
          {Math.round(dailyPlan.totalProtein)}g protein, {Math.round(dailyPlan.totalCarbs)}g carbs, {Math.round(dailyPlan.totalFat)}g fat
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {dailyPlan.meals.map((meal, index) => (
          <div key={index} className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{meal.name}</h3>
              <span className="text-sm text-muted-foreground">{meal.mealType}</span>
            </div>
            
            <div className="grid grid-cols-4 gap-2 text-sm mb-2">
              <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                <span className="font-medium">{meal.macros.calories}</span>
                <span className="text-xs text-muted-foreground">Cal</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                <span className="font-medium">{meal.macros.protein}g</span>
                <span className="text-xs text-muted-foreground">Protein</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                <span className="font-medium">{meal.macros.carbs}g</span>
                <span className="text-xs text-muted-foreground">Carbs</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                <span className="font-medium">{meal.macros.fat}g</span>
                <span className="text-xs text-muted-foreground">Fat</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-1">Ingredients:</h4>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {meal.ingredients.map((ingredient, i) => (
                  <li key={i}>
                    {ingredient.amount} {ingredient.name}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-1">Instructions:</h4>
              <p className="text-sm">{meal.instructions}</p>
            </div>
            
            {index < dailyPlan.meals.length - 1 && <Separator className="my-4" />}
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerateMealPlan} className="w-full">
          Generate New Meal Plan
        </Button>
      </CardFooter>
    </Card>
  );
}