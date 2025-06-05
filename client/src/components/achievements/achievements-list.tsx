import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AchievementService, Achievement } from "@/lib/achievement-service";
import { AchievementCard } from "./achievement-card";
import { Button } from "@/components/ui/button";
import { Loader2, Award, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSubscription } from "@/hooks/use-subscription";

export const AchievementsList: React.FC = () => {
  const { toast } = useToast();
  const { hasActiveSubscription } = useSubscription();
  
  const { 
    data: achievements, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
    queryFn: async () => {
      return await AchievementService.getUserAchievements();
    }
  });

  const generateMutation = useMutation({
    mutationFn: AchievementService.generateAchievements,
    onSuccess: (data) => {
      toast({
        title: "Achievements Generated!",
        description: `${data.achievements.length} new achievements discovered.`,
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to generate achievements: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const markAsViewedMutation = useMutation({
    mutationFn: (id: number) => AchievementService.markAchievementAsViewed(id),
    onSuccess: () => {
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to mark achievement as viewed: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error Loading Achievements</AlertTitle>
        <AlertDescription>
          There was a problem loading your achievements. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const hasUnviewedAchievements = achievements?.some(a => !a.viewed);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Award className="mr-2 h-6 w-6" />
          Your Achievements
        </h2>
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending || !hasActiveSubscription}
          className="flex items-center gap-2"
        >
          {generateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Generate New Achievements
        </Button>
      </div>

      {!hasActiveSubscription && (
        <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
          <AlertTitle>Premium Feature</AlertTitle>
          <AlertDescription>
            AI-generated achievements are available to premium subscribers. Upgrade your subscription to unlock this feature.
          </AlertDescription>
        </Alert>
      )}

      {hasUnviewedAchievements && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
          <AlertTitle>New Achievements!</AlertTitle>
          <AlertDescription>
            You have new achievements to celebrate. Congrats on your progress!
          </AlertDescription>
        </Alert>
      )}

      {achievements && achievements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              onMarkAsViewed={(id) => markAsViewedMutation.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
          <Award className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium">No achievements yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Complete activities and reach your goals to earn achievements.
          </p>
          {hasActiveSubscription && (
            <Button
              onClick={() => generateMutation.mutate()}
              variant="outline"
              className="mt-4"
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing your training...
                </>
              ) : (
                <>Check for achievements</>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};