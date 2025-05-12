import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import MealPlanDisplay from "./meal-plan-display";
import { NutritionPreference, AIGeneratedMealPlan } from "@/lib/nutrition-ai-service";

// Form schema for generating a meal plan
const mealPlanSchema = z.object({
  date: z.date(),
  trainingLoad: z.enum(["rest", "light", "moderate", "heavy"]),
  activityLevel: z.string(),
  fitnessGoals: z.array(z.string()).min(1, "Select at least one fitness goal"),
  healthConditions: z.array(z.string()).optional(),
  recoverySituation: z.string().optional(),
  useWeeklyMealPlanning: z.boolean().default(false),
  customNotes: z.string().optional(),
});

type MealPlanFormValues = z.infer<typeof mealPlanSchema>;

interface MealPlannerProps {
  preferences: NutritionPreference | null;
  existingMealPlan: any;
  userId: number;
}

export default function MealPlanner({ preferences, existingMealPlan, userId }: MealPlannerProps) {
  const { toast } = useToast();
  const [generatedPlan, setGeneratedPlan] = useState<AIGeneratedMealPlan | null>(null);
  const [step, setStep] = useState<'form' | 'result'>(existingMealPlan ? 'result' : 'form');

  // Initialize with existing meal plan if available
  useEffect(() => {
    if (existingMealPlan) {
      setGeneratedPlan({
        dailyPlan: {
          calories: existingMealPlan.calories,
          protein: existingMealPlan.protein,
          carbs: existingMealPlan.carbs,
          fat: existingMealPlan.fat,
          hydration: existingMealPlan.hydration || 2000,
          meals: existingMealPlan.meals.map((meal: any) => ({
            name: meal.name,
            mealType: meal.meal_type,
            timeOfDay: meal.time_of_day,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            recipe: meal.recipe,
            preparationTime: meal.preparation_time,
            foods: meal.foodItems.map((food: any) => ({
              name: food.name,
              quantity: food.quantity,
              servingUnit: food.serving_unit,
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fat: food.fat
            }))
          }))
        }
      });
    }
  }, [existingMealPlan]);

  // Form setup
  const form = useForm<MealPlanFormValues>({
    resolver: zodResolver(mealPlanSchema),
    defaultValues: {
      date: new Date(),
      trainingLoad: "moderate",
      activityLevel: "moderate",
      fitnessGoals: ["improve_performance"],
      healthConditions: [],
      recoverySituation: "",
      useWeeklyMealPlanning: false,
      customNotes: "",
    },
  });

  // Generate meal plan
  const generateMutation = useMutation({
    mutationFn: async (data: MealPlanFormValues) => {
      // Convert user preferences into the format needed for the API
      const userPreferences = {
        dietaryRestrictions: preferences?.dietary_restrictions 
          ? preferences.dietary_restrictions.split(',').map(s => s.trim()) 
          : [],
        allergies: preferences?.allergies 
          ? preferences.allergies.split(',').map(s => s.trim()) 
          : [],
        dislikedFoods: preferences?.disliked_foods 
          ? preferences.disliked_foods.split(',').map(s => s.trim()) 
          : [],
        favoriteFoods: preferences?.favorite_foods 
          ? preferences.favorite_foods.split(',').map(s => s.trim()) 
          : [],
        calorieGoal: preferences?.calorie_goal,
        proteinGoal: preferences?.protein_goal,
        carbsGoal: preferences?.carbs_goal,
        fatGoal: preferences?.fat_goal,
      };

      const payload = {
        userId,
        date: format(data.date, 'yyyy-MM-dd'),
        trainingLoad: data.trainingLoad,
        userPreferences,
        activityLevel: data.activityLevel,
        fitnessGoals: data.fitnessGoals,
        healthConditions: data.healthConditions?.length ? data.healthConditions : undefined,
        recoverySituation: data.recoverySituation,
        useWeeklyMealPlanning: data.useWeeklyMealPlanning,
        customNotes: data.customNotes,
      };

      const response = await apiRequest("POST", "/api/nutrition/generate", payload);
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedPlan(data);
      setStep('result');
      toast({
        title: "Meal Plan Generated",
        description: "Your personalized meal plan has been created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate meal plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Save meal plan to database
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!generatedPlan) return null;
      
      // Convert the generated plan to database format
      const planDate = format(form.getValues('date'), 'yyyy-MM-dd');
      
      // Prepare meal plan data
      const mealPlan = {
        user_id: userId,
        plan_date: planDate,
        calories: generatedPlan.dailyPlan.calories,
        protein: generatedPlan.dailyPlan.protein,
        carbs: generatedPlan.dailyPlan.carbs,
        fat: generatedPlan.dailyPlan.fat,
        hydration: generatedPlan.dailyPlan.hydration,
        is_active: true,
        training_load: form.getValues('trainingLoad'),
        notes: generatedPlan.notes || "",
      };
      
      // Prepare meals data
      const meals = generatedPlan.dailyPlan.meals.map((meal, index) => ({
        tempId: `temp-${index}`, // Temporary ID for linking with food items
        name: meal.name,
        meal_type: meal.mealType,
        time_of_day: meal.timeOfDay,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        recipe: meal.recipe || "",
        preparation_time: meal.preparationTime || 0,
        order: index + 1,
      }));
      
      // Prepare food items data
      const foodItems = [];
      generatedPlan.dailyPlan.meals.forEach((meal, mealIndex) => {
        meal.foods.forEach((food) => {
          foodItems.push({
            name: food.name,
            mealId: `temp-${mealIndex}`, // Link to meal using temp ID
            category: guessCategory(food.name),
            quantity: food.quantity,
            servingUnit: food.servingUnit,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
          });
        });
      });
      
      const payload = {
        mealPlan,
        meals,
        foodItems,
      };
      
      const response = await apiRequest("POST", "/api/nutrition/save-plan", payload);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Meal Plan Saved",
        description: "Your meal plan has been saved successfully.",
      });
      
      // Invalidate the meal plan query to refresh data
      queryClient.invalidateQueries({
        queryKey: ["/api/nutrition/meal-plans", userId, format(form.getValues('date'), 'yyyy-MM-dd')],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save meal plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper to guess food category based on its name - this is a simple version
  const guessCategory = (foodName: string) => {
    foodName = foodName.toLowerCase();
    
    if (/milk|yogurt|cheese|cream/.test(foodName)) return "dairy";
    if (/beef|chicken|pork|turkey|fish|salmon|tuna|meat/.test(foodName)) return "protein";
    if (/bread|rice|pasta|oats|cereal|quinoa/.test(foodName)) return "grains";
    if (/apple|banana|orange|berry|fruit/.test(foodName)) return "fruits";
    if (/broccoli|spinach|carrot|kale|lettuce|vegetable/.test(foodName)) return "vegetables";
    if (/oil|butter|avocado/.test(foodName)) return "fats";
    if (/cookie|cake|chocolate|candy|dessert/.test(foodName)) return "sweets";
    if (/water|tea|coffee|juice|beverage/.test(foodName)) return "beverages";
    
    return "other";
  };

  const onSubmit = (data: MealPlanFormValues) => {
    generateMutation.mutate(data);
  };

  const activityLevels = [
    { value: "sedentary", label: "Sedentary (little to no exercise)" },
    { value: "light", label: "Light (exercise 1-3 days/week)" },
    { value: "moderate", label: "Moderate (exercise 3-5 days/week)" },
    { value: "active", label: "Active (exercise 6-7 days/week)" },
    { value: "very_active", label: "Very Active (intense exercise daily or twice daily)" },
  ];

  const fitnessGoalTypes = [
    { id: "improve_performance", label: "Improve Performance" },
    { id: "build_muscle", label: "Build Muscle" },
    { id: "lose_weight", label: "Lose Weight" },
    { id: "maintain_weight", label: "Maintain Weight" },
    { id: "increase_endurance", label: "Increase Endurance" },
    { id: "race_preparation", label: "Race Preparation" },
    { id: "recovery", label: "Recovery Support" },
  ];

  const healthConditionTypes = [
    { id: "diabetes", label: "Diabetes" },
    { id: "hypertension", label: "Hypertension" },
    { id: "heart_disease", label: "Heart Disease" },
    { id: "high_cholesterol", label: "High Cholesterol" },
    { id: "ibs", label: "Irritable Bowel Syndrome" },
    { id: "celiac", label: "Celiac Disease" },
    { id: "arthritis", label: "Arthritis" },
  ];

  if (step === 'result' && generatedPlan) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Personalized Meal Plan</h2>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setStep('form')}
              disabled={saveMutation.isPending}
            >
              Generate New Plan
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Save Plan"
              )}
            </Button>
          </div>
        </div>
        
        <MealPlanDisplay plan={generatedPlan} />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Meal Plan</CardTitle>
        <CardDescription>
          Create a personalized meal plan based on your training and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setDate(new Date().getDate() - 1))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      The date for your meal plan
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trainingLoad"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Training Load</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-3 space-y-0">
                          <RadioGroupItem value="rest" id="rest" />
                          <label
                            htmlFor="rest"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Rest Day
                          </label>
                        </div>
                        <div className="flex items-center space-x-3 space-y-0">
                          <RadioGroupItem value="light" id="light" />
                          <label
                            htmlFor="light"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Light Training
                          </label>
                        </div>
                        <div className="flex items-center space-x-3 space-y-0">
                          <RadioGroupItem value="moderate" id="moderate" />
                          <label
                            htmlFor="moderate"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Moderate Training
                          </label>
                        </div>
                        <div className="flex items-center space-x-3 space-y-0">
                          <RadioGroupItem value="heavy" id="heavy" />
                          <label
                            htmlFor="heavy"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Heavy/Intense Training
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      Your training intensity for this day
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="activityLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Activity Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your activity level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activityLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Your general daily activity level
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fitnessGoals"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Fitness Goals</FormLabel>
                    <FormDescription>
                      Select the goals this meal plan should support
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {fitnessGoalTypes.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="fitnessGoals"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, item.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {item.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="healthConditions"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Health Conditions</FormLabel>
                    <FormDescription>
                      Select any health conditions that should be considered
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {healthConditionTypes.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="healthConditions"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), item.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {item.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recoverySituation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recovery Situation</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe any specific recovery needs (e.g., post-race, injury recovery, etc.)"
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Any specific recovery requirements for your nutrition
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="useWeeklyMealPlanning"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Create Weekly Meal Plan
                    </FormLabel>
                    <FormDescription>
                      Generate a full week of meals instead of a single day
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Plan
                </>
              ) : (
                "Generate Meal Plan"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}