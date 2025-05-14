import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { and, eq } from 'drizzle-orm';
import { db } from './db';
import { users, nutrition_preferences } from '@shared/schema';

// Initialize the Google AI client
let googleAI: GoogleGenerativeAI | null = null;
let geminiModel: any = null;

if (process.env.GOOGLE_AI_API_KEY) {
  try {
    googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    geminiModel = googleAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Configure system prompt for nutrition
    geminiModel = geminiModel.startChat({
      history: [
        {
          role: "user",
          parts: "I need your help as a professional sports nutritionist for athletes, particularly runners. Create meal plans that match their dietary restrictions, macro targets, and activity level."
        },
        {
          role: "model", 
          parts: "I'll help you create personalized meal plans for athletes based on their specific needs. For each plan, I'll consider dietary restrictions (like keto, vegan, lactose-intolerance), their physical characteristics (weight, height), activity level, and macro targets. Just provide me with the relevant information, and I'll generate practical, nutritionally balanced meal plans optimized for athletic performance."
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 0.95,
      }
    });
    console.log("Google AI model initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Google AI:", error);
    googleAI = null;
    geminiModel = null;
  }
}

/**
 * Simplified function to generate a meal plan using user profile data
 */
export async function generateSimpleMealPlan(userId: number) {
  try {
    // Get user profile and nutritional preferences
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const [userPreferences] = await db
      .select()
      .from(nutrition_preferences)
      .where(eq(nutrition_preferences.user_id, userId));
    
    if (!userPreferences) {
      throw new Error("User nutrition preferences not found");
    }
    
    // Build a simple prompt
    const prompt = `
    Please create a simple daily meal plan for an athlete with the following profile:
    
    Physical Characteristics:
    ${user.weight ? `Weight: ${user.weight} kg` : ''}
    ${user.height ? `Height: ${user.height} cm` : ''}
    Experience Level: ${user.experience_level || 'beginner'}
    
    Dietary Information:
    Dietary Restrictions: ${Array.isArray(userPreferences.dietary_restrictions) ? userPreferences.dietary_restrictions.join(", ") : userPreferences.dietary_restrictions || "None"}
    Allergies: ${Array.isArray(userPreferences.allergies) ? userPreferences.allergies.join(", ") : userPreferences.allergies || "None"}
    Calorie Goal: ${userPreferences.calorie_goal || 2000} calories
    Protein Goal: ${userPreferences.protein_goal || 25}%
    Carbs Goal: ${userPreferences.carbs_goal || 50}%
    Fat Goal: ${userPreferences.fat_goal || 25}%
    
    ${userPreferences.dietary_restrictions?.includes('keto') ? 'Please follow ketogenic diet principles: high fat (70-80%), moderate protein (15-20%), very low carb (5-10%)' : ''}
    ${userPreferences.dietary_restrictions?.includes('vegan') ? 'Please follow vegan diet principles: exclude all animal products including meat, dairy, eggs, and honey' : ''}
    ${userPreferences.dietary_restrictions?.includes('lactose') ? 'Please avoid all lactose-containing foods: milk, most cheeses, ice cream, and many processed foods with milk ingredients' : ''}
    ${userPreferences.dietary_restrictions?.includes('gluten') ? 'Please avoid all gluten-containing foods: wheat, barley, rye, and products made with these grains' : ''}
    
    Please create a simple daily meal plan with 3 meals and 2 snacks. For each meal, include:
    1. Meal name
    2. List of ingredients with amounts
    3. Approximate macros (calories, protein, carbs, fat)
    4. Brief preparation instructions
    
    Return the response as valid JSON in the following format:
    {
      "dailyPlan": {
        "totalCalories": number,
        "totalProtein": number,
        "totalCarbs": number,
        "totalFat": number,
        "meals": [
          {
            "name": string,
            "mealType": string,
            "ingredients": [
              { "name": string, "amount": string }
            ],
            "macros": {
              "calories": number,
              "protein": number,
              "carbs": number,
              "fat": number
            },
            "instructions": string
          }
        ]
      }
    }
    `;
    
    // Generate the meal plan
    let mealPlanText;
    
    try {
      // Try Google AI first
      if (googleAI && geminiModel) {
        console.log("Generating meal plan with Google AI");
        const result = await geminiModel.sendMessage(prompt, {
          responseFormat: { type: "json_object" }
        });
        mealPlanText = result.response.text();
        console.log("Successfully generated meal plan with Google AI");
      } else {
        throw new Error("Google AI not available");
      }
    } catch (googleError) {
      console.error("Google AI error:", googleError.message);
      
      // Fall back to DeepSeek if available
      if (process.env.DEEPSEEK_API_KEY) {
        try {
          console.log("Falling back to DeepSeek API for meal plan generation");
          
          const deepseekResponse = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
              model: "deepseek-chat",
              messages: [
                {
                  role: "system",
                  content: "You are a professional sports nutritionist. Respond with valid JSON."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 2000,
              response_format: { type: "json_object" }
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
              }
            }
          );
          
          mealPlanText = deepseekResponse.data.choices[0].message.content;
          console.log("Successfully generated meal plan with DeepSeek API");
        } catch (deepseekError) {
          console.error("DeepSeek API error:", deepseekError.message);
          throw new Error("Both AI services failed to generate a meal plan");
        }
      } else {
        throw new Error("No fallback AI service available");
      }
    }
    
    // Extract JSON from response
    const jsonMatch = mealPlanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in the response");
    }
    
    const mealPlan = JSON.parse(jsonMatch[0]);
    return mealPlan;
    
  } catch (error) {
    console.error("Error generating simple meal plan:", error);
    throw error;
  }
}