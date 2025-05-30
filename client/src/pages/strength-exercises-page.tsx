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
      "Lower your body by bending at the hips and knees",
      "Keep your chest up and weight on your heels",
      "Descend until thighs are parallel to the floor",
      "Push through your heels to return to starting position"
    ],
    tips: [
      "Keep your knees in line with your toes",
      "Don't let your knees cave inward",
      "Focus on controlled movement",
      "Start with 10-15 repetitions"
    ]
  },
  {
    id: 2,
    name: "Push-ups",
    description: "Classic upper body exercise targeting chest, shoulders, and triceps.",
    category: "upper-body",
    difficulty: "beginner",
    equipment: "none",
    muscleGroups: ["Chest", "Shoulders", "Triceps", "Core"],
    duration: "3-8 minutes",
    youtubeId: "IODxDxX7oi4",
    steps: [
      "Start in plank position with hands shoulder-width apart",
      "Lower your chest toward the floor",
      "Keep your body in a straight line",
      "Push back up to starting position",
      "Maintain core engagement throughout"
    ],
    tips: [
      "Start with modified (knee) push-ups if needed",
      "Focus on full range of motion",
      "Keep your head in neutral position",
      "Build up repetitions gradually"
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
      result = result.filter(exercise => 
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.muscleGroups.some(muscle => 
          muscle.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    setFilteredExercises(result);
  }, [exercises, categoryFilter, difficultyFilter, equipmentFilter, searchQuery]);

  // Toggle favorite
  const toggleFavorite = (exercise: Exercise) => {
    const updatedExercises = exercises.map(ex => 
      ex.id === exercise.id ? { ...ex, favorite: !ex.favorite } : ex
    );
    setExercises(updatedExercises);
    
    const isFavorited = !exercise.favorite;
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
    
    toast({
      title: "Workout saved",
      description: `Your workout with ${savedWorkout.length} exercises has been saved.`
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
        return <Badge variant="outline" className="bg-green-100/20 text-green-100 border-green-300/30">Beginner</Badge>;
      case 'intermediate':
        return <Badge variant="outline" className="bg-blue-100/20 text-blue-100 border-blue-300/30">Intermediate</Badge>;
      case 'advanced':
        return <Badge variant="outline" className="bg-orange-100/20 text-orange-100 border-orange-300/30">Advanced</Badge>;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700">
      <div className="flex h-screen max-w-full overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <MobileMenu />
          <main className="p-6">
            {/* For mobile view padding to account for fixed header */}
            <div className="md:hidden pt-20"></div>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold font-heading text-white drop-shadow-md">Strength Exercises</h1>
                <p className="text-white/80 mt-1 drop-shadow-md">Build strength to improve running performance and prevent injuries</p>
              </div>
              {savedWorkout.length > 0 && (
                <div className="mt-4 md:mt-0">
                  <Badge variant="outline" className="bg-blue-300/20 text-blue-100 border-blue-300/30 drop-shadow-md">
                    {savedWorkout.length} exercise{savedWorkout.length !== 1 ? 's' : ''} in workout
                  </Badge>
                </div>
              )}
            </div>

            {/* Current Workout Display */}
            {savedWorkout.length > 0 && (
              <Card className="mb-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white drop-shadow-md">
                    <Zap className="h-5 w-5 text-blue-300" />
                    Current Workout
                  </CardTitle>
                  <CardDescription className="text-white/70 drop-shadow-md">
                    Your selected exercises for today's strength training
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {savedWorkout.map(exercise => (
                      <Badge 
                        key={exercise.id} 
                        variant="secondary" 
                        className="flex items-center gap-1 pr-1 bg-white/20 text-white border-white/30"
                      >
                        {exercise.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground text-white"
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
                      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white"
                    >
                      <Bookmark className="h-4 w-4" />
                      Save Workout
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setSavedWorkout([])}
                      className="flex items-center gap-2 border-white/30 text-white hover:bg-white/10"
                    >
                      Clear All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filters and Search */}
            <Card className="mb-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                      <Input
                        placeholder="Search exercises or muscle groups..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/50"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as ExerciseCategory | 'all')}>
                      <SelectTrigger className="w-[140px] bg-white/20 border-white/30 text-white">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="upper-body">Upper Body</SelectItem>
                        <SelectItem value="lower-body">Lower Body</SelectItem>
                        <SelectItem value="core">Core</SelectItem>
                        <SelectItem value="full-body">Full Body</SelectItem>
                        <SelectItem value="recovery">Recovery</SelectItem>
                        <SelectItem value="mobility">Mobility</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={difficultyFilter} onValueChange={(value) => setDifficultyFilter(value as ExerciseDifficulty | 'all')}>
                      <SelectTrigger className="w-[120px] bg-white/20 border-white/30 text-white">
                        <SelectValue placeholder="Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exercise Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExercises.map((exercise) => (
                <Card key={exercise.id} className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl hover:shadow-2xl transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-white drop-shadow-md">{exercise.name}</CardTitle>
                        <div className="flex gap-2 mt-2">
                          {renderDifficultyBadge(exercise.difficulty)}
                          <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                            {exercise.equipment === 'none' ? 'No Equipment' : exercise.equipment}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-white/80 text-sm mb-3 drop-shadow-md">{exercise.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {exercise.muscleGroups.slice(0, 3).map((muscle) => (
                        <Badge key={muscle} variant="secondary" className="text-xs bg-blue-300/20 text-blue-100 border-blue-300/30">
                          {muscle}
                        </Badge>
                      ))}
                      {exercise.muscleGroups.length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-blue-300/20 text-blue-100 border-blue-300/30">
                          +{exercise.muscleGroups.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <Clock className="h-4 w-4" />
                      {exercise.duration}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="flex gap-2 w-full">
                      <Button 
                        size="sm" 
                        onClick={() => viewExerciseDetails(exercise)}
                        className="flex-1 bg-blue-500 hover:bg-blue-400 text-white"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => addToWorkout(exercise)}
                        className="border-white/30 text-white hover:bg-white/10"
                      >
                        <Zap className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {filteredExercises.length === 0 && (
              <div className="text-center py-12">
                <Dumbbell className="h-12 w-12 mx-auto text-white/60 mb-4" />
                <h3 className="text-lg font-medium text-white drop-shadow-md mb-2">No exercises found</h3>
                <p className="text-white/70 drop-shadow-md">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}