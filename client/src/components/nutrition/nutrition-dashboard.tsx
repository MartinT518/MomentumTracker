import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; 
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Lock, Utensils, Apple, Beef, Bread, Egg } from "lucide-react";
import { format } from "date-fns";
import { NutritionPreference } from "@/lib/nutrition-ai-service";

interface NutritionDashboardProps {
  mealPlan: any | null;
  preferences: NutritionPreference | null;
  hasSubscription: boolean;
}

export default function NutritionDashboard({ mealPlan, preferences, hasSubscription }: NutritionDashboardProps) {
  const today = format(new Date(), "MMMM d, yyyy");
  
  // Calculate macro distribution
  const calculateMacros = () => {
    if (!mealPlan) return [];
    
    const totalCalories = mealPlan.calories;
    const proteinCalories = mealPlan.protein * 4; // 4 calories per gram
    const carbsCalories = mealPlan.carbs * 4; // 4 calories per gram
    const fatCalories = mealPlan.fat * 9; // 9 calories per gram
    
    return [
      { name: "Protein", value: Math.round((proteinCalories / totalCalories) * 100), fill: "#22c55e" },
      { name: "Carbs", value: Math.round((carbsCalories / totalCalories) * 100), fill: "#3b82f6" },
      { name: "Fat", value: Math.round((fatCalories / totalCalories) * 100), fill: "#eab308" }
    ];
  };
  
  // Generate food category distribution
  const calculateFoodGroups = () => {
    if (!mealPlan || !mealPlan.meals) return [];
    
    const categories: Record<string, number> = {
      "Protein": 0,
      "Grains": 0,
      "Fruits": 0,
      "Vegetables": 0,
      "Dairy": 0,
      "Fats": 0,
      "Other": 0
    };
    
    let totalItems = 0;
    
    mealPlan.meals.forEach((meal: any) => {
      if (meal.foodItems) {
        meal.foodItems.forEach((food: any) => {
          totalItems++;
          if (food.category === "protein") categories["Protein"]++;
          else if (food.category === "grains") categories["Grains"]++;
          else if (food.category === "fruits") categories["Fruits"]++;
          else if (food.category === "vegetables") categories["Vegetables"]++;
          else if (food.category === "dairy") categories["Dairy"]++;
          else if (food.category === "fats") categories["Fats"]++;
          else categories["Other"]++;
        });
      }
    });
    
    return Object.entries(categories)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({
        name,
        value: Math.round((count / totalItems) * 100),
        fill: getFoodCategoryColor(name)
      }));
  };
  
  // Get color for food category
  const getFoodCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      "Protein": "#ef4444",
      "Grains": "#f59e0b",
      "Fruits": "#84cc16",
      "Vegetables": "#10b981",
      "Dairy": "#06b6d4",
      "Fats": "#8b5cf6",
      "Other": "#6b7280"
    };
    
    return colorMap[category] || "#6b7280";
  };
  
  const macros = calculateMacros();
  const foodGroups = calculateFoodGroups();

  if (!hasSubscription) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Premium Feature
            </CardTitle>
            <CardDescription>
              Detailed nutrition tracking and analysis requires a subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to unlock personalized nutrition recommendations tailored to your training goals,
              dietary preferences, and recovery needs.
            </p>
            <Button onClick={() => window.location.href = "/subscription"}>
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Why Nutrition Matters</CardTitle>
            <CardDescription>
              Fueling your body properly can improve your running performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-primary/10 p-2 rounded-md">
                <Utensils className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Performance Optimization</h4>
                <p className="text-sm text-muted-foreground">
                  Proper nutrition helps maximize your training adaptations and performance.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-primary/10 p-2 rounded-md">
                <Apple className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Recovery Enhancement</h4>
                <p className="text-sm text-muted-foreground">
                  Food choices impact how quickly you recover between workouts.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-primary/10 p-2 rounded-md">
                <Beef className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Injury Prevention</h4>
                <p className="text-sm text-muted-foreground">
                  Proper nutrition supports tissue repair and immune function.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!mealPlan) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>No Active Meal Plan</CardTitle>
            <CardDescription>
              You don't have an active meal plan for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create a personalized meal plan based on your training needs and dietary preferences.
            </p>
            <Button onClick={() => window.location.href = "#meal-planner"}>
              Generate Meal Plan
            </Button>
          </CardContent>
        </Card>
        
        {preferences && (
          <Card>
            <CardHeader>
              <CardTitle>Your Nutrition Profile</CardTitle>
              <CardDescription>
                Based on your saved preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Dietary Type</span>
                <Badge variant="outline">{preferences.dietary_type}</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Calorie Goal</span>
                  <span className="text-sm">{preferences.calorie_goal} kcal</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Protein</span>
                  <span className="text-sm">{preferences.protein_goal}%</span>
                </div>
                <Progress value={preferences.protein_goal} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Carbs</span>
                  <span className="text-sm">{preferences.carbs_goal}%</span>
                </div>
                <Progress value={preferences.carbs_goal} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Fat</span>
                  <span className="text-sm">{preferences.fat_goal}%</span>
                </div>
                <Progress value={preferences.fat_goal} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Nutrition Plan</CardTitle>
            <CardDescription>
              {today} • {mealPlan.training_load || "Regular"} Training Day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-primary/10 rounded-md">
                  <p className="text-xs text-muted-foreground">Calories</p>
                  <p className="font-medium">{mealPlan.calories} kcal</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-md">
                  <p className="text-xs text-muted-foreground">Protein</p>
                  <p className="font-medium">{mealPlan.protein}g</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-md">
                  <p className="text-xs text-muted-foreground">Carbs</p>
                  <p className="font-medium">{mealPlan.carbs}g</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-md">
                  <p className="text-xs text-muted-foreground">Fat</p>
                  <p className="font-medium">{mealPlan.fat}g</p>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium">Meals</h3>
                {mealPlan.meals?.map((meal: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="capitalize">
                        {meal.meal_type}
                      </Badge>
                      <span className="text-sm font-medium">{meal.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {meal.calories} kcal
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-right">
                <Button variant="link" className="p-0 h-auto text-primary" onClick={() => window.location.href = "#meal-planner"}>
                  View Meal Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Macro Distribution</CardTitle>
              <CardDescription>
                Percentage of calories from each macronutrient
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={macros}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {macros.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {foodGroups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Food Group Balance</CardTitle>
                <CardDescription>
                  Distribution of food groups in your meal plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={foodGroups}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {foodGroups.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {mealPlan.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Nutritionist Notes</CardTitle>
            <CardDescription>
              Additional guidance for today's nutrition plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{mealPlan.notes}</p>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Hydration Reminder</CardTitle>
          <CardDescription>
            Stay hydrated to optimize performance and recovery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Daily Target</span>
                <span className="text-sm">{mealPlan.hydration || 2500}ml</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
              <p className="text-sm text-blue-800">
                Remember to drink water regularly throughout the day, especially before, during, and after workouts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}