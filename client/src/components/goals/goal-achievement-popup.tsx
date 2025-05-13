import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Award, Trophy, Clock, Medal, Target, Calendar, Zap, Flag } from "lucide-react";
import { Achievement } from '@/lib/achievements';
import { useToast } from '@/hooks/use-toast';
import { celebrateWithConfetti } from '@/lib/achievements';

interface GoalAchievementPopupProps {
  // Optional custom props can be added here
}

export function GoalAchievementPopup(props: GoalAchievementPopupProps) {
  const [visible, setVisible] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const { toast } = useToast();

  // Listen for custom achievement event
  useEffect(() => {
    const handleAchievementEvent = (event: CustomEvent) => {
      const achievement = event.detail.achievement;
      if (achievement) {
        setAchievements(prevAchievements => [...prevAchievements, achievement]);
      }
    };

    // Add event listener for achievement events
    window.addEventListener('achievement-earned' as any, handleAchievementEvent as EventListener);

    // Cleanup event listener
    return () => {
      window.removeEventListener('achievement-earned' as any, handleAchievementEvent as EventListener);
    };
  }, []);

  // Process achievement queue
  useEffect(() => {
    if (achievements.length > 0 && !visible) {
      // Get the next achievement
      const achievement = achievements[0];
      setCurrentAchievement(achievement);
      setVisible(true);
      
      // Remove from queue
      setAchievements(prevAchievements => prevAchievements.slice(1));
      
      // Play celebration animation
      celebrateWithConfetti();
    }
  }, [achievements, visible]);

  const handleClose = () => {
    setVisible(false);
    setCurrentAchievement(null);
    
    // If there are more achievements in the queue, show the next one after a short delay
    if (achievements.length > 0) {
      setTimeout(() => {
        const achievement = achievements[0];
        setCurrentAchievement(achievement);
        setVisible(true);
        
        // Remove from queue
        setAchievements(prevAchievements => prevAchievements.slice(1));
        
        // Play celebration animation
        celebrateWithConfetti();
      }, 500);
    }
  };

  if (!visible || !currentAchievement) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <Card className="w-full max-w-md bg-white rounded-xl shadow-2xl border-0 animate-popup">
        <CardHeader className="pb-4 text-center">
          <div className="mx-auto mb-4 bg-primary/10 p-3 rounded-full">
            <AchievementIcon type={currentAchievement.achievement_type || currentAchievement.type || 'milestone'} />
          </div>
          <CardTitle className="text-xl font-bold text-primary">Achievement Unlocked!</CardTitle>
          <CardDescription className="text-lg font-medium mt-1">
            {currentAchievement.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pb-4">
          <div className="mb-4 text-neutral-600">
            {currentAchievement.description}
          </div>
          
          {/* Progress bar - only shown for achievements with progress data */}
          {currentAchievement.progress && (
            <div className="mb-6 mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>{currentAchievement.progress.current} {currentAchievement.progress.unit}</span>
                <span>{currentAchievement.progress.target} {currentAchievement.progress.unit}</span>
              </div>
              <Progress
                value={(currentAchievement.progress.current / currentAchievement.progress.target) * 100}
                className="h-2"
              />
            </div>
          )}
          
          <div className="inline-flex items-center text-sm text-neutral-500 mt-2">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Earned {new Date(currentAchievement.earned_at).toLocaleDateString()}</span>
          </div>
        </CardContent>
        <CardFooter className="pt-0 pb-4 flex justify-center">
          <Button onClick={handleClose} className="w-32">Awesome!</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function getDefaultBadgeImage(type: string): string {
  switch (type.toLowerCase()) {
    case 'milestone':
      return '/assets/badges/milestone-badge.svg';
    case 'streak':
      return '/assets/badges/streak-badge.svg';
    case 'personal_best':
    case 'personal-best':
      return '/assets/badges/pb-badge.svg';
    case 'challenge':
      return '/assets/badges/challenge-badge.svg';
    case 'race':
      return '/assets/badges/race-badge.svg';
    default:
      return '/assets/badges/achievement-badge.svg';
  }
}

function AchievementIcon({ type }: { type: string }) {
  const iconClass = "h-8 w-8 text-primary";
  
  switch (type.toLowerCase()) {
    case 'milestone':
      return <Flag className={iconClass} />;
    case 'streak':
      return <Zap className={iconClass} />;
    case 'personal_best':
    case 'personal-best':
      return <Trophy className={iconClass} />;
    case 'race':
      return <Medal className={iconClass} />;
    case 'challenge':
      return <Target className={iconClass} />;
    default:
      return <Award className={iconClass} />;
  }
}