// AI-powered nutrition recommendation service
import { 
  MealPlan, 
  FoodItem, 
  Meal, 
  NutritionPreference,
  InsertMealPlan
} from "@shared/schema";
import { apiRequest } from "./queryClient";

// Types for nutrition AI responses
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

// Nutrition recommendation parameters
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

// Get nutrition preferences for a user
export async function getNutritionPreferences(userId: number): Promise<NutritionPreference | null> {
  try {
    const response = await apiRequest("GET", `/api/nutrition/preferences/${userId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error fetching nutrition preferences:", error);
    return null;
  }
}

// Save nutrition preferences
export async function saveNutritionPreferences(preferences: NutritionPreference): Promise<boolean> {
  try {
    const response = await apiRequest("POST", `/api/nutrition/preferences`, preferences);
    return response.ok;
  } catch (error) {
    console.error("Error saving nutrition preferences:", error);
    return false;
  }
}

// Get a user's meal plan for a specific date
export async function getMealPlan(userId: number, date: string): Promise<MealPlan | null> {
  try {
    const response = await apiRequest("GET", `/api/nutrition/meal-plans/${userId}/${date}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error fetching meal plan:", error);
    return null;
  }
}

// Generate a meal plan using AI
export async function generateAIMealPlan(params: NutritionRecommendationParams): Promise<AIGeneratedMealPlan | null> {
  try {
    const response = await apiRequest("POST", "/api/nutrition/generate", params);
    if (!response.ok) {
      throw new Error(`Failed to generate meal plan: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error generating AI meal plan:", error);
    return null;
  }
}

// Save an AI-generated meal plan to the database
export async function saveMealPlan(mealPlan: InsertMealPlan, meals: Meal[], foodItems: FoodItem[]): Promise<boolean> {
  try {
    const response = await apiRequest("POST", "/api/nutrition/save-plan", {
      mealPlan,
      meals,
      foodItems
    });
    return response.ok;
  } catch (error) {
    console.error("Error saving meal plan:", error);
    return false;
  }
}

// Get food items by category (for displaying options)
export async function getFoodItemsByCategory(category: string): Promise<FoodItem[]> {
  try {
    const response = await apiRequest("GET", `/api/nutrition/food-items/${category}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error(`Error fetching food items for category ${category}:`, error);
    return [];
  }
}

// Search for food items
export async function searchFoodItems(query: string): Promise<FoodItem[]> {
  try {
    const response = await apiRequest("GET", `/api/nutrition/food-items/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error(`Error searching food items for "${query}":`, error);
    return [];
  }
}

// Calculate nutrition stats based on a list of food items
export function calculateNutrition(foodItems: (FoodItem & { quantity: number })[]): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  return foodItems.reduce((totals, item) => {
    const multiplier = item.quantity || 1;
    return {
      calories: totals.calories + (item.calories * multiplier),
      protein: totals.protein + (item.protein * multiplier),
      carbs: totals.carbs + (item.carbs * multiplier),
      fat: totals.fat + (item.fat * multiplier),
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}