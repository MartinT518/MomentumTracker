import { useState, useEffect } from 'react';
import { Sidebar } from "@/components/common/sidebar";
import { MobileMenu } from "@/components/common/mobile-menu";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dumbbell, Filter, Search, Play, Bookmark, Clock, BarChart3, Heart, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Define exercise categories
type ExerciseCategory = "upper-body" | "lower-body" | "core" | "full-body" | "recovery" | "mobility";
type ExerciseDifficulty = "beginner" | "intermediate" | "advanced";
type ExerciseEquipment = "none" | "minimal" | "standard";

interface Exercise {
  id: number;
  name: string;
  description: string;
  category: ExerciseCategory;
  difficulty: ExerciseDifficulty;
  equipment: ExerciseEquipment;
  muscleGroups: string[];
  duration: string;
  steps: string[];
  tips: string[];
  videoUrl?: string;
  youtubeId?: string;
  imageUrl?: string;
  favorite?: boolean;
}

// Mock exercises data
const exercisesData: Exercise[] = [
  {
    id: 1,
    name: "Bodyweight Squats",
    description: "A fundamental lower body exercise that targets your quadriceps, hamstrings, and glutes.",
    category: "lower-body",
    difficulty: "beginner", 
    equipment: "none",
    muscleGroups: ["Quadriceps", "Hamstrings", "Glutes", "Core"],
    duration: "5-10 minutes",
    youtubeId: "YaXPRqUwItQ",
    steps: [
      "Stand with feet shoulder-width apart",
      "Keep your chest up and back straight",
      "Lower your body by bending your knees as if sitting in a chair",
      "Ensure knees don't extend past your toes",
      "Lower until thighs are parallel to ground (or as far as comfortable)",
      "Push through heels to return to standing position"
    ],
    tips: [
      "Keep weight in heels",
      "Maintain neutral spine throughout movement",
      "For added difficulty, try a slower tempo or pause at the bottom",
      "Beginners can use a chair or bench for guidance"
    ]
  },
  {
    id: 2,
    name: "Push-ups",
    description: "An effective upper body exercise that works your chest, shoulders, triceps, and core.",
    category: "upper-body",
    difficulty: "intermediate",
    equipment: "none",
    muscleGroups: ["Chest", "Shoulders", "Triceps", "Core"],
    duration: "3-8 minutes",
    youtubeId: "IODxDxX7oi4",
    steps: [
      "Start in a plank position with hands slightly wider than shoulders",
      "Keep body in a straight line from head to heels",
      "Lower your body by bending elbows until chest nearly touches the floor",
      "Keep elbows at about 45-degree angle from your body",
      "Push back up to starting position"
    ],
    tips: [
      "Engage core throughout the movement",
      "Don't let hips sag or pike upwards",
      "For easier variation, perform on knees or against a wall",
      "For added difficulty, elevate feet or try diamond push-ups"
    ]
  },
  {
    id: 3,
    name: "Plank",
    description: "A core stabilizing exercise that builds endurance and strength in your abdominals, back, and shoulders.",
    category: "core",
    difficulty: "beginner",
    equipment: "none",
    muscleGroups: ["Abdominals", "Lower Back", "Shoulders"],
    duration: "1-5 minutes",
    youtubeId: "F-nQ_KJgfCY",
    steps: [
      "Start in push-up position with forearms on the ground",
      "Elbows should be directly beneath your shoulders",
      "Keep body in a straight line from head to heels",
      "Engage your core and glutes",
      "Hold the position for desired duration"
    ],
    tips: [
      "Don't hold your breath - breathe normally",
      "Look slightly forward to maintain neutral neck position",
      "For easier variation, keep knees on the ground",
      "For added difficulty, try lifting one limb at a time"
    ]
  },
  {
    id: 4,
    name: "Glute Bridges",
    description: "An excellent exercise for strengthening the posterior chain, especially important for runners.",
    category: "lower-body",
    difficulty: "beginner",
    equipment: "none",
    muscleGroups: ["Glutes", "Lower Back", "Hamstrings"],
    duration: "3-8 minutes",
    youtubeId: "wPM8icPu6H8",
    steps: [
      "Lie on your back with knees bent, feet flat on floor",
      "Place feet hip-width apart, arms at sides",
      "Press through heels to lift hips toward ceiling",
      "Squeeze glutes at the top",
      "Lower hips back to starting position under control"
    ],
    tips: [
      "Ensure knees track in line with toes",
      "Don't overextend at the top - keep movement controlled",
      "For added difficulty, extend one leg straight",
      "Can be performed with a resistance band around knees"
    ]
  },
  {
    id: 5,
    name: "Mountain Climbers",
    description: "A dynamic full-body exercise that builds core strength and cardiovascular fitness.",
    category: "full-body",
    difficulty: "intermediate",
    equipment: "none",
    muscleGroups: ["Core", "Shoulders", "Hip Flexors", "Quads"],
    duration: "2-4 minutes",
    youtubeId: "nmwgirgXLYM",
    steps: [
      "Start in push-up position with arms straight",
      "Keep your body in a straight line from head to heels",
      "Quickly drive one knee toward your chest",
      "Return foot to starting position while simultaneously driving opposite knee forward",
      "Continue alternating in a running motion"
    ],
    tips: [
      "Keep hips down and core engaged",
      "Control the pace to maintain proper form",
      "For easier variation, slow down the movement",
      "For added intensity, increase speed"
    ]
  },
  {
    id: 6,
    name: "Lunges",
    description: "A unilateral lower body exercise that improves balance, coordination, and strength.",
    category: "lower-body",
    difficulty: "intermediate",
    equipment: "none",
    muscleGroups: ["Quadriceps", "Hamstrings", "Glutes", "Calves"],
    duration: "5-10 minutes",
    youtubeId: "3XDriUn0udo",
    steps: [
      "Stand with feet hip-width apart",
      "Step forward with one leg",
      "Lower your body until front thigh is parallel to floor and back knee nearly touches ground",
      "Push through front heel to return to starting position",
      "Repeat with opposite leg"
    ],
    tips: [
      "Keep torso upright and core engaged",
      "Ensure front knee stays in line with foot",
      "For balance issues, perform next to a wall or chair",
      "For added difficulty, try walking lunges or add a twist"
    ]
  },
  {
    id: 7,
    name: "Superman",
    description: "An effective exercise for strengthening the posterior chain and improving posture.",
    category: "core",
    difficulty: "beginner",
    equipment: "none",
    muscleGroups: ["Lower Back", "Glutes", "Upper Back"],
    duration: "3-6 minutes",
    youtubeId: "cc6UVRS7PW4",
    steps: [
      "Lie face down with arms extended overhead",
      "Simultaneously lift arms, chest, and legs off the floor",
      "Keep neck in neutral position (looking down)",
      "Hold briefly at the top",
      "Lower back to starting position under control"
    ],
    tips: [
      "Focus on using back muscles rather than momentum",
      "Don't hyperextend the neck - keep gaze down",
      "For easier variation, lift only arms or only legs",
      "For added difficulty, increase hold time at the top"
    ]
  },
  {
    id: 8,
    name: "Bird Dog",
    description: "A core stabilizing exercise that enhances balance and coordination while strengthening the back.",
    category: "core",
    difficulty: "beginner",
    equipment: "none",
    muscleGroups: ["Core", "Lower Back", "Shoulders", "Glutes"],
    duration: "3-8 minutes",
    youtubeId: "wiFNA3sqjCA",
    steps: [
      "Start on hands and knees in tabletop position",
      "Extend opposite arm and leg simultaneously",
      "Keep back flat and core engaged",
      "Hold briefly at full extension",
      "Return to starting position and repeat on opposite side"
    ],
    tips: [
      "Move slowly with control",
      "Keep hips level throughout the movement",
      "For added difficulty, bring elbow to knee under body before extending",
      "Focus on stability rather than speed"
    ]
  },
  {
    id: 9,
    name: "Calf Raises",
    description: "A simple yet effective exercise for strengthening calf muscles, crucial for runners.",
    category: "lower-body",
    difficulty: "beginner",
    equipment: "none",
    muscleGroups: ["Calves"],
    duration: "2-5 minutes",
    youtubeId: "gwLzBJYoWlI",
    steps: [
      "Stand with feet hip-width apart",
      "Raise heels off the ground by pushing through the balls of your feet",
      "Rise as high as possible",
      "Hold briefly at the top",
      "Lower heels back to the ground under control"
    ],
    tips: [
      "For balance, lightly hold onto a wall or chair",
      "For added difficulty, perform one leg at a time",
      "Perform on a step for increased range of motion",
      "Vary foot position to target different parts of the calf muscle"
    ]
  },
  {
    id: 10,
    name: "Hip Mobility Flow",
    description: "A series of movements designed to improve hip mobility and flexibility, essential for runners.",
    category: "mobility",
    difficulty: "beginner",
    equipment: "none",
    muscleGroups: ["Hip Flexors", "Glutes", "Adductors"],
    duration: "5-10 minutes",
    youtubeId: "NG9qbvAN3gQ",
    steps: [
      "Start with gentle hip circles in both directions",
      "Move to standing hip swings forward and backward",
      "Perform lateral hip swings side to side",
      "Include figure-4 stretch for piriformis",
      "Finish with deep squat holds if comfortable"
    ],
    tips: [
      "Focus on controlled movements rather than forcing range",
      "Breathe deeply throughout the exercises",
      "Perform daily for best results",
      "Can be used as part of a warm-up routine"
    ]
  }
];

export default function StrengthExercisesPage() {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>(exercisesData);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>(exercisesData);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ExerciseCategory | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<ExerciseDifficulty | 'all'>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<ExerciseEquipment | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [savedWorkout, setSavedWorkout] = useState<Exercise[]>([]);
  
  // Apply filters when they change
  useEffect(() => {
    let result = [...exercises];
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(exercise => exercise.category === categoryFilter);
    }
    
    // Apply difficulty filter
    if (difficultyFilter !== 'all') {
      result = result.filter(exercise => exercise.difficulty === difficultyFilter);
    }
    
    // Apply equipment filter
    if (equipmentFilter !== 'all') {
      result = result.filter(exercise => exercise.equipment === equipmentFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        exercise => 
          exercise.name.toLowerCase().includes(query) || 
          exercise.description.toLowerCase().includes(query) ||
          exercise.muscleGroups.some(group => group.toLowerCase().includes(query))
      );
    }
    
    setFilteredExercises(result);
  }, [exercises, categoryFilter, difficultyFilter, equipmentFilter, searchQuery]);
  
  // Toggle exercise favorite status
  const toggleFavorite = (id: number) => {
    setExercises(prev => 
      prev.map(exercise => 
        exercise.id === id 
          ? {...exercise, favorite: !exercise.favorite} 
          : exercise
      )
    );
    
    const exercise = exercises.find(ex => ex.id === id);
    const isFavorited = !exercise?.favorite;
    
    toast({
      title: isFavorited ? "Added to favorites" : "Removed from favorites",
      description: `${exercise?.name} has been ${isFavorited ? 'added to' : 'removed from'} your favorites.`
    });
  };

  // Add exercise to workout
  const addToWorkout = (exercise: Exercise) => {
    if (savedWorkout.find(ex => ex.id === exercise.id)) {
      toast({
        title: "Already in workout",
        description: `${exercise.name} is already in your current workout.`,
        variant: "destructive"
      });
      return;
    }
    
    setSavedWorkout(prev => [...prev, exercise]);
    toast({
      title: "Added to workout",
      description: `${exercise.name} has been added to your current workout.`
    });
  };

  // Remove exercise from workout
  const removeFromWorkout = (id: number) => {
    const exercise = savedWorkout.find(ex => ex.id === id);
    setSavedWorkout(prev => prev.filter(ex => ex.id !== id));
    toast({
      title: "Removed from workout",
      description: `${exercise?.name} has been removed from your workout.`
    });
  };

  // Save current workout
  const saveWorkout = () => {
    if (savedWorkout.length === 0) {
      toast({
        title: "No exercises selected",
        description: "Please add exercises to your workout before saving.",
        variant: "destructive"
      });
      return;
    }

    // In a real app, this would save to a database
    toast({
      title: "Workout saved",
      description: `Successfully saved workout with ${savedWorkout.length} exercises.`
    });
    
    // Clear the current workout after saving
    setSavedWorkout([]);
  };
  
  // View exercise details
  const viewExerciseDetails = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };
  
  // Back to list
  const backToList = () => {
    setSelectedExercise(null);
  };
  
  // Render difficulty badge
  const renderDifficultyBadge = (difficulty: ExerciseDifficulty) => {
    switch(difficulty) {
      case 'beginner':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Beginner</Badge>;
      case 'intermediate':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Intermediate</Badge>;
      case 'advanced':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Advanced</Badge>;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 text-white flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <MobileMenu />
        <main className="p-6">
        {/* For mobile view padding to account for fixed header */}
        <div className="md:hidden pt-20"></div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading text-white">Strength Exercises</h1>
            <p className="text-white/80 mt-1">Build strength to improve running performance and prevent injuries</p>
          </div>
          {savedWorkout.length > 0 && (
            <div className="mt-4 md:mt-0">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {savedWorkout.length} exercise{savedWorkout.length !== 1 ? 's' : ''} in workout
              </Badge>
            </div>
          )}
        </div>

        {/* Current Workout Display */}
        {savedWorkout.length > 0 && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Current Workout
              </CardTitle>
              <CardDescription>
                Your selected exercises for today's strength training
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {savedWorkout.map(exercise => (
                  <Badge 
                    key={exercise.id} 
                    variant="secondary" 
                    className="flex items-center gap-1 pr-1"
                  >
                    {exercise.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeFromWorkout(exercise.id)}
                    >
                      ×
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={saveWorkout}
                  className="flex items-center gap-2"
                >
                  <Bookmark className="h-4 w-4" />
                  Save Workout
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setSavedWorkout([])}
                  className="flex items-center gap-2"
                >
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main content */}
        {selectedExercise ? (
          // Exercise detail view
          <Card className="border-neutral-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={backToList}
                    className="h-8 px-2 lg:px-3"
                  >
                    <span className="sr-only lg:not-sr-only">Back</span>
                  </Button>
                  <CardTitle className="text-xl">{selectedExercise.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {renderDifficultyBadge(selectedExercise.difficulty)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(selectedExercise.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Heart 
                      className={cn(
                        "h-5 w-5", 
                        selectedExercise.favorite ? "fill-red-500 text-red-500" : "text-neutral-500"
                      )} 
                    />
                    <span className="sr-only">
                      {selectedExercise.favorite ? "Remove from favorites" : "Add to favorites"}
                    </span>
                  </Button>
                </div>
              </div>
              <CardDescription className="mt-2">
                {selectedExercise.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">How to Perform</h3>
                  <ol className="space-y-2 list-decimal list-inside text-neutral-dark">
                    {selectedExercise.steps.map((step, index) => (
                      <li key={index} className="pl-1">
                        <span className="text-neutral-darker">{step}</span>
                      </li>
                    ))}
                  </ol>
                  
                  <h3 className="text-lg font-medium mt-6 mb-3">Tips</h3>
                  <ul className="space-y-1 list-disc list-inside text-neutral-dark">
                    {selectedExercise.tips.map((tip, index) => (
                      <li key={index} className="pl-1">
                        <span className="text-neutral-darker">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Exercise Details</h3>
                  <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100 space-y-4">
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 text-neutral-500 mr-3" />
                      <div>
                        <p className="text-sm text-neutral-500">Target Muscle Groups</p>
                        <p className="text-neutral-darker">{selectedExercise.muscleGroups.join(', ')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-neutral-500 mr-3" />
                      <div>
                        <p className="text-sm text-neutral-500">Recommended Duration</p>
                        <p className="text-neutral-darker">{selectedExercise.duration}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Dumbbell className="h-5 w-5 text-neutral-500 mr-3" />
                      <div>
                        <p className="text-sm text-neutral-500">Equipment Needed</p>
                        <p className="text-neutral-darker capitalize">
                          {selectedExercise.equipment === 'none' 
                            ? 'No equipment (bodyweight only)' 
                            : selectedExercise.equipment === 'minimal'
                              ? 'Minimal equipment (resistance bands, light weights)'
                              : 'Standard gym equipment'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedExercise.youtubeId && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">Video Demonstration</h3>
                      <div className="rounded-lg overflow-hidden aspect-video">
                        <iframe 
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/${selectedExercise.youtubeId}`}
                          title={`${selectedExercise.name} demonstration`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                      <p className="text-xs text-neutral-500 mt-2">
                        Video content freely available to all users without subscription
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="border-t border-neutral-100 pt-6 flex flex-wrap gap-3">
              <Button 
                variant="secondary" 
                className="flex items-center gap-2"
                onClick={() => addToWorkout(selectedExercise)}
              >
                <Clock className="h-4 w-4" />
                Add to Workout
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={saveWorkout}
              >
                <Bookmark className="h-4 w-4" />
                Save Workout ({savedWorkout.length})
              </Button>
            </CardFooter>
          </Card>
        ) : (
          // Exercise list view
          <>
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <Input
                  placeholder="Search exercises..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
                <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as ExerciseCategory | 'all')}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Category</SelectLabel>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="upper-body">Upper Body</SelectItem>
                      <SelectItem value="lower-body">Lower Body</SelectItem>
                      <SelectItem value="core">Core</SelectItem>
                      <SelectItem value="full-body">Full Body</SelectItem>
                      <SelectItem value="recovery">Recovery</SelectItem>
                      <SelectItem value="mobility">Mobility</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {showFilters && (
              <Card className="mb-6 border-neutral-200">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-sm font-medium mb-3">Difficulty Level</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="difficulty-all" 
                            checked={difficultyFilter === 'all'}
                            onCheckedChange={() => setDifficultyFilter('all')}
                          />
                          <label htmlFor="difficulty-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            All Levels
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="difficulty-beginner" 
                            checked={difficultyFilter === 'beginner'}
                            onCheckedChange={() => setDifficultyFilter('beginner')}
                          />
                          <label htmlFor="difficulty-beginner" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Beginner
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="difficulty-intermediate" 
                            checked={difficultyFilter === 'intermediate'}
                            onCheckedChange={() => setDifficultyFilter('intermediate')}
                          />
                          <label htmlFor="difficulty-intermediate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Intermediate
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="difficulty-advanced" 
                            checked={difficultyFilter === 'advanced'}
                            onCheckedChange={() => setDifficultyFilter('advanced')}
                          />
                          <label htmlFor="difficulty-advanced" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Advanced
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-3">Equipment Required</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="equipment-all" 
                            checked={equipmentFilter === 'all'}
                            onCheckedChange={() => setEquipmentFilter('all')}
                          />
                          <label htmlFor="equipment-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            All Equipment Types
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="equipment-none" 
                            checked={equipmentFilter === 'none'}
                            onCheckedChange={() => setEquipmentFilter('none')}
                          />
                          <label htmlFor="equipment-none" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            No Equipment (Bodyweight Only)
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="equipment-minimal" 
                            checked={equipmentFilter === 'minimal'}
                            onCheckedChange={() => setEquipmentFilter('minimal')}
                          />
                          <label htmlFor="equipment-minimal" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Minimal Equipment
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="equipment-standard" 
                            checked={equipmentFilter === 'standard'}
                            onCheckedChange={() => setEquipmentFilter('standard')}
                          />
                          <label htmlFor="equipment-standard" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Standard Gym Equipment
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-3">Category</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="category-all" 
                            checked={categoryFilter === 'all'}
                            onCheckedChange={() => setCategoryFilter('all')}
                          />
                          <label htmlFor="category-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            All Categories
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="category-upper" 
                            checked={categoryFilter === 'upper-body'}
                            onCheckedChange={() => setCategoryFilter('upper-body')}
                          />
                          <label htmlFor="category-upper" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Upper Body
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="category-lower" 
                            checked={categoryFilter === 'lower-body'}
                            onCheckedChange={() => setCategoryFilter('lower-body')}
                          />
                          <label htmlFor="category-lower" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Lower Body
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="category-core" 
                            checked={categoryFilter === 'core'}
                            onCheckedChange={() => setCategoryFilter('core')}
                          />
                          <label htmlFor="category-core" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Core
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExercises.map(exercise => (
                <Card 
                  key={exercise.id} 
                  className="border-neutral-200 transition-all hover:shadow-md cursor-pointer"
                  onClick={() => viewExerciseDetails(exercise)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{exercise.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(exercise.id);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Heart 
                          className={cn(
                            "h-5 w-5", 
                            exercise.favorite ? "fill-red-500 text-red-500" : "text-neutral-500"
                          )} 
                        />
                        <span className="sr-only">
                          {exercise.favorite ? "Remove from favorites" : "Add to favorites"}
                        </span>
                      </Button>
                    </div>
                    <div className="flex space-x-2 mt-1">
                      {renderDifficultyBadge(exercise.difficulty)}
                      <Badge variant="outline" className="bg-neutral-50 text-neutral-700 border-neutral-200 capitalize">
                        {exercise.category.replace('-', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-medium text-sm line-clamp-2">
                      {exercise.description}
                    </p>
                    <div className="flex items-center mt-3 text-xs text-neutral-500">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{exercise.duration}</span>
                      <span className="mx-2">•</span>
                      <Dumbbell className="h-3 w-3 mr-1" />
                      <span className="capitalize">{exercise.equipment === 'none' ? 'No equipment' : exercise.equipment}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        viewExerciseDetails(exercise);
                      }}
                    >
                      View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToWorkout(exercise);
                      }}
                    >
                      Add to Workout
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {filteredExercises.length === 0 && (
              <div className="text-center py-10">
                <Dumbbell className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium">No exercises found</h3>
                <p className="text-neutral-medium mt-1">Try adjusting your filters or search terms</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setCategoryFilter('all');
                    setDifficultyFilter('all');
                    setEquipmentFilter('all');
                    setSearchQuery('');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}