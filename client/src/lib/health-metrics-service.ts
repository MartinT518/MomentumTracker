import { apiRequest } from "./queryClient";
import { calculateEnergyLevel } from "./energy-calculator";

export interface HealthMetric {
  id?: number;
  user_id: number;
  metric_date: string;
  metric_type: string;
  metric_value: number;
  source?: string;
  created_at?: string;
}

export interface DailyHealthMetrics {
  date: string;
  hrvScore?: number;
  restingHeartRate?: number;
  sleepQuality?: number;
  sleepDuration?: number;
  recoveryScore?: number;
  fatigueLevel?: number;
  strain?: number;
  muscleSoreness?: number;
  energyLevel?: number;
  source?: string;
}

/**
 * Get health metrics for a specific date range
 */
export async function getHealthMetrics(userId: number, startDate: string, endDate: string): Promise<HealthMetric[]> {
  try {
    const response = await apiRequest(
      'GET', 
      `/api/health-metrics?userId=${userId}&startDate=${startDate}&endDate=${endDate}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch health metrics');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching health metrics:', error);
    throw error;
  }
}

/**
 * Save a new health metric
 */
export async function saveHealthMetric(metric: Omit<HealthMetric, 'id' | 'created_at'>): Promise<HealthMetric> {
  try {
    const response = await apiRequest('POST', '/api/health-metrics', metric);
    
    if (!response.ok) {
      throw new Error('Failed to save health metric');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving health metric:', error);
    throw error;
  }
}

/**
 * Update an existing health metric
 */
export async function updateHealthMetric(id: number, metric: Partial<HealthMetric>): Promise<HealthMetric> {
  try {
    const response = await apiRequest('PUT', `/api/health-metrics/${id}`, metric);
    
    if (!response.ok) {
      throw new Error('Failed to update health metric');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating health metric:', error);
    throw error;
  }
}

/**
 * Delete a health metric
 */
export async function deleteHealthMetric(id: number): Promise<void> {
  try {
    const response = await apiRequest('DELETE', `/api/health-metrics/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to delete health metric');
    }
  } catch (error) {
    console.error('Error deleting health metric:', error);
    throw error;
  }
}

/**
 * Get processed daily health metrics with calculated values
 */
export async function getDailyHealthData(userId: number, startDate: string, endDate: string): Promise<DailyHealthMetrics[]> {
  try {
    const metrics = await getHealthMetrics(userId, startDate, endDate);
    
    // Group metrics by date
    const metricsByDate: Record<string, HealthMetric[]> = {};
    
    metrics.forEach(metric => {
      if (!metricsByDate[metric.metric_date]) {
        metricsByDate[metric.metric_date] = [];
      }
      metricsByDate[metric.metric_date].push(metric);
    });
    
    // Process each day's metrics into a single object
    const dailyData: DailyHealthMetrics[] = [];
    
    Object.keys(metricsByDate).forEach(date => {
      const dayMetrics = metricsByDate[date];
      const dailyMetrics: DailyHealthMetrics = { date };
      
      // Process each metric
      dayMetrics.forEach(metric => {
        switch (metric.metric_type) {
          case 'hrv':
            dailyMetrics.hrvScore = metric.metric_value;
            break;
          case 'resting_heart_rate':
            dailyMetrics.restingHeartRate = metric.metric_value;
            break;
          case 'sleep_quality':
            dailyMetrics.sleepQuality = metric.metric_value;
            break;
          case 'sleep_duration':
            dailyMetrics.sleepDuration = metric.metric_value;
            break;
          case 'recovery_score':
            dailyMetrics.recoveryScore = metric.metric_value;
            break;
          case 'fatigue_level':
            dailyMetrics.fatigueLevel = metric.metric_value;
            break;
          case 'strain':
            dailyMetrics.strain = metric.metric_value;
            break;
          case 'muscle_soreness':
            dailyMetrics.muscleSoreness = metric.metric_value;
            break;
        }
        
        // If source isn't set yet, use this metric's source
        if (!dailyMetrics.source && metric.source) {
          dailyMetrics.source = metric.source;
        }
      });
      
      // Calculate energy level based on available metrics
      dailyMetrics.energyLevel = calculateEnergyLevel(dailyMetrics);
      
      dailyData.push(dailyMetrics);
    });
    
    // Sort by date (newest first)
    return dailyData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error getting daily health data:', error);
    throw error;
  }
}

/**
 * Get the latest energy level for a user
 */
export async function getLatestEnergyLevel(userId: number): Promise<number | null> {
  try {
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    
    const formattedToday = today.toISOString().split('T')[0];
    const formattedOneWeekAgo = oneWeekAgo.toISOString().split('T')[0];
    
    const dailyData = await getDailyHealthData(userId, formattedOneWeekAgo, formattedToday);
    
    // Return the most recent energy level, or null if no data
    return dailyData.length > 0 ? dailyData[0].energyLevel || null : null;
  } catch (error) {
    console.error('Error getting latest energy level:', error);
    return null;
  }
}