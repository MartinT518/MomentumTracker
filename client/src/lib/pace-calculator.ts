// Pace Calculator - Utility for calculating running paces and predictions
// Based on the Peter Riegel formula (t2 = t1 * (d2/d1)^1.06)

/**
 * Convert time string in format "HH:MM:SS" to seconds
 */
export function timeToSeconds(time: string): number {
  const parts = time.split(':');
  let seconds = 0;
  
  // Handle different time formats (HH:MM:SS, MM:SS, or SS)
  if (parts.length === 3) {
    // HH:MM:SS
    seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  } else if (parts.length === 2) {
    // MM:SS
    seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
  } else if (parts.length === 1) {
    // SS
    seconds = parseInt(parts[0]);
  }
  
  return seconds;
}

/**
 * Convert seconds to time string in format "HH:MM:SS"
 */
export function secondsToTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Convert distance name to meters
 */
export function distanceToMeters(distance: string): number {
  const distanceMap: Record<string, number> = {
    '5k': 5000,
    '10k': 10000,
    'half-marathon': 21097.5,
    'marathon': 42195,
  };
  
  return distanceMap[distance.toLowerCase()] || 0;
}

/**
 * Predict race time for a different distance using Peter Riegel's formula
 * t2 = t1 * (d2/d1)^1.06
 * 
 * @param time1 Original time in "HH:MM:SS" format
 * @param distance1 Original distance (like "5k", "10k", "half-marathon", "marathon")
 * @param distance2 Target distance to predict
 * @returns Predicted time for target distance in "HH:MM:SS" format
 */
export function predictTime(time1: string, distance1: string, distance2: string): string {
  const d1 = distanceToMeters(distance1);
  const d2 = distanceToMeters(distance2);
  
  if (d1 === 0 || d2 === 0) {
    return "Invalid distance";
  }
  
  const t1 = timeToSeconds(time1);
  const t2 = t1 * Math.pow(d2 / d1, 1.06);
  
  return secondsToTime(t2);
}

/**
 * Calculate pace in min/km from time and distance
 * 
 * @param time Time in "HH:MM:SS" format
 * @param distance Distance (like "5k", "10k", "half-marathon", "marathon")
 * @returns Pace in "MM:SS/km" format
 */
export function calculatePace(time: string, distance: string): string {
  const distanceMeters = distanceToMeters(distance);
  const timeSeconds = timeToSeconds(time);
  
  if (distanceMeters === 0) {
    return "Invalid distance";
  }
  
  const paceSeconds = (timeSeconds / (distanceMeters / 1000));
  
  return secondsToTime(paceSeconds) + "/km";
}

/**
 * Calculate race time equivalent as a percentage of target
 * E.g., if current 5k time predicts a 10k time that's 90% of target 10k time
 * 
 * @param currentDistance Current best race distance (e.g., "5k")
 * @param currentTime Current best time for that distance
 * @param targetDistance Target race distance (e.g., "10k")
 * @param targetTime Target time for the target distance
 * @returns Percentage completion towards target (0-100)
 */
export function calculateRaceProgress(
  currentDistance: string,
  currentTime: string,
  targetDistance: string,
  targetTime: string
): number {
  // If no current time/distance, return 0% progress
  if (!currentTime || !currentDistance) {
    return 0;
  }
  
  // Predict what the current fitness level would produce at the target distance
  const predictedTime = predictTime(currentTime, currentDistance, targetDistance);
  
  // Convert both times to seconds
  const predictedSeconds = timeToSeconds(predictedTime);
  const targetSeconds = timeToSeconds(targetTime);
  
  // Calculate progress (note: faster is better, so predicted time should be less than target)
  // If predicted > target, you're not there yet
  // If predicted < target, you've exceeded your goal
  const progress = Math.min(100, Math.max(0, 
    // Reverse the ratio because lower time is better
    100 * (targetSeconds / predictedSeconds)
  ));
  
  return Math.round(progress);
}

/**
 * Format time improvement between current projected time and target time
 * 
 * @param currentDistance Current distance with best time (e.g., "5k")
 * @param currentTime Current best time for that distance
 * @param targetDistance Target race distance (e.g., "10k")
 * @param targetTime Target time for the target distance
 * @returns Formatted string showing time to improve
 */
export function formatTimeImprovement(
  currentDistance: string,
  currentTime: string,
  targetDistance: string,
  targetTime: string
): string {
  // If no current information, can't calculate improvement
  if (!currentTime || !currentDistance) {
    return "No current race data";
  }
  
  // Predict what the current fitness level would produce at target distance
  const predictedTime = predictTime(currentTime, currentDistance, targetDistance);
  
  // Convert both to seconds
  const predictedSeconds = timeToSeconds(predictedTime);
  const targetSeconds = timeToSeconds(targetTime);
  
  // Calculate difference (negative means you're ahead of target)
  const diffSeconds = predictedSeconds - targetSeconds;
  
  if (diffSeconds <= 0) {
    return `Ahead of target by ${secondsToTime(Math.abs(diffSeconds))}`;
  } else {
    return `Need to improve by ${secondsToTime(diffSeconds)}`;
  }
}