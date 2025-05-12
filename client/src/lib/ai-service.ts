import { GoogleGenerativeAI } from "@google/generative-ai";

export interface TrainingPlan {
  planText: string;
  metadata: {
    generatedAt: string;
    goal: string;
    weeks: number;
    daysPerWeek: number;
  };
  // Extended properties for rich display
  overview?: {
    weeklyMileage?: string;
    workoutsPerWeek?: string;
    longRunDistance?: string;
    qualityWorkouts?: string;
  };
  philosophy?: string;
  weeklyPlans?: Array<{
    week: number;
    focus: string;
    workouts: Array<{
      day: string;
      description: string;
      type: string;
      distance?: string;
      duration?: string;
      intensity?: string;
    }>;
  }>;
}

export interface PlanAdjustment {
  planText: string;
  metadata: {
    generatedAt: string;
    adjustmentReason: string;
    originalPlanId?: string;
  };
}

// Initialize the Google AI with the API key
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Create a client
let genAI: GoogleGenerativeAI | null = null;

export function initializeGoogleAI(apiKey: string = API_KEY) {
  if (!apiKey) {
    console.warn("Google AI API key is not set!");
    return null;
  }
  
  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

if (API_KEY) {
  initializeGoogleAI();
}

/**
 * Gets the Google Gemini model with the specified configuration
 * @param modelName The name of the model to use
 * @param systemPrompt The system prompt to use
 * @returns The model instance
 */
export function getGeminiModel(modelName = "gemini-1.5-pro", systemPrompt?: string) {
  if (!genAI) {
    throw new Error("Google AI not initialized. Call initializeGoogleAI first.");
  }
  
  // Get the model
  const model = genAI.getGenerativeModel({ model: modelName });
  
  // Initialize chat with system prompt if provided
  if (systemPrompt) {
    return model.startChat({
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ] as any,
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "I'll help you with that request, following all the guidelines you've provided." }],
        }
      ],
    });
  }
  
  return model;
}

/**
 * Generates text with the Gemini model
 * @param prompt The prompt to generate text from
 * @param systemPrompt Optional system prompt to guide the model
 * @returns The generated text
 */
export async function generateText(prompt: string, systemPrompt?: string): Promise<string> {
  try {
    if (!genAI) {
      throw new Error("Google AI not initialized");
    }
    
    const model = getGeminiModel("gemini-1.5-pro", systemPrompt);
    
    if ('sendMessage' in model) {
      // It's a chat model
      const result = await model.sendMessage(prompt);
      return result.response.text();
    } else {
      // It's a regular generative model
      const result = await model.generateContent(prompt);
      return result.response.text();
    }
  } catch (error) {
    console.error("Error generating text:", error);
    throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generates text with structured data (JSON) output
 * @param prompt The prompt to generate text from
 * @param responseSchema The JSON schema for the response
 * @param systemPrompt Optional system prompt to guide the model
 * @returns The generated structured data
 */
export async function generateStructuredData<T>(
  prompt: string,
  responseSchema: any,
  systemPrompt?: string
): Promise<T> {
  try {
    if (!genAI) {
      throw new Error("Google AI not initialized");
    }
    
    // Add instructions to return JSON
    const jsonPrompt = `${prompt}\n\nProvide your response in valid JSON format that conforms to this schema: ${JSON.stringify(responseSchema)}`;
    
    // Generate the text
    const model = getGeminiModel("gemini-1.5-pro", systemPrompt);
    
    let jsonText = "";
    if ('sendMessage' in model) {
      // It's a chat model
      const result = await model.sendMessage(jsonPrompt);
      jsonText = result.response.text();
    } else {
      // It's a regular generative model
      const result = await model.generateContent(jsonPrompt);
      jsonText = result.response.text();
    }
    
    // Extract JSON from the text (in case the model adds explanation)
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from the response");
    }
    
    // Parse the JSON
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error generating structured data:", error);
    throw new Error(`Failed to generate structured data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generates a training plan using the Gemini model
 * @param userData Information about the user and their training goals
 * @returns A promise that resolves to the generated training plan
 */
export async function generateTrainingPlan(userData: {
  goal: string;
  currentFitness: string;
  weeksToTrain: number;
  daysPerWeek: number;
  includeStrengthTraining: boolean;
  raceDistance?: string;
  preferences?: string;
  injuries?: string;
  recentRaceTime?: string;
  preferredTerrains?: string[];
}): Promise<TrainingPlan> {
  try {
    if (!genAI) {
      throw new Error("Google AI not initialized");
    }
    
    const systemPrompt = `You are an expert running coach with decades of experience training all levels of runners. 
    Your task is to create a personalized running training plan based on the user's goals, fitness level, and preferences.
    Your training plans should include:
    1. A weekly schedule with specific workouts
    2. Training intensity zones (easy, moderate, hard)
    3. Pacing guidelines
    4. Rest and recovery recommendations
    5. Strength training exercises (if requested)
    6. Realistic progression that avoids overtraining
    Always prioritize injury prevention and sustainable training.`;
    
    // Create the prompt with the user's data
    const prompt = `Create a ${userData.weeksToTrain}-week training plan for a runner with the following details:
    
    Goal: ${userData.goal}
    Current fitness level: ${userData.currentFitness}
    Available training days per week: ${userData.daysPerWeek}
    Include strength training: ${userData.includeStrengthTraining ? 'Yes' : 'No'}
    ${userData.raceDistance ? `Race distance: ${userData.raceDistance}` : ''}
    ${userData.preferences ? `Training preferences: ${userData.preferences}` : ''}
    ${userData.injuries ? `Injury history or concerns: ${userData.injuries}` : ''}
    ${userData.recentRaceTime ? `Recent race time: ${userData.recentRaceTime}` : ''}
    ${userData.preferredTerrains?.length ? `Preferred terrain: ${userData.preferredTerrains.join(', ')}` : ''}
    
    Please provide a detailed training plan with daily workouts, weekly structure, pacing guidance, and specific workout descriptions.`;
    
    // First, generate the basic training plan text
    const trainingPlanText = await generateText(prompt, systemPrompt);
    
    // Then, generate structured data for displaying the plan in a more interactive way
    const structurePrompt = `
    Please analyze the following training plan and extract structured information from it:
    
    ${trainingPlanText}
    
    Create a JSON object with the following structure:
    {
      "overview": {
        "weeklyMileage": "Average weekly mileage (e.g., '32 miles')",
        "workoutsPerWeek": "Number of workout sessions per week (e.g., '5')",
        "longRunDistance": "Typical long run distance (e.g., '12 miles')",
        "qualityWorkouts": "Number of quality/intense workouts per week (e.g., '2')"
      },
      "philosophy": "A brief description of the training philosophy",
      "weeklyPlans": [
        {
          "week": 1,
          "focus": "Main focus of the week",
          "workouts": [
            {
              "day": "Monday",
              "description": "Detailed workout description",
              "type": "Easy Run/Tempo/Long Run/etc.",
              "distance": "Distance if applicable",
              "duration": "Duration if applicable",
              "intensity": "Zone 1-5 or Easy/Moderate/Hard"
            },
            // Additional days...
          ]
        },
        // Additional weeks...
      ]
    }`;
    
    try {
      // Attempt to parse the training plan into structured data
      const structuredData = await generateStructuredData<{
        overview: {
          weeklyMileage: string;
          workoutsPerWeek: string;
          longRunDistance: string;
          qualityWorkouts: string;
        };
        philosophy: string;
        weeklyPlans: Array<{
          week: number;
          focus: string;
          workouts: Array<{
            day: string;
            description: string;
            type: string;
            distance?: string;
            duration?: string;
            intensity?: string;
          }>
        }>
      }>(structurePrompt, "Analyze the training plan and extract structured data for an interactive display. The overview should include weeklyMileage, workoutsPerWeek, longRunDistance, and qualityWorkouts as separate fields.");
      
      // Return the complete training plan with both text and structured data
      return {
        planText: trainingPlanText,
        metadata: {
          generatedAt: new Date().toISOString(),
          goal: userData.goal,
          weeks: userData.weeksToTrain,
          daysPerWeek: userData.daysPerWeek
        },
        overview: structuredData.overview,
        philosophy: structuredData.philosophy,
        weeklyPlans: structuredData.weeklyPlans
      };
    } catch (error) {
      console.error("Error generating structured training plan data:", error);
      // If structured data generation fails, still return the basic plan
      return {
        planText: trainingPlanText,
        metadata: {
          generatedAt: new Date().toISOString(),
          goal: userData.goal,
          weeks: userData.weeksToTrain,
          daysPerWeek: userData.daysPerWeek
        }
      };
    }
  } catch (error) {
    console.error("Error generating training plan:", error);
    throw new Error(`Failed to generate training plan: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generates training plan adjustments based on user feedback or changes in conditions
 * @param originalPlan The original training plan to adjust
 * @param adjustmentReason The reason for making adjustments to the plan
 * @param additionalDetails Any additional details to consider for the adjustment
 * @returns A promise that resolves to the adjusted training plan
 */
/**
 * Generates recommendations for improving a training plan based on performance data
 * @param plan The current training plan
 * @param performanceData Recent performance data to analyze
 * @returns A list of recommendations to improve the training plan
 */
export async function generateTrainingRecommendations(
  plan: TrainingPlan,
  performanceData: {
    recentActivities: Array<{
      date: string;
      type: string;
      distance?: number;
      duration?: number;
      avgPace?: string;
      heartRate?: {
        avg?: number;
        max?: number;
      };
      perceivedEffort?: number;
      notes?: string;
    }>;
    healthMetrics?: {
      sleepScore?: number;
      hrvScore?: number;
      restingHeartRate?: number;
      energyLevel?: number;
      stressLevel?: number;
    };
    totalDistanceLastWeek?: number;
    comparedToPlanLastWeek?: "above" | "below" | "on-target";
    userFeedback?: string;
  }
): Promise<Array<{
  type: "intensity" | "volume" | "recovery" | "workout_type" | "general";
  recommendation: string;
  reasoning: string;
  priority: "high" | "medium" | "low";
}>> {
  try {
    if (!genAI) {
      throw new Error("Google AI not initialized");
    }
    
    const systemPrompt = `You are an expert running coach who analyzes training data and provides personalized recommendations.
    Based on the athlete's recent performance data and health metrics, suggest adjustments to their training plan.
    Focus on:
    1. Volume adjustments (mileage/distance)
    2. Intensity adjustments (pace, heart rate zones)
    3. Recovery recommendations
    4. Workout type changes
    5. General training advice
    
    Your recommendations should be specific, actionable, and backed by sports science principles.
    Prioritize recommendations based on their potential impact and urgency.`;
    
    // Create a prompt that includes the training plan and performance data
    const prompt = `I need recommendations to optimize this training plan based on recent performance data:
    
    CURRENT TRAINING PLAN:
    ${plan.planText}
    
    RECENT PERFORMANCE DATA:
    - Recent Activities: ${JSON.stringify(performanceData.recentActivities, null, 2)}
    - Health Metrics: ${performanceData.healthMetrics ? JSON.stringify(performanceData.healthMetrics, null, 2) : 'No health metrics provided'}
    - Total Distance Last Week: ${performanceData.totalDistanceLastWeek || 'Not provided'}
    - Compared to Plan: ${performanceData.comparedToPlanLastWeek || 'Unknown'}
    - User Feedback: ${performanceData.userFeedback || 'None provided'}
    
    Please provide recommendations in JSON format with the following structure:
    [
      {
        "type": "intensity|volume|recovery|workout_type|general",
        "recommendation": "Specific recommendation",
        "reasoning": "Scientific reasoning behind recommendation",
        "priority": "high|medium|low"
      }
    ]`;
    
    // Generate the recommendations
    const recommendations = await generateStructuredData<Array<{
      type: "intensity" | "volume" | "recovery" | "workout_type" | "general";
      recommendation: string;
      reasoning: string;
      priority: "high" | "medium" | "low";
    }>>(prompt, systemPrompt);
    
    return recommendations;
  } catch (error) {
    console.error("Error generating training recommendations:", error);
    throw new Error(`Failed to generate training recommendations: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function generateTrainingPlanAdjustments(
  originalPlan: TrainingPlan,
  adjustmentReason: string,
  additionalDetails?: string
): Promise<PlanAdjustment> {
  try {
    if (!genAI) {
      throw new Error("Google AI not initialized");
    }
    
    const systemPrompt = `You are an expert running coach with decades of experience training all levels of runners. 
    Your task is to adjust an existing training plan based on the user's feedback, changes in conditions, or other factors.
    When adjusting a plan, consider:
    1. What aspects of the original plan should be preserved
    2. What needs to be modified based on the reason provided
    3. How to ensure the adjusted plan is still progressive and prevents injury
    4. How to incorporate the user's feedback while maintaining training effectiveness
    Always prioritize athlete safety and sustainable training.`;
    
    // Create the prompt with the original plan and adjustment reason
    const prompt = `I need to adjust a training plan for the following reason: ${adjustmentReason}
    
    ${additionalDetails ? `Additional details: ${additionalDetails}` : ''}
    
    Here is the original training plan:
    
    ${originalPlan.planText}
    
    Please provide an adjusted training plan that addresses the reason for adjustment while maintaining the overall training structure and goals.`;
    
    // Generate the adjusted plan
    const adjustedPlanText = await generateText(prompt, systemPrompt);
    
    // Return the adjusted plan
    return {
      planText: adjustedPlanText,
      metadata: {
        generatedAt: new Date().toISOString(),
        adjustmentReason: adjustmentReason,
        originalPlanId: originalPlan.metadata?.goal // Using goal as a simple ID for now
      }
    };
  } catch (error) {
    console.error("Error generating training plan adjustments:", error);
    throw new Error(`Failed to generate training plan adjustments: ${error instanceof Error ? error.message : String(error)}`);
  }
}