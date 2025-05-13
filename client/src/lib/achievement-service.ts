import { apiRequest } from './queryClient';
import { Activity } from '@shared/schema';
import { Achievement } from './achievements';

/**
 * Service for handling user achievements
 */
export const achievementService = {
  /**
   * Fetch all user achievements
   * @param userId The user ID to fetch achievements for
   * @returns Promise resolving to array of achievements
   */
  async getUserAchievements(userId: number): Promise<Achievement[]> {
    try {
      const response = await apiRequest('GET', `/api/users/${userId}/achievements`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      throw new Error('Failed to load achievements');
    }
  },

  /**
   * Mark an achievement as viewed
   * @param achievementId The ID of the achievement to mark as viewed
   */
  async markAchievementViewed(achievementId: number): Promise<void> {
    try {
      await apiRequest('PATCH', `/api/achievements/${achievementId}/viewed`);
    } catch (error) {
      console.error('Error marking achievement as viewed:', error);
      throw new Error('Failed to update achievement status');
    }
  },

  /**
   * Get unviewed achievements for the current user
   * @returns Promise resolving to array of unviewed achievements
   */
  async getUnviewedAchievements(): Promise<Achievement[]> {
    try {
      const response = await apiRequest('GET', '/api/achievements/unviewed');
      return await response.json();
    } catch (error) {
      console.error('Error fetching unviewed achievements:', error);
      throw new Error('Failed to load unviewed achievements');
    }
  },

  /**
   * Handle activity completion and check for achievements
   * @param activityData Data about the completed activity
   * @returns Promise resolving to array of earned achievements, if any
   */
  async checkForAchievements(activityData: Activity): Promise<Achievement[]> {
    try {
      const response = await apiRequest('POST', '/api/achievements/check', {
        activity: activityData
      });
      return await response.json();
    } catch (error) {
      console.error('Error checking for achievements:', error);
      // We don't throw here to avoid interrupting the activity completion flow
      return [];
    }
  },

  /**
   * Create a manual achievement for testing
   * @param achievement Achievement to create
   * @returns Promise resolving to the created achievement
   */
  async createTestAchievement(achievement: Partial<Achievement>): Promise<Achievement> {
    try {
      const response = await apiRequest('POST', '/api/achievements/test', achievement);
      return await response.json();
    } catch (error) {
      console.error('Error creating test achievement:', error);
      throw new Error('Failed to create test achievement');
    }
  }
};