import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";

// Define the form schema for preferences
const nutritionPreferencesSchema = z.object({
  user_id: z.number(),
  dietary_type: z.string().optional(),
  calorie_goal: z.coerce.number().min(1000, "Calorie goal must be at least 1000").max(8000, "Calorie goal must be less than 8000").optional(),
  protein_goal: z.coerce.number().min(10, "Protein must be at least 10%").max(60, "Protein must be less than 60%").optional(),
  carbs_goal: z.coerce.number().min(10, "Carbs must be at least 10%").max(80, "Carbs must be less than 80%").optional(),
  fat_goal: z.coerce.number().min(10, "Fat must be at least 10%").max(60, "Fat must be less than 60%").optional(),
  favorite_foods: z.string().optional(),
  disliked_foods: z.string().optional(),
  allergies: z.string().optional(),
  dietary_restrictions: z.string().optional(),
  meal_frequency: z.coerce.number().min(2, "Meal frequency must be at least 2").max(8, "Meal frequency must be less than 8").optional(),
  notes: z.string().optional(),
});

type PreferenceFormValues = z.infer<typeof nutritionPreferencesSchema>;

interface NutritionPreferencesProps {
  existingPreferences: any;
  userId: number;
  onSaved: () => void;
}

export default function NutritionPreferences({ existingPreferences, userId, onSaved }: NutritionPreferencesProps) {
  const { toast } = useToast();
  const [favoritesList, setFavoritesList] = useState<string[]>([]);
  const [dislikedList, setDislikedList] = useState<string[]>([]);
  const [allergiesList, setAllergiesList] = useState<string[]>([]);
  const [restrictionsList, setRestrictionsList] = useState<string[]>([]);
  const [newFavorite, setNewFavorite] = useState("");
  const [newDisliked, setNewDisliked] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const [newRestriction, setNewRestriction] = useState("");

  const form = useForm<PreferenceFormValues>({
    resolver: zodResolver(nutritionPreferencesSchema),
    defaultValues: {
      user_id: userId,
      dietary_type: existingPreferences?.dietary_type || "balanced",
      calorie_goal: existingPreferences?.calorie_goal || 2000,
      protein_goal: existingPreferences?.protein_goal || 30,
      carbs_goal: existingPreferences?.carbs_goal || 45,
      fat_goal: existingPreferences?.fat_goal || 25,
      meal_frequency: existingPreferences?.meal_frequency || 3,
      notes: existingPreferences?.notes || "",
    },
  });

  // Initialize food lists if there are existing preferences
  useEffect(() => {
    if (existingPreferences) {
      if (existingPreferences.favorite_foods) {
        setFavoritesList(existingPreferences.favorite_foods.split(",").map((item: string) => item.trim()));
      }
      if (existingPreferences.disliked_foods) {
        setDislikedList(existingPreferences.disliked_foods.split(",").map((item: string) => item.trim()));
      }
      if (existingPreferences.allergies) {
        setAllergiesList(existingPreferences.allergies.split(",").map((item: string) => item.trim()));
      }
      if (existingPreferences.dietary_restrictions) {
        setRestrictionsList(existingPreferences.dietary_restrictions.split(",").map((item: string) => item.trim()));
      }
    }
  }, [existingPreferences]);

  const saveMutation = useMutation({
    mutationFn: async (data: PreferenceFormValues) => {
      // Combine lists back into comma-separated strings
      data.favorite_foods = favoritesList.join(", ");
      data.disliked_foods = dislikedList.join(", ");
      data.allergies = allergiesList.join(", ");
      data.dietary_restrictions = restrictionsList.join(", ");

      const response = await apiRequest("POST", "/api/nutrition/preferences", data);
      return await response.json();
    },
    onSuccess: () => {
      onSaved();
    },
    onError: (error: any) => {
      toast({
        title: "Error Saving Preferences",
        description: error.message || "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const dietaryTypes = [
    { value: "balanced", label: "Balanced" },
    { value: "high_protein", label: "High Protein" },
    { value: "low_carb", label: "Low Carb" },
    { value: "high_carb", label: "High Carb" },
    { value: "low_fat", label: "Low Fat" },
    { value: "keto", label: "Ketogenic" },
    { value: "paleo", label: "Paleo" },
    { value: "vegetarian", label: "Vegetarian" },
    { value: "vegan", label: "Vegan" },
    { value: "mediterranean", label: "Mediterranean" },
  ];

  const addToList = (item: string, list: string[], setList: (items: string[]) => void, setNewItem: (value: string) => void) => {
    if (!item.trim()) return;
    if (!list.includes(item.trim())) {
      setList([...list, item.trim()]);
      setNewItem("");
    }
  };

  const removeFromList = (item: string, list: string[], setList: (items: string[]) => void) => {
    setList(list.filter((i) => i !== item));
  };

  const onSubmit = (data: PreferenceFormValues) => {
    saveMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nutrition Preferences</CardTitle>
        <CardDescription>
          Customize your nutritional preferences and dietary requirements
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="dietary_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dietary Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a dietary type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dietaryTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Your primary dietary approach
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meal_frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meals Per Day</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={2}
                        max={8}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      How many meals you typically eat per day
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="calorie_goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Calorie Goal</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1000}
                        max={8000}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Target calories per day
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="protein_goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protein (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={10}
                        max={60}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Percentage of calories from protein
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
                    <FormLabel>Carbs (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={10}
                        max={80}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Percentage of calories from carbs
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
                    <FormLabel>Fat (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={10}
                        max={60}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Percentage of calories from fat
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormItem>
                <FormLabel>Favorite Foods</FormLabel>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newFavorite}
                    onChange={(e) => setNewFavorite(e.target.value)}
                    placeholder="Add a favorite food"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => addToList(newFavorite, favoritesList, setFavoritesList, setNewFavorite)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {favoritesList.map((item) => (
                    <Badge key={item} variant="secondary" className="flex items-center gap-1">
                      {item}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeFromList(item, favoritesList, setFavoritesList)}
                      />
                    </Badge>
                  ))}
                </div>
                <FormDescription>
                  Foods you particularly enjoy
                </FormDescription>
              </FormItem>

              <FormItem>
                <FormLabel>Disliked Foods</FormLabel>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newDisliked}
                    onChange={(e) => setNewDisliked(e.target.value)}
                    placeholder="Add a disliked food"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => addToList(newDisliked, dislikedList, setDislikedList, setNewDisliked)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dislikedList.map((item) => (
                    <Badge key={item} variant="secondary" className="flex items-center gap-1">
                      {item}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeFromList(item, dislikedList, setDislikedList)}
                      />
                    </Badge>
                  ))}
                </div>
                <FormDescription>
                  Foods you prefer to avoid
                </FormDescription>
              </FormItem>

              <FormItem>
                <FormLabel>Allergies</FormLabel>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    placeholder="Add an allergy"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => addToList(newAllergy, allergiesList, setAllergiesList, setNewAllergy)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allergiesList.map((item) => (
                    <Badge key={item} variant="secondary" className="flex items-center gap-1">
                      {item}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeFromList(item, allergiesList, setAllergiesList)}
                      />
                    </Badge>
                  ))}
                </div>
                <FormDescription>
                  Foods you're allergic to
                </FormDescription>
              </FormItem>

              <FormItem>
                <FormLabel>Dietary Restrictions</FormLabel>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newRestriction}
                    onChange={(e) => setNewRestriction(e.target.value)}
                    placeholder="Add a dietary restriction"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => addToList(newRestriction, restrictionsList, setRestrictionsList, setNewRestriction)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {restrictionsList.map((item) => (
                    <Badge key={item} variant="secondary" className="flex items-center gap-1">
                      {item}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeFromList(item, restrictionsList, setRestrictionsList)}
                      />
                    </Badge>
                  ))}
                </div>
                <FormDescription>
                  E.g., gluten-free, dairy-free, no processed foods
                </FormDescription>
              </FormItem>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any other dietary information we should know about"
                        className="resize-none h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Other relevant nutrition information
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <CardFooter className="flex justify-end px-0 pt-4">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}