import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Salad, 
  Activity, 
  BarChart3, 
  Droplets,
  Utensils,
  Dumbbell
} from "lucide-react";
import { SimpleMealPlan } from './simple-meal-plan';
import { useQuery } from '@tanstack/react-query';
import { MealPlanResponse } from './simple-meal-plan';

interface NutritionSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mainMealType: string;
  hydrationTip: string;
  macroBalance: string;
}

export function NutritionOverview() {
  const [nutritionSummary, setNutritionSummary] = useState<NutritionSummary>({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    mainMealType: 'Balanced',
    hydrationTip: 'Drink 2-3 liters of water daily for optimal performance.',
    macroBalance: 'Balanced'
  });

  // Get meal plan data to display summary statistics
  const { data: mealPlan } = useQuery<MealPlanResponse>({
    queryKey: ['/api/nutrition/simple-meal-plan'],
    enabled: false
  });

  // Update nutrition summary when meal plan data is available
  if (mealPlan && nutritionSummary.totalCalories === 0) {
    setNutritionSummary({
      totalCalories: mealPlan.dailyPlan.totalCalories,
      totalProtein: mealPlan.dailyPlan.totalProtein,
      totalCarbs: mealPlan.dailyPlan.totalCarbs,
      totalFat: mealPlan.dailyPlan.totalFat,
      mainMealType: getMealPlanType(mealPlan),
      hydrationTip: getHydrationTip(mealPlan.dailyPlan.totalCalories),
      macroBalance: getMacroBalance(mealPlan)
    });
  }

  return (
    <div className="space-y-8 -ml-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Calorie Target</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nutritionSummary.totalCalories} kcal</div>
            <p className="text-xs text-muted-foreground">
              Daily target based on your profile and activity level
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nutrition Type</CardTitle>
            <Salad className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nutritionSummary.mainMealType}</div>
            <p className="text-xs text-muted-foreground">
              Personalized for your training needs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hydration</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">Recommended</div>
            <p className="text-xs text-muted-foreground">
              {nutritionSummary.hydrationTip}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Macronutrient Distribution</CardTitle>
          <CardDescription>
            {nutritionSummary.macroBalance} macro balance for optimal athletic performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center space-y-1">
              <span className="text-lg font-semibold">{nutritionSummary.totalProtein}g</span>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ 
                    width: `${Math.min(100, (nutritionSummary.totalProtein * 100) / 
                      (nutritionSummary.totalProtein + nutritionSummary.totalCarbs + nutritionSummary.totalFat))}%` 
                  }}
                />
              </div>
              <div className="flex items-center space-x-1 text-sm">
                <Dumbbell className="h-4 w-4" />
                <span>Protein</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center space-y-1">
              <span className="text-lg font-semibold">{nutritionSummary.totalCarbs}g</span>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ 
                    width: `${Math.min(100, (nutritionSummary.totalCarbs * 100) / 
                      (nutritionSummary.totalProtein + nutritionSummary.totalCarbs + nutritionSummary.totalFat))}%` 
                  }}
                />
              </div>
              <div className="flex items-center space-x-1 text-sm">
                <BarChart3 className="h-4 w-4" />
                <span>Carbs</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center space-y-1">
              <span className="text-lg font-semibold">{nutritionSummary.totalFat}g</span>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full" 
                  style={{ 
                    width: `${Math.min(100, (nutritionSummary.totalFat * 100) / 
                      (nutritionSummary.totalProtein + nutritionSummary.totalCarbs + nutritionSummary.totalFat))}%` 
                  }}
                />
              </div>
              <div className="flex items-center space-x-1 text-sm">
                <Utensils className="h-4 w-4" />
                <span>Fat</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Current Meal Plan</h3>
        <SimpleMealPlan />
      </div>
    </div>
  );
}

// Helper functions to analyze meal plan data
function getMealPlanType(mealPlan: MealPlanResponse): string {
  const { totalProtein, totalCarbs, totalFat } = mealPlan.dailyPlan;
  const totalMacros = totalProtein + totalCarbs + totalFat;
  
  const proteinPercentage = (totalProtein / totalMacros) * 100;
  const carbsPercentage = (totalCarbs / totalMacros) * 100;
  
  if (carbsPercentage > 60) {
    return 'High-Carb Endurance';
  } else if (carbsPercentage < 10) {
    return 'Ketogenic';
  } else if (proteinPercentage > 30) {
    return 'High-Protein Performance';
  } else {
    return 'Balanced Athlete';
  }
}

function getHydrationTip(calories: number): string {
  // Base recommendation on calorie expenditure
  if (calories > 3000) {
    return 'Drink 3-4 liters of water daily with electrolytes for high-intensity training.';
  } else if (calories > 2500) {
    return 'Aim for 2.5-3 liters of water daily with added electrolytes during longer sessions.';
  } else {
    return 'Maintain 2-2.5 liters of water daily for optimal hydration and performance.';
  }
}

function getMacroBalance(mealPlan: MealPlanResponse): string {
  const { totalProtein, totalCarbs, totalFat } = mealPlan.dailyPlan;
  const totalMacros = totalProtein + totalCarbs + totalFat;
  
  const proteinPercentage = (totalProtein / totalMacros) * 100;
  const carbsPercentage = (totalCarbs / totalMacros) * 100;
  const fatPercentage = (totalFat / totalMacros) * 100;
  
  if (carbsPercentage > 60) {
    return 'Carbohydrate-focused';
  } else if (carbsPercentage < 10) {
    return 'Fat-adapted';
  } else if (Math.abs(proteinPercentage - carbsPercentage) < 10 && Math.abs(proteinPercentage - fatPercentage) < 10) {
    return 'Balanced';
  } else if (proteinPercentage > 30) {
    return 'Protein-emphasized';
  } else {
    return 'Mixed macronutrient';
  }
}