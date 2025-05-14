import { apiRequest } from './queryClient';
import { 
  calculateRaceProgress,
  formatTimeImprovement,
  predictTime,
  calculatePace
} from './pace-calculator';

export interface GoalProgress {
  currentProgress: number;
  forecastData: Array<{
    name: string;
    progress: number;
    target: number;
  }>;
  prediction: {
    estimatedCompletionDate: Date;
    isOnTrack: boolean;
    daysAhead?: number;
    daysBehind?: number;
  };
}

export interface GoalPaceData {
  paceData: Array<{
    date: string;
    pace: number | null;
    target: number;
  }>;
  improvement: {
    absolute: number;
    percentage: number;
  };
}

export interface GoalComparisonData {
  comparisonData: Array<{
    name: string;
    you: number;
    average: number;
    top: number;
  }>;
  ranking: {
    percentile: number;
    position?: string;
  };
}

export interface WeightProgressData {
  startingWeight: number;
  currentWeight: number;
  targetWeight: number;
  weightData: Array<{
    name: string;
    weight: number | null;
    projected?: number | null;
    target: number;
  }>;
  projection: {
    estimatedCompletionDate: Date;
    isOnTrack: boolean;
    expectedFinalWeight: number;
  };
}

// Calculate days between two dates
function daysBetween(startDate: Date, endDate: Date): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((startDate.getTime() - endDate.getTime()) / millisecondsPerDay));
}

// Calculate weeks between two dates
function weeksBetween(startDate: Date, endDate: Date): number {
  return Math.ceil(daysBetween(startDate, endDate) / 7);
}

// Format date for display in charts
function formatChartDate(date: Date): string {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  if (isToday) return 'Today';
  
  const dayDifference = daysBetween(today, date);
  
  if (dayDifference <= 14) {
    if (date < today) {
      return `${dayDifference}d ago`;
    } else {
      return `In ${dayDifference}d`;
    }
  }
  
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

// Generate goal progress data
export async function getGoalProgressData(goalId: number): Promise<GoalProgress> {
  try {
    // Get related activities from API
    const response = await apiRequest('GET', `/api/goals/${goalId}/activities`);
    const data = await response.json();
    
    // Calculate progress from actual activities
    const goal = await getGoalById(goalId);
    
    const startDate = new Date(goal.created_at);
    const targetDate = new Date(goal.target_date);
    const today = new Date();
    
    // Calculate expected progress based on time elapsed
    const totalDays = daysBetween(startDate, targetDate);
    const daysElapsed = daysBetween(startDate, today);
    const expectedProgress = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
    
    // Determine current progress based on goal type
    let currentProgress = 0;
    
    if (goal.goal_type === 'race') {
      // For race goals, calculate progress based on pace calculations
      // Check if we have a best race time for a distance
      const bestActivity = data.length > 0 
        ? data
            .filter((a: any) => a.activity_type === 'run' && a.is_completed && a.distance > 0 && a.duration > 0)
            .sort((a: any, b: any) => (a.pace_seconds || Infinity) - (b.pace_seconds || Infinity))[0]
        : null;
        
      if (bestActivity) {
        // We have a best race time, use that to calculate progress based on pace prediction
        const bestDistance = (bestActivity.distance / 1000).toFixed(1) + 'k'; // Convert to km
        const hours = Math.floor(bestActivity.duration / 3600);
        const minutes = Math.floor((bestActivity.duration % 3600) / 60);
        const seconds = Math.floor(bestActivity.duration % 60);
        const bestTime = 
          `${hours > 0 ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Get target distance and time
        const targetDistance = goal.race_distance || '5k';
        const targetTime = goal.target_time || '25:00';
        
        // Calculate progress using our pace calculator
        currentProgress = calculateRaceProgress(
          bestDistance,
          bestTime,
          targetDistance,
          targetTime
        );
      } else {
        // No best race time, fall back to training completion
        const totalWorkouts = data.length > 0 ? data.filter((a: any) => a.is_completed).length : 0;
        const plannedWorkouts = data.length;
        
        currentProgress = plannedWorkouts > 0 
          ? Math.round((totalWorkouts / plannedWorkouts) * 100) 
          : Math.min(expectedProgress, 10); // Fallback
      }
    } else if (goal.goal_type === 'weight_loss') {
      // For weight loss goals, calculate based on weight loss progress
      const startingWeight = goal.weekly_mileage || 0; // Using this field for current_weight
      const targetWeight = startingWeight - (goal.target_value || 0);
      const currentWeight = goal.current_weight || startingWeight;
      
      if (startingWeight > targetWeight) {
        currentProgress = Math.min(100, Math.round(
          ((startingWeight - currentWeight) / (startingWeight - targetWeight)) * 100
        ));
      }
    } else {
      // For other goals, use expected progress as fallback
      currentProgress = expectedProgress;
    }
    
    // Generate forecast data
    const weeksLeft = weeksBetween(today, targetDate);
    const progressPerWeek = (100 - currentProgress) / Math.max(1, weeksLeft);
    
    const forecastData = [];
    
    // Add past data points
    const weeksPassed = Math.max(1, weeksBetween(startDate, today));
    
    for (let i = 0; i < weeksPassed; i++) {
      const pastDate = new Date(startDate);
      pastDate.setDate(pastDate.getDate() + (i * 7));
      
      const expectedPastProgress = Math.min(100, Math.round((i / (weeksPassed + weeksLeft)) * 100));
      const actualPastProgress = i === weeksPassed - 1 ? currentProgress : 
        Math.round(currentProgress * (i / (weeksPassed - 1) || 1));
      
      forecastData.push({
        name: formatChartDate(pastDate),
        progress: actualPastProgress,
        target: expectedPastProgress
      });
    }
    
    // Add current point
    forecastData.push({
      name: 'Now',
      progress: currentProgress,
      target: expectedProgress
    });
    
    // Add future forecast
    for (let i = 1; i <= weeksLeft; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + (i * 7));
      
      const projectedProgress = Math.min(100, Math.round(currentProgress + (progressPerWeek * i)));
      const targetProgress = Math.min(100, Math.round(expectedProgress + ((100 - expectedProgress) / weeksLeft) * i));
      
      forecastData.push({
        name: formatChartDate(futureDate),
        progress: projectedProgress,
        target: targetProgress
      });
    }
    
    // Calculate estimated completion date
    const isOnTrack = currentProgress >= expectedProgress;
    let estimatedCompletionDate = new Date(targetDate);
    
    if (!isOnTrack && currentProgress > 0) {
      // Calculate how many additional days needed based on current progress rate
      const progressPerDay = currentProgress / daysElapsed;
      const daysNeeded = Math.ceil((100 - currentProgress) / progressPerDay);
      
      estimatedCompletionDate = new Date(today);
      estimatedCompletionDate.setDate(today.getDate() + daysNeeded);
    } else if (isOnTrack && currentProgress > expectedProgress) {
      // Calculate how many days ahead of schedule
      const progressPerDay = expectedProgress / daysElapsed;
      const daysAhead = Math.floor((currentProgress - expectedProgress) / progressPerDay);
      
      estimatedCompletionDate = new Date(targetDate);
      estimatedCompletionDate.setDate(targetDate.getDate() - daysAhead);
    }
    
    const daysAhead = isOnTrack ? daysBetween(estimatedCompletionDate, targetDate) : undefined;
    const daysBehind = !isOnTrack ? daysBetween(estimatedCompletionDate, targetDate) : undefined;
    
    return {
      currentProgress,
      forecastData,
      prediction: {
        estimatedCompletionDate,
        isOnTrack,
        daysAhead,
        daysBehind
      }
    };
  } catch (error) {
    console.error('Error calculating goal progress:', error);
    
    // Return fallback data
    return {
      currentProgress: 0,
      forecastData: [{ name: 'Now', progress: 0, target: 0 }],
      prediction: {
        estimatedCompletionDate: new Date(),
        isOnTrack: false
      }
    };
  }
}

// Generate pace improvement data for race goals
export async function getGoalPaceData(goalId: number): Promise<GoalPaceData> {
  try {
    // Get related activities from API
    const response = await apiRequest('GET', `/api/goals/${goalId}/activities`);
    const activities = await response.json();
    
    const goal = await getGoalById(goalId);
    
    if (goal.goal_type !== 'race') {
      throw new Error('Pace data is only available for race goals');
    }
    
    // Parse target time
    const targetTimeString = goal.target_pace || '00:00:00';
    const [targetHours, targetMinutes, targetSeconds] = targetTimeString.split(':').map(Number);
    const targetPaceMinutes = (targetHours * 60) + targetMinutes + (targetSeconds / 60);
    
    // Calculate target pace based on distance
    const distance = parseFloat(goal.target_distance || '0');
    const targetPace = distance > 0 ? targetPaceMinutes / distance : 0;
    
    // Get all running activities sorted by date
    const runActivities = activities
      .filter((a: any) => a.activity_type === 'run')
      .sort((a: any, b: any) => new Date(a.activity_date).getTime() - new Date(b.activity_date).getTime());
    
    // Generate pace data points
    const paceData = [];
    let initialPace = 0;
    let currentPace = 0;
    
    if (runActivities.length > 0) {
      // Get initial pace from first activity
      const firstActivity = runActivities[0];
      const paceString = firstActivity.pace || '00:00';
      const [paceMinutes, paceSeconds] = paceString.split(':').map(Number);
      initialPace = paceMinutes + (paceSeconds / 60);
      
      // Get most recent pace
      const lastActivity = runActivities[runActivities.length - 1];
      const lastPaceString = lastActivity.pace || '00:00';
      const [lastPaceMinutes, lastPaceSeconds] = lastPaceString.split(':').map(Number);
      currentPace = lastPaceMinutes + (lastPaceSeconds / 60);
      
      // Generate data points from activities
      for (const activity of runActivities) {
        const activityDate = new Date(activity.activity_date);
        const activityPaceString = activity.pace || '00:00';
        const [activityPaceMinutes, activityPaceSeconds] = activityPaceString.split(':').map(Number);
        const activityPace = activityPaceMinutes + (activityPaceSeconds / 60);
        
        paceData.push({
          date: formatChartDate(activityDate),
          pace: activityPace,
          target: targetPace
        });
      }
    } else {
      // No activities, use target pace as fallback
      initialPace = targetPace * 1.3; // 30% slower than target as starting point
      currentPace = targetPace * 1.2; // 20% slower than target as current pace
    }
    
    // Add empty future point
    paceData.push({
      date: 'Target',
      pace: null,
      target: targetPace
    });
    
    // Calculate improvement
    const absoluteImprovement = initialPace - currentPace;
    const percentageImprovement = initialPace > 0 ? 
      (absoluteImprovement / initialPace) * 100 : 0;
    
    return {
      paceData,
      improvement: {
        absolute: parseFloat(absoluteImprovement.toFixed(2)),
        percentage: parseFloat(percentageImprovement.toFixed(1))
      }
    };
  } catch (error) {
    console.error('Error calculating pace data:', error);
    
    // Return fallback data
    return {
      paceData: [
        { date: 'Start', pace: 0, target: 0 },
        { date: 'Now', pace: 0, target: 0 },
        { date: 'Target', pace: null, target: 0 }
      ],
      improvement: {
        absolute: 0,
        percentage: 0
      }
    };
  }
}

// Generate comparison data with other users having similar goals
export async function getGoalComparisonData(goalId: number): Promise<GoalComparisonData> {
  try {
    // Get comparison data from API
    const response = await apiRequest('GET', `/api/goals/${goalId}/comparison`);
    
    // If API doesn't exist yet, throw error to use fallback
    if (!response.ok) {
      throw new Error('Comparison API not implemented');
    }
    
    const data = await response.json();
    
    return {
      comparisonData: data.comparisonData,
      ranking: {
        percentile: data.percentile,
        position: data.position
      }
    };
  } catch (error) {
    console.error('Error fetching comparison data:', error);
    
    // Get current goal
    let goal;
    try {
      goal = await getGoalById(goalId);
    } catch (e) {
      goal = { progress: 50 };
    }
    
    // Generate simulated comparison data based on goal progress
    const currentProgress = goal.progress || 50;
    const comparisonData = [];
    
    // Generate historical data points
    for (let i = 1; i <= 6; i++) {
      const weekProgress = Math.round(currentProgress * (i / 6));
      const avgProgress = Math.round(weekProgress * 0.8); // Average is 80% of user's progress
      const topProgress = Math.round(weekProgress * 1.2); // Top performers are 120% of user's progress
      
      comparisonData.push({
        name: `Week ${i}`,
        you: weekProgress,
        average: avgProgress,
        top: topProgress
      });
    }
    
    // Add current point
    comparisonData.push({
      name: 'Now',
      you: currentProgress,
      average: Math.round(currentProgress * 0.8),
      top: Math.round(currentProgress * 1.2)
    });
    
    // Determine ranking (percentile) based on progress
    const rankPercentage = currentProgress > 50 ? 70 : 40;
    
    return {
      comparisonData,
      ranking: {
        percentile: rankPercentage,
        position: rankPercentage > 50 ? 'Above Average' : 'Below Average'
      }
    };
  }
}

// Generate weight progress data for weight loss goals
export async function getWeightProgressData(goalId: number): Promise<WeightProgressData> {
  try {
    // Get weight tracking data from API
    const response = await apiRequest('GET', `/api/goals/${goalId}/weight-data`);
    
    // If API doesn't exist yet, throw error to use fallback
    if (!response.ok) {
      throw new Error('Weight tracking API not implemented');
    }
    
    const data = await response.json();
    
    return {
      startingWeight: data.startingWeight,
      currentWeight: data.currentWeight,
      targetWeight: data.targetWeight,
      weightData: data.weightData,
      projection: data.projection
    };
  } catch (error) {
    console.error('Error fetching weight data:', error);
    
    // Get goal to use actual values
    const goal = await getGoalById(goalId);
    
    if (goal.goal_type !== 'weight_loss') {
      throw new Error('Weight data is only available for weight loss goals');
    }
    
    // Extract weight values
    const startingWeight = parseFloat(goal.weekly_mileage || '165');
    const targetValue = parseFloat(goal.target_value || '15');
    const targetWeight = startingWeight - targetValue;
    
    // Calculate current weight based on progress
    const progress = goal.progress || 0;
    const weightLost = (targetValue * progress) / 100;
    const currentWeight = startingWeight - weightLost;
    
    // Generate weight tracking data
    const weightData = [];
    const today = new Date();
    const startDate = new Date(goal.created_at);
    const targetDate = new Date(goal.target_date);
    
    // Calculate needed loss per week
    const weeksTotal = weeksBetween(startDate, targetDate);
    const lossPerWeek = targetValue / weeksTotal;
    
    // Generate historical data
    const weeksPassed = weeksBetween(startDate, today);
    
    for (let i = 0; i < weeksPassed; i++) {
      const pastDate = new Date(startDate);
      pastDate.setDate(pastDate.getDate() + (i * 7));
      
      const expectedWeight = startingWeight - (lossPerWeek * i);
      const actualWeight = i === weeksPassed - 1 
        ? currentWeight 
        : startingWeight - (weightLost * (i / weeksPassed));
      
      weightData.push({
        name: formatChartDate(pastDate),
        weight: parseFloat(actualWeight.toFixed(1)),
        target: parseFloat(expectedWeight.toFixed(1))
      });
    }
    
    // Add current weight
    weightData.push({
      name: 'Now',
      weight: parseFloat(currentWeight.toFixed(1)),
      target: parseFloat((startingWeight - (lossPerWeek * weeksPassed)).toFixed(1))
    });
    
    // Add future projections
    const weeksLeft = weeksBetween(today, targetDate);
    
    // Calculate current weekly loss rate
    const currentLossRate = weightLost / Math.max(1, weeksPassed);
    const projectedWeeksNeeded = (targetValue - weightLost) / currentLossRate;
    
    // Determine if on track
    const isOnTrack = currentLossRate >= lossPerWeek;
    
    // Calculate estimated completion date
    let estimatedCompletionDate = new Date(targetDate);
    
    if (!isOnTrack && currentLossRate > 0) {
      // Calculate how many additional weeks needed
      const additionalWeeks = projectedWeeksNeeded - weeksLeft;
      
      estimatedCompletionDate = new Date(targetDate);
      estimatedCompletionDate.setDate(targetDate.getDate() + (additionalWeeks * 7));
    }
    
    // Calculate expected final weight
    const expectedFinalWeight = parseFloat(
      (currentWeight - (currentLossRate * weeksLeft)).toFixed(1)
    );
    
    // Generate future data points
    for (let i = 1; i <= weeksLeft; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + (i * 7));
      
      const targetFutureWeight = startingWeight - (lossPerWeek * (weeksPassed + i));
      const projectedFutureWeight = currentWeight - (currentLossRate * i);
      
      weightData.push({
        name: formatChartDate(futureDate),
        weight: null, // No actual weight for future
        projected: parseFloat(projectedFutureWeight.toFixed(1)),
        target: parseFloat(targetFutureWeight.toFixed(1))
      });
    }
    
    return {
      startingWeight,
      currentWeight: parseFloat(currentWeight.toFixed(1)),
      targetWeight,
      weightData,
      projection: {
        estimatedCompletionDate,
        isOnTrack,
        expectedFinalWeight: Math.max(targetWeight, expectedFinalWeight)
      }
    };
  }
}

// Helper function to get a goal by ID
export async function getGoalById(goalId: number): Promise<any> {
  try {
    const response = await apiRequest('GET', `/api/goals/${goalId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch goal');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching goal:', error);
    throw error;
  }
}