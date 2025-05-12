import { apiRequest } from "./queryClient";
import { format } from "date-fns";

// Type definitions for nutrition-related data

export interface NutritionPreference {
  id?: number;
  user_id: number;
  dietary_type?: string;
  calorie_goal?: number;
  protein_goal?: number;
  carbs_goal?: number;
  fat_goal?: number;
  meal_frequency?: number;
  favorite_foods?: string;
  disliked_foods?: string;
  allergies?: string;
  dietary_restrictions?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MealPlan {
  id?: number;
  user_id: number;
  plan_date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  hydration?: number;
  is_active: boolean;
  training_load?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  meals?: Meal[];
}

export interface Meal {
  id?: number;
  meal_plan_id: number;
  name: string;
  meal_type: string;
  time_of_day: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recipe?: string;
  preparation_time?: number;
  order: number;
  created_at?: string;
  updated_at?: string;
  foodItems?: FoodItem[];
}

export interface FoodItem {
  id?: number;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size?: string;
  serving_unit?: string;
  created_at?: string;
  updated_at?: string;
  quantity?: number;
}

export interface AIGeneratedMealPlan {
  dailyPlan: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    hydration: number;
    meals: AIGeneratedMeal[];
  };
  weeklyPlans?: AIGeneratedMealPlan[];
  notes?: string;
}

export interface AIGeneratedMeal {
  name: string;
  mealType: string;
  timeOfDay: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foods: AIGeneratedFoodItem[];
  recipe?: string;
  preparationTime?: number;
}

export interface AIGeneratedFoodItem {
  name: string;
  quantity: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionRecommendationParams {
  userId: number;
  date: string;
  trainingLoad: "rest" | "light" | "moderate" | "heavy";
  userPreferences: {
    dietaryRestrictions?: string[];
    allergies?: string[];
    dislikedFoods?: string[];
    favoriteFoods?: string[];
    calorieGoal?: number;
    proteinGoal?: number;
    carbsGoal?: number;
    fatGoal?: number;
  };
  activityLevel: string;
  fitnessGoals: string[];
  healthConditions?: string[];
  recoverySituation?: string;
  useWeeklyMealPlanning?: boolean;
}

// API functions for nutrition-related data

export async function getNutritionPreferences(userId: number): Promise<NutritionPreference | null> {
  try {
    const response = await apiRequest("GET", `/api/nutrition/preferences/${userId}`);
    if (response.status === 404) return null;
    return await response.json();
  } catch (error) {
    console.error("Error fetching nutrition preferences:", error);
    return null;
  }
}

export async function saveNutritionPreferences(preferences: NutritionPreference): Promise<boolean> {
  try {
    const response = await apiRequest("POST", "/api/nutrition/preferences", preferences);
    return response.status === 201 || response.status === 200;
  } catch (error) {
    console.error("Error saving nutrition preferences:", error);
    return false;
  }
}

export async function getMealPlan(userId: number, date: string): Promise<MealPlan | null> {
  try {
    const response = await apiRequest("GET", `/api/nutrition/meal-plans/${userId}/${date}`);
    if (response.status === 404) return null;
    return await response.json();
  } catch (error) {
    console.error("Error fetching meal plan:", error);
    return null;
  }
}

export async function generateAIMealPlan(params: NutritionRecommendationParams): Promise<AIGeneratedMealPlan | null> {
  try {
    const response = await apiRequest("POST", "/api/nutrition/generate", params);
    return await response.json();
  } catch (error) {
    console.error("Error generating AI meal plan:", error);
    return null;
  }
}

export async function saveMealPlan(mealPlan: MealPlan, meals: Meal[], foodItems: any[]): Promise<boolean> {
  try {
    const payload = {
      mealPlan,
      meals,
      foodItems,
    };
    
    const response = await apiRequest("POST", "/api/nutrition/save-plan", payload);
    return response.status === 201 || response.status === 200;
  } catch (error) {
    console.error("Error saving meal plan:", error);
    return false;
  }
}

export async function getFoodItemsByCategory(category: string): Promise<FoodItem[]> {
  try {
    const response = await apiRequest("GET", `/api/nutrition/food-items/${category}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching food items for category ${category}:`, error);
    return [];
  }
}

export async function searchFoodItems(query: string): Promise<FoodItem[]> {
  try {
    const response = await apiRequest("GET", `/api/nutrition/food-items/search?q=${encodeURIComponent(query)}`);
    return await response.json();
  } catch (error) {
    console.error("Error searching food items:", error);
    return [];
  }
}

export function calculateNutrition(foodItems: (FoodItem & { quantity: number })[]): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  return foodItems.reduce(
    (acc, item) => {
      const multiplier = item.quantity || 1;
      return {
        calories: acc.calories + item.calories * multiplier,
        protein: acc.protein + item.protein * multiplier,
        carbs: acc.carbs + item.carbs * multiplier,
        fat: acc.fat + item.fat * multiplier,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}