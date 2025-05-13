import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Check onboarding status
  const { data: onboardingStatus, isLoading: isCheckingOnboarding } = useQuery({
    queryKey: ["/api/onboarding/status"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/onboarding/status");
        return await res.json();
      } catch (error) {
        // If 404, it means the user hasn't started onboarding yet
        if (error instanceof Error && error.message.includes("404")) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!user, // Only run if user is logged in
  });

  useEffect(() => {
    if (isCheckingOnboarding) return;
    
    // If onboarding status doesn't exist or is not completed, redirect to onboarding
    if (!onboardingStatus || !onboardingStatus.completed) {
      setLocation("/onboarding");
    } else {
      // Otherwise, redirect to dashboard
      setLocation("/dashboard");
    }
  }, [onboardingStatus, isCheckingOnboarding, setLocation]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p>Redirecting you to the right place...</p>
    </div>
  );
}
