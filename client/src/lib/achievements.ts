/**
 * Utility functions and constants for the achievement system
 */

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
};

export type AchievementType = 'race' | 'milestone' | 'streak' | 'personal_best' | 'challenge';

// Achievement templates that can be used with appropriate substitutions
export const achievementTemplates = {
  // Race completion achievements
  raceCompletion: (
    distance: string,
    date: Date,
    progress?: { current: number; target: number; unit: string }
  ): Achievement => ({
    id: Date.now(),
    title: `${distance} Race Complete`,
    description: `You successfully completed a ${distance} race!`,
    type: 'race',
    achievedDate: date.toISOString(),
    progress,
  }),
  
  // Personal best achievements
  personalBest: (
    activity: string,
    metric: string,
    value: string,
    date: Date
  ): Achievement => ({
    id: Date.now(),
    title: `New ${activity} Personal Best`,
    description: `You set a new personal record: ${metric} of ${value}!`,
    type: 'personal_best',
    achievedDate: date.toISOString(),
  }),
  
  // Streak achievements
  streak: (
    count: number,
    activity: string,
    date: Date
  ): Achievement => ({
    id: Date.now(),
    title: `${count}-Day ${activity} Streak`,
    description: `You've maintained a consistent ${activity} routine for ${count} days!`,
    type: 'streak',
    achievedDate: date.toISOString(),
    progress: {
      current: count,
      target: count,
      unit: 'days',
    },
  }),
  
  // Milestone achievements
  milestone: (
    activity: string,
    milestone: string,
    value: number,
    unit: string,
    date: Date
  ): Achievement => ({
    id: Date.now(),
    title: `${milestone} Milestone`,
    description: `You've reached ${value}${unit} in ${activity}!`,
    type: 'milestone',
    achievedDate: date.toISOString(),
    progress: {
      current: value,
      target: value,
      unit,
    },
  }),
  
  // Challenge achievements
  challenge: (
    challengeName: string,
    date: Date
  ): Achievement => ({
    id: Date.now(),
    title: `Challenge Complete: ${challengeName}`,
    description: `You've successfully completed the ${challengeName} challenge!`,
    type: 'challenge',
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
  if (!previousWorkouts.length) return null;
  
  // Filter similar workouts (same type, similar distance)
  const similarWorkouts = previousWorkouts.filter(
    (w) => 
      w.activity_type === currentWorkout.activity_type &&
      Math.abs(w.distance - currentWorkout.distance) < currentWorkout.distance * 0.1 // Within 10%
  );
  
  if (!similarWorkouts.length) return null;
  
  // Check for pace PB (lower is better)
  const currentPace = currentWorkout.duration / currentWorkout.distance; // Minutes per km/mile
  const previousBestPace = Math.min(...similarWorkouts.map(w => w.duration / w.distance));
  
  if (currentPace < previousBestPace) {
    // Format pace for display
    const paceMinutes = Math.floor(currentPace);
    const paceSeconds = Math.floor((currentPace - paceMinutes) * 60);
    const formattedPace = `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`;
    
    // Create pace PB achievement
    return achievementTemplates.personalBest(
      currentWorkout.activity_type,
      'Pace',
      `${formattedPace}/km`,
      new Date(currentWorkout.activity_date)
    );
  }
  
  // Check for distance PB (for same activity type)
  const sameTypeWorkouts = previousWorkouts.filter(w => w.activity_type === currentWorkout.activity_type);
  const previousBestDistance = Math.max(...sameTypeWorkouts.map(w => w.distance));
  
  if (currentWorkout.distance > previousBestDistance) {
    return achievementTemplates.personalBest(
      currentWorkout.activity_type,
      'Distance',
      `${currentWorkout.distance.toFixed(2)} km`,
      new Date(currentWorkout.activity_date)
    );
  }
  
  return null;
}

/**
 * Check for achievements related to cumulative metrics (e.g., total distance)
 */
export function checkForCumulativeAchievements(
  workouts: any[],
  newActivity: any
): Achievement[] {
  const achievements: Achievement[] = [];
  
  // Calculate total distance
  const totalDistance = workouts.reduce((sum, w) => sum + w.distance, 0);
  
  // Distance milestones in km
  const distanceMilestones = [100, 250, 500, 1000, 2000, 5000];
  
  // Find the highest milestone achieved
  for (let i = distanceMilestones.length - 1; i >= 0; i--) {
    const milestone = distanceMilestones[i];
    const previousTotal = totalDistance - newActivity.distance;
    
    // Check if this activity caused crossing the milestone
    if (previousTotal < milestone && totalDistance >= milestone) {
      achievements.push(
        achievementTemplates.milestone(
          'total distance',
          `${milestone}km Lifetime Distance`,
          milestone,
          'km',
          new Date()
        )
      );
      break; // Only add the highest milestone
    }
  }
  
  return achievements;
}

/**
 * Check for streak achievements
 */
export function checkForStreakAchievements(
  workouts: any[]
): Achievement | null {
  if (workouts.length < 2) return null;
  
  // Sort workouts by date (newest first)
  const sortedWorkouts = [...workouts].sort(
    (a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
  );
  
  // Find the current streak
  let currentStreak = 1;
  let lastDate = new Date(sortedWorkouts[0].activity_date);
  lastDate.setHours(0, 0, 0, 0); // Normalize to start of day
  
  for (let i = 1; i < sortedWorkouts.length; i++) {
    const workoutDate = new Date(sortedWorkouts[i].activity_date);
    workoutDate.setHours(0, 0, 0, 0); // Normalize to start of day
    
    const dayDiff = Math.floor(
      (lastDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (dayDiff === 1) {
      // Consecutive day
      currentStreak++;
      lastDate = workoutDate;
    } else if (dayDiff === 0) {
      // Same day, continue checking
      lastDate = workoutDate;
    } else {
      // Streak broken
      break;
    }
  }
  
  // Check for streak achievements
  const streakMilestones = [3, 7, 14, 30, 60, 100];
  
  for (const milestone of streakMilestones) {
    if (currentStreak === milestone) {
      return achievementTemplates.streak(
        milestone,
        'Activity',
        new Date()
      );
    }
  }
  
  return null;
}

/**
 * Check for race achievements
 */
export function checkForRaceCompletion(
  workout: any
): Achievement | null {
  // Check if the activity is marked as a race
  if (workout.is_race) {
    let distanceName = '';
    
    // Determine race type based on distance
    if (workout.distance >= 4.8 && workout.distance <= 5.2) {
      distanceName = '5K';
    } else if (workout.distance >= 9.8 && workout.distance <= 10.2) {
      distanceName = '10K';
    } else if (workout.distance >= 20.5 && workout.distance <= 21.5) {
      distanceName = 'Half Marathon';
    } else if (workout.distance >= 41.5 && workout.distance <= 43) {
      distanceName = 'Marathon';
    } else {
      distanceName = `${workout.distance.toFixed(1)}K`;
    }
    
    return achievementTemplates.raceCompletion(
      distanceName,
      new Date(workout.activity_date),
      {
        current: workout.distance,
        target: workout.distance,
        unit: 'km'
      }
    );
  }
  
  return null;
}