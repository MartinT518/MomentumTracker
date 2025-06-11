import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Loader2, Clock, Dumbbell, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

type TrainingPreferencesStepProps = {
  onNext: () => void;
  onPrevious: () => void;
  onUpdateData: (data: any) => void;
  initialData: any;
};

// Types for our form data
interface TrainingPreferencesData {
  preferred_workout_types: string[];
  avoid_workout_types: string[];
  cross_training_activities: string[];
  cross_training_days: number;
  rest_days: number;
  max_workout_duration?: number;
}

// Workout type options
const workoutTypes = [
  { value: "easy_run", label: "Easy Runs" },
  { value: "long_run", label: "Long Runs" },
  { value: "tempo_run", label: "Tempo Runs" },
  { value: "interval", label: "Interval Training" },
  { value: "hill_repeats", label: "Hill Repeats" },
  { value: "fartlek", label: "Fartlek" },
  { value: "progression_run", label: "Progression Runs" },
  { value: "recovery_run", label: "Recovery Runs" },
  { value: "threshold", label: "Threshold Workouts" },
  { value: "track_workout", label: "Track Workouts" },
  { value: "trail_run", label: "Trail Running" },
  { value: "stride", label: "Strides" }
];

// Cross-training options
const crossTrainingTypes = [
  { value: "cycling", label: "Cycling" },
  { value: "swimming", label: "Swimming" },
  { value: "strength_training", label: "Strength Training" },
  { value: "yoga", label: "Yoga" },
  { value: "pilates", label: "Pilates" },
  { value: "hiit", label: "HIIT" },
  { value: "rowing", label: "Rowing" },
  { value: "elliptical", label: "Elliptical" },
  { value: "walking", label: "Walking" },
  { value: "hiking", label: "Hiking" },
  { value: "cross_country_skiing", label: "Cross-Country Skiing" },
  { value: "core_workout", label: "Core Workouts" }
];

export default function TrainingPreferencesStep({ 
  onNext, 
  onPrevious,
  onUpdateData,
  initialData 
}: TrainingPreferencesStepProps) {
  const { toast } = useToast();

  // Initialize form data with either initial data or defaults
  const [formData, setFormData] = useState<TrainingPreferencesData>(
    initialData || {
      preferred_workout_types: ["easy_run", "long_run"],
      avoid_workout_types: [],
      cross_training_activities: ["strength_training"],
      cross_training_days: 2,
      rest_days: 1,
    }
  );

  // Auto-save timeout ref
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Event handlers for form updates with auto-save
  const handleChange = (field: keyof TrainingPreferencesData, value: any) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    onUpdateData(updatedData);

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Auto-save functionality removed to prevent errors
  };

  // Toggle workout type in preferred list
  const togglePreferredWorkout = (workout: string) => {
    let newPreferred: string[];
    
    if (formData.preferred_workout_types.includes(workout)) {
      newPreferred = formData.preferred_workout_types.filter(w => w !== workout);
    } else {
      newPreferred = [...formData.preferred_workout_types, workout];
      
      // Remove from avoid list if it's there
      if (formData.avoid_workout_types.includes(workout)) {
        handleChange(
          "avoid_workout_types", 
          formData.avoid_workout_types.filter(w => w !== workout)
        );
      }
    }
    
    handleChange("preferred_workout_types", newPreferred);
  };

  // Toggle workout type in avoid list
  const toggleAvoidWorkout = (workout: string) => {
    let newAvoid: string[];
    
    if (formData.avoid_workout_types.includes(workout)) {
      newAvoid = formData.avoid_workout_types.filter(w => w !== workout);
    } else {
      newAvoid = [...formData.avoid_workout_types, workout];
      
      // Remove from preferred list if it's there
      if (formData.preferred_workout_types.includes(workout)) {
        handleChange(
          "preferred_workout_types", 
          formData.preferred_workout_types.filter(w => w !== workout)
        );
      }
    }
    
    handleChange("avoid_workout_types", newAvoid);
  };

  // Toggle cross-training activity
  const toggleCrossTraining = (activity: string) => {
    let newActivities: string[];
    
    if (formData.cross_training_activities.includes(activity)) {
      newActivities = formData.cross_training_activities.filter(a => a !== activity);
    } else {
      newActivities = [...formData.cross_training_activities, activity];
    }
    
    handleChange("cross_training_activities", newActivities);
  };

  // Track required field status
  const isFormValid = () => {
    return (
      formData.preferred_workout_types.length > 0 &&
      formData.cross_training_days !== undefined &&
      formData.rest_days !== undefined
    );
  };

  // Mutation for saving training preferences
  const savePreferencesMutation = useMutation({
    mutationFn: async (data: TrainingPreferencesData) => {
      const res = await apiRequest("POST", "/api/onboarding/training-preferences", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Training preferences saved",
        description: "Your training preferences have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/training-preferences"] });
      onUpdateData(data);
      onNext();
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving training preferences",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = () => {
    if (isFormValid()) {
      savePreferencesMutation.mutate(formData);
    } else {
      toast({
        title: "Please complete all required fields",
        description: "Some required information is missing.",
        variant: "destructive",
      });
    }
  };

  // When the component mounts, update parent component with initial data
  useEffect(() => {
    if (initialData) {
      onUpdateData(initialData);
    }
  }, [initialData, onUpdateData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Training Preferences</h2>
        <p className="text-muted-foreground">
          Customize your training plan to match your preferences and availability.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Preferred Workout Types</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Select workouts you enjoy and want to include in your training plan.
          </p>
          
          <ScrollArea className="h-[160px] rounded-md border p-4">
            <div className="grid grid-cols-2 gap-2">
              {workoutTypes.map((workout) => (
                <div key={workout.value} className="flex items-start space-x-2">
                  <Checkbox 
                    id={`prefer-${workout.value}`} 
                    checked={formData.preferred_workout_types.includes(workout.value)}
                    onCheckedChange={() => togglePreferredWorkout(workout.value)}
                  />
                  <label
                    htmlFor={`prefer-${workout.value}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {workout.label}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Workouts to Avoid</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Select workouts you prefer to avoid or have difficulty with.
          </p>
          
          <ScrollArea className="h-[160px] rounded-md border p-4">
            <div className="grid grid-cols-2 gap-2">
              {workoutTypes.map((workout) => (
                <div key={workout.value} className="flex items-start space-x-2">
                  <Checkbox 
                    id={`avoid-${workout.value}`} 
                    checked={formData.avoid_workout_types.includes(workout.value)}
                    onCheckedChange={() => toggleAvoidWorkout(workout.value)}
                  />
                  <label
                    htmlFor={`avoid-${workout.value}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {workout.label}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-medium mb-2">Cross-Training Activities</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Select cross-training activities you enjoy or have access to.
          </p>
          
          <ScrollArea className="h-[160px] rounded-md border p-4">
            <div className="grid grid-cols-2 gap-2">
              {crossTrainingTypes.map((activity) => (
                <div key={activity.value} className="flex items-start space-x-2">
                  <Checkbox 
                    id={`activity-${activity.value}`} 
                    checked={formData.cross_training_activities.includes(activity.value)}
                    onCheckedChange={() => toggleCrossTraining(activity.value)}
                  />
                  <label
                    htmlFor={`activity-${activity.value}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {activity.label}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-4 flex flex-col items-center">
            <Calendar className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium text-center mb-1">Cross-Training Days</h3>
            <p className="text-xs text-muted-foreground text-center mb-4">
              Days per week for cross-training
            </p>
            <Select 
              value={formData.cross_training_days?.toString()}
              onValueChange={(value) => handleChange("cross_training_days", parseInt(value, 10))}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Days" />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <SelectItem key={`cross-${day}`} value={day.toString()}>
                    {day} day{day !== 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
          
          <Card className="p-4 flex flex-col items-center">
            <Calendar className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium text-center mb-1">Rest Days</h3>
            <p className="text-xs text-muted-foreground text-center mb-4">
              Complete rest days per week
            </p>
            <Select 
              value={formData.rest_days?.toString()}
              onValueChange={(value) => handleChange("rest_days", parseInt(value, 10))}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Days" />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <SelectItem key={`rest-${day}`} value={day.toString()}>
                    {day} day{day !== 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
          
          <Card className="p-4 flex flex-col items-center">
            <Clock className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium text-center mb-1">Max Workout Duration</h3>
            <p className="text-xs text-muted-foreground text-center mb-4">
              Maximum time for a single workout
            </p>
            <Select 
              value={formData.max_workout_duration?.toString()}
              onValueChange={(value) => handleChange("max_workout_duration", parseInt(value, 10))}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Minutes" />
              </SelectTrigger>
              <SelectContent>
                {[30, 45, 60, 75, 90, 120, 150, 180, 240].map((minutes) => (
                  <SelectItem key={minutes} value={minutes.toString()}>
                    {minutes} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        </div>
      </div>


    </div>
  );
}