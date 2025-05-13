/**
 * Utility functions and constants for the achievement system
 */

import confetti from 'canvas-confetti';

export type Achievement = {
  id: number;
  title: string;
  description: string;
  type: AchievementType;
  achievedDate: string;
  progress?: {
    current: number;
    target: number;
    unit: string;
  };
  viewed?: boolean;
  badge_image?: string;
};

export type AchievementType = 'race' | 'milestone' | 'streak' | 'personal_best' | 'challenge';

/**
 * Achievement template functions to create achievement objects
 */
export const achievementTemplates = {
  firstRun: (
    date: Date
  ): Achievement => ({
    id: 0, // Will be assigned by server
    title: 'First Steps',
    description: 'Completed your first run',
    type: 'milestone',
    achievedDate: date.toISOString(),
  }),
  
  distanceMilestone: (
    distance: number,
    date: Date
  ): Achievement => ({
    id: 0,
    title: `${distance} Miles Club`,
    description: `Ran a total of ${distance} miles`,
    type: 'milestone',
    achievedDate: date.toISOString(),
    progress: {
      current: distance,
      target: distance,
      unit: 'miles'
    }
  }),
  
  streakAchievement: (
    days: number,
    date: Date
  ): Achievement => ({
    id: 0,
    title: `${days}-Day Streak`,
    description: `Ran for ${days} consecutive days`,
    type: 'streak',
    achievedDate: date.toISOString(),
    progress: {
      current: days,
      target: days,
      unit: 'days'
    }
  }),
  
  raceCompletion: (
    raceType: string,
    date: Date
  ): Achievement => ({
    id: 0,
    title: `${raceType} Finisher`,
    description: `Completed a ${raceType} race`,
    type: 'race',
    achievedDate: date.toISOString(),
  }),
  
  personalBest: (
    metric: string,
    value: string,
    date: Date
  ): Achievement => ({
    id: 0,
    title: `Personal Best: ${metric}`,
    description: `New personal best: ${value} for ${metric}`,
    type: 'personal_best',
    achievedDate: date.toISOString(),
  }),
};

/**
 * Check if a workout is a personal best based on various metrics
 * @param currentWorkout The workout to check
 * @param previousWorkouts Array of previous workouts to compare against
 * @returns Achievement if it's a PB, null otherwise
 */
export function checkForPersonalBest(
  currentWorkout: any,
  previousWorkouts: any[]
): Achievement | null {
  // Filter workouts of same type and distance range (±10%)
  const comparableWorkouts = previousWorkouts.filter(w => {
    return w.activity_type === currentWorkout.activity_type &&
      Math.abs(w.distance - currentWorkout.distance) / currentWorkout.distance < 0.1;
  });
  
  if (comparableWorkouts.length === 0) return null;
  
  // Check for pace personal best (lower is better)
  const currentPace = currentWorkout.duration / currentWorkout.distance; // time per distance unit
  const bestPreviousPace = Math.min(...comparableWorkouts.map(w => w.duration / w.distance));
  
  if (currentPace < bestPreviousPace) {
    const paceImprovement = (bestPreviousPace - currentPace) / bestPreviousPace * 100;
    const paceMinPerMile = Math.floor(currentPace / 60) + ':' + 
      (Math.round(currentPace % 60)).toString().padStart(2, '0');
    
    return achievementTemplates.personalBest(
      `${currentWorkout.distance.toFixed(1)} mile pace`,
      `${paceMinPerMile} min/mile (${paceImprovement.toFixed(1)}% improvement)`,
      new Date(currentWorkout.activity_date)
    );
  }
  
  return null;
}

/**
 * Check for achievements related to cumulative metrics (e.g., total distance)
 */
export function checkForCumulativeAchievements(
  activities: any[],
  currentActivity: any
): Achievement[] {
  const milestones = [10, 25, 50, 100, 250, 500, 1000, 2000];
  const achievements: Achievement[] = [];
  
  // Calculate total distance including current activity
  const totalDistance = activities.reduce((sum, act) => sum + (act.distance || 0), 0) + 
    (currentActivity.distance || 0);
  
  // Find the highest milestone reached
  const milestone = milestones.filter(m => totalDistance >= m).pop();
  
  if (milestone) {
    // Check if this milestone was already achieved
    const alreadyAchieved = activities.some(a => 
      a.achievements?.some((ach: any) => 
        ach.type === 'milestone' && ach.title === `${milestone} Miles Club`
      )
    );
    
    if (!alreadyAchieved) {
      achievements.push(achievementTemplates.distanceMilestone(
        milestone,
        new Date(currentActivity.activity_date)
      ));
    }
  }
  
  return achievements;
}

/**
 * Check for streak achievements
 */
export function checkForStreakAchievements(
  activities: any[],
  currentActivity: any
): Achievement | null {
  const streakMilestones = [3, 7, 14, 21, 30, 60, 90, 180, 365];
  const allActivities = [...activities, currentActivity].sort((a, b) => 
    new Date(a.activity_date).getTime() - new Date(b.activity_date).getTime()
  );
  
  // Calculate current streak
  let currentStreak = 1;
  let maxStreak = 1;
  
  for (let i = 1; i < allActivities.length; i++) {
    const prevDate = new Date(allActivities[i-1].activity_date);
    const currDate = new Date(allActivities[i].activity_date);
    
    // Calculate days between activities
    const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 1) {
      // Consecutive days
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (dayDiff > 1) {
      // Streak broken
      currentStreak = 1;
    }
  }
  
  // Find the highest streak milestone reached
  const streakMilestone = streakMilestones.filter(m => maxStreak >= m).pop();
  
  if (streakMilestone) {
    // Check if this streak was already achieved
    const alreadyAchieved = activities.some(a => 
      a.achievements?.some((ach: any) => 
        ach.type === 'streak' && ach.title === `${streakMilestone}-Day Streak`
      )
    );
    
    if (!alreadyAchieved) {
      return achievementTemplates.streakAchievement(
        streakMilestone,
        new Date(currentActivity.activity_date)
      );
    }
  }
  
  return null;
}

/**
 * Check for race achievements
 */
export function checkForRaceCompletion(
  currentActivity: any
): Achievement | null {
  const raceDistances: Record<string, string> = {
    '5K': 'a 5K race',
    '10K': 'a 10K race',
    'Half Marathon': 'a Half Marathon',
    'Marathon': 'a Marathon',
    'Ultra': 'an Ultra Marathon'
  };
  
  // Check if this is a race
  if (currentActivity.is_race) {
    let raceType = 'Race';
    
    // Determine race type based on distance
    const distance = currentActivity.distance;
    if (distance >= 3 && distance < 3.5) raceType = '5K';
    else if (distance >= 6 && distance < 6.5) raceType = '10K';
    else if (distance >= 13 && distance < 13.5) raceType = 'Half Marathon';
    else if (distance >= 26 && distance < 26.5) raceType = 'Marathon';
    else if (distance >= 31) raceType = 'Ultra';
    
    return achievementTemplates.raceCompletion(
      raceType,
      new Date(currentActivity.activity_date)
    );
  }
  
  return null;
}

/**
 * Trigger confetti animation for achievement celebration
 */
export function celebrateWithConfetti(): void {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 1500
  };

  function fire(particleRatio: number, opts: any) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  
  fire(0.2, {
    spread: 60,
  });
  
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });
  
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });
  
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}