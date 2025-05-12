import { useState } from 'react';
import { Sidebar } from "@/components/common/sidebar";
import { MobileMenu } from "@/components/common/mobile-menu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, List } from "lucide-react";
import { TrainingGoalOverview } from "@/components/training-plan/training-goal-overview";
import { TrainingPlanCalendar } from "@/components/training-plan/training-plan-calendar";
import { WorkoutDetailView } from "@/components/training-plan/workout-detail-view";

export default function TrainingPlanPage() {
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  const [showWorkoutDetail, setShowWorkoutDetail] = useState<boolean>(false);

  return (
    <div className="flex h-screen max-w-full overflow-hidden">
      <Sidebar />
      <MobileMenu />

      <main className="flex-1 overflow-y-auto bg-neutral-lighter pt-0 md:pt-4 pb-16 md:pb-4 px-4 md:px-6">
        {/* For mobile view padding to account for fixed header */}
        <div className="md:hidden pt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading text-neutral-darker">Training Plan</h1>
            <p className="text-neutral-medium mt-1">View and manage your personalized training schedule</p>
          </div>
          
          {selectedTab === "schedule" && (
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowWorkoutDetail(!showWorkoutDetail)}
              >
                {showWorkoutDetail ? "Back to Schedule" : "View Example Workout"}
              </Button>
            </div>
          )}
        </div>

        {/* Training Plan Content */}
        <Tabs defaultValue="overview" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <TrainingGoalOverview />
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Training Plan Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 font-medium mb-1">Weekly Mileage</div>
                  <div className="text-2xl font-bold">32 miles</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium mb-1">Workouts Per Week</div>
                  <div className="text-2xl font-bold">5 sessions</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium mb-1">Long Run</div>
                  <div className="text-2xl font-bold">12 miles</div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-yellow-600 font-medium mb-1">Quality Workouts</div>
                  <div className="text-2xl font-bold">2 per week</div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Training Philosophy</h3>
                <p className="text-neutral-700">
                  This plan follows a balanced approach with progressive overload to prepare you for your marathon goal.
                  It includes a mix of easy running, speed work, tempo runs, and essential long runs, with appropriate recovery 
                  periods to maximize adaptation while minimizing injury risk.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="schedule">
            {showWorkoutDetail ? (
              <WorkoutDetailView />
            ) : (
              <TrainingPlanCalendar />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
