import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Achievement } from "@/lib/achievement-service";

interface AchievementCardProps {
  achievement: Achievement;
  onMarkAsViewed: (id: number) => void;
}

const getAchievementTypeIcon = (type: string) => {
  switch (type) {
    case "milestone":
      return <Award className="h-5 w-5 text-amber-500" />;
    case "consistency":
      return <Calendar className="h-5 w-5 text-blue-500" />;
    case "improvement":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "personal_best":
      return <Award className="h-5 w-5 text-purple-500" />;
    default:
      return <Award className="h-5 w-5 text-gray-500" />;
  }
};

const getAchievementTypeBadge = (type: string) => {
  switch (type) {
    case "milestone":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Milestone</Badge>;
    case "consistency":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Consistency</Badge>;
    case "improvement":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Improvement</Badge>;
    case "personal_best":
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Personal Best</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, onMarkAsViewed }) => {
  return (
    <Card className={`mb-4 overflow-hidden transition-all duration-300 ${!achievement.viewed ? 'border-2 border-primary shadow-lg' : ''}`}>
      <CardHeader className="relative pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            {getAchievementTypeIcon(achievement.achievement_type)}
            <CardTitle className="text-lg">{achievement.title}</CardTitle>
          </div>
          {getAchievementTypeBadge(achievement.achievement_type)}
        </div>
        <CardDescription className="text-sm">
          Earned on {format(new Date(achievement.earned_at), "MMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {achievement.badge_image && (
          <div className="flex justify-center mb-4">
            <img 
              src={achievement.badge_image} 
              alt={`${achievement.title} badge`} 
              className="h-20 w-20 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <p className="text-sm">{achievement.description}</p>
      </CardContent>
      {!achievement.viewed && (
        <CardFooter className="pt-0 flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onMarkAsViewed(achievement.id)}
          >
            Mark as viewed
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};