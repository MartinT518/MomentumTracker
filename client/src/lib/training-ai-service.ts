import { apiRequest } from "./queryClient";
import { calculateEnergyLevel } from "./energy-calculator";
import type { DailyHealthMetrics } from "./health-metrics-service";

// Types for user's activity data
export interface ActivityData {
  id: string | number;
  type: string;
  date: string;
  distance?: number;
  duration: number;
  pace?: number;
  heartRate?: {
    average?: number;
    max?: number;
  };
  elevationGain?: number;
  perceivedExertion?: number; // 1-10 scale
  notes?: string;
  tags?: string[];
}

// Types for user's performance and trends
export interface PerformanceMetrics {
  recentActivities: ActivityData[];
  weeklyVolume: {
    current: number;
    previous: number;
    trend: number; // percentage change
  };
  avgPace: {
    current: number;
    previous: number;
    trend: number; // percentage change
  };
  longRunDistance: {
    current: number;
    previous: number;
    trend: number; // percentage change
  };
  strainScore: number; // 0-100 scale
  fitnessScore: number; // 0-100 scale
  consistencyScore: number; // 0-100 scale
}

// Training plan types
export interface TrainingPlan {
  id: string | number;
  userId: string | number;
  goal: {
    type: string;
    targetDate: string;
    targetDistance?: string;
    targetTime?: string;
  };
  weeks: TrainingWeek[];
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'draft';
  adjustmentHistory?: PlanAdjustment[];
}

export interface TrainingWeek {
  weekNumber: number;
  theme?: string;
  totalDistance?: number;
  workouts: Workout[];
}

export interface Workout {
  id: string | number;
  day: number;
  date: string;
  type: string;
  description: string;
  targetDistance?: number;
  targetDuration?: number;
  targetPace?: number | [number, number]; // Single pace or range
  completed?: boolean;
  actualDistance?: number;
  actualDuration?: number;
  actualPace?: number;
  notes?: string;
  adjustmentReason?: string;
}

export interface PlanAdjustment {
  date: string;
  reason: string;
  changes: {
    workoutId: string | number;
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

// AI adjustment parameters
export interface AdjustmentParameters {
  energyLevel?: number;
  healthMetrics?: DailyHealthMetrics;
  recentPerformance?: PerformanceMetrics;
  userPreference?: {
    preferredRestDays?: number[];
    maxWeeklyDistance?: number;
    minWeeklyRuns?: number;
    preferredWorkoutTypes?: string[];
  };
  adjustmentStrategy?: 'conservative' | 'moderate' | 'aggressive';
  previousAdjustments?: PlanAdjustment[];
}

/**
 * Get AI-generated training plan adjustments based on user performance and energy level
 */
export async function getTrainingPlanAdjustments(
  planId: string | number,
  params: AdjustmentParameters
): Promise<PlanAdjustment> {
  try {
    const response = await apiRequest('POST', `/api/training-plans/${planId}/adjustments`, params);
    
    if (!response.ok) {
      throw new Error('Failed to get training plan adjustments');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting training plan adjustments:', error);
    throw error;
  }
}

/**
 * Apply AI-suggested adjustments to a training plan
 */
export async function applyTrainingPlanAdjustments(
  planId: string | number,
  adjustmentId: string | number
): Promise<TrainingPlan> {
  try {
    const response = await apiRequest(
      'PUT', 
      `/api/training-plans/${planId}/adjustments/${adjustmentId}/apply`,
      {}
    );
    
    if (!response.ok) {
      throw new Error('Failed to apply training plan adjustments');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error applying training plan adjustments:', error);
    throw error;
  }
}

/**
 * Calculate a user's training load and fatigue
 * Uses an exponentially weighted moving average based on the Banister Impulse-Response model
 */
export function calculateTrainingLoad(activities: ActivityData[], days: number = 42): { 
  acuteLoad: number;
  chronicLoad: number;
  trainingStressBalance: number;
  fatigueRatio: number;
} {
  // Constants for the exponential decay
  const ACUTE_DECAY = Math.exp(-1/7); // ~7 day time constant
  const CHRONIC_DECAY = Math.exp(-1/42); // ~42 day time constant
  
  // Sort activities by date (newest first)
  const sortedActivities = [...activities]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, days); // Only consider activities within the specified window
  
  // If no activities, return default values
  if (sortedActivities.length === 0) {
    return {
      acuteLoad: 0,
      chronicLoad: 0,
      trainingStressBalance: 0,
      fatigueRatio: 1
    };
  }
  
  // Calculate daily training loads
  const dailyLoads: Record<string, number> = {};
  
  for (const activity of sortedActivities) {
    const date = activity.date.split('T')[0]; // Get YYYY-MM-DD format
    const load = calculateActivityLoad(activity);
    
    if (!dailyLoads[date]) {
      dailyLoads[date] = 0;
    }
    
    dailyLoads[date] += load;
  }
  
  // Create a complete array of days with loads (fill gaps with zeros)
  const today = new Date();
  const dailyLoadArray: number[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyLoadArray.push(dailyLoads[dateStr] || 0);
  }
  
  // Calculate acute (fatigue) and chronic (fitness) loads using exponential weighting
  let acuteLoad = dailyLoadArray[0];
  let chronicLoad = dailyLoadArray[0];
  
  for (let i = 1; i < dailyLoadArray.length; i++) {
    acuteLoad = acuteLoad * ACUTE_DECAY + dailyLoadArray[i] * (1 - ACUTE_DECAY);
    chronicLoad = chronicLoad * CHRONIC_DECAY + dailyLoadArray[i] * (1 - CHRONIC_DECAY);
  }
  
  // Calculate training stress balance (fitness - fatigue)
  const trainingStressBalance = chronicLoad - acuteLoad;
  
  // Calculate fatigue ratio (acute load / chronic load)
  const fatigueRatio = chronicLoad > 0 ? acuteLoad / chronicLoad : 1;
  
  return {
    acuteLoad,
    chronicLoad,
    trainingStressBalance,
    fatigueRatio
  };
}

/**
 * Calculate load score for a single activity
 * This is a simplified version that uses duration, distance, and heart rate
 */
function calculateActivityLoad(activity: ActivityData): number {
  const baseDurationFactor = activity.duration / 60; // Duration in minutes
  
  // Default intensity multiplier
  let intensityMultiplier = 1;
  
  // Adjust intensity based on heart rate if available
  if (activity.heartRate?.average) {
    // Higher heart rates indicate higher intensity
    intensityMultiplier = Math.pow(activity.heartRate.average / 130, 1.5);
  }
  // Else adjust based on pace if available for running activities
  else if (activity.pace && activity.type.toLowerCase().includes('run')) {
    // Faster paces indicate higher intensity (pace in minutes/km or minutes/mile)
    const referenceEasyPace = 6; // 6:00 min/km or mile as reference
    intensityMultiplier = Math.pow(referenceEasyPace / activity.pace, 1.5);
  }
  // Else adjust based on perceived exertion if available
  else if (activity.perceivedExertion) {
    intensityMultiplier = activity.perceivedExertion / 5; // Scale from 1-10 to approximately 0.2-2
  }
  // Else adjust based on workout type
  else {
    const workoutType = activity.type.toLowerCase();
    
    if (workoutType.includes('interval') || workoutType.includes('speed') || workoutType.includes('tempo')) {
      intensityMultiplier = 1.5;
    } else if (workoutType.includes('threshold') || workoutType.includes('hill')) {
      intensityMultiplier = 1.3;
    } else if (workoutType.includes('long')) {
      intensityMultiplier = 1.1;
    } else if (workoutType.includes('easy') || workoutType.includes('recovery')) {
      intensityMultiplier = 0.8;
    }
  }
  
  // Adjust for elevation gain if available
  const elevationFactor = activity.elevationGain 
    ? 1 + (activity.elevationGain / 1000) * 0.1 // 10% increase per 1000m of elevation
    : 1;
  
  return baseDurationFactor * intensityMultiplier * elevationFactor;
}

/**
 * Generate workout recommendations based on energy level and training history
 */
export function generateWorkoutRecommendation(
  energyLevel: number,
  trainingLoad: {
    acuteLoad: number;
    chronicLoad: number;
    trainingStressBalance: number;
    fatigueRatio: number;
  }
): {
  recommendedIntensity: 'rest' | 'recovery' | 'easy' | 'moderate' | 'hard';
  suggestedWorkouts: string[];
  explanation: string;
} {
  // Define threshold values
  const HIGH_FATIGUE_RATIO = 1.2;
  const LOW_FATIGUE_RATIO = 0.8;
  const NEGATIVE_TSB_THRESHOLD = -15;
  
  // Initialize with default values
  let recommendedIntensity: 'rest' | 'recovery' | 'easy' | 'moderate' | 'hard' = 'easy';
  const suggestedWorkouts: string[] = [];
  let explanation = '';
  
  // First check energy level as primary factor
  if (energyLevel < 25) {
    recommendedIntensity = 'rest';
    explanation = 'Your energy level is very low, indicating you need a complete rest day.';
    suggestedWorkouts.push('Complete rest - no running');
    suggestedWorkouts.push('Light stretching or yoga');
    suggestedWorkouts.push('Extra sleep');
  } else if (energyLevel < 40) {
    recommendedIntensity = 'recovery';
    explanation = 'Your energy level is low, indicating you need a recovery day.';
    suggestedWorkouts.push('Very easy run (20-30 minutes)');
    suggestedWorkouts.push('Cross-training (swimming, cycling at easy effort)');
    suggestedWorkouts.push('Active recovery with mobility work');
  } else if (energyLevel < 55) {
    // For moderate-low energy, check training load
    if (trainingLoad.fatigueRatio > HIGH_FATIGUE_RATIO || trainingLoad.trainingStressBalance < NEGATIVE_TSB_THRESHOLD) {
      recommendedIntensity = 'recovery';
      explanation = 'While your energy is moderate, your training load indicates you need recovery.';
      suggestedWorkouts.push('Easy run (30-40 minutes)');
      suggestedWorkouts.push('Recovery cross-training');
      suggestedWorkouts.push('Easy run with strides');
    } else {
      recommendedIntensity = 'easy';
      explanation = 'Your energy level is moderate, suitable for an easy training day.';
      suggestedWorkouts.push('Easy run (40-50 minutes)');
      suggestedWorkouts.push('Easy run with light hill sprints');
      suggestedWorkouts.push('Technique drills and easy running');
    }
  } else if (energyLevel < 70) {
    // For true moderate energy, check training load
    if (trainingLoad.fatigueRatio > HIGH_FATIGUE_RATIO) {
      recommendedIntensity = 'easy';
      explanation = 'Your energy is moderate but training fatigue is high, so keep intensity easy.';
      suggestedWorkouts.push('Steady easy run (50-60 minutes)');
      suggestedWorkouts.push('Easy run with form drills');
      suggestedWorkouts.push('Progression run (easy to moderate)');
    } else {
      recommendedIntensity = 'moderate';
      explanation = 'Your energy level is good for moderate training.';
      suggestedWorkouts.push('Tempo run (20-30 minutes at threshold pace)');
      suggestedWorkouts.push('Fartlek workout');
      suggestedWorkouts.push('Hill repeats (moderate effort)');
    }
  } else if (energyLevel < 85) {
    // For high energy, still consider training load
    if (trainingLoad.fatigueRatio > HIGH_FATIGUE_RATIO) {
      recommendedIntensity = 'moderate';
      explanation = 'Your energy is high but recent training load is also high. A moderate session is ideal.';
      suggestedWorkouts.push('Moderate long run');
      suggestedWorkouts.push('Tempo intervals (e.g., 4-5 × 5 minutes at threshold)');
      suggestedWorkouts.push('Progression run ending at threshold effort');
    } else {
      recommendedIntensity = 'hard';
      explanation = 'Your energy level is high, good for a challenging workout.';
      suggestedWorkouts.push('Interval workout (e.g., 6-8 × 800m at 5K pace)');
      suggestedWorkouts.push('Hill repeats (hard effort)');
      suggestedWorkouts.push('Tempo run (25-40 minutes at threshold pace)');
    }
  } else {
    // For very high energy
    if (trainingLoad.fatigueRatio > HIGH_FATIGUE_RATIO) {
      recommendedIntensity = 'moderate';
      explanation = 'While your energy is excellent, your training load is high. A moderate session is recommended.';
      suggestedWorkouts.push('Fast finish long run');
      suggestedWorkouts.push('Threshold intervals');
      suggestedWorkouts.push('Moderate long run with hills');
    } else {
      recommendedIntensity = 'hard';
      explanation = 'Your energy level is excellent for a high-intensity session or race.';
      suggestedWorkouts.push('VO2max intervals (e.g., 5-6 × 1000m at 3K-5K pace)');
      suggestedWorkouts.push('Race pace-specific workout');
      suggestedWorkouts.push('Long intervals at threshold with short recovery');
    }
  }
  
  // Add TSB explanation
  if (trainingLoad.trainingStressBalance < NEGATIVE_TSB_THRESHOLD) {
    explanation += ' Your training stress balance is significantly negative, indicating accumulated fatigue.';
  } else if (trainingLoad.trainingStressBalance > 0 && trainingLoad.fatigueRatio < LOW_FATIGUE_RATIO) {
    explanation += ' Your training stress balance is positive and fatigue is low, showing good recovery.';
  }
  
  return {
    recommendedIntensity,
    suggestedWorkouts,
    explanation
  };
}

/**
 * Analyze race readiness based on training history
 */
export function analyzeRaceReadiness(
  goal: {
    type: string;
    targetDate: string;
    targetDistance?: string;
    targetTime?: string;
  },
  trainingHistory: ActivityData[],
  fitnessMetrics: {
    acuteLoad: number;
    chronicLoad: number;
    trainingStressBalance: number;
    fatigueRatio: number;
  }
): {
  readinessScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  projectedResult?: string;
} {
  // Extract target race details
  const raceDistance = parseDistance(goal.targetDistance || '');
  const targetDate = new Date(goal.targetDate);
  const daysUntilRace = Math.max(0, Math.floor((targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  
  // Calculate long run readiness (specific to distance)
  const longRunReadiness = calculateLongRunReadiness(trainingHistory, raceDistance);
  
  // Calculate volume readiness
  const volumeReadiness = calculateVolumeReadiness(trainingHistory, raceDistance);
  
  // Calculate specific workouts readiness
  const workoutReadiness = calculateWorkoutReadiness(trainingHistory, goal.type.toLowerCase());
  
  // Calculate taper readiness
  const taperReadiness = calculateTaperReadiness(fitnessMetrics, daysUntilRace);
  
  // Calculate consistency
  const consistencyScore = calculateConsistencyScore(trainingHistory);
  
  // Weights for overall score
  const weights = {
    longRun: 0.3,
    volume: 0.25,
    workouts: 0.2,
    taper: 0.15,
    consistency: 0.1
  };
  
  // Calculate overall readiness score
  const readinessScore = Math.min(100, Math.max(0, Math.round(
    longRunReadiness.score * weights.longRun +
    volumeReadiness.score * weights.volume +
    workoutReadiness.score * weights.workouts +
    taperReadiness.score * weights.taper +
    consistencyScore * weights.consistency
  )));
  
  // Determine strengths and weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  if (longRunReadiness.score >= 80) strengths.push('Long run endurance');
  else if (longRunReadiness.score <= 50) weaknesses.push('Long run endurance');
  
  if (volumeReadiness.score >= 80) strengths.push('Weekly training volume');
  else if (volumeReadiness.score <= 50) weaknesses.push('Weekly training volume');
  
  if (workoutReadiness.score >= 80) strengths.push('Race-specific workouts');
  else if (workoutReadiness.score <= 50) weaknesses.push('Race-specific workouts');
  
  if (consistencyScore >= 80) strengths.push('Training consistency');
  else if (consistencyScore <= 50) weaknesses.push('Training consistency');
  
  if (taperReadiness.score >= 80) strengths.push('Recovery status');
  else if (taperReadiness.score <= 50) weaknesses.push('Recovery status');
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (longRunReadiness.score < 70) {
    recommendations.push(longRunReadiness.recommendation);
  }
  
  if (volumeReadiness.score < 70) {
    recommendations.push(volumeReadiness.recommendation);
  }
  
  if (workoutReadiness.score < 70) {
    recommendations.push(workoutReadiness.recommendation);
  }
  
  if (consistencyScore < 70) {
    recommendations.push('Work on maintaining more consistent training without large gaps between runs.');
  }
  
  if (daysUntilRace <= 14 && taperReadiness.score < 70) {
    recommendations.push(taperReadiness.recommendation);
  }
  
  // Add projected result if race is close
  let projectedResult: string | undefined;
  
  if (daysUntilRace <= 21) {
    const confidence = readinessScore >= 80 ? 'high' : readinessScore >= 60 ? 'moderate' : 'low';
    const performanceLevel = readinessScore >= 80 ? 'optimal' : readinessScore >= 60 ? 'good' : 'challenging';
    
    projectedResult = `Based on your training, we have ${confidence} confidence that you can achieve a ${performanceLevel} performance in your upcoming ${goal.type}.`;
    
    if (goal.targetTime) {
      if (readinessScore >= 80) {
        projectedResult += ` You're well prepared to achieve your target time of ${goal.targetTime}.`;
      } else if (readinessScore >= 60) {
        projectedResult += ` You have a reasonable chance of achieving your target time of ${goal.targetTime}, but it will require a strong race day effort.`;
      } else {
        projectedResult += ` Your target time of ${goal.targetTime} may be challenging based on your current preparation.`;
      }
    }
  }
  
  return {
    readinessScore,
    strengths,
    weaknesses,
    recommendations,
    projectedResult
  };
}

// Helper functions for race readiness analysis

function parseDistance(distanceStr: string): number {
  // Handle common race distances
  const lowerDistance = distanceStr.toLowerCase();
  
  if (lowerDistance.includes('5k') || lowerDistance.includes('5 km')) return 5;
  if (lowerDistance.includes('10k') || lowerDistance.includes('10 km')) return 10;
  if (lowerDistance.includes('half') || lowerDistance.includes('13.1')) return 21.1;
  if (lowerDistance.includes('marathon') || lowerDistance.includes('26.2') || lowerDistance.includes('42')) return 42.2;
  
  // Try to extract a number
  const match = distanceStr.match(/(\d+(\.\d+)?)/);
  if (match) {
    return parseFloat(match[0]);
  }
  
  // Default to 10k if we can't determine
  return 10;
}

function calculateLongRunReadiness(
  activities: ActivityData[],
  raceDistance: number
): { score: number; recommendation: string } {
  // Get long runs (typically longest run in each week)
  const runActivities = activities
    .filter(a => a.type.toLowerCase().includes('run') && a.distance)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  if (runActivities.length === 0) {
    return {
      score: 0,
      recommendation: 'Start incorporating regular long runs into your training program.'
    };
  }
  
  // Group by week
  const weeklyLongRuns: ActivityData[] = [];
  let currentWeekStart = new Date(runActivities[0].date);
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
  
  let currentWeekLongest: ActivityData | null = null;
  
  runActivities.forEach(activity => {
    const activityDate = new Date(activity.date);
    const activityWeekStart = new Date(activityDate);
    activityWeekStart.setDate(activityWeekStart.getDate() - activityWeekStart.getDay());
    
    // If we've moved to a new week
    if (activityWeekStart.getTime() > currentWeekStart.getTime()) {
      if (currentWeekLongest) {
        weeklyLongRuns.push(currentWeekLongest);
      }
      currentWeekStart = activityWeekStart;
      currentWeekLongest = activity;
    } 
    // Still in same week, check if this is the longest run
    else if (!currentWeekLongest || (activity.distance && currentWeekLongest.distance && activity.distance > currentWeekLongest.distance)) {
      currentWeekLongest = activity;
    }
  });
  
  // Add the last week's longest run
  if (currentWeekLongest) {
    weeklyLongRuns.push(currentWeekLongest);
  }
  
  // Get the 3 longest runs in the last 8 weeks
  const recentLongRuns = weeklyLongRuns.slice(-8)
    .sort((a, b) => (b.distance || 0) - (a.distance || 0))
    .slice(0, 3);
  
  if (recentLongRuns.length === 0) {
    return {
      score: 0,
      recommendation: 'Start incorporating regular long runs into your training program.'
    };
  }
  
  // Calculate average of top 3 recent long runs
  const avgLongRunDistance = recentLongRuns.reduce((sum, run) => sum + (run.distance || 0), 0) / recentLongRuns.length;
  
  // Calculate readiness based on race distance
  let longRunReadinessScore = 0;
  let recommendation = '';
  
  // Different standards based on race distance
  if (raceDistance <= 5) { // 5K
    longRunReadinessScore = Math.min(100, (avgLongRunDistance / 10) * 100);
    if (avgLongRunDistance < 8) {
      recommendation = 'Increase your long run distance to 8-10 km to build endurance for your 5K race.';
    }
  } else if (raceDistance <= 10) { // 10K
    longRunReadinessScore = Math.min(100, (avgLongRunDistance / 15) * 100);
    if (avgLongRunDistance < 12) {
      recommendation = 'Work toward increasing your long run to 12-15 km to build endurance for your 10K race.';
    }
  } else if (raceDistance <= 21.1) { // Half Marathon
    longRunReadinessScore = Math.min(100, (avgLongRunDistance / 25) * 100);
    if (avgLongRunDistance < 18) {
      recommendation = 'Increase your long run distance to at least 18-20 km for half marathon readiness.';
    }
  } else { // Marathon
    longRunReadinessScore = Math.min(100, (avgLongRunDistance / 35) * 100);
    if (avgLongRunDistance < 30) {
      recommendation = 'Work toward building your long run to at least 30-35 km for marathon readiness.';
    }
  }
  
  // If no specific recommendation was set (meaning the long runs are adequate)
  if (!recommendation) {
    recommendation = 'Continue your current long run strategy, which is appropriate for your race distance.';
  }
  
  return {
    score: Math.round(longRunReadinessScore),
    recommendation
  };
}

function calculateVolumeReadiness(
  activities: ActivityData[],
  raceDistance: number
): { score: number; recommendation: string } {
  // Get running activities
  const runActivities = activities
    .filter(a => a.type.toLowerCase().includes('run') && a.distance)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  if (runActivities.length === 0) {
    return {
      score: 0,
      recommendation: 'Start building consistent weekly running volume.'
    };
  }
  
  // Group by week
  const weeklyVolumes: number[] = [];
  const weeks: Record<string, ActivityData[]> = {};
  
  runActivities.forEach(activity => {
    const activityDate = new Date(activity.date);
    const weekStart = new Date(activityDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeks[weekKey]) {
      weeks[weekKey] = [];
    }
    
    weeks[weekKey].push(activity);
  });
  
  // Calculate weekly volumes
  Object.values(weeks).forEach(weekActivities => {
    const weeklyVolume = weekActivities.reduce((sum, activity) => sum + (activity.distance || 0), 0);
    weeklyVolumes.push(weeklyVolume);
  });
  
  // Get recent weekly volumes (last 4 weeks)
  const recentWeeklyVolumes = weeklyVolumes.slice(-4);
  
  if (recentWeeklyVolumes.length === 0) {
    return {
      score: 0,
      recommendation: 'Start building consistent weekly running volume.'
    };
  }
  
  // Calculate average weekly volume
  const avgWeeklyVolume = recentWeeklyVolumes.reduce((sum, volume) => sum + volume, 0) / recentWeeklyVolumes.length;
  
  // Calculate recommended weekly volume based on race distance
  let recommendedVolume = 0;
  
  if (raceDistance <= 5) { // 5K
    recommendedVolume = 30; // 30 km per week is solid for a 5K
  } else if (raceDistance <= 10) { // 10K
    recommendedVolume = 40; // 40 km per week
  } else if (raceDistance <= 21.1) { // Half Marathon
    recommendedVolume = 60; // 60 km per week
  } else { // Marathon
    recommendedVolume = 80; // 80 km per week
  }
  
  // Calculate score based on how close to recommended volume
  const volumeReadinessScore = Math.min(100, (avgWeeklyVolume / recommendedVolume) * 100);
  
  // Generate recommendation
  let recommendation = '';
  
  if (avgWeeklyVolume < recommendedVolume * 0.7) {
    recommendation = `Gradually increase your weekly volume toward ${Math.round(recommendedVolume)} km per week for optimal race preparation.`;
  } else if (avgWeeklyVolume < recommendedVolume * 0.9) {
    recommendation = `You're on the right track with volume. Consider a small increase toward ${Math.round(recommendedVolume)} km per week.`;
  } else {
    recommendation = 'Your weekly volume is appropriate for your race distance. Maintain this level with proper periodization.';
  }
  
  return {
    score: Math.round(volumeReadinessScore),
    recommendation
  };
}

function calculateWorkoutReadiness(
  activities: ActivityData[],
  raceType: string
): { score: number; recommendation: string } {
  // Identify quality workouts in last 8 weeks
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
  
  const recentActivities = activities.filter(a => new Date(a.date) >= eightWeeksAgo);
  
  // Count quality workouts by type
  const tempoRuns = recentActivities.filter(a => 
    a.type.toLowerCase().includes('tempo') || 
    a.type.toLowerCase().includes('threshold') ||
    a.type.toLowerCase().includes('cruise')
  ).length;
  
  const intervalWorkouts = recentActivities.filter(a => 
    a.type.toLowerCase().includes('interval') || 
    a.type.toLowerCase().includes('speed') ||
    a.type.toLowerCase().includes('track')
  ).length;
  
  const hillWorkouts = recentActivities.filter(a => 
    a.type.toLowerCase().includes('hill')
  ).length;
  
  const longRuns = recentActivities.filter(a => 
    a.type.toLowerCase().includes('long run')
  ).length;
  
  // Determine recommended workouts based on race type
  let tempoTarget = 0;
  let intervalTarget = 0;
  let hillTarget = 0;
  let recommendedWorkouts = '';
  
  if (raceType.includes('5k') || raceType.includes('5 km')) {
    tempoTarget = 4; // One tempo every other week
    intervalTarget = 8; // One interval session per week
    hillTarget = 4; // Hill work every other week
    recommendedWorkouts = 'interval training, hill sprints, and threshold runs';
  } else if (raceType.includes('10k') || raceType.includes('10 km')) {
    tempoTarget = 6; // Almost weekly tempo
    intervalTarget = 6; // Almost weekly intervals
    hillTarget = 3; // Hill work every ~2-3 weeks
    recommendedWorkouts = 'threshold runs, interval training, and tempo efforts';
  } else if (raceType.includes('half') || raceType.includes('13.1') || raceType.includes('21.1')) {
    tempoTarget = 8; // Weekly tempo
    intervalTarget = 4; // Interval every other week
    hillTarget = 3; // Occasional hills
    recommendedWorkouts = 'threshold runs, marathon-pace efforts, and progressive long runs';
  } else if (raceType.includes('marathon') || raceType.includes('26.2') || raceType.includes('42.2')) {
    tempoTarget = 6; // Tempo most weeks
    intervalTarget = 3; // Occasional intervals
    hillTarget = 2; // Some hill work
    recommendedWorkouts = 'marathon-pace runs, progression long runs, and medium-long runs';
  }
  
  // Calculate workout readiness score
  const tempoScore = Math.min(100, (tempoRuns / tempoTarget) * 100);
  const intervalScore = Math.min(100, (intervalWorkouts / intervalTarget) * 100);
  const hillScore = Math.min(100, (hillWorkouts / hillTarget) * 100);
  
  // Weight the scores based on race importance (can adjust these weights)
  let workoutReadinessScore = 0;
  
  if (raceType.includes('5k') || raceType.includes('5 km')) {
    workoutReadinessScore = tempoScore * 0.3 + intervalScore * 0.5 + hillScore * 0.2;
  } else if (raceType.includes('10k') || raceType.includes('10 km')) {
    workoutReadinessScore = tempoScore * 0.4 + intervalScore * 0.4 + hillScore * 0.2;
  } else if (raceType.includes('half') || raceType.includes('13.1') || raceType.includes('21.1')) {
    workoutReadinessScore = tempoScore * 0.5 + intervalScore * 0.3 + hillScore * 0.2;
  } else if (raceType.includes('marathon') || raceType.includes('26.2') || raceType.includes('42.2')) {
    workoutReadinessScore = tempoScore * 0.6 + intervalScore * 0.2 + hillScore * 0.2;
  }
  
  // Generate recommendation
  let recommendation = '';
  
  if (workoutReadinessScore < 50) {
    recommendation = `Incorporate more race-specific workouts including ${recommendedWorkouts} into your training plan.`;
  } else if (workoutReadinessScore < 75) {
    recommendation = `You're making progress with quality workouts. Continue to focus on ${recommendedWorkouts} for optimal race preparation.`;
  } else {
    recommendation = 'Your workout variety is well-balanced for your race goal. Maintain this quality training mix.';
  }
  
  return {
    score: Math.round(workoutReadinessScore),
    recommendation
  };
}

function calculateTaperReadiness(
  fitnessMetrics: {
    acuteLoad: number;
    chronicLoad: number;
    trainingStressBalance: number;
    fatigueRatio: number;
  },
  daysUntilRace: number
): { score: number; recommendation: string } {
  // If race is more than 3 weeks away, taper is not relevant yet
  if (daysUntilRace > 21) {
    return {
      score: 100,
      recommendation: 'Taper not applicable yet; continue building fitness.'
    };
  }
  
  // Calculate ideal training stress balance (TSB) based on days until race
  let idealTSB = 0;
  
  if (daysUntilRace <= 3) {
    idealTSB = 20; // Race day: Well-rested with high TSB
  } else if (daysUntilRace <= 7) {
    idealTSB = 10; // Race week: Positive TSB
  } else if (daysUntilRace <= 14) {
    idealTSB = 0; // 1-2 weeks out: Neutral TSB
  } else {
    idealTSB = -10; // 2-3 weeks out: Still in training with slightly negative TSB
  }
  
  // Calculate ideal fatigue ratio based on days until race
  let idealFatigueRatio = 0;
  
  if (daysUntilRace <= 3) {
    idealFatigueRatio = 0.7; // Race day: Low fatigue relative to fitness
  } else if (daysUntilRace <= 7) {
    idealFatigueRatio = 0.8; // Race week: Reduced fatigue
  } else if (daysUntilRace <= 14) {
    idealFatigueRatio = 0.9; // 1-2 weeks out: Starting taper
  } else {
    idealFatigueRatio = 1.0; // 2-3 weeks out: Fatigue matches fitness
  }
  
  // Calculate how close the actual metrics are to ideal
  const tsbDifference = Math.abs(fitnessMetrics.trainingStressBalance - idealTSB);
  const tsbScore = Math.max(0, 100 - tsbDifference * 2); // Lose 2 points per unit away from ideal
  
  const ratioDifference = Math.abs(fitnessMetrics.fatigueRatio - idealFatigueRatio);
  const ratioScore = Math.max(0, 100 - ratioDifference * 100); // Lose 1 point per 0.01 away from ideal
  
  // Overall taper readiness score
  const taperReadinessScore = (tsbScore * 0.6) + (ratioScore * 0.4);
  
  // Generate recommendation
  let recommendation = '';
  
  if (daysUntilRace <= 7) {
    if (fitnessMetrics.fatigueRatio > idealFatigueRatio + 0.1) {
      recommendation = 'Reduce training volume significantly for the remaining days before your race to ensure proper recovery.';
    } else if (fitnessMetrics.trainingStressBalance < idealTSB - 10) {
      recommendation = 'You are still carrying significant fatigue. Focus on rest, recovery, and very light workouts until race day.';
    } else if (taperReadinessScore >= 80) {
      recommendation = 'Your taper is on track. Maintain current reduced volume with some race-pace efforts to stay sharp.';
    } else {
      recommendation = 'Adjust your taper by focusing on quality over quantity and ensuring adequate rest.';
    }
  } else {
    if (fitnessMetrics.fatigueRatio > 1.2) {
      recommendation = 'Begin reducing training volume while maintaining some intensity to start your taper effectively.';
    } else if (fitnessMetrics.trainingStressBalance < -20) {
      recommendation = 'Your current fatigue is high. Consider starting your taper with a reduction in volume.';
    } else {
      recommendation = 'Continue your training plan as scheduled, with a gradual reduction in volume as you approach race week.';
    }
  }
  
  return {
    score: Math.round(taperReadinessScore),
    recommendation
  };
}

function calculateConsistencyScore(activities: ActivityData[]): number {
  // Only look at the last 12 weeks
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
  
  const recentActivities = activities
    .filter(a => a.type.toLowerCase().includes('run') && new Date(a.date) >= twelveWeeksAgo)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  if (recentActivities.length === 0) {
    return 0;
  }
  
  // Group activities by week
  const weeks: Record<string, ActivityData[]> = {};
  
  recentActivities.forEach(activity => {
    const activityDate = new Date(activity.date);
    const weekStart = new Date(activityDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeks[weekKey]) {
      weeks[weekKey] = [];
    }
    
    weeks[weekKey].push(activity);
  });
  
  // Calculate week-to-week consistency for number of runs
  const weeklyRunCounts = Object.values(weeks).map(weekActivities => weekActivities.length);
  
  // Calculate week-to-week consistency for volume
  const weeklyVolumes = Object.values(weeks).map(weekActivities => 
    weekActivities.reduce((sum, activity) => sum + (activity.distance || 0), 0)
  );
  
  // Calculate variations
  const runCountVariation = calculateCoeffientOfVariation(weeklyRunCounts);
  const volumeVariation = calculateCoeffientOfVariation(weeklyVolumes);
  
  // Detect gaps in training (0 runs in a week)
  const gapWeeks = weeklyRunCounts.filter(count => count === 0).length;
  const gapPenalty = gapWeeks * 10; // 10 point penalty per week with no runs
  
  // Calculate avg runs per week
  const avgRunsPerWeek = weeklyRunCounts.reduce((sum, count) => sum + count, 0) / weeklyRunCounts.length;
  
  // Base consistency score on variation coefficients and gaps
  let consistencyScore = 100 - (runCountVariation * 40) - (volumeVariation * 20) - gapPenalty;
  
  // Adjust for very low frequency
  if (avgRunsPerWeek < 3) {
    consistencyScore = Math.min(consistencyScore, 60); // Cap at 60 if averaging fewer than 3 runs per week
  }
  
  // Ensure score is between 0-100
  return Math.min(100, Math.max(0, Math.round(consistencyScore)));
}

function calculateCoeffientOfVariation(values: number[]): number {
  if (values.length <= 1) return 0;
  
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (mean === 0) return 0;
  
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev / mean; // Coefficient of variation (ratio of standard deviation to mean)
}