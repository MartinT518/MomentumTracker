import { useState, useEffect } from 'react';
import { AppLayout } from "@/components/common/app-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  youtubeId?: string;
  favorite?: boolean;
}

// Comprehensive exercises database
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
  },
  {
    id: 3,
    name: "Plank",
    description: "Core strengthening exercise that improves stability and endurance.",
    category: "core",
    difficulty: "beginner",
    equipment: "none",
    muscleGroups: ["Core", "Shoulders", "Glutes"],
    duration: "2-5 minutes",
    youtubeId: "pSHjTRCQxIw",
    steps: [
      "Start in push-up position",
      "Lower to forearms, keeping elbows under shoulders",
      "Keep body in straight line from head to heels",
      "Engage core and hold position",
      "Breathe normally throughout"
    ],
    tips: [
      "Don't let hips sag or pike up",
      "Keep neck neutral",
      "Start with 20-30 seconds",
      "Focus on quality over duration"
    ]
  },
  {
    id: 4,
    name: "Lunges",
    description: "Single-leg exercise that builds lower body strength and improves balance.",
    category: "lower-body",
    difficulty: "beginner",
    equipment: "none",
    muscleGroups: ["Quadriceps", "Hamstrings", "Glutes", "Calves"],
    duration: "5-10 minutes",
    youtubeId: "QOVaHwm-Q6U",
    steps: [
      "Stand tall with feet hip-width apart",
      "Step forward with one leg",
      "Lower body until both knees are at 90 degrees",
      "Keep front knee over ankle",
      "Push back to starting position"
    ],
    tips: [
      "Keep torso upright",
      "Don't let front knee go past toes",
      "Control the descent",
      "Alternate legs or complete sets on one side"
    ]
  },
  {
    id: 5,
    name: "Mountain Climbers",
    description: "High-intensity cardio exercise that targets core and builds endurance.",
    category: "full-body",
    difficulty: "intermediate",
    equipment: "none",
    muscleGroups: ["Core", "Shoulders", "Legs", "Cardio"],
    duration: "3-8 minutes",
    youtubeId: "wQq3ybaLd1I",
    steps: [
      "Start in plank position",
      "Bring right knee toward chest",
      "Quickly switch legs",
      "Keep hips level and core engaged",
      "Continue alternating rapidly"
    ],
    tips: [
      "Maintain plank position throughout",
      "Land softly on balls of feet",
      "Keep breathing steady",
      "Start slow and build speed"
    ]
  },
  {
    id: 6,
    name: "Burpees",
    description: "Full-body exercise combining strength training and cardiovascular fitness.",
    category: "full-body",
    difficulty: "advanced",
    equipment: "none",
    muscleGroups: ["Full Body", "Cardio"],
    duration: "5-15 minutes",
    youtubeId: "TU8QYVW0gDU",
    steps: [
      "Start standing upright",
      "Drop into squat position",
      "Jump back into plank position",
      "Perform push-up (optional)",
      "Jump feet back to squat, then jump up with arms overhead"
    ],
    tips: [
      "Land softly when jumping",
      "Modify by stepping instead of jumping",
      "Keep core engaged throughout",
      "Focus on smooth transitions"
    ]
  },
  {
    id: 7,
    name: "Dumbbell Bicep Curls",
    description: "Isolation exercise for bicep development and arm strength.",
    category: "upper-body",
    difficulty: "beginner",
    equipment: "standard",
    muscleGroups: ["Biceps", "Forearms"],
    duration: "5-8 minutes",
    youtubeId: "ykJmrZ5v0Oo",
    steps: [
      "Stand with dumbbells in each hand, arms at sides",
      "Keep elbows close to torso",
      "Curl weights up toward shoulders",
      "Squeeze biceps at top",
      "Slowly lower back to starting position"
    ],
    tips: [
      "Don't swing weights",
      "Control the negative portion",
      "Keep wrists straight",
      "Start with lighter weights"
    ]
  },
  {
    id: 8,
    name: "Deadlifts",
    description: "Compound exercise targeting posterior chain muscles.",
    category: "lower-body",
    difficulty: "intermediate",
    equipment: "standard",
    muscleGroups: ["Hamstrings", "Glutes", "Lower Back", "Traps"],
    duration: "8-12 minutes",
    youtubeId: "op9kVnSso6Q",
    steps: [
      "Stand with feet hip-width apart, barbell over mid-foot",
      "Bend at hips and knees to grip bar",
      "Keep chest up and back straight",
      "Drive through heels to stand up",
      "Lower bar with control"
    ],
    tips: [
      "Keep bar close to body",
      "Don't round your back",
      "Start with light weight",
      "Focus on hip hinge movement"
    ]
  },
  {
    id: 9,
    name: "Russian Twists",
    description: "Core rotation exercise that targets obliques and improves rotational strength.",
    category: "core",
    difficulty: "intermediate",
    equipment: "minimal",
    muscleGroups: ["Obliques", "Core", "Hip Flexors"],
    duration: "5-8 minutes",
    youtubeId: "wkD8rjkodUI",
    steps: [
      "Sit with knees bent, feet slightly off ground",
      "Lean back to 45-degree angle",
      "Hold weight or medicine ball",
      "Rotate torso left and right",
      "Keep chest up and core engaged"
    ],
    tips: [
      "Don't pull on neck",
      "Control the rotation",
      "Keep feet elevated if possible",
      "Start without weight"
    ]
  },
  {
    id: 10,
    name: "Yoga Flow - Sun Salutation",
    description: "Dynamic stretching sequence that improves flexibility and mobility.",
    category: "mobility",
    difficulty: "beginner",
    equipment: "minimal",
    muscleGroups: ["Full Body", "Flexibility"],
    duration: "10-15 minutes",
    youtubeId: "73sjOKi6N1I",
    steps: [
      "Start in mountain pose",
      "Sweep arms up overhead",
      "Forward fold to touch toes",
      "Step back to plank",
      "Lower to chaturanga, then upward dog",
      "Downward dog, then step forward and rise"
    ],
    tips: [
      "Move with your breath",
      "Modify poses as needed",
      "Focus on smooth transitions",
      "Don't force the stretches"
    ]
  },
  {
    id: 11,
    name: "Foam Rolling Recovery",
    description: "Self-myofascial release technique for muscle recovery and mobility.",
    category: "recovery",
    difficulty: "beginner",
    equipment: "minimal",
    muscleGroups: ["Full Body Recovery"],
    duration: "10-20 minutes",
    youtubeId: "Gq5wGo4DJdY",
    steps: [
      "Position foam roller under target muscle",
      "Apply gentle pressure with body weight",
      "Roll slowly along muscle length",
      "Pause on tender spots for 30 seconds",
      "Move to next muscle group"
    ],
    tips: [
      "Don't roll too fast",
      "Avoid rolling over joints",
      "Breathe deeply and relax",
      "Start with light pressure"
    ]
  },
  {
    id: 12,
    name: "Bench Press",
    description: "Classic upper body compound exercise for chest development.",
    category: "upper-body",
    difficulty: "intermediate",
    equipment: "standard",
    muscleGroups: ["Chest", "Shoulders", "Triceps"],
    duration: "10-15 minutes",
    youtubeId: "rT7DgCr-3pg",
    steps: [
      "Lie on bench with feet flat on floor",
      "Grip bar slightly wider than shoulders",
      "Lower bar to chest with control",
      "Press bar up until arms are extended",
      "Keep core tight throughout"
    ],
    tips: [
      "Always use a spotter",
      "Keep shoulder blades retracted",
      "Don't bounce bar off chest",
      "Start with lighter weight"
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
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                Strength Exercises
              </h1>
              <p className="text-white/80 text-lg drop-shadow-md">
                Build strength to improve running performance and prevent injuries
              </p>
            </div>
          </div>
          
          {savedWorkout.length > 0 && (
            <Badge variant="outline" className="bg-blue-300/20 text-blue-100 border-blue-300/30 drop-shadow-md">
              {savedWorkout.length} exercise{savedWorkout.length !== 1 ? 's' : ''} in workout
            </Badge>
          )}
        </div>

        {/* Main Content */}
        {selectedExercise ? (
          // Exercise detail view
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={backToList}
                  className="text-white hover:bg-white/10"
                >
                  ← Back
                </Button>
                <h2 className="text-2xl font-bold text-white drop-shadow-md">{selectedExercise.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                {renderDifficultyBadge(selectedExercise.difficulty)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFavorite(selectedExercise)}
                  className="h-8 w-8 p-0 text-white hover:bg-white/10"
                >
                  <Heart 
                    className={cn(
                      "h-5 w-5", 
                      selectedExercise.favorite ? "fill-red-500 text-red-500" : "text-white"
                    )} 
                  />
                </Button>
              </div>
            </div>
            
            <p className="text-white/80 text-lg mb-6 drop-shadow-md">
              {selectedExercise.description}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-white drop-shadow-md">How to Perform</h3>
                <ol className="space-y-3 list-decimal list-inside text-white/90">
                  {selectedExercise.steps.map((step, index) => (
                    <li key={index} className="pl-2">
                      <span className="text-white/90 drop-shadow-sm">{step}</span>
                    </li>
                  ))}
                </ol>
                
                <h3 className="text-xl font-semibold mt-8 mb-4 text-white drop-shadow-md">Tips</h3>
                <ul className="space-y-2 list-disc list-inside text-white/90">
                  {selectedExercise.tips.map((tip, index) => (
                    <li key={index} className="pl-2">
                      <span className="text-white/90 drop-shadow-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4 text-white drop-shadow-md">Exercise Details</h3>
                <div className="bg-white/10 rounded-lg p-6 border border-white/20 space-y-4">
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 text-white/70 mr-3" />
                    <div>
                      <p className="text-sm text-white/70">Target Muscle Groups</p>
                      <p className="text-white drop-shadow-sm">{selectedExercise.muscleGroups.join(', ')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-white/70 mr-3" />
                    <div>
                      <p className="text-sm text-white/70">Recommended Duration</p>
                      <p className="text-white drop-shadow-sm">{selectedExercise.duration}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Dumbbell className="h-5 w-5 text-white/70 mr-3" />
                    <div>
                      <p className="text-sm text-white/70">Equipment Needed</p>
                      <p className="text-white drop-shadow-sm capitalize">
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
                    <h3 className="text-xl font-semibold mb-4 text-white drop-shadow-md">Video Demonstration</h3>
                    <div className="rounded-lg overflow-hidden aspect-video">
                      <iframe 
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${selectedExercise.youtubeId}`}
                        title={`${selectedExercise.name} demonstration`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <p className="text-xs text-white/60 mt-2 drop-shadow-sm">
                      Video content freely available to all users
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 mt-8 pt-6 border-t border-white/20">
              <Button 
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white"
                onClick={() => addToWorkout(selectedExercise)}
              >
                <Zap className="h-4 w-4" />
                Add to Workout
              </Button>
              {savedWorkout.length > 0 && (
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 border-white/30 text-white hover:bg-white/10"
                  onClick={saveWorkout}
                >
                  <Bookmark className="h-4 w-4" />
                  Save Workout ({savedWorkout.length})
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Workout Display */}
            {savedWorkout.length > 0 && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-300" />
                  Current Workout
                </h3>
                <p className="text-white/70 mb-4">Your selected exercises for today's strength training</p>
                
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
              </div>
            )}

            {/* Filters and Search */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                    <Input
                      placeholder="Search exercises or muscle groups..."
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as ExerciseCategory | 'all')}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="upper-body">Upper Body</SelectItem>
                      <SelectItem value="lower-body">Lower Body</SelectItem>
                      <SelectItem value="core">Core</SelectItem>
                      <SelectItem value="full-body">Full Body</SelectItem>
                      <SelectItem value="mobility">Mobility</SelectItem>
                      <SelectItem value="recovery">Recovery</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={difficultyFilter} onValueChange={(value) => setDifficultyFilter(value as ExerciseDifficulty | 'all')}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={equipmentFilter} onValueChange={(value) => setEquipmentFilter(value as ExerciseEquipment | 'all')}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Equipment</SelectItem>
                      <SelectItem value="none">No Equipment</SelectItem>
                      <SelectItem value="minimal">Minimal Equipment</SelectItem>
                      <SelectItem value="standard">Standard Gym</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Exercise Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExercises.map(exercise => (
                <Card key={exercise.id} className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-white drop-shadow-md">{exercise.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(exercise)}
                        className="h-6 w-6 p-0 text-white hover:bg-white/10"
                      >
                        <Heart 
                          className={cn(
                            "h-4 w-4", 
                            exercise.favorite ? "fill-red-500 text-red-500" : "text-white/60"
                          )} 
                        />
                      </Button>
                    </div>
                    <CardDescription className="text-white/70 text-sm drop-shadow-md">
                      {exercise.description}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      {renderDifficultyBadge(exercise.difficulty)}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
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
          </div>
        )}
      </div>
    </AppLayout>
  );
}