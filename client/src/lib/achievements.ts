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