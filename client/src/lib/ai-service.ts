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

// Interface for user performance data
export interface UserPerformance {
  completedWorkouts: {
    date: string;
    workoutType: string;
    plannedDistance?: string;
    actualDistance?: string;
    plannedDuration?: string;
    actualDuration?: string;
    perceivedEffort: number; // 1-10 scale
    heartRateData?: {
      average: number;
      max: number;
    };
    notes?: string;
    completed: boolean;
  }[];
  missedWorkouts: {
    date: string;
    workoutType: string;
    reason?: string;
  }[];
  biometricData?: {
    sleepQuality: number[]; // Last 7 days, 1-10 scale
    restingHeartRate: number[]; // Last 7 days
    hrvScore?: number[]; // Last 7 days
    stressScore?: number[]; // Last 7 days
  };
  energyLevels: number[]; // Last 7 days, 1-10 scale
  fatigueLevel: number; // 1-10 scale
  weeklyMileage: {
    planned: number;
    actual: number;
  };
  recentInjuries?: string[];
  goalsProgress?: {
    type: string;
    target: number;
    current: number;
  }[];
}

// Interface for plan adjustment response
export interface PlanAdjustment {
  recommendedChanges: {
    overall: string;
    currentWeek: {
      message: string;
      adjustments: {
        day: string;
        originalWorkout: string;
        adjustedWorkout: string;
        reason: string;
      }[];
    };
    futureWeeks: {
      message: string;
      adjustmentTypes: string[];
    };
  };
  adaptationInsights: {
    strengths: string[];
    limitingFactors: string[];
    recommendations: string[];
  };
  trainingLoad: {
    previousWeek: number; // 1-100 scale
    currentWeek: number; // 1-100 scale
    recommendedNextWeek: number; // 1-100 scale
    explanation: string;
  };
}

// Function to generate training plan adjustments based on user performance
export async function generateTrainingPlanAdjustments(
  currentPlan: TrainingPlan,
  performanceData: UserPerformance,
  userPreferences: { focusAreas: string[], recoveryPreference: 'aggressive' | 'moderate' | 'conservative' }
): Promise<PlanAdjustment> {
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
    const prompt = createPlanAdjustmentPrompt(currentPlan, performanceData, userPreferences);
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response as JSON
    try {
      // Clean response text in case there are markdown code blocks
      const jsonStr = cleanJsonResponse(text);
      return JSON.parse(jsonStr) as PlanAdjustment;
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.log("Raw Response:", text);
      throw new Error("Failed to generate valid training plan adjustments. Please try again.");
    }
  } catch (error: any) {
    console.error("Error generating training plan adjustments:", error);
    throw new Error(error.message || "Failed to generate training plan adjustments");
  }
}

// Helper function to create the prompt for the AI adjustment algorithm
function createPlanAdjustmentPrompt(
  currentPlan: TrainingPlan, 
  performanceData: UserPerformance,
  userPreferences: { focusAreas: string[], recoveryPreference: 'aggressive' | 'moderate' | 'conservative' }
): string {
  // Calculate key metrics for the prompt
  const completionRate = performanceData.completedWorkouts.length / 
    (performanceData.completedWorkouts.length + performanceData.missedWorkouts.length) * 100;
    
  const avgEffort = performanceData.completedWorkouts.reduce(
    (sum, workout) => sum + workout.perceivedEffort, 0
  ) / performanceData.completedWorkouts.length;
  
  const avgEnergy = performanceData.energyLevels.reduce((sum, level) => sum + level, 0) / 
    performanceData.energyLevels.length;
  
  const mileageAdherence = (performanceData.weeklyMileage.actual / performanceData.weeklyMileage.planned) * 100;
  
  // Create a detailed prompt with all performance data
  let prompt = `
Generate personalized training plan adjustments in JSON format based on the following data:

CURRENT TRAINING PLAN:
- Plan name: ${currentPlan.name}
- Current week: ${currentPlan.weeklyPlans[0].weekNumber}
- Planned weekly mileage: ${currentPlan.weeklyPlans[0].totalMileage}
- Key workouts: ${JSON.stringify(currentPlan.weeklyPlans[0].keyWorkouts)}

USER PERFORMANCE DATA:
- Workout completion rate: ${completionRate.toFixed(1)}%
- Average perceived effort: ${avgEffort.toFixed(1)}/10
- Average energy level: ${avgEnergy.toFixed(1)}/10
- Weekly mileage adherence: ${mileageAdherence.toFixed(1)}%
- Current fatigue level: ${performanceData.fatigueLevel}/10
- Completed workouts: ${performanceData.completedWorkouts.length}
- Missed workouts: ${performanceData.missedWorkouts.length}

${performanceData.biometricData ? `BIOMETRIC DATA:
- Average sleep quality: ${performanceData.biometricData.sleepQuality.reduce((sum, val) => sum + val, 0) / performanceData.biometricData.sleepQuality.length}/10
- Recent resting HR trend: ${performanceData.biometricData.restingHeartRate.join(', ')} bpm
${performanceData.biometricData.hrvScore ? `- Recent HRV trend: ${performanceData.biometricData.hrvScore.join(', ')}` : ''}` : ''}

${performanceData.recentInjuries && performanceData.recentInjuries.length > 0 ? 
  `RECENT INJURIES/ISSUES:
- ${performanceData.recentInjuries.join('\n- ')}` : ''}

USER PREFERENCES:
- Focus areas: ${userPreferences.focusAreas.join(', ')}
- Recovery preference: ${userPreferences.recoveryPreference}

Using advanced exercise science principles, analyze this data and generate a comprehensive training plan adjustment in this JSON format:
{
  "recommendedChanges": {
    "overall": "Brief summary of overall adjustment approach",
    "currentWeek": {
      "message": "Brief explanation of current week adjustments",
      "adjustments": [
        {
          "day": "Day of week",
          "originalWorkout": "Brief description of original workout",
          "adjustedWorkout": "Detailed description of adjusted workout",
          "reason": "Physiological explanation for the adjustment"
        }
      ]
    },
    "futureWeeks": {
      "message": "How future weeks of the plan should be modified",
      "adjustmentTypes": ["List of adjustment types needed"]
    }
  },
  "adaptationInsights": {
    "strengths": ["Areas where the athlete is showing positive adaptation"],
    "limitingFactors": ["Factors limiting performance improvement"],
    "recommendations": ["Specific recommendations beyond workout adjustments"]
  },
  "trainingLoad": {
    "previousWeek": 75, 
    "currentWeek": 85,
    "recommendedNextWeek": 80,
    "explanation": "Explanation of training load recommendations"
  }
}

Apply these advanced training principles in your analysis:
1. Consider heart rate variability and resting heart rate trends when determining recovery status
2. Apply the principles of periodization and progressive overload
3. Balance high-intensity and low-intensity training appropriately
4. Account for both physiological and psychological factors
5. Make adjustments that maintain training plan integrity while addressing immediate needs
6. Consider the impact of sleep quality on recovery capability
7. Analyze effort-to-performance ratio to detect signs of overtraining or undertraining
8. Apply the latest sports science on optimizing training adaptations

Generate ONLY valid JSON with no explanations before or after.`;

  return prompt;
}