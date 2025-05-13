import { apiRequest } from '@/lib/queryClient';
import { Achievement } from '@/lib/achievements';

/**
 * Service class for achievement-related functionality
 */
export class AchievementService {
  /**
   * Fetches all achievements for the current user
   * @returns Promise with array of achievements
   */
  static async getUserAchievements(): Promise<Achievement[]> {
    try {
      const response = await apiRequest('GET', '/api/achievements');
      return await response.json();
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return [];
    }
  }

  /**
   * Fetches achievements that haven't been viewed yet
   * @returns Promise with array of unviewed achievements
   */
  static async getUnviewedAchievements(): Promise<Achievement[]> {
    try {
      const response = await apiRequest('GET', '/api/achievements/unviewed');
      return await response.json();
    } catch (error) {
      console.error('Error fetching unviewed achievements:', error);
      return [];
    }
  }

  /**
   * Marks an achievement as viewed
   * @param achievementId The ID of the achievement to mark as viewed
   * @returns Promise with success/failure status
   */
  static async markAchievementAsViewed(achievementId: number): Promise<boolean> {
    try {
      await apiRequest('POST', `/api/achievements/${achievementId}/viewed`);
      return true;
    } catch (error) {
      console.error('Error marking achievement as viewed:', error);
      return false;
    }
  }

  /**
   * Creates a test achievement (for development/demonstration purposes)
   * @param achievementData Achievement data to create
   * @returns Promise with the created achievement or null on failure
   */
  static async createTestAchievement(achievementData: any): Promise<Achievement | null> {
    try {
      const response = await apiRequest('POST', '/api/achievements/test', achievementData);
      return await response.json();
    } catch (error) {
      console.error('Error creating test achievement:', error);
      return null;
    }
  }

  /**
   * Generates an achievement triggered by an activity
   * @param activityId The ID of the activity that triggered the achievement
   * @param achievementType The type of achievement (e.g., 'milestone', 'streak')
   * @param achievementData Additional achievement data
   * @returns Promise with the created achievement or null on failure
   */
  static async generateActivityAchievement(
    activityId: number,
    achievementType: string,
    achievementData: any
  ): Promise<Achievement | null> {
    try {
      const response = await apiRequest('POST', '/api/achievements/activity', {
        activity_id: activityId,
        achievement_type: achievementType,
        achievement_data: achievementData,
      });
      return await response.json();
    } catch (error) {
      console.error('Error generating activity achievement:', error);
      return null;
    }
  }

  /**
   * Triggers the achievement event to show a popup
   * @param achievement The achievement to show
   */
  static triggerAchievementEvent(achievement: Achievement): void {
    // Create and dispatch custom event
    const achievementEvent = new CustomEvent('achievement-earned', {
      detail: { achievement },
    });
    window.dispatchEvent(achievementEvent);
  }
}