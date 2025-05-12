// Nutrition AI Service
// This service interacts with the Google Gemini AI model to generate personalized meal plans

import { apiRequest } from "./queryClient";

// Food item in a meal
export interface AIGeneratedFood {
  name: string;
  quantity: string;
  servingUnit: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

// Meal in a meal plan
export interface AIGeneratedMeal {
  name: string;
  mealType: string; // breakfast, lunch, dinner, snack
  timeOfDay: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foods: AIGeneratedFood[];
  recipe?: string;
  preparationTime?: number;
}

// Daily nutritional summary
export interface DailyNutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  hydration: number; // in milliliters
  meals: AIGeneratedMeal[];
}

// Complete meal plan
export interface AIGeneratedMealPlan {
  date: string;
  dailyPlan: DailyNutritionSummary;
  notes?: string;
  userPreferences?: NutritionPreference;
}

// User nutrition preferences
export interface NutritionPreference {
  id: number;
  user_id: number;
  dietary_restrictions: string[]; // vegan, vegetarian, gluten-free, etc.
  excluded_foods: string[]; // foods to avoid
  preferred_foods: string[]; // foods the user likes
  calorie_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  meal_count: number; // number of meals per day
  created_at: Date;
  updated_at: Date;
}

/**
 * Generates a meal plan based on user preferences, training load, and dietary needs
 * @param userId The user ID
 * @param date The date for the meal plan
 * @returns A promise that resolves to the generated meal plan
 */
export async function getMealPlan(userId: number, date: string): Promise<AIGeneratedMealPlan | null> {
  try {
    const response = await apiRequest("GET", `/api/nutrition/meal-plan/${userId}?date=${date}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching meal plan:", error);
    return null;
  }
}

/**
 * Generates a new meal plan using the Google Gemini AI model
 * @param userId The user ID
 * @param preferences The user's nutrition preferences
 * @param trainingLoad Information about the user's training for the day
 * @returns A promise that resolves to the generated meal plan
 */
export async function generateMealPlan(
  userId: number, 
  preferences: NutritionPreference,
  trainingLoad?: {
    calories_burned: number;
    workout_type: string;
    duration_minutes: number;
  }
): Promise<AIGeneratedMealPlan | null> {
  try {
    const response = await apiRequest("POST", "/api/nutrition/generate-meal-plan", {
      userId,
      preferences,
      trainingLoad,
      date: new Date().toISOString().split('T')[0]
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error generating meal plan:", error);
    return null;
  }
}

/**
 * Gets the user's nutrition preferences
 * @param userId The user ID
 * @returns A promise that resolves to the user's nutrition preferences
 */
export async function getNutritionPreferences(userId: number): Promise<NutritionPreference | null> {
  try {
    const response = await apiRequest("GET", `/api/nutrition/preferences/${userId}`);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching nutrition preferences:", error);
    return null;
  }
}

/**
 * Updates the user's nutrition preferences
 * @param userId The user ID
 * @param preferences The updated preferences
 * @returns A promise that resolves to the updated preferences
 */
export async function updateNutritionPreferences(
  userId: number,
  preferences: Partial<NutritionPreference>
): Promise<NutritionPreference | null> {
  try {
    const response = await apiRequest("PATCH", `/api/nutrition/preferences/${userId}`, preferences);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating nutrition preferences:", error);
    return null;
  }
}