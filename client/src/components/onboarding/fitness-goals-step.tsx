import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

type FitnessGoalsStepProps = {
  onNext: () => void;
  onPrevious: () => void;
  onUpdateData: (data: any) => void;
  initialData: any;
};

// Types for our form data
interface FitnessGoalsData {
  primary_goal: string;
  goal_event_type?: string;
  goal_distance?: number;
  goal_time?: string;
  goal_date?: string;
  has_target_race: boolean;
  weight_goal?: "maintain" | "lose" | "gain";
  target_weight?: number;
  current_weight?: number;
}

export default function FitnessGoalsStep({ 
  onNext, 
  onPrevious,
  onUpdateData,
  initialData 
}: FitnessGoalsStepProps) {
  const { toast } = useToast();

  // Initialize form data with either initial data or defaults
  const [formData, setFormData] = useState<FitnessGoalsData>(
    initialData || {
      primary_goal: "improve_fitness",
      has_target_race: false,
      weight_goal: "maintain"
    }
  );

  // Event handlers for form updates
  const handleChange = (field: keyof FitnessGoalsData, value: any) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    onUpdateData(updatedData);
  };

  // Track required field status
  const isFormValid = () => {
    // Primary goal is always required
    if (!formData.primary_goal) return false;
    
    // Validate race-specific fields if user has a target race
    if (formData.has_target_race) {
      return !!(formData.goal_event_type && formData.goal_distance && formData.goal_date);
    }
    
    return true;
  };

  // Mutation for saving fitness goals
  const saveFitnessGoalsMutation = useMutation({
    mutationFn: async (data: FitnessGoalsData) => {
      const res = await apiRequest("POST", "/api/onboarding/fitness-goals", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Fitness goals saved",
        description: "Your fitness goals have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/fitness-goals"] });
      onUpdateData(data);
      onNext();
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving fitness goals",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Separate mutation for saving draft without navigating
  const saveDraftMutation = useMutation({
    mutationFn: async (data: FitnessGoalsData) => {
      // Save both to the main API and as a draft for summary
      const [mainRes] = await Promise.all([
        apiRequest("POST", "/api/onboarding/fitness-goals", data),
        apiRequest("POST", "/api/onboarding/drafts/fitness-goals", data)
      ]);
      return await mainRes.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Draft saved",
        description: "Your progress has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/fitness-goals"] });
      onUpdateData(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving draft",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = () => {
    if (isFormValid()) {
      saveFitnessGoalsMutation.mutate(formData);
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
        <h2 className="text-2xl font-bold">Set Your Fitness Goals</h2>
        <p className="text-muted-foreground">
          Tell us what you want to achieve so we can create a personalized plan for you.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">What is your primary fitness goal?</h3>
          <RadioGroup
            value={formData.primary_goal}
            onValueChange={(value) => handleChange("primary_goal", value)}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Label
              htmlFor="improve_fitness"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="improve_fitness" id="improve_fitness" className="sr-only" />
              <span className="text-center">Improve Overall Fitness</span>
            </Label>
            <Label
              htmlFor="lose_weight"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="lose_weight" id="lose_weight" className="sr-only" />
              <span className="text-center">Lose Weight / Improve Body Composition</span>
            </Label>
            <Label
              htmlFor="train_for_race"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="train_for_race" id="train_for_race" className="sr-only" />
              <span className="text-center">Train for a Race or Event</span>
            </Label>
            <Label
              htmlFor="improve_speed"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="improve_speed" id="improve_speed" className="sr-only" />
              <span className="text-center">Improve Speed/Performance</span>
            </Label>
            <Label
              htmlFor="build_consistency"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="build_consistency" id="build_consistency" className="sr-only" />
              <span className="text-center">Build Consistency/Habit</span>
            </Label>
            <Label
              htmlFor="injury_recovery"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="injury_recovery" id="injury_recovery" className="sr-only" />
              <span className="text-center">Injury Prevention/Recovery</span>
            </Label>
          </RadioGroup>
        </div>

        <Separator className="my-4" />

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Are you training for a specific race or event?</h3>
            <Switch
              checked={formData.has_target_race}
              onCheckedChange={(checked) => handleChange("has_target_race", checked)}
            />
          </div>

          {formData.has_target_race && (
            <Card className="p-4 mt-2 space-y-4">
              <div>
                <Label htmlFor="event_type" className="mb-1 block">Event Type</Label>
                <RadioGroup
                  value={formData.goal_event_type}
                  onValueChange={(value) => handleChange("goal_event_type", value)}
                  className="grid grid-cols-2 md:grid-cols-4 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="5k" id="5k" />
                    <Label htmlFor="5k">5K</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="10k" id="10k" />
                    <Label htmlFor="10k">10K</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="half_marathon" id="half_marathon" />
                    <Label htmlFor="half_marathon">Half Marathon</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="marathon" id="marathon" />
                    <Label htmlFor="marathon">Marathon</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="trail_run" id="trail_run" />
                    <Label htmlFor="trail_run">Trail Run</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ultra" id="ultra" />
                    <Label htmlFor="ultra">Ultra</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="triathlon" id="triathlon" />
                    <Label htmlFor="triathlon">Triathlon</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">Other</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.goal_event_type === "other" && (
                <div>
                  <Label htmlFor="distance" className="mb-1 block">Distance (in kilometers)</Label>
                  <Input
                    id="distance"
                    type="number"
                    min="0"
                    placeholder="Enter distance"
                    value={formData.goal_distance || ""}
                    onChange={(e) => handleChange("goal_distance", parseFloat(e.target.value))}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="goal_time" className="mb-1 block">Target Finish Time (Optional)</Label>
                <Input
                  id="goal_time"
                  type="text"
                  placeholder="e.g. 3:45:00"
                  value={formData.goal_time || ""}
                  onChange={(e) => handleChange("goal_time", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="goal_date" className="mb-1 block">Event Date</Label>
                <Input
                  id="goal_date"
                  type="date"
                  value={formData.goal_date || ""}
                  onChange={(e) => handleChange("goal_date", e.target.value)}
                />
              </div>
            </Card>
          )}
        </div>

        <Separator className="my-4" />

        <div>
          <h3 className="text-lg font-medium mb-2">Weight Management Goals</h3>
          <div className="space-y-4">
            <RadioGroup
              value={formData.weight_goal}
              onValueChange={(value: "maintain" | "lose" | "gain") => handleChange("weight_goal", value)}
              className="grid grid-cols-3 gap-4"
            >
              <Label
                htmlFor="maintain"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <RadioGroupItem value="maintain" id="maintain" className="sr-only" />
                <span className="text-center">Maintain Weight</span>
              </Label>
              <Label
                htmlFor="lose"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <RadioGroupItem value="lose" id="lose" className="sr-only" />
                <span className="text-center">Lose Weight</span>
              </Label>
              <Label
                htmlFor="gain"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <RadioGroupItem value="gain" id="gain" className="sr-only" />
                <span className="text-center">Gain Weight</span>
              </Label>
            </RadioGroup>

            {formData.weight_goal !== "maintain" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="current_weight" className="mb-1 block">Current Weight (kg)</Label>
                  <Input
                    id="current_weight"
                    type="number"
                    min="30"
                    max="200"
                    placeholder="Current weight in kg"
                    value={formData.current_weight || ""}
                    onChange={(e) => handleChange("current_weight", parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="target_weight" className="mb-1 block">Target Weight (kg)</Label>
                  <Input
                    id="target_weight"
                    type="number"
                    min="30"
                    max="200"
                    placeholder="Target weight in kg"
                    value={formData.target_weight || ""}
                    onChange={(e) => handleChange("target_weight", parseFloat(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}