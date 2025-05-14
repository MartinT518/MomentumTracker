import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { getNutritionPreferences, NutritionPreference } from '@/lib/nutrition-ai-service';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

// Define the form schema
const nutritionPreferencesSchema = z.object({
  dietary_restrictions: z.array(z.string()).default([]),
  calorie_goal: z.coerce.number().min(1200).max(5000),
  protein_goal: z.coerce.number().min(50).max(300),
  carbs_goal: z.coerce.number().min(50).max(600),
  fat_goal: z.coerce.number().min(20).max(200),
  meal_count: z.coerce.number().min(3).max(6),
});

type NutritionPreferencesFormValues = z.infer<typeof nutritionPreferencesSchema>;

// Dietary restrictions options
const dietaryRestrictionOptions = [
  { id: 'vegan', label: 'Vegan' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'keto', label: 'Ketogenic' },
  { id: 'paleo', label: 'Paleo' },
  { id: 'gluten', label: 'Gluten-Free' },
  { id: 'lactose', label: 'Lactose-Free' },
  { id: 'nut', label: 'Nut-Free' },
];

export function NutritionPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch existing preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['/api/nutrition/preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return getNutritionPreferences(user.id);
    },
    enabled: !!user?.id,
  });

  // Set up form with default values
  const form = useForm<NutritionPreferencesFormValues>({
    resolver: zodResolver(nutritionPreferencesSchema),
    defaultValues: {
      dietary_restrictions: preferences?.dietary_restrictions || [],
      calorie_goal: preferences?.calorie_goal || 2500,
      protein_goal: preferences?.protein_goal || 150,
      carbs_goal: preferences?.carbs_goal || 300,
      fat_goal: preferences?.fat_goal || 70,
      meal_count: preferences?.meal_count || 4,
    },
  });

  // Update form values when preferences data is loaded
  useState(() => {
    if (preferences) {
      form.reset({
        dietary_restrictions: preferences.dietary_restrictions || [],
        calorie_goal: preferences.calorie_goal || 2500,
        protein_goal: preferences.protein_goal || 150,
        carbs_goal: preferences.carbs_goal || 300,
        fat_goal: preferences.fat_goal || 70,
        meal_count: preferences.meal_count || 4,
      });
    }
  });

  // Mutation to update preferences
  const updatePreferences = useMutation({
    mutationFn: async (data: NutritionPreferencesFormValues) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const response = await apiRequest('POST', '/api/nutrition/preferences', {
        ...data,
        user_id: user.id,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update preferences');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/preferences', user?.id] });
      toast({
        title: 'Preferences Updated',
        description: 'Your nutrition preferences have been saved.',
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: NutritionPreferencesFormValues) => {
    updatePreferences.mutate(data);
  };

  // Helper function to calculate macronutrient percentages
  const calculateMacroPercentages = (formValues: NutritionPreferencesFormValues) => {
    const totalGrams = formValues.protein_goal + formValues.carbs_goal + formValues.fat_goal;
    const proteinPercent = Math.round((formValues.protein_goal / totalGrams) * 100);
    const carbsPercent = Math.round((formValues.carbs_goal / totalGrams) * 100);
    const fatPercent = Math.round((formValues.fat_goal / totalGrams) * 100);
    
    return { proteinPercent, carbsPercent, fatPercent };
  };

  // Get current macro percentages
  const currentValues = form.watch();
  const { proteinPercent, carbsPercent, fatPercent } = calculateMacroPercentages(currentValues);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nutrition Preferences</CardTitle>
        <CardDescription>
          Customize your dietary preferences and nutritional targets
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Dietary Restrictions</h3>
              <div className="flex flex-wrap gap-2">
                {preferences?.dietary_restrictions && preferences.dietary_restrictions.length > 0 ? (
                  preferences.dietary_restrictions.map((restriction) => (
                    <span key={restriction} className="px-2 py-1 bg-muted rounded-full text-sm">
                      {restriction.charAt(0).toUpperCase() + restriction.slice(1)}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">No dietary restrictions</span>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Daily Targets</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground text-sm">Calories:</span>
                  <span className="font-medium ml-2">{preferences?.calorie_goal || 2500} kcal</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Meals per day:</span>
                  <span className="font-medium ml-2">{preferences?.meal_count || 4}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Macronutrient Distribution</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-muted-foreground text-sm">Protein:</span>
                  <span className="font-medium ml-2">{preferences?.protein_goal || 150}g ({proteinPercent}%)</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Carbs:</span>
                  <span className="font-medium ml-2">{preferences?.carbs_goal || 300}g ({carbsPercent}%)</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Fat:</span>
                  <span className="font-medium ml-2">{preferences?.fat_goal || 70}g ({fatPercent}%)</span>
                </div>
              </div>
              
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <div className="flex h-full">
                  <div 
                    className="bg-blue-500 h-full" 
                    style={{ width: `${proteinPercent}%` }}
                  />
                  <div 
                    className="bg-green-500 h-full" 
                    style={{ width: `${carbsPercent}%` }}
                  />
                  <div 
                    className="bg-yellow-500 h-full" 
                    style={{ width: `${fatPercent}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>Protein</span>
                <span>Carbs</span>
                <span>Fat</span>
              </div>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="dietary_restrictions"
                render={() => (
                  <FormItem>
                    <FormLabel>Dietary Restrictions</FormLabel>
                    <div className="grid grid-cols-2 mt-2">
                      {dietaryRestrictionOptions.map((option) => (
                        <FormField
                          key={option.id}
                          control={form.control}
                          name="dietary_restrictions"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={option.id}
                                className="flex flex-row items-center space-x-3 space-y-0 mb-2"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(option.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, option.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== option.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {option.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="calorie_goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calorie Goal (kcal)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Daily calorie target (1200-5000)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="meal_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meals Per Day</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select number of meals" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="3">3 meals</SelectItem>
                          <SelectItem value="4">4 meals</SelectItem>
                          <SelectItem value="5">5 meals</SelectItem>
                          <SelectItem value="6">6 meals</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Number of meals and snacks per day
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="protein_goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protein Goal ({field.value}g - {proteinPercent}%)</FormLabel>
                    <FormControl>
                      <Slider
                        min={50}
                        max={300}
                        step={5}
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      Daily protein target in grams
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="carbs_goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carbohydrate Goal ({field.value}g - {carbsPercent}%)</FormLabel>
                    <FormControl>
                      <Slider
                        min={50}
                        max={600}
                        step={10}
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      Daily carbohydrate target in grams
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fat_goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fat Goal ({field.value}g - {fatPercent}%)</FormLabel>
                    <FormControl>
                      <Slider
                        min={20}
                        max={200}
                        step={5}
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      Daily fat target in grams
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="flex h-full">
                  <div 
                    className="bg-blue-500 h-full" 
                    style={{ width: `${proteinPercent}%` }}
                  />
                  <div 
                    className="bg-green-500 h-full" 
                    style={{ width: `${carbsPercent}%` }}
                  />
                  <div 
                    className="bg-yellow-500 h-full" 
                    style={{ width: `${fatPercent}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>Protein</span>
                <span>Carbs</span>
                <span>Fat</span>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit Preferences</Button>
        ) : (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={updatePreferences.isPending}
            >
              {updatePreferences.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}