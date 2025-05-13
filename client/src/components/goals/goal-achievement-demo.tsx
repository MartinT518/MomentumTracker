import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Achievement } from '@/lib/achievements';
import { AchievementService } from '@/lib/achievement-service';

/**
 * This component demonstrates the achievement system by providing
 * buttons to trigger different types of achievement popups.
 */
export function GoalAchievementDemo() {
  const handleDemoClick = (type: string) => {
    // Create sample achievements for demo purposes
    let achievement: Achievement;
    
    switch (type) {
      case 'milestone':
        achievement = {
          id: Math.floor(Math.random() * 10000), // Random ID for demo
          user_id: 1,
          title: '100km Club',
          description: "You've run a total of 100 kilometers since joining MomentumRun!",
          achievement_type: 'milestone',
          badge_image: '/assets/badges/milestone-badge.svg',
          earned_at: new Date(),
          times_earned: 1,
          viewed: false,
          progress: {
            current: 100,
            target: 100,
            unit: 'km'
          }
        };
        break;
        
      case 'streak':
        achievement = {
          id: Math.floor(Math.random() * 10000),
          user_id: 1,
          title: '7-Day Streak',
          description: "You've completed workouts for 7 consecutive days!",
          achievement_type: 'streak',
          badge_image: '/assets/badges/streak-badge.svg',
          earned_at: new Date(),
          times_earned: 1,
          viewed: false,
          progress: {
            current: 7,
            target: 7,
            unit: 'days'
          }
        };
        break;
        
      case 'personal_best':
        achievement = {
          id: Math.floor(Math.random() * 10000),
          user_id: 1,
          title: '5K Personal Best',
          description: 'You set a new personal record for 5K: 22:15',
          achievement_type: 'personal_best',
          badge_image: '/assets/badges/pb-badge.svg',
          earned_at: new Date(),
          times_earned: 1,
          viewed: false,
          achievement_data: {
            old_record: '23:05',
            new_record: '22:15',
            improvement: '0:50',
            distance: '5K'
          }
        };
        break;
        
      case 'race':
        achievement = {
          id: Math.floor(Math.random() * 10000),
          user_id: 1,
          title: 'Half Marathon Finisher',
          description: "You've completed your half marathon goal race!",
          achievement_type: 'race',
          badge_image: '/assets/badges/race-badge.svg',
          earned_at: new Date(),
          times_earned: 1,
          viewed: false,
          achievement_data: {
            race_name: 'Spring Half Marathon',
            finish_time: '1:45:22',
            position: '156 of 1243'
          }
        };
        break;
        
      default: // challenge
        achievement = {
          id: Math.floor(Math.random() * 10000),
          user_id: 1,
          title: 'May Distance Challenge',
          description: "You've completed the May distance challenge of 150km!",
          achievement_type: 'challenge',
          badge_image: '/assets/badges/challenge-badge.svg',
          earned_at: new Date(),
          times_earned: 1,
          viewed: false,
          progress: {
            current: 150,
            target: 150,
            unit: 'km'
          }
        };
    }
    
    // Trigger the achievement popup by dispatching an event
    AchievementService.triggerAchievementEvent(achievement);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Goal Achievement Examples</CardTitle>
        <CardDescription>
          Click the buttons below to see examples of different achievement popups
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center"
            onClick={() => handleDemoClick('milestone')}
          >
            <span className="text-2xl mb-2">🏅</span>
            <span>Milestone</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center"
            onClick={() => handleDemoClick('streak')}
          >
            <span className="text-2xl mb-2">🔥</span>
            <span>Streak</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center"
            onClick={() => handleDemoClick('personal_best')}
          >
            <span className="text-2xl mb-2">🚀</span>
            <span>Personal Best</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center"
            onClick={() => handleDemoClick('race')}
          >
            <span className="text-2xl mb-2">🏁</span>
            <span>Race</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center"
            onClick={() => handleDemoClick('challenge')}
          >
            <span className="text-2xl mb-2">🏆</span>
            <span>Challenge</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}