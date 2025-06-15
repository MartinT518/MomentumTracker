import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { AdminImpersonationProvider } from "@/hooks/use-admin-impersonation";
import { AchievementsProvider } from "@/hooks/use-achievements";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { SupportChatBot } from "@/components/support/support-chat-bot";
import { GoalAchievementPopup } from "@/components/goals/goal-achievement-popup";
import { AppFooter } from "@/components/common/app-footer";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";

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

import PricingPage from "@/pages/pricing-page";
// Information pages
import FAQPage from "@/pages/faq-page";
import TermsPage from "@/pages/terms-page";
import PrivacyPage from "@/pages/privacy-page";
// Annual subscription feature pages
import CoachesPage from "@/pages/coaches-page";
import CoachDetailPage from "@/pages/coach-detail-page";
import VideoAnalysisPage from "@/pages/video-analysis-page";
// Admin pages
import CoachManagementPage from "@/pages/coach-management-page";
import AdminPanelPage from "@/pages/admin-panel-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminProtectedRoute } from "./lib/admin-protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/pricing" component={PricingPage} />
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

      {/* Information pages */}
      <Route path="/faq" component={FAQPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      {/* Annual subscription feature routes */}
      <ProtectedRoute path="/coaches" component={CoachesPage} />
      <ProtectedRoute path="/coaches/:id" component={CoachDetailPage} />
      <ProtectedRoute path="/video-analysis" component={VideoAnalysisPage} />
      <AdminProtectedRoute path="/admin/coaches" component={CoachManagementPage} />
      <AdminProtectedRoute path="/admin" component={AdminPanelPage} />
      <Route path="/integrations/:platform/callback" component={IntegrationCallbackPage} />
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
            <div className="flex flex-col min-h-screen">
              <div className="flex-1">
                <Toaster />
                <Router />
                <SupportChatBot />
                <GoalAchievementPopup />
              </div>
              <AppFooter />
            </div>
          </TooltipProvider>
        </AchievementsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
