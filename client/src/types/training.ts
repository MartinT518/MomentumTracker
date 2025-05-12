// Training plan types
export interface TrainingPlanMetadata {
  generatedAt: string;
  goal: string;
  weeks: number;
  daysPerWeek: number;
}

export interface WorkoutDetails {
  day: string;
  description: string;
  type: string;
  distance?: string;
  duration?: string;
  intensity?: string;
}

export interface WeekPlan {
  week: number;
  focus: string;
  workouts: WorkoutDetails[];
}

export interface TrainingPlanOverview {
  weeklyMileage?: string;
  workoutsPerWeek?: string;
  longRunDistance?: string;
  qualityWorkouts?: string;
}

export interface TrainingPlan {
  planText: string;
  metadata: TrainingPlanMetadata;
  overview?: TrainingPlanOverview;
  philosophy?: string;
  weeklyPlans?: WeekPlan[];
}

// Training adjustments
export interface PlanAdjustmentMetadata {
  generatedAt: string;
  adjustmentReason: string;
  originalPlanId?: string;
}

export interface PlanAdjustment {
  planText: string;
  metadata: PlanAdjustmentMetadata;
}

// Training recommendations
export type RecommendationType = 
  | "intensity" 
  | "volume" 
  | "recovery" 
  | "workout_type" 
  | "general";

export type RecommendationPriority = 
  | "high" 
  | "medium" 
  | "low";

export interface TrainingRecommendation {
  type: RecommendationType;
  recommendation: string;
  reasoning: string;
  priority: RecommendationPriority;
}

// Performance metrics
export interface HeartRateData {
  avg?: number;
  max?: number;
}

export interface ActivityData {
  date: string;
  type: string;
  distance?: number;
  duration?: number;
  avgPace?: string;
  heartRate?: HeartRateData;
  perceivedEffort?: number;
  notes?: string;
}

export interface HealthMetricData {
  sleepScore?: number;
  hrvScore?: number;
  restingHeartRate?: number;
  energyLevel?: number;
  stressLevel?: number;
}

export interface PerformanceData {
  recentActivities: ActivityData[];
  healthMetrics?: HealthMetricData;
  totalDistanceLastWeek?: number;
  comparedToPlanLastWeek?: "above" | "below" | "on-target";
  userFeedback?: string;
}