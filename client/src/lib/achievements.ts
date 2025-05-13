import { Activity } from '@shared/schema';

// Define Achievement type used throughout the application
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

// Map to define milestone achievements based on cumulative distances
export const distanceMilestones = [
  { distance: 5, title: "5K Club", description: "Run a total of 5 kilometers" },
  { distance: 10, title: "10K Club", description: "Run a total of 10 kilometers" },
  { distance: 21.1, title: "Half Marathon Distance", description: "Run a total of 21.1 kilometers" },
  { distance: 42.2, title: "Marathon Distance", description: "Run a total of 42.2 kilometers" },
  { distance: 100, title: "Century Club", description: "Run a total of 100 kilometers" },
  { distance: 250, title: "250K Club", description: "Run a total of 250 kilometers" },
  { distance: 500, title: "500K Club", description: "Run a total of 500 kilometers" },
  { distance: 1000, title: "1000K Club", description: "Run a total of 1000 kilometers" },
];

// Define streak thresholds for streak-based achievements
export const streakThresholds = [
  { days: 3, title: "3-Day Streak", description: "Complete activities for 3 consecutive days" },
  { days: 7, title: "7-Day Streak", description: "Complete activities for 7 consecutive days" },
  { days: 14, title: "2-Week Streak", description: "Complete activities for 14 consecutive days" },
  { days: 30, title: "30-Day Streak", description: "Complete activities for 30 consecutive days" },
  { days: 50, title: "50-Day Streak", description: "Complete activities for 50 consecutive days" },
  { days: 100, title: "100-Day Streak", description: "Complete activities for 100 consecutive days" },
];

/**
 * Check if an activity qualifies as a personal best
 * @param newActivity The newly completed activity
 * @param previousActivities Array of user's previous activities
 * @returns Achievement object if a personal best was achieved, null otherwise
 */
export function checkForPersonalBest(
  newActivity: Activity, 
  previousActivities: Activity[]
): Achievement | null {
  // Ensure we have a valid activity with distance and duration
  if (!newActivity.distance || !newActivity.duration) {
    return null;
  }
  
  // Calculate pace (minutes per km)
  const newPace = newActivity.duration / (newActivity.distance / 1000);
  
  // Find comparable activities (similar distance)
  const similarActivities = previousActivities.filter(activity => {
    // Similar distance (within 10%)
    const distanceDiff = Math.abs(activity.distance - newActivity.distance) / newActivity.distance;
    return (
      activity.activity_type === newActivity.activity_type && // Same activity type
      distanceDiff < 0.1 && // Within 10% distance
      activity.distance > 1 && // Ignore very short activities
      activity.duration > 0 // Must have a duration
    );
  });
  
  if (similarActivities.length === 0) {
    return null; // No comparable activities
  }
  
  // Calculate paces for all similar activities
  const previousPaces = similarActivities.map(activity => 
    activity.duration / (activity.distance / 1000)
  );
  
  // Find best previous pace
  const bestPreviousPace = Math.min(...previousPaces);
  
  // Compare with new pace
  if (newPace < bestPreviousPace) {
    // Calculate improvement percentage
    const improvementPercent = ((bestPreviousPace - newPace) / bestPreviousPace) * 100;
    
    return {
      id: 0, // Will be set by backend
      user_id: newActivity.user_id,
      title: "Personal Best",
      description: `New personal best pace for ${newActivity.distance.toFixed(1)}km ${newActivity.activity_type}!`,
      achievement_type: "personal_best",
      earned_at: new Date(),
      times_earned: 1,
      viewed: false,
      achievement_data: {
        activity_type: newActivity.activity_type,
        distance: newActivity.distance,
        old_pace: bestPreviousPace,
        new_pace: newPace,
        improvement_percent: improvementPercent.toFixed(1)
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
export function checkForCumulativeAchievements(activities: Activity[]): Achievement[] {
  // Calculate total distance
  const totalDistance = activities.reduce((sum, activity) => sum + activity.distance, 0);
  
  // Find eligible milestones
  const earnedAchievements: Achievement[] = [];
  
  for (const milestone of distanceMilestones) {
    if (totalDistance >= milestone.distance) {
      earnedAchievements.push({
        id: 0, // Will be set by backend
        user_id: activities[0]?.user_id || 0,
        title: milestone.title,
        description: milestone.description,
        achievement_type: "milestone",
        earned_at: new Date(),
        times_earned: 1,
        viewed: false,
        progress: {
          current: totalDistance,
          target: milestone.distance,
          unit: "km"
        }
      });
    }
  }
  
  return earnedAchievements;
}

/**
 * Check for streak-based achievements
 * @param activities Array of all user activities sorted by date
 * @returns Array of earned streak achievements
 */
export function checkForStreakAchievements(activities: Activity[]): Achievement[] {
  if (!activities.length) return [];
  
  // Sort activities by date (newest first)
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
  );
  
  // Calculate current streak
  let currentStreak = 1;
  let lastDate = new Date(sortedActivities[0].activity_date);
  
  // Group activities by date (to handle multiple activities on same day)
  const activityDates = new Set<string>();
  sortedActivities.forEach(activity => {
    activityDates.add(activity.activity_date.substring(0, 10)); // Get YYYY-MM-DD part
  });
  
  // Convert to array and sort
  const dates = Array.from(activityDates).sort().reverse(); // Newest first
  
  // Calculate streak
  for (let i = 1; i < dates.length; i++) {
    const currentDate = new Date(dates[i-1]);
    const prevDate = new Date(dates[i]);
    
    // Check if dates are consecutive
    const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak++;
    } else {
      break; // Streak broken
    }
  }
  
  // Check if any streak thresholds were met
  const earnedAchievements: Achievement[] = [];
  
  for (const threshold of streakThresholds) {
    if (currentStreak >= threshold.days) {
      earnedAchievements.push({
        id: 0, // Will be set by backend
        user_id: activities[0]?.user_id || 0,
        title: threshold.title,
        description: threshold.description,
        achievement_type: "streak",
        earned_at: new Date(),
        times_earned: 1,
        viewed: false,
        progress: {
          current: currentStreak,
          target: threshold.days,
          unit: "days"
        }
      });
    }
  }
  
  return earnedAchievements;
}

/**
 * Create confetti animation to celebrate achievement
 */
export function celebrateWithConfetti() {
  // Simple implementation using DOM elements
  const confettiContainer = document.createElement('div');
  confettiContainer.style.position = 'fixed';
  confettiContainer.style.top = '0';
  confettiContainer.style.left = '0';
  confettiContainer.style.width = '100vw';
  confettiContainer.style.height = '100vh';
  confettiContainer.style.pointerEvents = 'none';
  confettiContainer.style.zIndex = '9999';
  document.body.appendChild(confettiContainer);
  
  // Create confetti pieces
  const colors = ['#2563eb', '#16a34a', '#ef4444', '#eab308', '#8b5cf6'];
  const confettiCount = 150;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Random styles for variety
    confetti.style.position = 'absolute';
    confetti.style.width = `${Math.random() * 10 + 5}px`;
    confetti.style.height = `${Math.random() * 5 + 5}px`;
    confetti.style.backgroundColor = color;
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    confetti.style.top = '-20px';
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.opacity = '1';
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    confettiContainer.appendChild(confetti);
    
    // Animate confetti falling with CSS
    const duration = Math.random() * 3 + 2; // 2-5 seconds
    const horizontalMovement = (Math.random() - 0.5) * 100; // -50px to 50px
    
    confetti.animate(
      [
        { transform: `translateY(0) translateX(0) rotate(0deg)`, opacity: 1 },
        { transform: `translateY(70vh) translateX(${horizontalMovement}px) rotate(${Math.random() * 360}deg)`, opacity: 0.7 },
        { transform: `translateY(100vh) translateX(${horizontalMovement * 2}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
      ],
      {
        duration: duration * 1000,
        easing: 'cubic-bezier(.21,.98,.6,.94)'
      }
    );
    
    // Remove confetti after animation
    setTimeout(() => {
      confetti.remove();
      
      // Remove container when all confetti are gone
      if (i === confettiCount - 1) {
        setTimeout(() => {
          confettiContainer.remove();
        }, duration * 1000);
      }
    }, duration * 1000);
  }
}