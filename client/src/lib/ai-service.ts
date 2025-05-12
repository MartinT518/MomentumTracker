import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with the API key
const API_KEY = import.meta.env.GOOGLE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// Model configuration
const modelName = 'gemini-1.5-pro';
const generationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 8192,
};

export interface TrainingPlanParams {
  targetRace?: string;
  raceDistance?: string;
  goalTime?: string;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  currentWeeklyMileage?: number;
  availableDaysPerWeek: number;
  timePerSessionMinutes?: number;
  preferredWorkoutTypes?: string[];
  injuries?: string[];
  startDate?: string;
  endDate?: string;
  userAge?: number;
  userWeight?: number;
  userHeight?: number;
}

export interface TrainingPlan {
  overview: {
    title: string;
    description: string;
    weeklyMileage: string;
    workoutsPerWeek: number;
    longRunDistance: string;
    qualityWorkouts: number;
  };
  philosophy: string;
  recommendedGear?: string[];
  nutritionTips?: string;
  weeklyPlans: WeeklyPlan[];
}

export interface WeeklyPlan {
  weekNumber: number;
  focus: string;
  totalMileage: string;
  workouts: Workout[];
}

export interface Workout {
  id: number;
  day: string;
  type: string;
  description: string;
  duration: string;
  distance?: string;
  intensity: 'easy' | 'moderate' | 'hard' | 'recovery' | 'race';
  completed?: boolean;
  warmUp?: string;
  mainSet?: string[];
  coolDown?: string;
  notes?: string;
}

/**
 * Generates a training plan using Google's Gemini AI
 */
export async function generateTrainingPlan(params: TrainingPlanParams): Promise<TrainingPlan> {
  try {
    const model = genAI.getGenerativeModel({ model: modelName, generationConfig });
    
    const prompt = buildTrainingPlanPrompt(params);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response into a structured training plan
    return parseTrainingPlanResponse(text, params);
  } catch (error) {
    console.error('Error generating training plan:', error);
    throw new Error('Failed to generate training plan. Please try again later.');
  }
}

/**
 * Builds a prompt for the AI model based on user parameters
 */
function buildTrainingPlanPrompt(params: TrainingPlanParams): string {
  return `
    As an experienced running coach, create a detailed training plan with the following specifications:
    
    USER PROFILE:
    - Target Race: ${params.targetRace || 'General fitness'}
    - Race Distance: ${params.raceDistance || 'Not specified'}
    - Goal Time: ${params.goalTime || 'Completion'}
    - Fitness Level: ${params.fitnessLevel}
    - Current Weekly Mileage: ${params.currentWeeklyMileage || 'Not specified'} miles per week
    - Available Days: ${params.availableDaysPerWeek} days per week
    - Time Per Session: ${params.timePerSessionMinutes || 60} minutes
    - Preferred Workout Types: ${params.preferredWorkoutTypes?.join(', ') || 'Any'}
    - Injuries/Limitations: ${params.injuries?.join(', ') || 'None'}
    - Age: ${params.userAge || 'Not specified'}
    - Weight: ${params.userWeight || 'Not specified'} kg
    - Height: ${params.userHeight || 'Not specified'} cm
    - Start Date: ${params.startDate || 'Immediate'}
    - End Date/Race Day: ${params.endDate || 'Not specified'}
    
    I need a comprehensive training plan that includes:
    
    1. OVERALL PLAN SUMMARY:
    - Title reflecting the goal
    - Brief description
    - Weekly mileage progression
    - Workouts per week
    - Long run progression
    - Number of quality workouts per week
    
    2. TRAINING PHILOSOPHY:
    - A paragraph explaining the training approach

    3. WEEKLY BREAKDOWNS:
    - Weekly focus/theme
    - Total mileage
    - Day-by-day workout schedule including:
      * Workout type (Easy Run, Long Run, Tempo, Intervals, Cross-Training, Rest, etc.)
      * Duration (in minutes)
      * Distance (if applicable)
      * Intensity level (easy, moderate, hard, recovery, race)
      * Detailed workout description
      * Warm-up instructions
      * Main set details
      * Cool-down instructions
      * Special notes or considerations
    
    4. OPTIONAL ADDITIONS:
    - Recommended gear
    - Basic nutrition guidance
    
    Format the response to be easily parsed by a program. Keep descriptions concise but informative.
    
    I'll be using this plan to train for ${params.targetRace || 'improved fitness'}, so make it realistic, progressive, and include adequate recovery.
  `;
}

/**
 * Parses the AI response into a structured training plan object
 * This is a simplified parser - in production, we might use more sophisticated parsing
 */
function parseTrainingPlanResponse(text: string, params: TrainingPlanParams): TrainingPlan {
  try {
    // This is a placeholder parser - in a real application we would use
    // more sophisticated parsing, potentially with additional AI calls
    // to structure the data correctly if the initial format isn't ideal
    
    // For now, create a simple structured plan with mock data that would 
    // approximate what the AI would return
    const weekCount = estimateWeekCount(params);
    
    const trainingPlan: TrainingPlan = {
      overview: {
        title: `${params.raceDistance || 'Running'} Training Plan - ${params.fitnessLevel} Level`,
        description: `Personalized training plan to prepare for ${params.targetRace || 'improved fitness'} with progressive overload and structured workouts.`,
        weeklyMileage: calculateWeeklyMileage(params),
        workoutsPerWeek: Math.min(params.availableDaysPerWeek, 6),
        longRunDistance: calculateLongRunDistance(params),
        qualityWorkouts: calculateQualityWorkoutCount(params),
      },
      philosophy: `This plan follows a balanced approach with progressive overload tailored for a ${params.fitnessLevel} runner. It includes a mix of easy running, speed work, tempo runs, and essential long runs, with appropriate recovery periods to maximize adaptation while minimizing injury risk.`,
      weeklyPlans: generateWeeklyPlans(weekCount, params),
    };
    
    return trainingPlan;
  } catch (error) {
    console.error('Error parsing training plan response:', error);
    throw new Error('Failed to parse training plan response. Please try again.');
  }
}

/**
 * Helper functions for generating mock training plan data
 * In a real implementation, these would be replaced by actual AI parsing
 */
function estimateWeekCount(params: TrainingPlanParams): number {
  if (params.startDate && params.endDate) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  }
  
  // Default training plan lengths based on race distance
  switch (params.raceDistance?.toLowerCase()) {
    case '5k': return 8;
    case '10k': return 10;
    case 'half marathon': return 12;
    case 'marathon': return 16;
    default: return 8;
  }
}

function calculateWeeklyMileage(params: TrainingPlanParams): string {
  const baseMileage = params.currentWeeklyMileage || 
    (params.fitnessLevel === 'beginner' ? 10 : 
     params.fitnessLevel === 'intermediate' ? 20 : 30);
  
  return `${baseMileage}-${baseMileage * 1.5} miles`;
}

function calculateLongRunDistance(params: TrainingPlanParams): string {
  const baseLongRun = params.fitnessLevel === 'beginner' ? 5 : 
                      params.fitnessLevel === 'intermediate' ? 8 : 12;
  
  if (params.raceDistance?.toLowerCase() === 'marathon') {
    return `${baseLongRun}-20 miles`;
  } else if (params.raceDistance?.toLowerCase() === 'half marathon') {
    return `${baseLongRun}-15 miles`;
  }
  
  return `${baseLongRun}-10 miles`;
}

function calculateQualityWorkoutCount(params: TrainingPlanParams): number {
  return params.fitnessLevel === 'beginner' ? 1 : 
         params.fitnessLevel === 'intermediate' ? 2 : 3;
}

function generateWeeklyPlans(weekCount: number, params: TrainingPlanParams): WeeklyPlan[] {
  const weeklyPlans: WeeklyPlan[] = [];
  
  for (let week = 1; week <= weekCount; week++) {
    const workouts: Workout[] = [];
    const weeklyFocus = getWeeklyFocus(week, weekCount);
    
    // Generate workouts for each day of the week
    for (let day = 0; day < 7; day++) {
      // Skip if we exceed available days per week (maintain rest days)
      if (getWorkoutCountForWeek(day, params.availableDaysPerWeek) === 'rest') {
        continue;
      }
      
      const workoutType = determineWorkoutType(day, week, params);
      
      if (workoutType !== 'Rest Day') {
        workouts.push({
          id: week * 100 + day,
          day: getDayName(day),
          type: workoutType,
          description: getWorkoutDescription(workoutType, week, params),
          duration: getWorkoutDuration(workoutType, params),
          distance: getWorkoutDistance(workoutType, week, params),
          intensity: getWorkoutIntensity(workoutType),
          completed: false,
          warmUp: getWarmUp(workoutType),
          mainSet: getMainSet(workoutType, week, params),
          coolDown: getCoolDown(workoutType),
          notes: getWorkoutNotes(workoutType, week)
        });
      }
    }
    
    weeklyPlans.push({
      weekNumber: week,
      focus: weeklyFocus,
      totalMileage: calculateTotalMileage(week, weekCount, params),
      workouts
    });
  }
  
  return weeklyPlans;
}

function getWeeklyFocus(week: number, totalWeeks: number): string {
  const phase = Math.floor((week / totalWeeks) * 4);
  
  switch (phase) {
    case 0: return "Base Building";
    case 1: return "Strength Development";
    case 2: return "Speed and Endurance";
    case 3: 
      if (week === totalWeeks) return "Race Week";
      if (week === totalWeeks - 1) return "Taper";
      return "Peak Training";
    default: return "General Fitness";
  }
}

function getDayName(day: number): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[day];
}

function getWorkoutCountForWeek(day: number, availableDays: number): 'workout' | 'rest' {
  // Distribute workouts evenly through the week
  const restDays = 7 - availableDays;
  
  if (restDays >= 3) {
    // If many rest days, distribute them evenly
    if (day % 2 === 1 && restDays > day / 2) {
      return 'rest';
    }
  } else if (restDays === 2) {
    // Common pattern: rest Monday and Friday
    if (day === 0 || day === 4) {
      return 'rest';
    }
  } else if (restDays === 1) {
    // One rest day: typically Monday
    if (day === 0) {
      return 'rest';
    }
  }
  
  return 'workout';
}

function determineWorkoutType(day: number, week: number, params: TrainingPlanParams): string {
  // Long run typically on weekend
  if (day === 5 || day === 6) {
    return 'Long Run';
  }
  
  // Recovery runs after hard days
  if (day === 2 || day === 4) {
    return 'Recovery Run';
  }
  
  // Quality workouts on Tuesdays and Thursdays for intermediate/advanced
  if ((day === 1 || day === 3) && params.fitnessLevel !== 'beginner') {
    if (week % 3 === 0) {
      return 'Interval Training';
    } else if (week % 3 === 1) {
      return 'Tempo Run';
    } else {
      return 'Hill Repeats';
    }
  }
  
  // Cross training or easy runs on other days
  if (day % 3 === 0) {
    return 'Cross Training';
  }
  
  return 'Easy Run';
}

function getWorkoutDescription(type: string, week: number, params: TrainingPlanParams): string {
  switch (type) {
    case 'Easy Run':
      return 'Steady pace run with focus on form and building aerobic base';
    case 'Recovery Run':
      return 'Very easy effort to promote recovery while maintaining activity';
    case 'Long Run':
      return 'Sustained effort to build endurance and mental fortitude';
    case 'Tempo Run':
      return 'Sustained effort at threshold pace to improve lactate clearance';
    case 'Interval Training':
      return 'High-intensity repeats to improve VO2max and speed';
    case 'Hill Repeats':
      return 'Uphill efforts to build strength and power';
    case 'Cross Training':
      return 'Non-running activity to build fitness while reducing impact';
    default:
      return 'Active recovery or complete rest day';
  }
}

function getWorkoutDuration(type: string, params: TrainingPlanParams): string {
  const baseTime = params.timePerSessionMinutes || 60;
  
  switch (type) {
    case 'Long Run': 
      return `${baseTime * 1.5}-${baseTime * 2} minutes`;
    case 'Recovery Run':
      return `${baseTime * 0.5}-${baseTime * 0.7} minutes`;
    case 'Cross Training':
      return `${baseTime} minutes`;
    default:
      return `${baseTime} minutes`;
  }
}

function getWorkoutDistance(type: string, week: number, params: TrainingPlanParams): string | undefined {
  if (type === 'Cross Training') {
    return undefined;
  }
  
  const baseMileage = params.fitnessLevel === 'beginner' ? 3 : 
                     params.fitnessLevel === 'intermediate' ? 5 : 7;
  
  const progressFactor = 1 + (week * 0.05);
  
  switch (type) {
    case 'Long Run':
      const longRunBase = baseMileage * 1.5;
      const longRunDistance = Math.round(longRunBase * progressFactor * 10) / 10;
      return `${longRunDistance} miles`;
    case 'Recovery Run':
      return `${Math.round(baseMileage * 0.6 * 10) / 10} miles`;
    case 'Easy Run':
      return `${Math.round(baseMileage * progressFactor * 10) / 10} miles`;
    case 'Tempo Run':
      return `${Math.round(baseMileage * 0.9 * progressFactor * 10) / 10} miles`;
    case 'Interval Training':
      return `${Math.round(baseMileage * 0.8 * progressFactor * 10) / 10} miles total`;
    case 'Hill Repeats':
      return `${Math.round(baseMileage * 0.7 * progressFactor * 10) / 10} miles total`;
    default:
      return undefined;
  }
}

function getWorkoutIntensity(type: string): 'easy' | 'moderate' | 'hard' | 'recovery' | 'race' {
  switch (type) {
    case 'Easy Run': return 'easy';
    case 'Recovery Run': return 'recovery';
    case 'Long Run': return 'moderate';
    case 'Tempo Run': return 'moderate';
    case 'Interval Training': return 'hard';
    case 'Hill Repeats': return 'hard';
    case 'Cross Training': return 'easy';
    default: return 'easy';
  }
}

function calculateTotalMileage(week: number, totalWeeks: number, params: TrainingPlanParams): string {
  const baseMileage = params.currentWeeklyMileage || 
    (params.fitnessLevel === 'beginner' ? 10 : 
     params.fitnessLevel === 'intermediate' ? 20 : 30);
  
  // Increase mileage gradually, then taper
  let factor = 1;
  if (week < totalWeeks * 0.8) {
    // Build up phase
    factor = 1 + (week / totalWeeks) * 0.5;
  } else {
    // Taper phase
    const weeksLeft = totalWeeks - week;
    factor = 1.4 - (weeksLeft / totalWeeks) * 0.4;
  }
  
  const weeklyMileage = Math.round(baseMileage * factor);
  return `${weeklyMileage} miles`;
}

function getWarmUp(type: string): string {
  if (type === 'Cross Training') {
    return '5-10 minutes of easy movement on your chosen equipment';
  }
  
  return '10-15 minutes of easy jogging followed by dynamic stretches and strides';
}

function getMainSet(type: string, week: number, params: TrainingPlanParams): string[] {
  switch (type) {
    case 'Easy Run':
      return ['Steady running at conversational pace (60-70% max heart rate)'];
    case 'Recovery Run':
      return ['Very easy running (50-60% max heart rate), focus on relaxed form'];
    case 'Long Run':
      if (params.fitnessLevel === 'advanced' && week > 4) {
        return [
          'First 75% at easy pace (60-70% max heart rate)',
          'Last 25% at moderate pace (70-80% max heart rate)'
        ];
      }
      return ['Steady running at comfortable pace (60-70% max heart rate)'];
    case 'Tempo Run':
      return [
        '15 minutes easy pace (60-70% max heart rate)',
        '20-30 minutes at threshold pace (80-85% max heart rate)',
        '10 minutes easy pace (60-70% max heart rate)'
      ];
    case 'Interval Training':
      if (week < 4) {
        return ['6-8 x 400m repeats at 5K pace with 90 sec recovery jog between'];
      } else if (week < 8) {
        return ['5-6 x 800m repeats at 5K pace with 2 min recovery jog between'];
      } else {
        return ['4-5 x 1000m repeats at 5K pace with 3 min recovery jog between'];
      }
    case 'Hill Repeats':
      return [
        'Find a moderate hill (4-6% grade) that takes 60-90 seconds to climb',
        '6-10 repeats: run up at hard effort, jog or walk down for recovery',
        'Focus on driving with knees and arms, maintaining good posture'
      ];
    case 'Cross Training':
      return [
        'Choose from: cycling, swimming, elliptical, rowing, or strength training',
        'Maintain moderate intensity (perceived exertion 6-7 out of 10)',
        'Include intervals or sustained efforts if comfortable'
      ];
    default:
      return ['Rest and recovery'];
  }
}

function getCoolDown(type: string): string {
  if (type === 'Cross Training') {
    return '5-10 minutes of easy movement followed by stretching';
  }
  
  return '10 minutes of easy jogging followed by static stretching';
}

function getWorkoutNotes(type: string, week: number): string {
  switch (type) {
    case 'Long Run':
      return 'Practice your race-day nutrition strategy. Stay hydrated and consider taking energy gels/chews if run exceeds 75 minutes.';
    case 'Tempo Run':
      return 'This workout should feel "comfortably hard" - you can speak in short phrases but not maintain a conversation.';
    case 'Interval Training':
      return 'Focus on consistent pacing across all repeats rather than starting too fast and fading.';
    case 'Hill Repeats':
      return 'Maintain good form, lean slightly forward, shorten your stride, and drive with your arms and knees.';
    case 'Cross Training':
      return 'Use this session to work different muscle groups while giving your running muscles a break from impact.';
    default:
      if (week > 8) {
        return 'Focus on maintaining good form even when fatigued. Consider foam rolling after this session.';
      }
      return 'Keep effort easy and focus on building consistency in your training.';
  }
}