import { apiRequest } from "./queryClient";
import { Achievement } from "./achievements";

/**
 * Service for handling user achievements
 */
export const achievementService = {
  /**
   * Fetch all user achievements
   * @param userId The user ID to fetch achievements for
   * @returns Promise resolving to array of achievements
   */
  getUserAchievements: async (userId: number): Promise<any[]> => {
    const response = await apiRequest("GET", `/api/users/${userId}/achievements`);
    return response.json();
  },

  /**
   * Mark an achievement as viewed
   * @param achievementId The ID of the achievement to mark as viewed
   */
  markAchievementViewed: async (achievementId: number): Promise<void> => {
    await apiRequest("PATCH", `/api/achievements/${achievementId}/viewed`, { viewed: true });
  },

  /**
   * Get unviewed achievements for the current user
   * @returns Promise resolving to array of unviewed achievements
   */
  getUnviewedAchievements: async (): Promise<any[]> => {
    const response = await apiRequest("GET", `/api/achievements/unviewed`);
    return response.json();
  },

  /**
   * Handle activity completion and check for achievements
   * @param activityData Data about the completed activity
   * @returns Promise resolving to array of earned achievements, if any
   */
  processActivityCompletion: async (activityData: any): Promise<Achievement[]> => {
    const response = await apiRequest("POST", "/api/achievements/check", {
      activity: activityData,
    });
    return response.json();
  },

  /**
   * Create a manual achievement for testing
   * @param achievement Achievement to create
   * @returns Promise resolving to the created achievement
   */
  createTestAchievement: async (achievementData: any): Promise<Achievement> => {
    const response = await apiRequest("POST", "/api/achievements/test", achievementData);
    return response.json();
  }
};