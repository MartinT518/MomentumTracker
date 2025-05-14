import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { AchievementsList } from "@/components/achievements/achievements-list";
import { Award } from "lucide-react";

const AchievementsPage: React.FC = () => {
  return (
    <div className="container py-6">
      <PageHeader
        title="Achievements"
        description="Track your training milestones and celebrate your progress"
        icon={<Award className="w-6 h-6" />}
      />
      
      <div className="mt-6">
        <AchievementsList />
      </div>
    </div>
  );
};

export default AchievementsPage;