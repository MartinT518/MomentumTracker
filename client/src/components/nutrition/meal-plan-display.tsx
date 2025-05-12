import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AIGeneratedMealPlan, AIGeneratedMeal } from "@/lib/nutrition-ai-service";

interface MealPlanDisplayProps {
  plan: AIGeneratedMealPlan;
}

export default function MealPlanDisplay({ plan }: MealPlanDisplayProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  
  // Calculate macro percentages
  const proteinPercentage = Math.round((plan.dailyPlan.protein / plan.dailyPlan.calories) * 400); // 4 cal per gram
  const carbsPercentage = Math.round((plan.dailyPlan.carbs / plan.dailyPlan.calories) * 400); // 4 cal per gram
  const fatPercentage = Math.round((plan.dailyPlan.fat / plan.dailyPlan.calories) * 900); // 9 cal per gram
  
  // Determine if we have a weekly plan
  const hasWeeklyPlan = plan.weeklyPlans && plan.weeklyPlans.length > 0;
  
  // Get the current day's plan
  const currentPlan = hasWeeklyPlan ? plan.weeklyPlans![selectedDay] : plan;

  return (
    <div className="space-y-6">
      {/* Nutrition Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Nutrition Summary</CardTitle>
          <CardDescription>
            Daily nutrition breakdown and macronutrient balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Calories</span>
                  <span className="text-sm font-medium">{currentPlan.dailyPlan.calories} kcal</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Protein</span>
                  <span className="text-sm font-medium">{currentPlan.dailyPlan.protein}g ({proteinPercentage}%)</span>
                </div>
                <Progress value={proteinPercentage} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Carbs</span>
                  <span className="text-sm font-medium">{currentPlan.dailyPlan.carbs}g ({carbsPercentage}%)</span>
                </div>
                <Progress value={carbsPercentage} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Fat</span>
                  <span className="text-sm font-medium">{currentPlan.dailyPlan.fat}g ({fatPercentage}%)</span>
                </div>
                <Progress value={fatPercentage} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Hydration Target</span>
                  <span className="text-sm font-medium">{currentPlan.dailyPlan.hydration}ml</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
            </div>
            
            <div className="flex flex-col justify-center">
              <div className="flex space-x-2 mb-4">
                <div className="w-4 h-4 rounded-full bg-primary"></div>
                <span className="text-sm">Protein: {proteinPercentage}%</span>
              </div>
              <div className="flex space-x-2 mb-4">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span className="text-sm">Carbs: {carbsPercentage}%</span>
              </div>
              <div className="flex space-x-2 mb-4">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span className="text-sm">Fat: {fatPercentage}%</span>
              </div>
              {plan.notes && (
                <div className="mt-4 p-3 bg-primary/10 rounded-md text-sm">
                  <p className="font-semibold mb-1">Notes:</p>
                  <p>{plan.notes}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Plan Tabs (if available) */}
      {hasWeeklyPlan && (
        <Tabs 
          defaultValue="0" 
          onValueChange={(val) => setSelectedDay(parseInt(val))}
          className="w-full"
        >
          <TabsList className="grid grid-cols-7 mb-4">
            <TabsTrigger value="0">Day 1</TabsTrigger>
            <TabsTrigger value="1">Day 2</TabsTrigger>
            <TabsTrigger value="2">Day 3</TabsTrigger>
            <TabsTrigger value="3">Day 4</TabsTrigger>
            <TabsTrigger value="4">Day 5</TabsTrigger>
            <TabsTrigger value="5">Day 6</TabsTrigger>
            <TabsTrigger value="6">Day 7</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Meal Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Daily Meals</CardTitle>
          <CardDescription>
            Full breakdown of your meal plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {currentPlan.dailyPlan.meals.map((meal, index) => (
              <AccordionItem key={index} value={`meal-${index}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between w-full">
                    <div className="font-medium">
                      {meal.name} <Badge variant="outline" className="ml-2">{meal.mealType}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 sm:mt-0">
                      {meal.calories} kcal • {meal.protein}g protein • {meal.timeOfDay}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <MealDetail meal={meal} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

interface MealDetailProps {
  meal: AIGeneratedMeal;
}

function MealDetail({ meal }: MealDetailProps) {
  return (
    <div className="space-y-4 px-1">
      {/* Macronutrient breakdown */}
      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="p-2 bg-primary/10 rounded-md">
          <p className="text-xs text-muted-foreground">Calories</p>
          <p className="font-medium">{meal.calories} kcal</p>
        </div>
        <div className="p-2 bg-primary/10 rounded-md">
          <p className="text-xs text-muted-foreground">Protein</p>
          <p className="font-medium">{meal.protein}g</p>
        </div>
        <div className="p-2 bg-primary/10 rounded-md">
          <p className="text-xs text-muted-foreground">Carbs</p>
          <p className="font-medium">{meal.carbs}g</p>
        </div>
        <div className="p-2 bg-primary/10 rounded-md">
          <p className="text-xs text-muted-foreground">Fat</p>
          <p className="font-medium">{meal.fat}g</p>
        </div>
      </div>

      {/* Ingredients list */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Ingredients</h4>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
          {meal.foods.map((food, index) => (
            <li key={index} className="text-sm flex justify-between">
              <span>{food.name}</span>
              <span className="text-muted-foreground">{food.quantity} {food.servingUnit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recipe instructions */}
      {meal.recipe && (
        <>
          <Separator />
          <div>
            <h4 className="text-sm font-semibold mb-2">Preparation</h4>
            {meal.preparationTime && (
              <p className="text-xs text-muted-foreground mb-2">
                Preparation time: approximately {meal.preparationTime} minutes
              </p>
            )}
            <p className="text-sm whitespace-pre-line">{meal.recipe}</p>
          </div>
        </>
      )}
    </div>
  );
}