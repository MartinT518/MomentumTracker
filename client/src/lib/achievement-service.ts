import { apiRequest, queryClient } from "./queryClient";

export interface Achievement {
  id: number;
  user_id: number;
  title: string;
  description: string;
  achievement_type: string;
  badge_image?: string;
  earned_at: Date;
  times_earned: number;
  viewed: boolean;
  achievement_data?: any;
}

export const AchievementService = {
  async getUserAchievements(): Promise<Achievement[]> {
    const response = await apiRequest("GET", "/api/achievements");
    return await response.json();
  },

  async generateAchievements(): Promise<{ message: string; achievements: Achievement[] }> {
    const response = await apiRequest("POST", "/api/achievements/generate");
    const result = await response.json();
    
    // Invalidate the achievements cache to reflect new achievements
    queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
    
    return result;
  },

  async markAchievementAsViewed(achievementId: number): Promise<void> {
    await apiRequest("PATCH", `/api/achievements/${achievementId}/view`);
    queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
  },

  triggerAchievementEvent(achievement: Achievement): void {
    // Dispatch a custom event to trigger achievement popup
    const event = new CustomEvent('achievement-earned', {
      detail: achievement
    });
    window.dispatchEvent(event);
  }
};