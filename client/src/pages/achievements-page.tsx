import React from "react";
import { AppLayout } from "@/components/common/app-layout";
import { AchievementsList } from "@/components/achievements/achievements-list";
import { Award } from "lucide-react";

const AchievementsPage: React.FC = () => {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Award className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                Achievements
              </h1>
              <p className="text-white/80 text-lg drop-shadow-md">
                Track your training milestones and celebrate your progress
              </p>
            </div>
          </div>
        </div>
        
        {/* Achievements List */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl">
          <AchievementsList />
        </div>
      </div>
    </AppLayout>
  );
};

export default AchievementsPage;