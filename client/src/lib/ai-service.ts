import { GoogleGenerativeAI } from '@google/generative-ai';

// Define model interfaces

export interface TrainingPlanOverview {
  name: string;
  weeklyMileage: string;
  workoutsPerWeek: string;
  longRunDistance: string;
  qualityWorkouts: string;
}

export interface WeeklyPlan {
  weekNumber: number;
  totalMileage: string;
  keyWorkouts: string[];
  description: string;
  days: DailyWorkout[];
}

export interface DailyWorkout {
  day: string;
  date: string;
  type: string;
  title: string;
  description: string;
  distance?: string;
  duration: string;
  intensity: 'easy' | 'moderate' | 'hard' | 'recovery' | 'race';
  warmUp?: string;
  mainSet?: string[];
  coolDown?: string;
  targetPace?: string;
  notes?: string;
}

export interface TrainingPlan {
  name: string;
  philosophy: string;
  overview: TrainingPlanOverview;
  keyWorkoutTypes: { [key: string]: string };
  weeklyPlans: WeeklyPlan[];
  nutritionTips?: string[];
  recoveryGuidelines?: string[];
}

// Interface for the form data
export interface PlanFormInput {
  goal: string;
  raceDistance?: string;
  currentFitness: string;
  weeksToTrain: number;
  daysPerWeek: number;
  preferences?: string;
  includeStrengthTraining: boolean;
  preferredTerrains?: string[];
  injuries?: string;
  recentRaceTime?: string;
  userType: 'free' | 'premium';
}

// Function to generate a training plan with Google's Gemini API
export async function generateTrainingPlan(input: PlanFormInput): Promise<TrainingPlan> {
  try {
    // Check if API key is available
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('Google AI API key not found');
    }

    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Prepare the prompt
    const prompt = createTrainingPlanPrompt(input);
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response as JSON
    try {
      // Clean response text in case there are markdown code blocks
      const jsonStr = cleanJsonResponse(text);
      return JSON.parse(jsonStr) as TrainingPlan;
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.log("Raw Response:", text);
      throw new Error("Failed to generate a valid training plan. Please try again.");
    }
  } catch (error: any) {
    console.error("Error generating training plan:", error);
    throw new Error(error.message || "Failed to generate training plan");
  }
}

// Helper function to create the prompt for the AI
function createTrainingPlanPrompt(input: PlanFormInput): string {
  const {
    goal,
    raceDistance,
    currentFitness,
    weeksToTrain,
    daysPerWeek,
    preferences,
    includeStrengthTraining,
    injuries,
    recentRaceTime,
    userType
  } = input;
  
  // Calculate how much of the plan to generate based on user type
  const weeksToGenerate = userType === 'premium' ? weeksToTrain : Math.min(2, weeksToTrain);
  
  // Base prompt
  let prompt = `
Generate a personalized running training plan in JSON format based on the following requirements:

User profile:
- Goal: ${goal}${goal === 'race' ? ` (${raceDistance})` : ''}
- Current fitness level: ${currentFitness}
- Weeks to train: ${weeksToTrain} (but only generate detailed plans for the first ${weeksToGenerate} weeks)
- Training days per week: ${daysPerWeek}
- Include strength training: ${includeStrengthTraining ? 'Yes' : 'No'}
${injuries ? `- Current injuries/limitations: ${injuries}` : ''}
${recentRaceTime ? `- Recent race time: ${recentRaceTime}` : ''}
${preferences ? `- Additional preferences: ${preferences}` : ''}

The JSON training plan should include the following structure:
{
  "name": "Plan name based on goal",
  "philosophy": "Brief paragraph explaining the training philosophy",
  "overview": {
    "weeklyMileage": "Average weekly mileage",
    "workoutsPerWeek": "Number of workouts per week", 
    "longRunDistance": "Typical long run distance",
    "qualityWorkouts": "Number of quality workouts per week"
  },
  "keyWorkoutTypes": {
    "easy": "Description of easy runs",
    "tempo": "Description of tempo runs",
    "intervals": "Description of interval workouts",
    "long": "Description of long runs",
    "recovery": "Description of recovery runs",
    "other": "Any other workout types"
  },
  "weeklyPlans": [
    {
      "weekNumber": 1,
      "totalMileage": "Total mileage for the week",
      "keyWorkouts": ["Brief descriptions of key workouts"],
      "description": "Brief overview of the week",
      "days": [
        {
          "day": "Monday",
          "date": "Example date format: May 13, 2025",
          "type": "Easy Run/Interval/etc",
          "title": "Short title of the workout",
          "description": "Brief workout description",
          "distance": "Distance if applicable",
          "duration": "Expected duration",
          "intensity": "One of: easy, moderate, hard, recovery, race",
          "warmUp": "Warm up instructions if applicable",
          "mainSet": ["Main workout details in array format"],
          "coolDown": "Cool down instructions if applicable",
          "targetPace": "Target pace if applicable",
          "notes": "Additional notes if applicable"
        },
        // Repeat for each day of the week 
      ]
    }
    // Include multiple weeks based on weeksToGenerate
  ]
}

Additional requirements:
1. For each day in the plan, include actual workout details with specific distances, paces, and instructions.
2. Adjust the plan to match the user's fitness level and goals.
3. Generate detailed workouts only for the first ${weeksToGenerate} weeks.
4. Include rest days appropriate to the user's training frequency.
5. Set realistic progression based on the fitness level.
6. Include appropriate intensity distribution.
7. Don't add additional fields to the JSON structure.
8. Format all dates starting from today (${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}).

Generate ONLY valid JSON with no explanations before or after.`;

  return prompt;
}

// Helper function to clean JSON response from potential markdown formatting
function cleanJsonResponse(responseText: string): string {
  // Remove markdown code block markers if present
  let cleanText = responseText.replace(/```json/g, '').replace(/```/g, '');
  
  // Trim whitespace
  cleanText = cleanText.trim();
  
  return cleanText;
}