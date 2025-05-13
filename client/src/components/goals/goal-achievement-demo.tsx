import { Button } from "@/components/ui/button";
import { useAchievements } from "@/hooks/use-achievements";

export function GoalAchievementDemo() {
  const { showAchievement } = useAchievements();

  const demoAchievements = [
    {
      id: 1,
      title: "First 5K Run Complete",
      description: "You've completed your first 5K run! Great job taking this milestone step in your running journey.",
      type: "milestone",
      achievedDate: new Date().toISOString(),
      progress: {
        current: 5,
        target: 5,
        unit: "km"
      }
    },
    {
      id: 2,
      title: "7-Day Streak",
      description: "You've been consistent for 7 days straight! Keep up the momentum.",
      type: "streak",
      achievedDate: new Date().toISOString()
    },
    {
      id: 3,
      title: "Half Marathon Conqueror",
      description: "You've successfully completed a half marathon! Amazing achievement.",
      type: "race",
      achievedDate: new Date().toISOString(),
      progress: {
        current: 21.1,
        target: 21.1,
        unit: "km"
      }
    },
    {
      id: 4,
      title: "New 10K Personal Best",
      description: "You've set a new personal record for your 10K time!",
      type: "personal_best",
      achievedDate: new Date().toISOString()
    }
  ];

  return (
    <div className="flex flex-col gap-2 p-4 bg-muted/40 rounded-lg">
      <h3 className="text-md font-semibold mb-2">Achievement Demos</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Click on any achievement below to see how the celebration will appear when a user accomplishes a goal.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {demoAchievements.map((achievement) => (
          <Button 
            key={achievement.id}
            variant="outline" 
            onClick={() => showAchievement(achievement)}
            className="justify-start h-auto py-3 px-4"
          >
            <div className="flex flex-col items-start">
              <span className="font-medium">{achievement.title}</span>
              <span className="text-xs text-muted-foreground">{achievement.type}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}