import confetti from 'canvas-confetti';

/**
 * Achievement interface describing the structure of achievement objects
 */
export interface Achievement {
  id: number;
  user_id: number;
  title: string;
  description: string;
  achievement_type: string;
  type?: string; // Alias for achievement_type
  badge_image?: string;
  earned_at: Date;
  times_earned: number;
  viewed: boolean;
  achievement_data?: any;
  // Optional fields used for progress display
  progress?: {
    current: number;
    target: number;
    unit: string;
  };
}

/**
 * Distance milestones for achievements (in kilometers)
 */
export const distanceMilestones = [
  { distance: 50, title: '50km Club', description: "You've run a total of 50 kilometers!" },
  { distance: 100, title: '100km Club', description: "You've run a total of 100 kilometers!" },
  { distance: 250, title: '250km Club', description: "You've run a total of 250 kilometers!" },
  { distance: 500, title: '500km Club', description: "You've run a total of 500 kilometers!" },
  { distance: 1000, title: '1,000km Club', description: "You've run a total of 1,000 kilometers!" },
  { distance: 2500, title: '2,500km Club', description: "You've run a total of 2,500 kilometers!" },
  { distance: 5000, title: '5,000km Club', description: "You've run a total of 5,000 kilometers!" },
  { distance: 10000, title: '10,000km Club', description: "You've run a total of 10,000 kilometers!" },
];

/**
 * Streak thresholds for achievements (in days)
 */
export const streakThresholds = [
  { days: 3, title: '3-Day Streak', description: "You've completed workouts for 3 consecutive days!" },
  { days: 7, title: '7-Day Streak', description: "You've completed workouts for 7 consecutive days!" },
  { days: 14, title: '14-Day Streak', description: "You've completed workouts for 2 weeks straight!" },
  { days: 21, title: '21-Day Streak', description: "You've completed workouts for 3 weeks straight!" },
  { days: 30, title: '30-Day Streak', description: "You've completed workouts for a full month!" },
  { days: 60, title: '60-Day Streak', description: "You've completed workouts for 2 months straight!" },
  { days: 90, title: '90-Day Streak', description: "You've completed workouts for 3 months straight!" },
  { days: 180, title: '180-Day Streak', description: "You've completed workouts for 6 months straight!" },
  { days: 365, title: '365-Day Streak', description: "You've completed workouts for a full year!" },
];

/**
 * Check if an activity qualifies as a personal best
 * @param newActivity The newly completed activity
 * @param previousActivities Array of user's previous activities
 * @returns Achievement object if a personal best was achieved, null otherwise
 */
export function checkForPersonalBest(
  newActivity: any, 
  previousActivities: any[]
): Achievement | null {
  // Filter activities of the same type and similar distance
  const similarActivities = previousActivities.filter(activity => {
    return activity.activity_type === newActivity.activity_type &&
           Math.abs(activity.distance - newActivity.distance) < 0.5; // Within 0.5km
  });
  
  if (similarActivities.length === 0) {
    return null; // No similar activities to compare with
  }
  
  // Sort by pace (seconds per kilometer)
  const activityWithPace = {
    ...newActivity,
    pace: newActivity.duration / (newActivity.distance / 1000) // Seconds per kilometer
  };
  
  const previousBestPace = Math.min(
    ...similarActivities.map(activity => activity.duration / (activity.distance / 1000))
  );
  
  // Check if new activity is faster than previous best
  if (activityWithPace.pace < previousBestPace) {
    // Calculate improvement percentage
    const improvementSeconds = previousBestPace - activityWithPace.pace;
    const improvementPercentage = (improvementSeconds / previousBestPace) * 100;
    
    // Format improvement nicely
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    // Create achievement
    return {
      id: 0, // Will be assigned by server
      user_id: newActivity.user_id,
      title: `${newActivity.activity_type} Personal Best`,
      description: `You set a new personal record for ${newActivity.activity_type} with a pace of ${formatTime(activityWithPace.pace)} min/km!`,
      achievement_type: 'personal_best',
      earned_at: new Date(),
      times_earned: 1,
      viewed: false,
      achievement_data: {
        old_pace: formatTime(previousBestPace),
        new_pace: formatTime(activityWithPace.pace),
        improvement_seconds: improvementSeconds,
        improvement_percentage: improvementPercentage.toFixed(1),
        activity_type: newActivity.activity_type,
        distance: newActivity.distance
      }
    };
  }
  
  return null;
}

/**
 * Check for cumulative achievements (distance milestones)
 * @param activities Array of all user activities 
 * @returns Array of earned milestone achievements
 */
export function checkForCumulativeAchievements(activities: any[]): Achievement[] {
  const achievements: Achievement[] = [];
  
  // Calculate total distance
  const totalDistance = activities.reduce(
    (sum, activity) => sum + (activity.distance || 0), 
    0
  ) / 1000; // Convert to kilometers
  
  // Check which milestones have been achieved
  for (const milestone of distanceMilestones) {
    if (totalDistance >= milestone.distance) {
      achievements.push({
        id: 0, // Will be assigned by server
        user_id: activities[0]?.user_id,
        title: milestone.title,
        description: milestone.description,
        achievement_type: 'milestone',
        earned_at: new Date(),
        times_earned: 1,
        viewed: false,
        progress: {
          current: totalDistance,
          target: milestone.distance,
          unit: 'km'
        }
      });
    }
  }
  
  return achievements;
}

/**
 * Check for streak-based achievements
 * @param activities Array of all user activities sorted by date
 * @returns Array of earned streak achievements
 */
export function checkForStreakAchievements(activities: any[]): Achievement[] {
  const achievements: Achievement[] = [];
  
  if (!activities.length) return achievements;
  
  // Group activities by date
  const activitiesByDate = new Map<string, any[]>();
  
  activities.forEach(activity => {
    const date = new Date(activity.activity_date).toISOString().split('T')[0];
    if (!activitiesByDate.has(date)) {
      activitiesByDate.set(date, []);
    }
    activitiesByDate.get(date)?.push(activity);
  });
  
  // Get unique dates with activities
  const dates = Array.from(activitiesByDate.keys()).sort();
  
  // Calculate current streak
  let currentStreak = 1;
  let maxStreak = 1;
  
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    
    // Check if dates are consecutive
    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  
  // Check which streak thresholds have been reached
  for (const threshold of streakThresholds) {
    if (maxStreak >= threshold.days) {
      achievements.push({
        id: 0, // Will be assigned by server
        user_id: activities[0]?.user_id,
        title: threshold.title,
        description: threshold.description,
        achievement_type: 'streak',
        earned_at: new Date(),
        times_earned: 1,
        viewed: false,
        progress: {
          current: maxStreak,
          target: threshold.days,
          unit: 'days'
        }
      });
    }
  }
  
  return achievements;
}

/**
 * Create confetti animation to celebrate achievement
 */
export function celebrateWithConfetti() {
  // Default to center if canvas-confetti can't determine window size
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999
  };

  // Fire confetti from left and right sides
  function fire(particleRatio: number, opts: any) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(200 * particleRatio)
    });
  }

  // Rainbow confetti
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    origin: { x: 0.2 }
  });
  fire(0.2, {
    spread: 60,
    origin: { x: 0.8 }
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    origin: { x: 0.5 }
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    origin: { x: 0.3 }
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    origin: { x: 0.7 }
  });
}