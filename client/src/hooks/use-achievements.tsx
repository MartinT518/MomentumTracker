import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Achievement } from '@/lib/achievements';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface AchievementsContextType {
  achievements: Achievement[];
  unviewedAchievements: Achievement[];
  isLoading: boolean;
  error: Error | null;
  markAchievementAsViewed: (achievementId: number) => Promise<void>;
  createTestAchievement: (achievementData: any) => Promise<void>;
}

const AchievementsContext = createContext<AchievementsContextType | null>(null);

export function AchievementsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dispatchedEvents, setDispatchedEvents] = useState<Record<number, boolean>>({});

  // Fetch all user achievements
  const {
    data: achievements = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/achievements'],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest('GET', '/api/achievements');
      return await res.json();
    },
    enabled: !!user,
  });

  // Filter for unviewed achievements
  const unviewedAchievements = achievements.filter(
    (achievement) => !achievement.viewed
  );

  // Mutation to mark achievement as viewed
  const markAsViewedMutation = useMutation({
    mutationFn: async (achievementId: number) => {
      await apiRequest('PATCH', `/api/achievements/${achievementId}/view`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
    },
  });

  // Mutation to create a test achievement
  const createTestAchievementMutation = useMutation({
    mutationFn: async (achievementData: any) => {
      await apiRequest('POST', '/api/achievements/test', achievementData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
    },
  });

  // Dispatch events for unviewed achievements
  useEffect(() => {
    if (!user) return;

    unviewedAchievements.forEach((achievement) => {
      // Don't dispatch events for achievements we've already dispatched
      if (dispatchedEvents[achievement.id]) return;

      // Create and dispatch the custom event
      const event = new CustomEvent('achievement-earned', {
        detail: { achievement },
      });
      window.dispatchEvent(event);

      // Mark this achievement as having had an event dispatched
      setDispatchedEvents((prev) => ({
        ...prev,
        [achievement.id]: true,
      }));
    });
  }, [unviewedAchievements, dispatchedEvents, user]);

  const markAchievementAsViewed = async (achievementId: number) => {
    await markAsViewedMutation.mutateAsync(achievementId);
  };

  const createTestAchievement = async (achievementData: any) => {
    await createTestAchievementMutation.mutateAsync(achievementData);
  };

  return (
    <AchievementsContext.Provider
      value={{
        achievements,
        unviewedAchievements,
        isLoading,
        error,
        markAchievementAsViewed,
        createTestAchievement,
      }}
    >
      {children}
    </AchievementsContext.Provider>
  );
}

export function useAchievements() {
  const context = useContext(AchievementsContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementsProvider');
  }
  return context;
}