import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Clock, Utensils } from "lucide-react";
import { AIGeneratedMealPlan, AIGeneratedMeal } from "@/lib/nutrition-ai-service";

interface MealPlanDisplayProps {
  plan: AIGeneratedMealPlan;
}

export default function MealPlanDisplay({ plan }: MealPlanDisplayProps) {
  if (!plan || !plan.dailyPlan) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Meal Plan Available</CardTitle>
          <CardDescription>
            There is no meal plan to display. Generate a new plan to see recommendations.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Summary</CardTitle>
            <CardDescription>
              Total nutrients for the day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-primary/10 rounded-md">
                  <p className="text-xs text-muted-foreground">Calories</p>
                  <p className="font-medium">{plan.dailyPlan.calories} kcal</p>
                </div>
                <div className="p-3 bg-green-100 rounded-md">
                  <p className="text-xs text-muted-foreground">Protein</p>
                  <p className="font-medium">{plan.dailyPlan.protein}g</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-md">
                  <p className="text-xs text-muted-foreground">Carbs</p>
                  <p className="font-medium">{plan.dailyPlan.carbs}g</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-md">
                  <p className="text-xs text-muted-foreground">Fat</p>
                  <p className="font-medium">{plan.dailyPlan.fat}g</p>
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-blue-700">Hydration Target</span>
                </div>
                <p className="text-sm text-blue-800">{plan.dailyPlan.hydration}ml of water</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {plan.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Nutritionist Notes</CardTitle>
              <CardDescription>
                Additional guidance for this meal plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line">{plan.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-medium">Today's Meals</h3>
        {plan.dailyPlan.meals.map((meal, index) => (
          <MealDetail key={index} meal={meal} />
        ))}
      </div>
    </div>
  );
}

interface MealDetailProps {
  meal: AIGeneratedMeal;
}

function MealDetail({ meal }: MealDetailProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">{meal.name}</CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="capitalize">
                {meal.mealType}
              </Badge>
              <span className="text-sm text-muted-foreground">{meal.timeOfDay}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">{meal.calories} kcal</p>
            <div className="text-xs text-muted-foreground space-x-1">
              <span>P: {meal.protein}g</span>
              <span>C: {meal.carbs}g</span>
              <span>F: {meal.fat}g</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <h4 className="text-sm font-medium mb-2">Foods</h4>
        <ul className="space-y-2 mb-4">
          {meal.foods.map((food, index) => (
            <li key={index} className="text-sm">
              <div className="flex justify-between">
                <span>
                  {food.name} <span className="text-muted-foreground">({food.quantity} {food.servingUnit})</span>
                </span>
                <span className="text-muted-foreground">{food.calories} kcal</span>
              </div>
            </li>
          ))}
        </ul>
        
        {meal.recipe && (
          <>
            <Separator className="my-3" />
            <div className="mt-4">
              <div className="flex items-center space-x-2 mb-2">
                <Utensils className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-medium">Preparation</h4>
              </div>
              <p className="text-sm whitespace-pre-line">{meal.recipe}</p>
            </div>
          </>
        )}
        
        {meal.preparationTime && (
          <div className="mt-4 flex items-center text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>Prep time: {meal.preparationTime} min</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}