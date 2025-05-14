/**
 * Predefined meal plans for different athlete types 
 * Based on the approach from AIEndurance.com for triathlon/running/cycling nutrition
 */

export interface Ingredient {
  name: string;
  amount: string;
}

export interface MealMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  name: string;
  mealType: string;
  ingredients: Ingredient[];
  macros: MealMacros;
  instructions: string;
}

export interface DailyPlan {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: Meal[];
}

export interface MealPlanResponse {
  dailyPlan: DailyPlan;
}

// Meal plan for endurance runners - high carb, moderate protein, low fat
export const runnerMealPlan: MealPlanResponse = {
  dailyPlan: {
    totalCalories: 2800,
    totalProtein: 140,
    totalCarbs: 420,
    totalFat: 65,
    meals: [
      {
        name: "Pre-Run Breakfast",
        mealType: "Breakfast",
        ingredients: [
          { name: "rolled oats", amount: "1 cup" },
          { name: "banana", amount: "1 medium" },
          { name: "honey", amount: "1 tbsp" },
          { name: "almond milk", amount: "1 cup" },
          { name: "chia seeds", amount: "1 tbsp" },
          { name: "walnuts", amount: "1 tbsp, chopped" }
        ],
        macros: {
          calories: 580,
          protein: 15,
          carbs: 96,
          fat: 16
        },
        instructions: "Combine oats and almond milk in a bowl. Microwave for 2 minutes, then stir in honey, sliced banana, chia seeds, and walnuts."
      },
      {
        name: "Post-Run Recovery Smoothie",
        mealType: "Snack",
        ingredients: [
          { name: "whey protein powder", amount: "1 scoop (25g)" },
          { name: "frozen berries", amount: "1 cup" },
          { name: "spinach", amount: "1 cup" },
          { name: "Greek yogurt", amount: "1/2 cup" },
          { name: "water or ice", amount: "1/2 cup" }
        ],
        macros: {
          calories: 320,
          protein: 32,
          carbs: 34,
          fat: 4
        },
        instructions: "Blend all ingredients until smooth. Consume within 30 minutes after training for optimal recovery."
      },
      {
        name: "Balanced Lunch Bowl",
        mealType: "Lunch",
        ingredients: [
          { name: "quinoa", amount: "1 cup, cooked" },
          { name: "grilled chicken breast", amount: "4 oz" },
          { name: "avocado", amount: "1/4" },
          { name: "cherry tomatoes", amount: "1/2 cup" },
          { name: "cucumber", amount: "1/2 cup, diced" },
          { name: "olive oil", amount: "1 tsp" },
          { name: "lemon juice", amount: "1 tbsp" }
        ],
        macros: {
          calories: 520,
          protein: 40,
          carbs: 58,
          fat: 16
        },
        instructions: "Place quinoa in a bowl, top with grilled chicken, avocado, tomatoes, and cucumber. Drizzle with olive oil and lemon juice."
      },
      {
        name: "Workout Energy Snack",
        mealType: "Snack",
        ingredients: [
          { name: "whole grain toast", amount: "1 slice" },
          { name: "almond butter", amount: "1 tbsp" },
          { name: "banana", amount: "1/2, sliced" },
          { name: "honey", amount: "1/2 tsp" }
        ],
        macros: {
          calories: 250,
          protein: 8,
          carbs: 35,
          fat: 10
        },
        instructions: "Toast bread, spread almond butter, top with banana slices and a drizzle of honey."
      },
      {
        name: "Runner's Dinner Plate",
        mealType: "Dinner",
        ingredients: [
          { name: "sweet potato", amount: "1 medium" },
          { name: "salmon fillet", amount: "5 oz" },
          { name: "broccoli", amount: "1 cup, steamed" },
          { name: "olive oil", amount: "1 tbsp" },
          { name: "lemon", amount: "1/2" },
          { name: "garlic", amount: "2 cloves, minced" },
          { name: "herbs", amount: "1 tsp, mixed" }
        ],
        macros: {
          calories: 580,
          protein: 38,
          carbs: 60,
          fat: 20
        },
        instructions: "Bake sweet potato at 400°F for 45 minutes. Season salmon with garlic, herbs, and lemon juice. Bake at 375°F for 12-15 minutes. Serve with steamed broccoli drizzled with olive oil."
      },
      {
        name: "Evening Recovery",
        mealType: "Snack",
        ingredients: [
          { name: "casein protein", amount: "1 scoop (25g)" },
          { name: "almond milk", amount: "1 cup" },
          { name: "tart cherries", amount: "1/4 cup" },
          { name: "dark chocolate", amount: "1 square (10g)" }
        ],
        macros: {
          calories: 250,
          protein: 25,
          carbs: 20,
          fat: 8
        },
        instructions: "Mix casein protein with almond milk. Enjoy with tart cherries and a small piece of dark chocolate for antioxidants and recovery."
      }
    ]
  }
};

// Meal plan for cyclists - very high carb, moderate protein, low fat
export const cyclistMealPlan: MealPlanResponse = {
  dailyPlan: {
    totalCalories: 3200,
    totalProtein: 150,
    totalCarbs: 500,
    totalFat: 70,
    meals: [
      {
        name: "Power-Start Breakfast",
        mealType: "Breakfast",
        ingredients: [
          { name: "whole grain pancakes", amount: "3 medium" },
          { name: "maple syrup", amount: "2 tbsp" },
          { name: "banana", amount: "1 large" },
          { name: "Greek yogurt", amount: "1/2 cup" },
          { name: "almonds", amount: "1 tbsp, chopped" },
          { name: "blueberries", amount: "1/2 cup" }
        ],
        macros: {
          calories: 650,
          protein: 25,
          carbs: 110,
          fat: 15
        },
        instructions: "Cook pancakes according to directions. Top with yogurt, banana, blueberries, almonds and maple syrup."
      },
      {
        name: "On-Bike Fuel",
        mealType: "Snack",
        ingredients: [
          { name: "energy gels", amount: "2 sachets" },
          { name: "electrolyte drink", amount: "750ml" },
          { name: "energy bar", amount: "1 bar (65g)" }
        ],
        macros: {
          calories: 400,
          protein: 8,
          carbs: 90,
          fat: 2
        },
        instructions: "Consume energy gel every 45 minutes during long rides. Sip electrolyte drink regularly. Have energy bar at halfway point for longer rides."
      },
      {
        name: "Recovery Lunch",
        mealType: "Lunch",
        ingredients: [
          { name: "whole grain pasta", amount: "1.5 cups, cooked" },
          { name: "lean ground turkey", amount: "4 oz" },
          { name: "tomato sauce", amount: "1/2 cup" },
          { name: "parmesan cheese", amount: "2 tbsp" },
          { name: "spinach", amount: "2 cups" },
          { name: "olive oil", amount: "1 tbsp" },
          { name: "garlic", amount: "2 cloves" }
        ],
        macros: {
          calories: 680,
          protein: 45,
          carbs: 85,
          fat: 20
        },
        instructions: "Cook pasta. In a separate pan, sauté garlic in olive oil. Add ground turkey until cooked through. Add tomato sauce and simmer. Wilt spinach into sauce. Combine with pasta and top with parmesan."
      },
      {
        name: "Afternoon Energy Boost",
        mealType: "Snack",
        ingredients: [
          { name: "whole grain crackers", amount: "8" },
          { name: "hummus", amount: "1/4 cup" },
          { name: "carrot sticks", amount: "1 cup" },
          { name: "apple", amount: "1 medium" }
        ],
        macros: {
          calories: 320,
          protein: 10,
          carbs: 55,
          fat: 8
        },
        instructions: "Serve crackers with hummus for dipping. Enjoy carrot sticks on the side and apple for a sweet finish."
      },
      {
        name: "Cyclist's Power Dinner",
        mealType: "Dinner",
        ingredients: [
          { name: "brown rice", amount: "1.5 cups, cooked" },
          { name: "grilled chicken thigh", amount: "6 oz, boneless" },
          { name: "roasted vegetables", amount: "2 cups mixed" },
          { name: "avocado", amount: "1/4" },
          { name: "olive oil", amount: "1 tbsp" },
          { name: "lemon", amount: "1/2" },
          { name: "herbs", amount: "1 tsp, mixed" }
        ],
        macros: {
          calories: 750,
          protein: 50,
          carbs: 85,
          fat: 25
        },
        instructions: "Cook rice according to package. Season chicken with herbs and grill until cooked through. Toss vegetables in olive oil and roast at 400°F for 20-25 minutes. Serve chicken over rice with roasted vegetables and sliced avocado. Squeeze lemon over the plate."
      },
      {
        name: "Overnight Recovery",
        mealType: "Snack",
        ingredients: [
          { name: "cottage cheese", amount: "1/2 cup" },
          { name: "pineapple chunks", amount: "1/4 cup" },
          { name: "walnuts", amount: "1 tbsp, chopped" },
          { name: "honey", amount: "1 tsp" }
        ],
        macros: {
          calories: 200,
          protein: 18,
          carbs: 20,
          fat: 6
        },
        instructions: "Mix cottage cheese with pineapple chunks. Top with walnuts and a drizzle of honey. Consume before bed to support muscle recovery during sleep."
      }
    ]
  }
};

// Meal plan for triathletes - balanced macros with emphasis on recovery and hydration
export const triathleteMealPlan: MealPlanResponse = {
  dailyPlan: {
    totalCalories: 3500,
    totalProtein: 175,
    totalCarbs: 490,
    totalFat: 90,
    meals: [
      {
        name: "Morning Kickstart",
        mealType: "Breakfast",
        ingredients: [
          { name: "eggs", amount: "2 whole" },
          { name: "egg whites", amount: "3" },
          { name: "sweet potato", amount: "1 small, diced" },
          { name: "bell peppers", amount: "1/2 cup, chopped" },
          { name: "spinach", amount: "1 cup" },
          { name: "whole grain toast", amount: "2 slices" },
          { name: "avocado", amount: "1/4" }
        ],
        macros: {
          calories: 640,
          protein: 40,
          carbs: 70,
          fat: 20
        },
        instructions: "Sauté sweet potatoes until soft. Add peppers and spinach. Cook eggs and whites with vegetables. Serve with toast topped with mashed avocado."
      },
      {
        name: "Pre-Workout Fuel",
        mealType: "Snack",
        ingredients: [
          { name: "banana", amount: "1 large" },
          { name: "rice cakes", amount: "2" },
          { name: "almond butter", amount: "1 tbsp" },
          { name: "honey", amount: "1 tsp" }
        ],
        macros: {
          calories: 340,
          protein: 8,
          carbs: 60,
          fat: 10
        },
        instructions: "Spread almond butter on rice cakes. Top with banana slices and a drizzle of honey. Consume 1-2 hours before training."
      },
      {
        name: "Triathlete Recovery Bowl",
        mealType: "Lunch",
        ingredients: [
          { name: "mixed grains", amount: "1.5 cups, cooked" },
          { name: "tuna", amount: "5 oz, canned in water" },
          { name: "mixed vegetables", amount: "2 cups" },
          { name: "olive oil", amount: "1 tbsp" },
          { name: "lemon", amount: "1/2" },
          { name: "olives", amount: "5 kalamata" },
          { name: "feta cheese", amount: "1 oz" }
        ],
        macros: {
          calories: 620,
          protein: 45,
          carbs: 75,
          fat: 18
        },
        instructions: "Mix cooked grains with drained tuna. Add mixed vegetables, olives, and crumbled feta. Drizzle with olive oil and lemon juice."
      },
      {
        name: "Training Session Fuel",
        mealType: "Snack",
        ingredients: [
          { name: "sports drink", amount: "20 oz" },
          { name: "energy chews", amount: "1 package" },
          { name: "dates", amount: "3" }
        ],
        macros: {
          calories: 350,
          protein: 2,
          carbs: 85,
          fat: 0
        },
        instructions: "Consume sports drink throughout workout. Have energy chews every 30-45 minutes during longer sessions. Use dates for quick natural sugar boost."
      },
      {
        name: "Protein Power Dinner",
        mealType: "Dinner",
        ingredients: [
          { name: "wild rice", amount: "1 cup, cooked" },
          { name: "sirloin steak", amount: "6 oz" },
          { name: "broccoli", amount: "1 cup, steamed" },
          { name: "carrots", amount: "1/2 cup, roasted" },
          { name: "sweet potato", amount: "1/2 medium, roasted" },
          { name: "olive oil", amount: "1 tbsp" },
          { name: "garlic", amount: "2 cloves, minced" }
        ],
        macros: {
          calories: 750,
          protein: 50,
          carbs: 75,
          fat: 25
        },
        instructions: "Cook wild rice according to package. Grill steak to desired doneness. Roast carrots and sweet potato with olive oil and garlic at 400°F for 20-25 minutes. Steam broccoli until tender-crisp. Serve all components together."
      },
      {
        name: "Muscle Repair Shake",
        mealType: "Snack",
        ingredients: [
          { name: "casein protein", amount: "1 scoop (25g)" },
          { name: "almond milk", amount: "1 cup" },
          { name: "frozen cherries", amount: "1/2 cup" },
          { name: "almond butter", amount: "1 tbsp" },
          { name: "flaxseed", amount: "1 tbsp, ground" }
        ],
        macros: {
          calories: 320,
          protein: 30,
          carbs: 25,
          fat: 12
        },
        instructions: "Blend all ingredients until smooth. Consume before bedtime to support overnight muscle recovery and reduce inflammation."
      }
    ]
  }
};

// Meal plan for vegan athletes - high carb, varied protein sources, healthy fats
export const veganAthleteMealPlan: MealPlanResponse = {
  dailyPlan: {
    totalCalories: 2900,
    totalProtein: 130,
    totalCarbs: 420,
    totalFat: 80,
    meals: [
      {
        name: "Power Plant Breakfast",
        mealType: "Breakfast",
        ingredients: [
          { name: "tofu", amount: "6 oz, firm" },
          { name: "nutritional yeast", amount: "2 tbsp" },
          { name: "turmeric", amount: "1/4 tsp" },
          { name: "black salt (kala namak)", amount: "1/8 tsp" },
          { name: "spinach", amount: "2 cups" },
          { name: "whole grain toast", amount: "2 slices" },
          { name: "avocado", amount: "1/4" }
        ],
        macros: {
          calories: 520,
          protein: 35,
          carbs: 50,
          fat: 22
        },
        instructions: "Crumble tofu in a pan with turmeric and black salt. Cook until heated through, then add nutritional yeast. Sauté spinach separately. Serve with toast topped with mashed avocado."
      },
      {
        name: "Pre-Training Smoothie",
        mealType: "Snack",
        ingredients: [
          { name: "banana", amount: "1 medium" },
          { name: "plant-based protein powder", amount: "1 scoop (25g)" },
          { name: "almond milk", amount: "1 cup" },
          { name: "spinach", amount: "1 cup" },
          { name: "flaxseed", amount: "1 tbsp, ground" },
          { name: "dates", amount: "2" }
        ],
        macros: {
          calories: 380,
          protein: 25,
          carbs: 55,
          fat: 8
        },
        instructions: "Blend all ingredients until smooth. Consume 1-2 hours before training."
      },
      {
        name: "Recovery Grain Bowl",
        mealType: "Lunch",
        ingredients: [
          { name: "quinoa", amount: "1 cup, cooked" },
          { name: "lentils", amount: "1/2 cup, cooked" },
          { name: "roasted vegetables", amount: "1.5 cups mixed" },
          { name: "avocado", amount: "1/4" },
          { name: "hemp seeds", amount: "1 tbsp" },
          { name: "tahini", amount: "1 tbsp" },
          { name: "lemon juice", amount: "1 tbsp" }
        ],
        macros: {
          calories: 580,
          protein: 25,
          carbs: 75,
          fat: 22
        },
        instructions: "Mix quinoa and lentils. Top with roasted vegetables and avocado. Sprinkle with hemp seeds. Whisk tahini with lemon juice and drizzle over bowl."
      },
      {
        name: "Energy-Boost Snack",
        mealType: "Snack",
        ingredients: [
          { name: "apple", amount: "1 medium" },
          { name: "almond butter", amount: "2 tbsp" },
          { name: "whole grain crackers", amount: "6" }
        ],
        macros: {
          calories: 340,
          protein: 10,
          carbs: 40,
          fat: 18
        },
        instructions: "Slice apple. Spread almond butter on crackers and top with apple slices."
      },
      {
        name: "Plant-Powered Dinner",
        mealType: "Dinner",
        ingredients: [
          { name: "tempeh", amount: "6 oz" },
          { name: "sweet potato", amount: "1 medium" },
          { name: "broccoli", amount: "1 cup" },
          { name: "brown rice", amount: "1 cup, cooked" },
          { name: "olive oil", amount: "1 tbsp" },
          { name: "tamari", amount: "1 tbsp" },
          { name: "garlic", amount: "2 cloves, minced" },
          { name: "ginger", amount: "1 tsp, minced" }
        ],
        macros: {
          calories: 750,
          protein: 35,
          carbs: 105,
          fat: 22
        },
        instructions: "Marinate tempeh in tamari, garlic, and ginger. Bake at 375°F for 20 minutes. Roast sweet potato and steam broccoli. Serve with brown rice."
      },
      {
        name: "Bedtime Recovery Mix",
        mealType: "Snack",
        ingredients: [
          { name: "soy milk", amount: "1 cup" },
          { name: "tart cherries", amount: "1/2 cup" },
          { name: "walnuts", amount: "1 tbsp, chopped" },
          { name: "pea protein", amount: "1/2 scoop (12g)" }
        ],
        macros: {
          calories: 280,
          protein: 18,
          carbs: 30,
          fat: 10
        },
        instructions: "Mix pea protein with soy milk. Consume with tart cherries and walnuts before bed to support recovery."
      }
    ]
  }
};

// Meal plan for keto athletes - high fat, moderate protein, very low carb
export const ketoAthleteMealPlan: MealPlanResponse = {
  dailyPlan: {
    totalCalories: 2700,
    totalProtein: 150,
    totalCarbs: 40,
    totalFat: 200,
    meals: [
      {
        name: "Fat-Fueled Breakfast",
        mealType: "Breakfast",
        ingredients: [
          { name: "eggs", amount: "3 whole" },
          { name: "avocado", amount: "1/2" },
          { name: "spinach", amount: "2 cups" },
          { name: "mushrooms", amount: "1/2 cup" },
          { name: "grass-fed butter", amount: "1 tbsp" },
          { name: "cheese", amount: "1 oz, cheddar" }
        ],
        macros: {
          calories: 550,
          protein: 30,
          carbs: 10,
          fat: 42
        },
        instructions: "Sauté spinach and mushrooms in butter. Scramble eggs with cheese. Serve with sliced avocado."
      },
      {
        name: "Keto Energy Snack",
        mealType: "Snack",
        ingredients: [
          { name: "macadamia nuts", amount: "1/4 cup" },
          { name: "coconut flakes", amount: "2 tbsp, unsweetened" },
          { name: "dark chocolate", amount: "1 square (10g, 85%+ cocoa)" }
        ],
        macros: {
          calories: 320,
          protein: 5,
          carbs: 5,
          fat: 30
        },
        instructions: "Mix nuts and coconut flakes in a small container. Enjoy with a square of dark chocolate."
      },
      {
        name: "Keto Athlete Lunch",
        mealType: "Lunch",
        ingredients: [
          { name: "salmon", amount: "5 oz" },
          { name: "mixed greens", amount: "3 cups" },
          { name: "olive oil", amount: "2 tbsp" },
          { name: "MCT oil", amount: "1 tsp" },
          { name: "cucumber", amount: "1/2 cup, sliced" },
          { name: "olives", amount: "10 kalamata" },
          { name: "feta cheese", amount: "1 oz" }
        ],
        macros: {
          calories: 620,
          protein: 35,
          carbs: 8,
          fat: 48
        },
        instructions: "Grill or bake salmon. Place on bed of mixed greens with cucumber, olives, and crumbled feta. Dress with olive oil and MCT oil."
      },
      {
        name: "Training Fuel",
        mealType: "Snack",
        ingredients: [
          { name: "bone broth", amount: "1 cup" },
          { name: "MCT oil", amount: "1 tbsp" },
          { name: "collagen peptides", amount: "1 scoop (10g)" }
        ],
        macros: {
          calories: 230,
          protein: 15,
          carbs: 2,
          fat: 18
        },
        instructions: "Heat bone broth. Stir in MCT oil and collagen peptides. Consume before or during training."
      },
      {
        name: "Keto Power Dinner",
        mealType: "Dinner",
        ingredients: [
          { name: "grass-fed steak", amount: "6 oz" },
          { name: "asparagus", amount: "1 cup" },
          { name: "cauliflower", amount: "1 cup, riced" },
          { name: "grass-fed butter", amount: "1 tbsp" },
          { name: "olive oil", amount: "1 tbsp" },
          { name: "garlic", amount: "2 cloves, minced" },
          { name: "herbs", amount: "1 tsp, mixed" }
        ],
        macros: {
          calories: 650,
          protein: 45,
          carbs: 10,
          fat: 45
        },
        instructions: "Grill steak to desired doneness. Sauté cauliflower rice in butter with garlic. Roast asparagus with olive oil. Season all components with herbs."
      },
      {
        name: "Nighttime Recovery",
        mealType: "Snack",
        ingredients: [
          { name: "casein protein", amount: "1 scoop (25g)" },
          { name: "almond milk (unsweetened)", amount: "1 cup" },
          { name: "almond butter", amount: "1 tbsp" },
          { name: "chia seeds", amount: "1 tbsp" }
        ],
        macros: {
          calories: 280,
          protein: 30,
          carbs: 5,
          fat: 18
        },
        instructions: "Mix casein protein with unsweetened almond milk. Stir in almond butter and chia seeds. Let sit for a few minutes to thicken before consuming."
      }
    ]
  }
};

// Function to select a meal plan based on athlete profile
export function selectMealPlan(
  activityType: string = "running", 
  dietaryPreferences: string[] = [], 
  calories: number = 2800
): MealPlanResponse {
  
  // Check for dietary restrictions first
  if (dietaryPreferences.includes("keto") || dietaryPreferences.includes("ketogenic")) {
    return adjustCalories(ketoAthleteMealPlan, calories);
  }
  
  if (dietaryPreferences.includes("vegan")) {
    return adjustCalories(veganAthleteMealPlan, calories);
  }
  
  // Then check for activity type
  if (activityType.toLowerCase().includes("cycle") || activityType.toLowerCase().includes("cycling") || activityType.toLowerCase().includes("bike")) {
    return adjustCalories(cyclistMealPlan, calories);
  }
  
  if (activityType.toLowerCase().includes("triathlon") || activityType.toLowerCase().includes("multi-sport")) {
    return adjustCalories(triathleteMealPlan, calories);
  }
  
  // Default to runner meal plan
  return adjustCalories(runnerMealPlan, calories);
}

// Function to adjust calories in a meal plan
function adjustCalories(mealPlan: MealPlanResponse, targetCalories: number): MealPlanResponse {
  const currentCalories = mealPlan.dailyPlan.totalCalories;
  
  if (currentCalories === targetCalories) {
    return mealPlan;
  }
  
  const scaleFactor = targetCalories / currentCalories;
  
  // Create a deep copy to avoid modifying the original
  const adjustedPlan: MealPlanResponse = JSON.parse(JSON.stringify(mealPlan));
  
  // Adjust total macros
  adjustedPlan.dailyPlan.totalCalories = Math.round(adjustedPlan.dailyPlan.totalCalories * scaleFactor);
  adjustedPlan.dailyPlan.totalProtein = Math.round(adjustedPlan.dailyPlan.totalProtein * scaleFactor);
  adjustedPlan.dailyPlan.totalCarbs = Math.round(adjustedPlan.dailyPlan.totalCarbs * scaleFactor);
  adjustedPlan.dailyPlan.totalFat = Math.round(adjustedPlan.dailyPlan.totalFat * scaleFactor);
  
  // Adjust individual meals
  adjustedPlan.dailyPlan.meals.forEach(meal => {
    meal.macros.calories = Math.round(meal.macros.calories * scaleFactor);
    meal.macros.protein = Math.round(meal.macros.protein * scaleFactor);
    meal.macros.carbs = Math.round(meal.macros.carbs * scaleFactor);
    meal.macros.fat = Math.round(meal.macros.fat * scaleFactor);
  });
  
  return adjustedPlan;
}