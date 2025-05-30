import { Sidebar } from "@/components/common/sidebar";
import { MobileMenu } from "@/components/common/mobile-menu";
import { CurrentGoalBanner } from "@/components/dashboard/current-goal-banner";
import { WeeklyMetrics } from "@/components/dashboard/weekly-metrics";
import { ProgressCharts } from "@/components/dashboard/progress-charts";
import { TrainingCalendar } from "@/components/dashboard/training-calendar";
import { TodaysWorkout } from "@/components/dashboard/todays-workout";
import { WeeklyProgress } from "@/components/dashboard/weekly-progress";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { EnergyLevelCard } from "@/components/dashboard/energy-level-card";
import { MotivationalQuoteCard, DailyMotivation } from "@/components/dashboard/motivational-quote";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link, Redirect } from "wouter";
import { Plus, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";


export default function DashboardPage() {
  const { user } = useAuth();

  // Check onboarding status
  const { data: onboardingStatus, isLoading: isLoadingOnboarding } = useQuery({
    queryKey: ["/api/onboarding/status"],
    enabled: !!user,
  });

  // Redirect to onboarding if not completed
  if (!isLoadingOnboarding && onboardingStatus && !onboardingStatus.completed) {
    return <Redirect to="/onboarding" />;
  }

  if (isLoadingOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8a4df0] via-[#3a4db9] to-indigo-900 text-white flex">
      <Sidebar />
      <MobileMenu />

      <main className="flex-1 overflow-y-auto pt-0 md:pt-4 pb-16 md:pb-4 px-4 md:px-6">
        {/* For mobile view padding to account for fixed header */}
        <div className="md:hidden pt-20"></div>

        {/* User Greeting with Glass Effect */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 p-6 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300">
          <div>
            <h1 className="text-2xl font-bold font-heading text-white drop-shadow-lg">Welcome back, {user?.username || 'Runner'}!</h1>
            <p className="text-white/90 mt-1 drop-shadow-md">You're making great progress on your training.</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Link href="/activities">
              <Button className="inline-flex items-center bg-gradient-to-r from-[#8a4df0] to-[#3a4db9] hover:from-[#7a3de0] hover:to-[#2a3da9] text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Log Activity
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Daily Motivation Banner */}
        <DailyMotivation />
        
        {/* Motivational Quote */}
        <div className="mb-6">
          <MotivationalQuoteCard />
        </div>

        {/* Current Goal Banner */}
        <CurrentGoalBanner />

        {/* Today's Workout - Moved to the top */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold font-heading text-white mb-4 drop-shadow-lg">Today's Workout</h2>
          <TodaysWorkout />
        </div>
        
        {/* Weekly Overview */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold font-heading text-white mb-4 drop-shadow-lg">This Week's Overview</h2>
          <WeeklyMetrics />
        </div>
        
        {/* Energy Level - Moved to a separate row and made full width */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold font-heading text-white mb-4 drop-shadow-lg">Today's Energy</h2>
          <EnergyLevelCard />
        </div>

        {/* Progress Charts */}
        <ProgressCharts />

        {/* Training Plan Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold font-heading text-white mb-4 drop-shadow-lg">Upcoming Workouts</h2>
            <TrainingCalendar />
          </div>

          <div>
            {/* Weekly Progress */}
            <h2 className="text-xl font-semibold font-heading text-white mb-4 drop-shadow-lg">Weekly Progress</h2>
            <WeeklyProgress />
          </div>
        </div>

        {/* Recent Activities */}
        <h2 className="text-xl font-semibold font-heading text-white mb-4 drop-shadow-lg">Recent Activities</h2>
        <RecentActivities />
      </main>
    </div>
  );
}
