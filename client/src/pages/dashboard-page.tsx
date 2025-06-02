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

        {/* Simplified User Greeting */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 drop-shadow-lg">
            Welcome back, {user?.username || 'Runner'}!
          </h1>
          <p className="text-white/80 text-xl drop-shadow-md">
            Ready to crush your running goals today?
          </p>
        </div>

        {/* Hero Section - Today's Workout */}
        <div className="mb-12">
          <TodaysWorkout />
        </div>

        {/* Energy Level - Standalone for emphasis */}
        <div className="mb-12">
          <EnergyLevelCard />
        </div>

        {/* Core Metrics Grid - Only 2 essential cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Weekly Progress */}
          <div>
            <WeeklyProgress />
          </div>
          
          {/* Recent Activities */}
          <div>
            <RecentActivities />
          </div>
        </div>

        {/* Motivational Section */}
        <div className="mb-12">
          <DailyMotivation />
        </div>

        {/* Quick Actions - Simplified */}
        <div className="flex gap-6 justify-center">
          <Link href="/activities">
            <Button size="lg" className="bg-white/20 hover:bg-white/30 text-white border-white/30 px-8">
              <Plus className="w-5 h-5 mr-2" />
              Log Activity
            </Button>
          </Link>
          <Link href="/training-plan">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8">
              View Training Plan
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
