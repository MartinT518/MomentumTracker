import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ExperienceStepProps = {
  onNext: () => void;
  onPrevious: () => void;
  onUpdateData: (data: any) => void;
  initialData: any;
};

// Types for our form data
interface ExperienceData {
  experience_level: string;
  years_running: number;
  weekly_activity_days: number;
  weekly_running_days: number;
  typical_run_distance: number;
  longest_run_last_month: number;
  recent_injuries: string[];
  injury_details?: string;
  current_training_intensity: number;
}

const experienceLevels = [
  { value: "beginner", label: "Beginner", description: "New to running or just started in the last 3 months" },
  { value: "intermediate", label: "Intermediate", description: "Running consistently for 3 months to 2 years" },
  { value: "advanced", label: "Advanced", description: "Regular runner for 2+ years with race experience" },
  { value: "elite", label: "Elite/Competitive", description: "Competitive runner with significant race experience" },
];

const commonInjuries = [
  "runner's_knee", "shin_splints", "achilles_tendinitis", "plantar_fasciitis", 
  "it_band_syndrome", "stress_fracture", "ankle_sprain", "hamstring_strain", "none"
];

const injuryLabels: Record<string, string> = {
  "runner's_knee": "Runner's Knee",
  "shin_splints": "Shin Splints",
  "achilles_tendinitis": "Achilles Tendinitis",
  "plantar_fasciitis": "Plantar Fasciitis",
  "it_band_syndrome": "IT Band Syndrome",
  "stress_fracture": "Stress Fracture",
  "ankle_sprain": "Ankle Sprain",
  "hamstring_strain": "Hamstring Strain",
  "none": "No recent injuries"
};

export default function ExperienceStep({ 
  onNext, 
  onPrevious,
  onUpdateData,
  initialData 
}: ExperienceStepProps) {
  const { toast } = useToast();

  // Initialize form data with either initial data or defaults
  const [formData, setFormData] = useState<ExperienceData>(
    initialData || {
      experience_level: "beginner",
      years_running: 0,
      weekly_activity_days: 3,
      weekly_running_days: 3,
      typical_run_distance: 5,
      longest_run_last_month: 5,
      recent_injuries: ["none"],
      injury_details: "",
      current_training_intensity: 5
    }
  );

  // Event handlers for form updates
  const handleChange = (field: keyof ExperienceData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Special handler for the injuries array
  const handleInjuryToggle = (injury: string) => {
    let newInjuries: string[];
    
    // Special case for "none" - it should be exclusive
    if (injury === "none") {
      newInjuries = formData.recent_injuries.includes("none") ? [] : ["none"];
    } else {
      // If adding a specific injury, make sure to remove "none" if it's selected
      newInjuries = formData.recent_injuries.filter(i => i !== "none");
      
      // Toggle the selected injury
      if (newInjuries.includes(injury)) {
        newInjuries = newInjuries.filter(i => i !== injury);
      } else {
        newInjuries = [...newInjuries, injury];
      }
      
      // If no injuries selected, default to "none"
      if (newInjuries.length === 0) {
        newInjuries = ["none"];
      }
    }
    
    handleChange("recent_injuries", newInjuries);
  };

  // Track required field status
  const isFormValid = () => {
    const required = [
      "experience_level",
      "weekly_activity_days",
      "weekly_running_days",
      "typical_run_distance",
      "recent_injuries"
    ];
    
    return required.every(field => 
      formData[field as keyof ExperienceData] !== undefined && 
      formData[field as keyof ExperienceData] !== null
    );
  };

  // Mutation for saving experience data
  const saveExperienceMutation = useMutation({
    mutationFn: async (data: ExperienceData) => {
      const res = await apiRequest("POST", "/api/onboarding/user-experience", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Experience saved",
        description: "Your running experience has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/user-experience"] });
      onUpdateData(data);
      onNext();
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = () => {
    if (isFormValid()) {
      saveExperienceMutation.mutate(formData);
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
        <h2 className="text-2xl font-bold">Your Running Experience</h2>
        <p className="text-muted-foreground">
          Tell us about your running experience and current fitness level.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3">How would you describe your running experience?</h3>
          <RadioGroup
            value={formData.experience_level}
            onValueChange={(value) => handleChange("experience_level", value)}
            className="grid grid-cols-1 gap-3"
          >
            {experienceLevels.map((level) => (
              <Label
                key={level.value}
                htmlFor={level.value}
                className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <RadioGroupItem value={level.value} id={level.value} className="sr-only" />
                <div className="space-y-0.5">
                  <p className="font-medium">{level.label}</p>
                  <p className="text-sm text-muted-foreground">{level.description}</p>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="years_running" className="mb-1 block">Years of running experience</Label>
            <Input
              id="years_running"
              type="number"
              min="0"
              max="50"
              placeholder="Years running"
              value={formData.years_running || ""}
              onChange={(e) => handleChange("years_running", parseInt(e.target.value, 10))}
            />
          </div>
          <div>
            <Label htmlFor="longest_run" className="mb-1 block">Longest run in the last month (km)</Label>
            <Input
              id="longest_run"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="Distance in km"
              value={formData.longest_run_last_month || ""}
              onChange={(e) => handleChange("longest_run_last_month", parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="mb-2 block">Days of physical activity per week</Label>
            <Select 
              value={formData.weekly_activity_days?.toString()}
              onValueChange={(value) => handleChange("weekly_activity_days", parseInt(value, 10))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select days" />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day} day{day !== 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="mb-2 block">Days of running per week</Label>
            <Select 
              value={formData.weekly_running_days?.toString()}
              onValueChange={(value) => handleChange("weekly_running_days", parseInt(value, 10))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select days" />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day} day{day !== 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Typical run distance (km)</Label>
          <Select 
            value={formData.typical_run_distance?.toString()}
            onValueChange={(value) => handleChange("typical_run_distance", parseFloat(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select distance" />
            </SelectTrigger>
            <SelectContent>
              {[2, 3, 5, 8, 10, 15, 20, 25, 30].map((distance) => (
                <SelectItem key={distance} value={distance.toString()}>
                  {distance} km
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-medium mb-2">Recent Injuries (in the last 6 months)</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Select any injuries you've experienced recently.
          </p>
          
          <div className="flex flex-wrap gap-2">
            {commonInjuries.map((injury) => {
              const isSelected = formData.recent_injuries?.includes(injury) || false;
              return (
                <Badge 
                  key={injury}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1 text-sm"
                  onClick={() => handleInjuryToggle(injury)}
                >
                  {injuryLabels[injury]}
                </Badge>
              );
            })}
          </div>
          
          {formData.recent_injuries && !formData.recent_injuries.includes("none") && (
            <div className="mt-3">
              <Label htmlFor="injury_details" className="mb-1 block">Injury details (optional)</Label>
              <Input
                id="injury_details"
                placeholder="Brief description of injuries"
                value={formData.injury_details || ""}
                onChange={(e) => handleChange("injury_details", e.target.value)}
              />
            </div>
          )}
        </div>

        <Separator />

        <div>
          <div className="flex justify-between mb-2">
            <Label>Current training intensity</Label>
            <span className="text-muted-foreground">
              {formData.current_training_intensity}/10
            </span>
          </div>
          <Slider
            value={[formData.current_training_intensity || 5]}
            min={1}
            max={10}
            step={1}
            onValueChange={(values) => handleChange("current_training_intensity", values[0])}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Very Light</span>
            <span>Moderate</span>
            <span>Very Intense</span>
          </div>
        </div>
      </div>


    </div>
  );
}