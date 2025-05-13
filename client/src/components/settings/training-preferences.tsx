import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Loader2, RotateCw, Save } from "lucide-react";

// Form data interface
interface TrainingPreferencesFormData {
  currentLevel: string;
  weeklyMileage: string;
  longRunDistance: string;
  daysPerWeek: string;
  preferredDays: string[];
  preferredTime: string;
  longRunDay: string;
  goalType: string;
  goalDistance: string;
  targetRaceDate: string;
  crossTraining: boolean;
  crossTrainingActivities: string[];
  preferredWorkoutTypes: string[];
  notes: string;
}

// Cross training types
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
  { value: "hiking", label: "Hiking" }
];

// Workout types
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
  { value: "trail_run", label: "Trail Running" }
];

// Days of the week
const daysOfWeek = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" }
];

export function TrainingPreferences() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Initialize form with default values
  const form = useForm<TrainingPreferencesFormData>({
    defaultValues: {
      currentLevel: "",
      weeklyMileage: "",
      longRunDistance: "",
      daysPerWeek: "4",
      preferredDays: [],
      preferredTime: "morning",
      longRunDay: "sunday",
      goalType: "general_fitness",
      goalDistance: "",
      targetRaceDate: "",
      crossTraining: false,
      crossTrainingActivities: [],
      preferredWorkoutTypes: [],
      notes: ""
    }
  });
  
  // Fetch existing preferences data when component mounts
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        // First try to get preferences from training_preferences
        const response = await apiRequest('GET', '/api/onboarding/training-preferences');
        
        if (response.ok) {
          const trainingPrefs: Record<string, any> = await response.json();
          
          // Then get experience data
          const expResponse = await apiRequest('GET', '/api/onboarding/experience');
          let expData: Record<string, any> = {};
          
          if (expResponse.ok) {
            expData = await expResponse.json();
          }
          
          // Then get goals data
          const goalResponse = await apiRequest('GET', '/api/onboarding/fitness-goals');
          let goalData: Record<string, any> = {};
          
          if (goalResponse.ok) {
            goalData = await goalResponse.json();
          }
          
          // Process arrays that might be stored as strings
          let preferredDays = trainingPrefs.preferred_days || [];
          let crossTrainingActivities = trainingPrefs.cross_training_activities || [];
          let preferredWorkoutTypes = trainingPrefs.preferred_workout_types || [];
          
          // Parse JSON strings if needed
          if (typeof preferredDays === 'string') {
            try {
              preferredDays = JSON.parse(preferredDays);
            } catch (e) {
              preferredDays = preferredDays.split(',').map((day: string) => day.trim());
            }
          }
          
          if (typeof crossTrainingActivities === 'string') {
            try {
              crossTrainingActivities = JSON.parse(crossTrainingActivities);
            } catch (e) {
              crossTrainingActivities = crossTrainingActivities.split(',').map((activity: string) => activity.trim());
            }
          }
          
          if (typeof preferredWorkoutTypes === 'string') {
            try {
              preferredWorkoutTypes = JSON.parse(preferredWorkoutTypes);
            } catch (e) {
              preferredWorkoutTypes = preferredWorkoutTypes.split(',').map((type: string) => type.trim());
            }
          }
          
          // Set form values from the combined data
          form.reset({
            currentLevel: expData.current_level || "",
            weeklyMileage: expData.weekly_mileage?.toString() || "",
            longRunDistance: expData.long_run_distance?.toString() || "",
            daysPerWeek: expData.days_per_week?.toString() || "4",
            preferredDays: preferredDays,
            preferredTime: trainingPrefs.preferred_time || "morning",
            longRunDay: trainingPrefs.long_run_day || "sunday",
            goalType: goalData.goal_type || "general_fitness",
            goalDistance: goalData.goal_distance || "",
            targetRaceDate: goalData.target_race_date 
              ? new Date(goalData.target_race_date).toISOString().split('T')[0] 
              : "",
            crossTraining: trainingPrefs.cross_training || false,
            crossTrainingActivities: crossTrainingActivities,
            preferredWorkoutTypes: preferredWorkoutTypes,
            notes: trainingPrefs.notes || ""
          });
        }
      } catch (error) {
        console.error("Error loading training preferences:", error);
        toast({
          title: "Failed to load preferences",
          description: "We couldn't load your training preferences. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPreferences();
  }, [form, toast]);
  
  // Handle form submission
  const onSubmit = async (data: TrainingPreferencesFormData) => {
    try {
      setSaving(true);
      
      // Create the payload for training preferences
      const trainingPrefPayload = {
        cross_training: data.crossTraining,
        rest_days: (7 - parseInt(data.daysPerWeek)).toString(),
        cross_training_activities: data.crossTrainingActivities,
        preferred_days: data.preferredDays,
        preferred_time: data.preferredTime,
        long_run_day: data.longRunDay,
        preferred_workout_types: data.preferredWorkoutTypes,
        notes: data.notes
      };
      
      // Create the payload for experience level
      const experiencePayload = {
        current_level: data.currentLevel,
        weekly_mileage: data.weeklyMileage,
        days_per_week: data.daysPerWeek,
        long_run_distance: data.longRunDistance
      };
      
      // Create the payload for fitness goals
      const goalsPayload = {
        goal_type: data.goalType,
        goal_distance: data.goalDistance,
        target_race_date: data.targetRaceDate
      };
      
      // Update training preferences
      await apiRequest('PUT', '/api/onboarding/update-preferences', {
        training_preferences: trainingPrefPayload,
        experience: experiencePayload,
        fitness_goals: goalsPayload
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/training-preferences'] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/experience'] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/fitness-goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/status'] });
      
      toast({
        title: "Preferences updated",
        description: "Your training preferences have been saved.",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Failed to save",
        description: "We couldn't save your training preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Running Profile & Training Preferences</CardTitle>
        <CardDescription>Update your running preferences to get more accurate training plans</CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Experience & Fitness Level</h3>
              <p className="text-sm text-muted-foreground mb-4">Tell us about your current running experience</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current running level */}
                <FormField
                  control={form.control}
                  name="currentLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current running level</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="elite">Elite</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                {/* Weekly mileage */}
                <FormField
                  control={form.control}
                  name="weeklyMileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current weekly mileage</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" placeholder="e.g. 20-25 miles" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {/* Days per week */}
                <FormField
                  control={form.control}
                  name="daysPerWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training days per week</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select days" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="4">4 days</SelectItem>
                          <SelectItem value="5">5 days</SelectItem>
                          <SelectItem value="6">6 days</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                {/* Long run distance */}
                <FormField
                  control={form.control}
                  name="longRunDistance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typical long run distance</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" placeholder="e.g. 8 miles" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium">Training Preferences</h3>
              <p className="text-sm text-muted-foreground mb-4">Customize how your training plans are structured</p>
              
              <div className="space-y-4">
                {/* Preferred days */}
                <FormField
                  control={form.control}
                  name="preferredDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred running days</FormLabel>
                      <div className="flex flex-wrap gap-4 mt-2">
                        {daysOfWeek.map((day) => (
                          <FormItem
                            key={day.value}
                            className="flex flex-row items-start space-x-2 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(day.value)}
                                onCheckedChange={(checked) => {
                                  const updatedValue = checked
                                    ? [...field.value, day.value]
                                    : field.value?.filter((val) => val !== day.value);
                                  field.onChange(updatedValue);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {day.label}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
                
                {/* Preferred time */}
                <FormField
                  control={form.control}
                  name="preferredTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred time of day</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="morning">Morning</SelectItem>
                          <SelectItem value="afternoon">Afternoon</SelectItem>
                          <SelectItem value="evening">Evening</SelectItem>
                          <SelectItem value="varies">Varies/Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                {/* Long run day */}
                <FormField
                  control={form.control}
                  name="longRunDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred long run day</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {daysOfWeek.map(day => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                {/* Cross training */}
                <FormField
                  control={form.control}
                  name="crossTraining"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Include cross training
                        </FormLabel>
                        <FormDescription>
                          Add non-running activities to your plan
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {/* Cross training activities (conditional) */}
                {form.watch("crossTraining") && (
                  <FormField
                    control={form.control}
                    name="crossTrainingActivities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cross training activities</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 mt-2">
                          {crossTrainingTypes.map((activity) => (
                            <FormItem
                              key={activity.value}
                              className="flex flex-row items-start space-x-2 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(activity.value)}
                                  onCheckedChange={(checked) => {
                                    const updatedValue = checked
                                      ? [...field.value, activity.value]
                                      : field.value?.filter((val) => val !== activity.value);
                                    field.onChange(updatedValue);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {activity.label}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Preferred workout types */}
                <FormField
                  control={form.control}
                  name="preferredWorkoutTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred workout types</FormLabel>
                      <FormDescription>
                        Select the types of workouts you enjoy and want to include in your training
                      </FormDescription>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 mt-2">
                        {workoutTypes.map((type) => (
                          <FormItem
                            key={type.value}
                            className="flex flex-row items-start space-x-2 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(type.value)}
                                onCheckedChange={(checked) => {
                                  const updatedValue = checked
                                    ? [...field.value, type.value]
                                    : field.value?.filter((val) => val !== type.value);
                                  field.onChange(updatedValue);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {type.label}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium">Goals</h3>
              <p className="text-sm text-muted-foreground mb-4">Set your running goals for better training recommendations</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Goal type */}
                <FormField
                  control={form.control}
                  name="goalType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary goal</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your goal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general_fitness">General fitness</SelectItem>
                          <SelectItem value="lose_weight">Weight loss</SelectItem>
                          <SelectItem value="race">Race preparation</SelectItem>
                          <SelectItem value="speed">Improve speed</SelectItem>
                          <SelectItem value="endurance">Build endurance</SelectItem>
                          <SelectItem value="injury_recovery">Recovery from injury</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                {/* Race distance (conditional) */}
                {form.watch("goalType") === "race" && (
                  <FormField
                    control={form.control}
                    name="goalDistance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Race distance</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select distance" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="5k">5K</SelectItem>
                            <SelectItem value="10k">10K</SelectItem>
                            <SelectItem value="half_marathon">Half Marathon</SelectItem>
                            <SelectItem value="marathon">Marathon</SelectItem>
                            <SelectItem value="ultra">Ultra Marathon</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Race date (conditional) */}
                {form.watch("goalType") === "race" && (
                  <FormField
                    control={form.control}
                    name="targetRaceDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Race date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Additional notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional notes</FormLabel>
                  <FormDescription>
                    Any other details that might be relevant for your training plan
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="E.g., specific races, injury concerns, or other preferences"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          
          <CardFooter>
            <Button type="submit" disabled={saving} className="ml-auto">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}