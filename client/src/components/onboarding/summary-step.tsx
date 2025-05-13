import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";

type SummaryStepProps = {
  onPrevious: () => void;
  onComplete: (profileUpdates?: any) => void;
  onboardingData: {
    fitnessGoals: any;
    experience: any;
    trainingPreferences: any;
  };
  isLoading: boolean;
};

export default function SummaryStep({ 
  onPrevious, 
  onComplete, 
  onboardingData,
  isLoading 
}: SummaryStepProps) {
  const { fitnessGoals, experience, trainingPreferences } = onboardingData;

  // Helper function to render goal summary
  const renderGoalSummary = () => {
    if (!fitnessGoals) return "No goal information provided";
    
    let summary = [];
    
    // Primary goal
    const goalLabels: Record<string, string> = {
      "improve_fitness": "Improve Overall Fitness",
      "lose_weight": "Lose Weight / Improve Body Composition",
      "train_for_race": "Train for a Race or Event",
      "improve_speed": "Improve Speed/Performance",
      "build_consistency": "Build Consistency/Habit",
      "injury_recovery": "Injury Prevention/Recovery"
    };
    
    summary.push(`Primary goal: ${goalLabels[fitnessGoals.primary_goal] || fitnessGoals.primary_goal}`);
    
    // Race info if applicable
    if (fitnessGoals.has_target_race && fitnessGoals.goal_event_type) {
      summary.push(`Training for: ${fitnessGoals.goal_event_type.toUpperCase().replace('_', ' ')}`);
      
      if (fitnessGoals.goal_date) {
        const date = new Date(fitnessGoals.goal_date);
        summary.push(`Event date: ${date.toLocaleDateString()}`);
      }
    }
    
    // Weight goals
    if (fitnessGoals.weight_goal && fitnessGoals.weight_goal !== "maintain") {
      const goalType = fitnessGoals.weight_goal === "lose" ? "Lose" : "Gain";
      
      if (fitnessGoals.current_weight && fitnessGoals.target_weight) {
        const change = Math.abs(fitnessGoals.target_weight - fitnessGoals.current_weight);
        summary.push(`Weight goal: ${goalType} ${change.toFixed(1)} kg (${fitnessGoals.current_weight} → ${fitnessGoals.target_weight} kg)`);
      } else {
        summary.push(`Weight goal: ${goalType} weight`);
      }
    } else if (fitnessGoals.weight_goal === "maintain") {
      summary.push("Weight goal: Maintain current weight");
    }
    
    return summary;
  };

  // Helper function to render experience summary
  const renderExperienceSummary = () => {
    if (!experience) return "No experience information provided";
    
    let summary = [];
    
    // Experience level
    const experienceLabels: Record<string, string> = {
      "beginner": "Beginner",
      "intermediate": "Intermediate",
      "advanced": "Advanced",
      "elite": "Elite/Competitive"
    };
    
    summary.push(`Experience level: ${experienceLabels[experience.experience_level] || experience.experience_level}`);
    
    // Running history
    if (experience.years_running !== undefined) {
      summary.push(`Running for ${experience.years_running} year${experience.years_running !== 1 ? 's' : ''}`);
    }
    
    // Weekly activity
    if (experience.weekly_running_days !== undefined) {
      summary.push(`Running ${experience.weekly_running_days} day${experience.weekly_running_days !== 1 ? 's' : ''}/week`);
    }
    
    // Typical run distance
    if (experience.typical_run_distance) {
      summary.push(`Typical run: ${experience.typical_run_distance} km`);
    }
    
    // Injuries
    if (experience.recent_injuries && experience.recent_injuries.length > 0) {
      if (experience.recent_injuries.includes("none")) {
        summary.push("No recent injuries");
      } else {
        const injuryLabels: Record<string, string> = {
          "runner's_knee": "Runner's Knee",
          "shin_splints": "Shin Splints",
          "achilles_tendinitis": "Achilles Tendinitis",
          "plantar_fasciitis": "Plantar Fasciitis",
          "it_band_syndrome": "IT Band Syndrome",
          "stress_fracture": "Stress Fracture",
          "ankle_sprain": "Ankle Sprain",
          "hamstring_strain": "Hamstring Strain"
        };
        
        const injuryNames = experience.recent_injuries
          .map(i => injuryLabels[i] || i)
          .join(", ");
        
        summary.push(`Recent injuries: ${injuryNames}`);
      }
    }
    
    return summary;
  };

  // Helper function to render training preferences summary
  const renderPreferencesSummary = () => {
    if (!trainingPreferences) return "No training preference information provided";
    
    let summary = [];
    
    // Workout types
    const workoutLabels: Record<string, string> = {
      "easy_run": "Easy Runs",
      "long_run": "Long Runs",
      "tempo_run": "Tempo Runs",
      "interval": "Interval Training",
      "hill_repeats": "Hill Repeats",
      "fartlek": "Fartlek",
      "progression_run": "Progression Runs",
      "recovery_run": "Recovery Runs",
      "threshold": "Threshold Workouts",
      "track_workout": "Track Workouts",
      "trail_run": "Trail Running",
      "stride": "Strides"
    };
    
    if (trainingPreferences.preferred_workout_types && trainingPreferences.preferred_workout_types.length > 0) {
      const preferredWorkouts = trainingPreferences.preferred_workout_types
        .map(w => workoutLabels[w] || w)
        .join(", ");
      
      summary.push(`Preferred workouts: ${preferredWorkouts}`);
    }
    
    // Cross-training
    const crossTrainingLabels: Record<string, string> = {
      "cycling": "Cycling",
      "swimming": "Swimming",
      "strength_training": "Strength Training",
      "yoga": "Yoga",
      "pilates": "Pilates",
      "hiit": "HIIT",
      "rowing": "Rowing",
      "elliptical": "Elliptical",
      "walking": "Walking",
      "hiking": "Hiking",
      "cross_country_skiing": "Cross-Country Skiing",
      "core_workout": "Core Workouts"
    };
    
    if (trainingPreferences.cross_training_activities && trainingPreferences.cross_training_activities.length > 0) {
      const crossTraining = trainingPreferences.cross_training_activities
        .map(a => crossTrainingLabels[a] || a)
        .join(", ");
      
      summary.push(`Cross-training: ${crossTraining}`);
    }
    
    // Schedule
    if (trainingPreferences.rest_days !== undefined) {
      summary.push(`Rest days: ${trainingPreferences.rest_days} per week`);
    }
    
    if (trainingPreferences.cross_training_days !== undefined) {
      summary.push(`Cross-training: ${trainingPreferences.cross_training_days} days per week`);
    }
    
    // Max workout duration
    if (trainingPreferences.max_workout_duration) {
      summary.push(`Max workout duration: ${trainingPreferences.max_workout_duration} minutes`);
    }
    
    return summary;
  };

  const goalSummary = renderGoalSummary();
  const experienceSummary = renderExperienceSummary();
  const preferencesSummary = renderPreferencesSummary();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Summary</h2>
        <p className="text-muted-foreground">
          Review your information before finalizing your personalized experience.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <SummaryCard 
          title="Fitness Goals"
          items={Array.isArray(goalSummary) ? goalSummary : [goalSummary]}
          isComplete={!!fitnessGoals}
        />
        
        <SummaryCard 
          title="Running Experience"
          items={Array.isArray(experienceSummary) ? experienceSummary : [experienceSummary]}
          isComplete={!!experience}
        />
        
        <SummaryCard 
          title="Training Preferences"
          items={Array.isArray(preferencesSummary) ? preferencesSummary : [preferencesSummary]}
          isComplete={!!trainingPreferences}
        />
      </div>

      <div className="bg-primary/5 rounded-lg p-4 mt-6 border border-primary/10">
        <h3 className="font-medium text-center mb-2">Ready to get started?</h3>
        <p className="text-sm text-center text-muted-foreground mb-4">
          We'll create a personalized training plan and dashboard based on your information.
          You can always update your preferences in your profile settings.
        </p>
        
        <div className="flex justify-center">
          <Button 
            size="lg"
            onClick={() => onComplete()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Complete Setup
          </Button>
        </div>
      </div>

      <div className="flex justify-start pt-2">
        <Button 
          variant="outline" 
          onClick={onPrevious}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
}

type SummaryCardProps = {
  title: string;
  items: string[];
  isComplete: boolean;
};

function SummaryCard({ title, items, isComplete }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          {isComplete ? (
            <Badge variant="outline" className="bg-primary/10 text-primary">
              <CheckCircle className="h-3 w-3 mr-1" />
              <span>Complete</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-destructive/10 text-destructive">
              Incomplete
            </Badge>
          )}
        </div>
        <Separator className="mb-3" />
        <ul className="space-y-1 text-sm">
          {items.map((item, index) => (
            <li key={index} className="text-muted-foreground">
              • {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}