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
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen max-w-full overflow-hidden">
      <Sidebar />
      <MobileMenu />

      <main className="flex-1 overflow-y-auto bg-neutral-lighter pt-0 md:pt-4 pb-16 md:pb-4 px-4 md:px-6">
        {/* For mobile view padding to account for fixed header */}
        <div className="md:hidden pt-20"></div>

        {/* User Greeting */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading text-neutral-darker">Welcome back, {user?.username || 'Runner'}!</h1>
            <p className="text-neutral-medium mt-1">You're making great progress on your training.</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Link href="/activities">
              <Button className="inline-flex items-center">
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Log Activity
              </Button>
            </Link>
          </div>
        </div>

        {/* Current Goal Banner */}
        <CurrentGoalBanner />

        {/* Today's Workout - Moved to the top */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold font-heading text-neutral-darker mb-4">Today's Workout</h2>
          <TodaysWorkout />
        </div>
        
        {/* Weekly Overview */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold font-heading text-neutral-darker mb-4">This Week's Overview</h2>
          <WeeklyMetrics />
        </div>
        
        {/* Energy Level - Moved to a separate row and made full width */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold font-heading text-neutral-darker mb-4">Today's Energy</h2>
          <EnergyLevelCard />
        </div>

        {/* Progress Charts */}
        <ProgressCharts />

        {/* Training Plan Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold font-heading text-neutral-darker mb-4">Upcoming Workouts</h2>
            <TrainingCalendar />
          </div>

          <div>
            {/* Weekly Progress */}
            <h2 className="text-xl font-semibold font-heading text-neutral-darker mb-4">Weekly Progress</h2>
            <WeeklyProgress />
          </div>
        </div>

        {/* Recent Activities */}
        <h2 className="text-xl font-semibold font-heading text-neutral-darker mb-4">Recent Activities</h2>
        <RecentActivities />
      </main>
    </div>
  );
}
