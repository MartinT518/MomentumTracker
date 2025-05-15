import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { AchievementsProvider } from "@/hooks/use-achievements";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { SupportChatBot } from "@/components/support/support-chat-bot";
import { GoalAchievementPopup } from "@/components/goals/goal-achievement-popup";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import TrainingPlanPage from "@/pages/training-plan-page";
import ActivitiesPage from "@/pages/activities-page";
import GoalsPage from "@/pages/goals-page";
import ProfilePage from "@/pages/profile-page";
import SettingsPage from "@/pages/settings-page";
import SubscriptionPage from "@/pages/subscription-page";
import StrengthExercisesPage from "@/pages/strength-exercises-page";
import HealthMetricsPage from "@/pages/health-metrics-page";
import NutritionPage from "@/pages/nutrition-page";
import OnboardingPage from "@/pages/onboarding-page";
import IntegrationCallbackPage from "@/pages/integration-callback-page";
import AchievementsPage from "@/pages/achievements-page";
// Annual subscription feature pages
import CoachesPage from "@/pages/coaches-page";
import CoachDetailPage from "@/pages/coach-detail-page";
import VideoAnalysisPage from "@/pages/video-analysis-page";
// Admin pages
import CoachManagementPage from "@/pages/coach-management-page";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/onboarding" component={OnboardingPage} />
      <ProtectedRoute path="/training-plan" component={TrainingPlanPage} />
      <ProtectedRoute path="/activities" component={ActivitiesPage} />
      <ProtectedRoute path="/goals" component={GoalsPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <ProtectedRoute path="/subscription/success" component={SubscriptionPage} />
      <ProtectedRoute path="/strength-exercises" component={StrengthExercisesPage} />
      <ProtectedRoute path="/health-metrics" component={HealthMetricsPage} />
      <ProtectedRoute path="/nutrition" component={NutritionPage} />
      <Route path="/achievements" component={AchievementsPage} />
      {/* Annual subscription feature routes */}
      <ProtectedRoute path="/coaches" component={CoachesPage} />
      <ProtectedRoute path="/coaches/:id" component={CoachDetailPage} />
      <ProtectedRoute path="/video-analysis" component={VideoAnalysisPage} />
      <ProtectedRoute path="/admin/coaches" component={CoachManagementPage} />
      <Route path="/auth/:platform/callback" component={IntegrationCallbackPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AchievementsProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <SupportChatBot />
            <GoalAchievementPopup />
          </TooltipProvider>
        </AchievementsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
