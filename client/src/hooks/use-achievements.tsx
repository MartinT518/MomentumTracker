import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { achievementService } from '@/lib/achievement-service';
import { Achievement } from '@/lib/achievements';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface AchievementsContextType {
  achievements: Achievement[];
  unviewedAchievements: Achievement[];
  currentAchievement: Achievement | null;
  isLoading: boolean;
  error: Error | null;
  showAchievement: (achievement: Achievement) => void;
  hideAchievement: () => void;
  markAchievementViewed: (id: number) => Promise<void>;
  createTestAchievement: (data: any) => Promise<void>;
}

const AchievementsContext = createContext<AchievementsContextType | null>(null);

export function AchievementsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  
  // Get all user achievements
  const {
    data: achievements = [],
    isLoading: isLoadingAchievements,
    error: achievementsError,
  } = useQuery({
    queryKey: ['/api/achievements', user?.id],
    queryFn: () => (user ? achievementService.getUserAchievements(user.id) : Promise.resolve([])),
    enabled: !!user,
  });
  
  // Get unviewed achievements
  const {
    data: unviewedAchievements = [],
    isLoading: isLoadingUnviewed,
    error: unviewedError,
  } = useQuery({
    queryKey: ['/api/achievements/unviewed'],
    queryFn: achievementService.getUnviewedAchievements,
    enabled: !!user,
  });
  
  // Mutation to mark achievement as viewed
  const markViewedMutation = useMutation({
    mutationFn: achievementService.markAchievementViewed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/achievements/unviewed'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to mark achievement as viewed: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Mutation to create test achievement (for development)
  const createTestMutation = useMutation({
    mutationFn: achievementService.createTestAchievement,
    onSuccess: (achievement) => {
      queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/achievements/unviewed'] });
      
      // Show the newly created achievement
      showAchievement(achievement);
      
      toast({
        title: 'Achievement Created',
        description: 'Test achievement was successfully created',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create test achievement: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Auto-display first unviewed achievement when they're loaded
  useEffect(() => {
    if (unviewedAchievements.length > 0 && !currentAchievement) {
      showAchievement(unviewedAchievements[0]);
    }
  }, [unviewedAchievements, currentAchievement]);
  
  // Show an achievement
  const showAchievement = (achievement: Achievement) => {
    setCurrentAchievement(achievement);
  };
  
  // Hide the current achievement
  const hideAchievement = () => {
    if (currentAchievement?.id) {
      markViewedMutation.mutate(currentAchievement.id);
    }
    setCurrentAchievement(null);
  };
  
  // Mark an achievement as viewed
  const markAchievementViewed = async (id: number) => {
    await markViewedMutation.mutateAsync(id);
    
    // If this was the current achievement, hide it
    if (currentAchievement?.id === id) {
      setCurrentAchievement(null);
    }
  };
  
  // Create a test achievement
  const createTestAchievement = async (data: any) => {
    await createTestMutation.mutateAsync(data);
  };
  
  return (
    <AchievementsContext.Provider
      value={{
        achievements,
        unviewedAchievements,
        currentAchievement,
        isLoading: isLoadingAchievements || isLoadingUnviewed,
        error: achievementsError || unviewedError,
        showAchievement,
        hideAchievement,
        markAchievementViewed,
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