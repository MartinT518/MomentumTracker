import { useState } from "react";
import { Sidebar } from "@/components/common/sidebar";
import { MobileMenu } from "@/components/common/mobile-menu";
import { 
  Dumbbell, Filter, ChevronDown, Play, Clock, Flame, LucideIcon, 
  MoveHorizontal, Heart, RefreshCw, Search
} from "lucide-react";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

// Types
export interface Exercise {
  id: number;
  name: string;
  description: string;
  muscleGroups: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  caloriesBurn: number; // estimated per session
  imageUrl: string;
  videoUrl?: string;
  steps: string[];
  equipment: string[];
  tips: string[];
  variations: {
    name: string;
    description: string;
  }[];
}

// Exercise data
const bodyweightExercises: Exercise[] = [
  {
    id: 1,
    name: "Push-Ups",
    description: "A classic upper body exercise that strengthens the chest, shoulders, triceps, and core.",
    muscleGroups: ["chest", "shoulders", "triceps", "core"],
    difficultyLevel: "beginner",
    duration: 5,
    caloriesBurn: 100,
    imageUrl: "https://placehold.co/300x200/f5f5f5/a3a3a3?text=Push-Ups",
    videoUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4",
    steps: [
      "Start in a plank position with your hands slightly wider than shoulder-width apart",
      "Lower your body until your chest nearly touches the floor",
      "Pause, then push yourself back up",
      "Repeat for the desired number of repetitions"
    ],
    equipment: [],
    tips: [
      "Keep your body in a straight line from head to heels",
      "Don't let your hips sag or pike upward",
      "Engage your core throughout the movement"
    ],
    variations: [
      {
        name: "Knee Push-Ups",
        description: "An easier variation performed with knees on the ground"
      },
      {
        name: "Diamond Push-Ups",
        description: "A more challenging variation with hands close together in a diamond shape"
      }
    ]
  },
  {
    id: 2,
    name: "Bodyweight Squats",
    description: "A fundamental lower body exercise that targets the quadriceps, hamstrings, and glutes.",
    muscleGroups: ["quadriceps", "hamstrings", "glutes", "core"],
    difficultyLevel: "beginner",
    duration: 5,
    caloriesBurn: 100,
    imageUrl: "https://placehold.co/300x200/f5f5f5/a3a3a3?text=Squats",
    videoUrl: "https://www.youtube.com/watch?v=YaXPRqUwItQ",
    steps: [
      "Stand with feet shoulder-width apart",
      "Lower your body by bending your knees and pushing your hips back",
      "Descend until your thighs are parallel to the ground",
      "Push through your heels to return to the starting position"
    ],
    equipment: [],
    tips: [
      "Keep your chest up and back straight",
      "Make sure your knees track over your toes",
      "Go as deep as your mobility allows"
    ],
    variations: [
      {
        name: "Jump Squats",
        description: "Add an explosive jump at the top of the movement for increased intensity"
      },
      {
        name: "Split Squats",
        description: "Perform with one foot forward and one back for single-leg focus"
      }
    ]
  },
  {
    id: 3,
    name: "Planks",
    description: "An isometric core exercise that builds endurance and stability throughout the entire body.",
    muscleGroups: ["core", "shoulders", "back"],
    difficultyLevel: "beginner",
    duration: 3,
    caloriesBurn: 50,
    imageUrl: "https://placehold.co/300x200/f5f5f5/a3a3a3?text=Planks",
    videoUrl: "https://www.youtube.com/watch?v=ASdvN_XEl_c",
    steps: [
      "Position yourself on your forearms and toes",
      "Keep your body in a straight line from head to heels",
      "Engage your core and hold the position",
      "Hold for the desired duration (aim for 30-60 seconds)"
    ],
    equipment: [],
    tips: [
      "Don't let your hips sag or pike upward",
      "Keep your gaze down to maintain neutral neck position",
      "Breathe normally throughout the hold"
    ],
    variations: [
      {
        name: "Side Plank",
        description: "Turn to one side to target the obliques"
      },
      {
        name: "Plank Shoulder Taps",
        description: "Add movement by alternately lifting one hand to tap the opposite shoulder"
      }
    ]
  },
  {
    id: 4,
    name: "Lunges",
    description: "A unilateral lower body exercise that targets the quadriceps, hamstrings, and glutes while improving balance.",
    muscleGroups: ["quadriceps", "hamstrings", "glutes", "core"],
    difficultyLevel: "beginner",
    duration: 6,
    caloriesBurn: 120,
    imageUrl: "https://placehold.co/300x200/f5f5f5/a3a3a3?text=Lunges",
    videoUrl: "https://www.youtube.com/watch?v=QOVaHwm-Q6U",
    steps: [
      "Stand with feet hip-width apart",
      "Step forward with one leg and lower your body until both knees form 90-degree angles",
      "Push through the front heel to return to the starting position",
      "Repeat with the opposite leg"
    ],
    equipment: [],
    tips: [
      "Keep your upper body straight with shoulders back",
      "Make sure your front knee stays above or behind your toes",
      "Engage your core for stability"
    ],
    variations: [
      {
        name: "Walking Lunges",
        description: "Perform lunges while moving forward for increased challenge"
      },
      {
        name: "Reverse Lunges",
        description: "Step backward instead of forward to reduce knee stress"
      }
    ]
  },
  {
    id: 5,
    name: "Mountain Climbers",
    description: "A dynamic exercise that combines cardio and core strengthening.",
    muscleGroups: ["core", "shoulders", "hip flexors", "cardiovascular system"],
    difficultyLevel: "intermediate",
    duration: 4,
    caloriesBurn: 150,
    imageUrl: "https://placehold.co/300x200/f5f5f5/a3a3a3?text=Mountain+Climbers",
    videoUrl: "https://www.youtube.com/watch?v=nmwgirgXLYM",
    steps: [
      "Start in a push-up position with arms straight",
      "Drive one knee toward your chest",
      "Quickly switch legs, extending the bent leg and driving the other knee in",
      "Continue alternating legs in a running motion"
    ],
    equipment: [],
    tips: [
      "Keep your hips down and core engaged",
      "Maintain a steady pace for better results",
      "Breathe rhythmically with the movement"
    ],
    variations: [
      {
        name: "Slow Mountain Climbers",
        description: "Perform the movement slowly for more control and core engagement"
      },
      {
        name: "Cross-Body Mountain Climbers",
        description: "Drive knees toward opposite elbows to engage obliques"
      }
    ]
  },
  {
    id: 6,
    name: "Burpees",
    description: "A full-body exercise that combines a squat, push-up, and jump for intense cardiovascular and muscular work.",
    muscleGroups: ["full body", "cardiovascular system"],
    difficultyLevel: "advanced",
    duration: 8,
    caloriesBurn: 250,
    imageUrl: "https://placehold.co/300x200/f5f5f5/a3a3a3?text=Burpees",
    videoUrl: "https://www.youtube.com/watch?v=TU8QYVW0gDU",
    steps: [
      "Start standing, then drop into a squat position with hands on the ground",
      "Kick your feet back into a plank position",
      "Perform a push-up (optional)",
      "Return feet to squat position and explosively jump up"
    ],
    equipment: [],
    tips: [
      "Modify by stepping back instead of jumping if needed",
      "Keep your core engaged throughout the movement",
      "Land softly from the jump with bent knees"
    ],
    variations: [
      {
        name: "Half Burpee",
        description: "Skip the push-up portion for a less intense variation"
      },
      {
        name: "Burpee Pull-Up",
        description: "Add a pull-up at the end of each burpee (requires a pull-up bar)"
      }
    ]
  },
  {
    id: 7,
    name: "Glute Bridges",
    description: "A lower body exercise focusing on the glutes and posterior chain.",
    muscleGroups: ["glutes", "hamstrings", "lower back"],
    difficultyLevel: "beginner",
    duration: 4,
    caloriesBurn: 60,
    imageUrl: "https://placehold.co/300x200/f5f5f5/a3a3a3?text=Glute+Bridges",
    videoUrl: "https://www.youtube.com/watch?v=wPM8icPu6H8",
    steps: [
      "Lie on your back with knees bent and feet flat on the floor",
      "Drive through your heels to lift your hips toward the ceiling",
      "Squeeze your glutes at the top of the movement",
      "Lower back down with control"
    ],
    equipment: [],
    tips: [
      "Keep your core engaged to protect your lower back",
      "Ensure your knees track over your ankles",
      "Focus on the glute contraction at the top"
    ],
    variations: [
      {
        name: "Single-Leg Glute Bridge",
        description: "Perform with one leg extended for increased difficulty"
      },
      {
        name: "Marching Glute Bridge",
        description: "Hold the top position and alternately lift each foot"
      }
    ]
  },
  {
    id: 8,
    name: "Tricep Dips",
    description: "An upper body exercise focusing on the triceps, with assistance from the shoulders and chest.",
    muscleGroups: ["triceps", "shoulders", "chest"],
    difficultyLevel: "intermediate",
    duration: 5,
    caloriesBurn: 80,
    imageUrl: "https://placehold.co/300x200/f5f5f5/a3a3a3?text=Tricep+Dips",
    videoUrl: "https://www.youtube.com/watch?v=6kALZikXxLc",
    steps: [
      "Sit on the edge of a stable chair or bench with hands gripping the edge",
      "Slide your butt off the edge with legs extended",
      "Lower your body by bending your elbows to about 90 degrees",
      "Push back up to the starting position"
    ],
    equipment: ["chair or bench (optional)"],
    tips: [
      "Keep your shoulders down and away from your ears",
      "Stay close to the chair/bench throughout the movement",
      "For easier variation, bend knees to 90 degrees"
    ],
    variations: [
      {
        name: "Bench Dips",
        description: "Perform with feet on the floor and knees bent for an easier version"
      },
      {
        name: "Straight Leg Dips",
        description: "Extend legs fully for increased difficulty"
      }
    ]
  },
  {
    id: 9,
    name: "Superman",
    description: "A back strengthening exercise that targets the erector spinae, glutes, and shoulders.",
    muscleGroups: ["lower back", "glutes", "shoulders"],
    difficultyLevel: "beginner",
    duration: 3,
    caloriesBurn: 40,
    imageUrl: "https://placehold.co/300x200/f5f5f5/a3a3a3?text=Superman",
    videoUrl: "https://www.youtube.com/watch?v=cc6UVRS7PW4",
    steps: [
      "Lie face down with arms extended overhead",
      "Simultaneously lift your arms, chest, and legs off the ground",
      "Hold the position briefly",
      "Lower back down with control"
    ],
    equipment: [],
    tips: [
      "Focus on lengthening through your fingertips and toes",
      "Keep your neck in a neutral position, looking at the floor",
      "Don't strain to lift too high"
    ],
    variations: [
      {
        name: "Alternating Superman",
        description: "Lift opposite arm and leg, then switch"
      },
      {
        name: "Superman Hold",
        description: "Hold the top position for 3-5 seconds"
      }
    ]
  },
  {
    id: 10,
    name: "Hollow Body Hold",
    description: "An advanced core exercise that strengthens the entire midsection and improves stability.",
    muscleGroups: ["core", "hip flexors", "lower back"],
    difficultyLevel: "intermediate",
    duration: 4,
    caloriesBurn: 70,
    imageUrl: "https://placehold.co/300x200/f5f5f5/a3a3a3?text=Hollow+Body+Hold",
    videoUrl: "https://www.youtube.com/watch?v=2fB1R9uWQbw",
    steps: [
      "Lie on your back with arms extended overhead",
      "Simultaneously lift your shoulders and legs off the ground, creating a 'dish' shape",
      "Hold the position, keeping lower back pressed into the floor",
      "Maintain the position for the desired duration"
    ],
    equipment: [],
    tips: [
      "Press your lower back firmly into the ground throughout",
      "Start with knees bent if the full version is too challenging",
      "Focus on creating tension throughout your entire body"
    ],
    variations: [
      {
        name: "Hollow Body Rock",
        description: "Add a gentle rocking motion for increased intensity"
      },
      {
        name: "Tuck Hollow Hold",
        description: "Keep knees bent toward chest for a beginner version"
      }
    ]
  }
];

// Icons for muscle groups
const muscleGroupIcons: Record<string, LucideIcon> = {
  chest: Heart,
  shoulders: MoveHorizontal,
  triceps: Dumbbell,
  core: RefreshCw,
  quadriceps: Dumbbell,
  hamstrings: Dumbbell,
  glutes: Dumbbell,
  back: MoveHorizontal,
  "hip flexors": MoveHorizontal,
  "lower back": MoveHorizontal,
  "full body": RefreshCw,
  "cardiovascular system": Heart
};

// Exercise Card Component
function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const { toast } = useToast();
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-48 overflow-hidden bg-neutral-100">
        <img 
          src={exercise.imageUrl} 
          alt={exercise.name} 
          className="object-cover w-full h-full"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-white" />
              <span className="text-white text-xs">{exercise.duration} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-white" />
              <span className="text-white text-xs">~{exercise.caloriesBurn} cal</span>
            </div>
          </div>
        </div>
      </div>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{exercise.name}</CardTitle>
          <span className={`text-xs px-2 py-1 rounded-full ${
            exercise.difficultyLevel === 'beginner' ? 'bg-green-100 text-green-700' :
            exercise.difficultyLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {exercise.difficultyLevel.charAt(0).toUpperCase() + exercise.difficultyLevel.slice(1)}
          </span>
        </div>
        <CardDescription>{exercise.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium mb-1">Targets</h4>
            <div className="flex flex-wrap gap-1.5">
              {exercise.muscleGroups.map(muscle => {
                const Icon = muscleGroupIcons[muscle.toLowerCase()] || Dumbbell;
                return (
                  <span key={muscle} className="inline-flex items-center gap-1 text-xs bg-neutral-100 px-2 py-1 rounded-full">
                    <Icon className="h-3.5 w-3.5 text-neutral-500" />
                    {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                  </span>
                );
              })}
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full gap-1"
            onClick={() => {
              toast({
                title: "Exercise Details",
                description: `Opening detailed view for ${exercise.name}.`,
              });
            }}
          >
            View Details <ChevronDown className="h-4 w-4" />
          </Button>

          {exercise.videoUrl && (
            <Button 
              variant="default" 
              className="w-full gap-1"
              onClick={() => {
                toast({
                  title: "Video Tutorial",
                  description: `Opening video for ${exercise.name}.`,
                });
                window.open(exercise.videoUrl, '_blank');
              }}
            >
              Watch Tutorial <Play className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function StrengthExercisesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
  
  // Extract unique muscle groups
  const allMuscleGroups = Array.from(
    new Set(bodyweightExercises.flatMap(ex => ex.muscleGroups))
  );
  
  // Filter exercises based on search and filters
  const filteredExercises = bodyweightExercises.filter(exercise => {
    // Search filter
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exercise.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Difficulty filter
    const matchesDifficulty = selectedDifficulty.length === 0 || 
                             selectedDifficulty.includes(exercise.difficultyLevel);
    
    // Muscle group filter
    const matchesMuscleGroup = selectedMuscleGroups.length === 0 || 
                              exercise.muscleGroups.some(muscle => 
                                selectedMuscleGroups.includes(muscle));
    
    return matchesSearch && matchesDifficulty && matchesMuscleGroup;
  });

  return (
    <div className="flex h-screen max-w-full overflow-hidden">
      <Sidebar />
      <MobileMenu />

      <main className="flex-1 overflow-y-auto bg-neutral-lighter pt-0 md:pt-4 pb-16 md:pb-4 px-4 md:px-6">
        {/* For mobile view padding to account for fixed header */}
        <div className="md:hidden pt-20"></div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading text-neutral-darker">Strength Exercises</h1>
            <p className="text-neutral-medium mt-1">
              Bodyweight strength training to complement your running program
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Exercises</TabsTrigger>
            <TabsTrigger value="upper">Upper Body</TabsTrigger>
            <TabsTrigger value="lower">Lower Body</TabsTrigger>
            <TabsTrigger value="core">Core</TabsTrigger>
            <TabsTrigger value="full">Full Body</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
              <Input 
                placeholder="Search exercises..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    <Filter className="h-4 w-4" /> Difficulty
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {['beginner', 'intermediate', 'advanced'].map(difficulty => (
                    <DropdownMenuCheckboxItem
                      key={difficulty}
                      checked={selectedDifficulty.includes(difficulty)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDifficulty([...selectedDifficulty, difficulty]);
                        } else {
                          setSelectedDifficulty(
                            selectedDifficulty.filter(d => d !== difficulty)
                          );
                        }
                      }}
                    >
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    <Dumbbell className="h-4 w-4" /> Muscle Groups
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {allMuscleGroups.map(muscle => (
                    <DropdownMenuCheckboxItem
                      key={muscle}
                      checked={selectedMuscleGroups.includes(muscle)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMuscleGroups([...selectedMuscleGroups, muscle]);
                        } else {
                          setSelectedMuscleGroups(
                            selectedMuscleGroups.filter(m => m !== muscle)
                          );
                        }
                      }}
                    >
                      {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExercises.map(exercise => (
                <ExerciseCard key={exercise.id} exercise={exercise} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="upper" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExercises
                .filter(ex => 
                  ex.muscleGroups.some(m => 
                    ['chest', 'shoulders', 'triceps', 'back'].includes(m.toLowerCase())
                  )
                )
                .map(exercise => (
                  <ExerciseCard key={exercise.id} exercise={exercise} />
                ))
              }
            </div>
          </TabsContent>
          
          <TabsContent value="lower" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExercises
                .filter(ex => 
                  ex.muscleGroups.some(m => 
                    ['quadriceps', 'hamstrings', 'glutes', 'hip flexors'].includes(m.toLowerCase())
                  )
                )
                .map(exercise => (
                  <ExerciseCard key={exercise.id} exercise={exercise} />
                ))
              }
            </div>
          </TabsContent>
          
          <TabsContent value="core" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExercises
                .filter(ex => 
                  ex.muscleGroups.some(m => 
                    ['core', 'lower back'].includes(m.toLowerCase())
                  )
                )
                .map(exercise => (
                  <ExerciseCard key={exercise.id} exercise={exercise} />
                ))
              }
            </div>
          </TabsContent>
          
          <TabsContent value="full" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExercises
                .filter(ex => 
                  ex.muscleGroups.includes('full body')
                )
                .map(exercise => (
                  <ExerciseCard key={exercise.id} exercise={exercise} />
                ))
              }
            </div>
          </TabsContent>
        </Tabs>

        {/* Workout Tips Section */}
        <div className="mt-8 mb-6">
          <h2 className="text-xl font-semibold font-heading text-neutral-darker mb-4">
            Strength Training For Runners
          </h2>
          
          <Card>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Why Strength Training Matters</h3>
                  <p className="text-neutral-medium mb-4">
                    Regular strength training helps runners prevent injuries, improve running economy, 
                    and enhance overall performance. Just 2-3 sessions per week can make a significant difference.
                  </p>
                  
                  <h3 className="text-lg font-medium mb-2">Best Practices</h3>
                  <ul className="text-neutral-medium space-y-2 list-disc pl-5">
                    <li>Schedule strength workouts after running or on separate days</li>
                    <li>Focus on multi-joint exercises that work multiple muscle groups</li>
                    <li>Start with bodyweight exercises before adding external resistance</li>
                    <li>Allow 48 hours of recovery between strength sessions for the same muscle groups</li>
                    <li>Aim for 2-3 strength sessions per week of 20-30 minutes each</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Recovery Tips</h3>
                  <p className="text-neutral-medium mb-4">
                    Proper recovery is essential for adapting to the stress of combined running and strength training.
                  </p>
                  
                  <ul className="text-neutral-medium space-y-2 list-disc pl-5">
                    <li>Prioritize protein intake within 30 minutes post-workout</li>
                    <li>Stay hydrated before, during, and after training</li>
                    <li>Get adequate sleep (7-9 hours for most adults)</li>
                    <li>Consider foam rolling and gentle stretching on rest days</li>
                    <li>Listen to your body and adjust intensity as needed</li>
                    <li>Remember that improvement comes during recovery, not during the workout itself</li>
                  </ul>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Sample Workout Structure</h3>
                <p className="text-neutral-medium mb-4">
                  Try this simple format for your strength training sessions:
                </p>
                
                <ol className="text-neutral-medium space-y-3 list-decimal pl-5">
                  <li>
                    <strong>Warm-up (5 min):</strong> Light cardio and dynamic stretches
                  </li>
                  <li>
                    <strong>Core activation (5 min):</strong> Planks, hollow body holds, or similar exercises
                  </li>
                  <li>
                    <strong>Main exercises (15 min):</strong> 3-5 compound movements like squats, lunges, push-ups
                  </li>
                  <li>
                    <strong>Cool down (5 min):</strong> Gentle stretching for worked muscle groups
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}