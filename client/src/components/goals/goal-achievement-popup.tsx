import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAchievements } from '@/hooks/use-achievements';
import { celebrateWithConfetti } from '@/lib/achievements';

interface GoalAchievementPopupProps {
  // Optional custom props can be added here
}

export function GoalAchievementPopup(props: GoalAchievementPopupProps) {
  const { currentAchievement, hideAchievement } = useAchievements();
  
  useEffect(() => {
    // When an achievement is displayed, trigger confetti animation
    if (currentAchievement) {
      celebrateWithConfetti();
    }
  }, [currentAchievement]);
  
  if (!currentAchievement) {
    return null;
  }
  
  const badgeImage = currentAchievement.badge_image || getDefaultBadgeImage(currentAchievement.type);
  
  return (
    <Dialog open={!!currentAchievement} onOpenChange={(open) => !open && hideAchievement()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4 w-24 h-24 flex items-center justify-center">
            {badgeImage ? (
              <img src={badgeImage} alt="Achievement badge" className="w-16 h-16" />
            ) : (
              <AchievementIcon type={currentAchievement.type} />
            )}
          </div>
          <DialogTitle className="text-xl font-bold text-primary">
            Achievement Unlocked!
          </DialogTitle>
          <DialogTitle className="text-lg">
            {currentAchievement.title}
          </DialogTitle>
          <DialogDescription className="mt-2">
            {currentAchievement.description}
          </DialogDescription>
        </DialogHeader>
        
        {currentAchievement.progress && (
          <div className="flex flex-col items-center px-4 py-2 gap-1">
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${(currentAchievement.progress.current / currentAchievement.progress.target) * 100}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {currentAchievement.progress.current} / {currentAchievement.progress.target} {currentAchievement.progress.unit}
            </span>
          </div>
        )}
        
        <DialogFooter className="sm:justify-center mt-4">
          <Button
            onClick={hideAchievement}
            className="w-full sm:w-auto"
            variant="default"
          >
            Keep Crushing It! 💪
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getDefaultBadgeImage(type: string): string {
  // You could implement logic to return different badge images based on achievement type
  return '';
}

function AchievementIcon({ type }: { type: string }) {
  // Return different SVG icons based on achievement type
  switch (type) {
    case 'milestone':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      );
    case 'race':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <line x1="13" x2="13" y1="4" y2="20" />
          <polyline points="19 4 19 11 13 11" />
          <polyline points="7 20 7 4 13 4" />
        </svg>
      );
    case 'streak':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'personal_best':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      );
    case 'challenge':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <path d="M12 17.8 5.8 21 7 14.1 2 9.3l7-1L12 2l3 6.3 7 1-5 4.8 1.2 6.9-6.2-3.2Z" />
        </svg>
      );
  }
}