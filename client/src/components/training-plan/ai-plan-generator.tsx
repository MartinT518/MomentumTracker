import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { BrainCircuit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateTrainingPlan, TrainingPlan } from "@/lib/ai-service";
import { useAuth } from "@/hooks/use-auth";

// Form schema
const formSchema = z.object({
  goal: z.string().min(1, { message: "Please select a goal" }),
  raceDistance: z.string().optional(),
  currentFitness: z.string().min(1, { message: "Please select your current fitness level" }),
  weeksToTrain: z.string().transform(val => parseInt(val, 10)),
  daysPerWeek: z.string().transform(val => parseInt(val, 10)),
  preferences: z.string().optional(),
  includeStrengthTraining: z.boolean().default(false),
  preferredTerrains: z.array(z.string()).optional(),
  injuries: z.string().optional(),
  recentRaceTime: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AIPlanGeneratorProps {
  onPlanGenerated: (plan: TrainingPlan) => void;
}

export function AIPlanGenerator({ onPlanGenerated }: AIPlanGeneratorProps) {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formData, setFormData] = useState<FormValues | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Check if user has active subscription
  const hasSubscription = user?.subscription_status === 'active';
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goal: "",
      raceDistance: "",
      currentFitness: "",
      weeksToTrain: "8",
      daysPerWeek: "4",
      preferences: "",
      includeStrengthTraining: false,
      preferredTerrains: [],
      injuries: "",
      recentRaceTime: "",
    },
  });
  
  const nextStep = () => {
    if (step === 1) {
      const goal = form.getValues("goal");
      const currentFitness = form.getValues("currentFitness");
      
      if (!goal || !currentFitness) {
        form.trigger(["goal", "currentFitness"]);
        return;
      }
    }
    
    setStep(prev => prev + 1);
  };
  
  const prevStep = () => {
    setStep(prev => prev - 1);
  };
  
  const handleFormSubmit = (data: FormValues) => {
    // Store form data and show confirmation dialog
    setFormData(data);
    setShowConfirmDialog(true);
  };
  
  const onSubmit = async (data: FormValues) => {
    setIsGenerating(true);
    setShowConfirmDialog(false);
    
    try {
      // Call the AI service to generate plan
      const plan = await generateTrainingPlan({
        ...data,
        userType: hasSubscription ? 'premium' : 'free'
      });
      
      toast({
        title: "Training Plan Generated",
        description: "Your personalized training plan has been created successfully",
      });
      
      // Notify parent component that plan has been generated
      onPlanGenerated(plan);
    } catch (error: any) {
      toast({
        title: "Error Generating Plan",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>AI Training Plan Generator</CardTitle>
              <CardDescription>
                Generate a personalized running plan tailored to your goals and preferences
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="goal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What is your primary goal?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your goal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="race">Race a specific distance</SelectItem>
                            <SelectItem value="improve_speed">Improve speed</SelectItem>
                            <SelectItem value="improve_endurance">Improve endurance</SelectItem>
                            <SelectItem value="weight_loss">Weight loss</SelectItem>
                            <SelectItem value="general_fitness">General fitness</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("goal") === "race" && (
                    <FormField
                      control={form.control}
                      name="raceDistance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Which distance are you training for?</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select race distance" />
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="currentFitness"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What is your current fitness level?</FormLabel>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="beginner" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Beginner (just starting out or returning after a long break)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="intermediate" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Intermediate (running consistently for 3-12 months)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="advanced" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Advanced (running consistently for 1+ years)
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("goal") === "race" && (
                    <FormField
                      control={form.control}
                      name="recentRaceTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Recent race time (optional)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="e.g., 25:30 for 5K, 1:50:45 for half marathon" 
                            />
                          </FormControl>
                          <FormDescription>
                            This helps calibrate your training paces more accurately
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
              
              {step === 2 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="weeksToTrain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How many weeks do you want to train?</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select number of weeks" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="4">4 weeks</SelectItem>
                            <SelectItem value="8">8 weeks</SelectItem>
                            <SelectItem value="12">12 weeks</SelectItem>
                            <SelectItem value="16">16 weeks</SelectItem>
                            <SelectItem value="20">20 weeks</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="daysPerWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How many days per week can you train?</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select days per week" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="2">2 days</SelectItem>
                            <SelectItem value="3">3 days</SelectItem>
                            <SelectItem value="4">4 days</SelectItem>
                            <SelectItem value="5">5 days</SelectItem>
                            <SelectItem value="6">6 days</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="includeStrengthTraining"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Include strength training</FormLabel>
                          <FormDescription>
                            Add complementary strength workouts to your running plan
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
                  
                  <FormField
                    control={form.control}
                    name="injuries"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Any current injuries or limitations? (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="e.g., recovering from knee pain, limited ankle mobility, etc."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {step === 3 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="preferences"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Any specific preferences for your plan? (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="e.g., prefer morning runs, want to include trail running, need one long run per week, etc."
                          />
                        </FormControl>
                        <FormDescription>
                          Share any preferences or special requests you have for your training plan
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {!hasSubscription && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                      <p className="font-medium text-yellow-800 mb-1">Free Plan Limitations</p>
                      <p className="text-yellow-700">
                        Free users will receive a detailed first week of training plus a brief overview of subsequent weeks. 
                        Upgrade to premium for the complete training plan with detailed workouts for all weeks.
                      </p>
                    </div>
                  )}
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Plan Summary</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Goal:</span>
                        <span className="font-medium">{
                          form.watch("goal") === "race" 
                            ? `Race (${form.watch("raceDistance")})` 
                            : form.watch("goal")?.replace("_", " ")
                        }</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Fitness level:</span>
                        <span className="font-medium">{form.watch("currentFitness")}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Training period:</span>
                        <span className="font-medium">{form.watch("weeksToTrain")} weeks</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Days per week:</span>
                        <span className="font-medium">{form.watch("daysPerWeek")} days</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Strength training:</span>
                        <span className="font-medium">{form.watch("includeStrengthTraining") ? "Yes" : "No"}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={prevStep}>
              Previous
            </Button>
          ) : (
            <div></div>
          )}
          
          {step < 3 ? (
            <Button onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button 
              onClick={() => handleFormSubmit(form.getValues())}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                "Generate Training Plan"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace Current Training Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to generate a new training plan? Your current plan will be replaced with the new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => formData && onSubmit(formData)}
            >
              Generate New Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}