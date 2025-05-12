interface HealthData {
  hrvScore?: number;           // 0-100 scale
  restingHeartRate?: number;   // bpm
  sleepQuality?: number;       // 0-100 scale
  sleepDuration?: number;      // hours
  recoveryScore?: number;      // 0-100 scale
  fatigueLevel?: number;       // 0-100 scale (0 = no fatigue, 100 = extreme fatigue)
  strain?: number;             // 0-100 scale (workout/activity intensity)
  muscleSoreness?: number;     // 0-100 scale
}

/**
 * Calculates an energy level score (0-100) based on various health metrics
 * 
 * The algorithm uses a weighted approach where each metric contributes to the 
 * overall energy score. Missing metrics are handled gracefully by adjusting weights.
 * 
 * @param healthData Object containing health metrics
 * @returns Energy level score between 0-100
 */
export function calculateEnergyLevel(healthData: HealthData): number {
  // Define weights for each metric (total should = 1.0)
  const weights = {
    hrvScore: 0.25,            // Heart Rate Variability has a strong correlation with recovery
    restingHeartRate: 0.15,    // Elevated RHR often indicates incomplete recovery
    sleepQuality: 0.20,        // Sleep quality is critical for recovery
    sleepDuration: 0.10,       // Sleep duration matters but quality is more important
    recoveryScore: 0.10,       // Direct recovery measure (if available)
    fatigueLevel: 0.10,        // Subjective fatigue rating
    strain: 0.05,              // Recent training load
    muscleSoreness: 0.05       // Physical readiness indicator
  };

  // Track metrics used and adjust total weight
  let totalWeightUsed = 0;
  let weightedScoreSum = 0;

  // Process HRV score
  if (healthData.hrvScore !== undefined) {
    totalWeightUsed += weights.hrvScore;
    weightedScoreSum += normalizeHrv(healthData.hrvScore) * weights.hrvScore;
  }

  // Process resting heart rate
  if (healthData.restingHeartRate !== undefined) {
    totalWeightUsed += weights.restingHeartRate;
    weightedScoreSum += normalizeRestingHeartRate(healthData.restingHeartRate) * weights.restingHeartRate;
  }

  // Process sleep quality
  if (healthData.sleepQuality !== undefined) {
    totalWeightUsed += weights.sleepQuality;
    weightedScoreSum += healthData.sleepQuality * weights.sleepQuality;
  }

  // Process sleep duration
  if (healthData.sleepDuration !== undefined) {
    totalWeightUsed += weights.sleepDuration;
    weightedScoreSum += normalizeSleepDuration(healthData.sleepDuration) * weights.sleepDuration;
  }

  // Process recovery score if provided directly
  if (healthData.recoveryScore !== undefined) {
    totalWeightUsed += weights.recoveryScore;
    weightedScoreSum += healthData.recoveryScore * weights.recoveryScore;
  }

  // Process fatigue level (invert it since higher fatigue = lower energy)
  if (healthData.fatigueLevel !== undefined) {
    totalWeightUsed += weights.fatigueLevel;
    weightedScoreSum += (100 - healthData.fatigueLevel) * weights.fatigueLevel;
  }

  // Process strain (invert it since higher strain = lower energy)
  if (healthData.strain !== undefined) {
    totalWeightUsed += weights.strain;
    weightedScoreSum += (100 - healthData.strain) * weights.strain;
  }

  // Process muscle soreness (invert it since higher soreness = lower energy)
  if (healthData.muscleSoreness !== undefined) {
    totalWeightUsed += weights.muscleSoreness;
    weightedScoreSum += (100 - healthData.muscleSoreness) * weights.muscleSoreness;
  }

  // If no valid metrics were provided, return moderate energy level
  if (totalWeightUsed === 0) {
    return 50;
  }

  // Normalize the weighted sum based on weights actually used
  const energyScore = weightedScoreSum / totalWeightUsed;
  
  // Ensure score is within 0-100 range and round to nearest integer
  return Math.min(100, Math.max(0, Math.round(energyScore)));
}

/**
 * Normalize HRV to a 0-100 scale where higher is better
 * Assumes typical athletic HRV ranges
 */
function normalizeHrv(hrvValue: number): number {
  // HRV is typically measured in milliseconds
  // These thresholds are for rMSSD, a common HRV metric
  const minHrv = 20;  // Very low HRV
  const maxHrv = 100; // Excellent HRV for an athlete
  
  if (hrvValue <= minHrv) return 0;
  if (hrvValue >= maxHrv) return 100;
  
  return ((hrvValue - minHrv) / (maxHrv - minHrv)) * 100;
}

/**
 * Normalize resting heart rate to a 0-100 scale where lower RHR = higher score
 * Assumes typical athletic RHR ranges
 */
function normalizeRestingHeartRate(rhr: number): number {
  // Typical athletic resting heart rates range from 40-60 bpm
  // Lower is generally better for athletes
  const minRhr = 40;  // Excellent RHR for well-trained athletes
  const maxRhr = 80;  // Elevated RHR indicating stress/fatigue
  
  if (rhr <= minRhr) return 100;
  if (rhr >= maxRhr) return 0;
  
  return ((maxRhr - rhr) / (maxRhr - minRhr)) * 100;
}

/**
 * Normalize sleep duration to a 0-100 scale
 * Based on recommended sleep durations for athletes
 */
function normalizeSleepDuration(hours: number): number {
  // Athletes typically need 7-9 hours, with 8 being optimal
  if (hours <= 4) return 0;
  if (hours <= 6) return 50;
  if (hours <= 7) return 75;
  if (hours <= 9) return 100;
  if (hours <= 10) return 90; // Too much sleep can indicate issues too
  return 75; // Excessive sleep (>10 hours)
}

/**
 * Get a descriptive label for the energy level
 */
export function getEnergyLevelLabel(energyScore: number): string {
  if (energyScore >= 85) return "Peak";
  if (energyScore >= 70) return "High";
  if (energyScore >= 55) return "Good";
  if (energyScore >= 40) return "Moderate";
  if (energyScore >= 25) return "Low";
  return "Very Low";
}

/**
 * Get training intensity recommendation based on energy level
 */
export function getTrainingRecommendation(energyScore: number): string {
  if (energyScore >= 85) return "High intensity or race day";
  if (energyScore >= 70) return "Hard training or intervals";
  if (energyScore >= 55) return "Moderate training";
  if (energyScore >= 40) return "Easy training or technical work";
  if (energyScore >= 25) return "Active recovery";
  return "Rest day recommended";
}

/**
 * Get color for energy level visualization
 */
export function getEnergyLevelColor(energyScore: number): string {
  if (energyScore >= 85) return "#22c55e"; // green-500
  if (energyScore >= 70) return "#84cc16"; // lime-500
  if (energyScore >= 55) return "#eab308"; // yellow-500
  if (energyScore >= 40) return "#f97316"; // orange-500
  if (energyScore >= 25) return "#ef4444"; // red-500
  return "#b91c1c";                         // red-700
}