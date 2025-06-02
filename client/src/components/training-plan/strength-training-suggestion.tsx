import { useState } from "react";
import { Link } from "wouter";
import { Dumbbell, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StrengthTrainingSuggestionProps {
  currentWeekSchedule: {
    date: Date;
    workoutType: string;
    intensity: "easy" | "moderate" | "hard" | "rest" | "recovery";
    completed?: boolean;
  }[];
}

export function StrengthTrainingSuggestion({ currentWeekSchedule }: StrengthTrainingSuggestionProps) {
  const [expanded, setExpanded] = useState(false);

  // Filter out days that are already marked as rest or recovery days
  const restOrRecoveryDays = currentWeekSchedule.filter(
    day => day.intensity === "rest" || day.intensity === "recovery" || day.intensity === "easy"
  );
  
  // Find best days for strength training (prioritize recovery or easy days)
  const suggestedDays = restOrRecoveryDays.slice(0, 2);
  
  if (suggestedDays.length === 0) {
    return null; // No suitable days found
  }

  // Format the date to show day of week
  const formatDay = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  return (
    <Card className="mt-4 overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-white/10 backdrop-blur-sm pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
              <Dumbbell className="h-5 w-5 text-orange-300" />
            </div>
            <CardTitle className="text-lg text-white drop-shadow-sm">Strength Training Recommendation</CardTitle>
          </div>
          <Badge variant="outline" className="bg-white/20 text-white border-white/30">
            AI Coach
          </Badge>
        </div>
        <CardDescription className="text-white/80 drop-shadow-sm">
          Strength training complements your running to improve performance and reduce injury risk
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="space-y-4">
          <p className="text-white/80 drop-shadow-sm">
            Based on your current training plan, I recommend adding strength training on:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestedDays.map((day, i) => (
              <div 
                key={i} 
                className="flex items-center p-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm"
              >
                <Calendar className="h-5 w-5 text-white/70 mr-3" />
                <div>
                  <p className="font-medium text-white drop-shadow-sm">
                    {formatDay(day.date)}
                  </p>
                  <p className="text-sm text-white/70 drop-shadow-sm">
                    {day.intensity === "rest" 
                      ? "Rest day - perfect for strength work" 
                      : day.intensity === "recovery" 
                        ? "Recovery day - good for light strength work"
                        : "Easy training day - can add moderate strength work"}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {expanded && (
            <div className="mt-4 space-y-3 animate-fadeIn">
              <h4 className="font-medium text-white drop-shadow-sm">Why add strength training?</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm text-white/80 drop-shadow-sm">
                <li>Improves running economy and efficiency</li>
                <li>Prevents injuries by strengthening supporting muscles</li>
                <li>Enhances overall athletic performance</li>
                <li>Increases power output for faster sprinting and hill climbing</li>
                <li>Corrects muscle imbalances common in runners</li>
              </ul>
              
              <h4 className="font-medium text-white drop-shadow-sm mt-4">Recommended approach:</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm text-white/80 drop-shadow-sm">
                <li>Start with bodyweight exercises if you're new to strength training</li>
                <li>Focus on compound movements that target multiple muscle groups</li>
                <li>Keep sessions to 20-30 minutes on easy or rest days</li>
                <li>Ensure 48 hours between strength sessions for the same muscle groups</li>
                <li>Prioritize form over intensity or weight</li>
              </ul>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
            className="w-full justify-between mt-2 text-white/80 hover:text-white hover:bg-white/10"
          >
            {expanded ? "Show less" : "Learn more about strength training benefits"}
            <ArrowRight className={cn(
              "h-4 w-4 ml-2 transition-transform duration-200",
              expanded && "rotate-90"
            )} />
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="bg-white/10 backdrop-blur-sm border-t border-white/20 gap-3 flex-wrap flex-col">
        <Button asChild className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30">
          <Link to="/strength-exercises">
            <Dumbbell className="h-4 w-4 mr-2" /> View Recommended Exercises
          </Link>
        </Button>
        <p className="text-xs text-white/70 text-center w-full mt-2 drop-shadow-sm">
          Free video demonstrations available for all users without subscription
        </p>
      </CardFooter>
    </Card>
  );
}