import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { 
  Loader2, 
  Brain, 
  LineChart, 
  Activity, 
  Heart, 
  Zap, 
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import RunnerAnimation from "@/components/ui/runner-animation";
import AITrainingGenerator from "@/components/ui/ai-training-generator";
import FitnessIntegration from "@/components/ui/fitness-integration";
import { AppFooter } from "@/components/common/app-footer";

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
    if (!user || isCheckingOnboarding) return;
    
    // If user is logged in and onboarding status is checked
    if (!onboardingStatus || !onboardingStatus.completed) {
      setLocation("/onboarding");
    } else {
      setLocation("/dashboard");
    }
  }, [user, onboardingStatus, isCheckingOnboarding, setLocation]);

  // If user is checking onboarding status, show loading
  if (user && isCheckingOnboarding) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Redirecting you to the right place...</p>
      </div>
    );
  }

  // If user is already logged in but not checking onboarding, they'll be redirected by the effect above
  // Otherwise, show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2a398f] via-[#3a4db9] to-[#8a4df0]">
      {/* Header */}
      <header className="backdrop-blur-md bg-white/10 border-b border-white/20 fixed w-full z-50">
        <div className="container mx-auto flex justify-between items-center p-4">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <span className="text-white mr-2">Aether</span><span className="text-white">Run</span>
          </h1>
          <div className="flex items-center space-x-4">
            <Link href="/auth" className="text-white/90 hover:text-white font-medium transition-colors">
              Login
            </Link>
            <Link href="/auth?tab=register">
              <Button className="bg-gradient-to-r from-[#8a4df0] to-[#f04d6a] border-none hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:-translate-y-0.5">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 mt-8 lg:mt-0">
              <h1 className="text-3xl md:text-5xl font-bold leading-tight">
                Transform Your Running Journey with AI Power
              </h1>
              <p className="text-lg text-blue-100 leading-relaxed">
                AetherRun combines AI-powered training plans, advanced data integration, and intelligent health tracking to push your limits and achieve your running goals.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
                <Link href="/auth?tab=register">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-[#8a4df0] to-[#f04d6a] border-none hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:-translate-y-0.5">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto backdrop-blur-md bg-white/10 border-white/30 text-white hover:bg-white/20 transition-all duration-300">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="order-first lg:order-last">
              <RunnerAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Powered by Intelligence</h2>
            <p className="text-white/80 mt-2">Discover how AI enhances your running experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="backdrop-blur-md bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-[#8a4df0] to-[#f04d6a] p-2 rounded-lg mr-3 text-white flex-shrink-0">
                  <Brain size={24} />
                </div>
                <h3 className="font-bold text-lg text-white">AI-Powered Training</h3>
              </div>
              <p className="text-white/80">
                Personalized plans built by OpenAI that adapt to your performance, goals, and recovery patterns in real-time.
              </p>
            </div>
            
            <div className="backdrop-blur-md bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-[#4df0b0] to-[#4d9df0] p-2 rounded-lg mr-3 text-white flex-shrink-0">
                  <LineChart size={24} />
                </div>
                <h3 className="font-bold text-lg text-white">Advanced Analytics</h3>
              </div>
              <p className="text-white/80">
                Gain deep insights into your pace, heart rate, and energy levels with visualization tools that help identify patterns and improvements.
              </p>
            </div>
            
            <div className="backdrop-blur-md bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-[#8a4df0] to-[#3a4db9] p-2 rounded-lg mr-3 text-white flex-shrink-0">
                  <Activity size={24} />
                </div>
                <h3 className="font-bold text-lg text-white">Platform Integration</h3>
              </div>
              <p className="text-white/80">
                Sync your activities automatically from Strava, Garmin Connect, and Polar to keep all your training data in one place.
              </p>
            </div>
            
            <div className="backdrop-blur-md bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-[#f04d6a] to-[#8a4df0] p-2 rounded-lg mr-3 text-white flex-shrink-0">
                  <Heart size={24} />
                </div>
                <h3 className="font-bold text-lg text-white">Health Intelligence</h3>
              </div>
              <p className="text-white/80">
                Monitor energy levels calculated from HRV, resting heart rate, and sleep quality to optimize training and prevent overtraining.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Training Generator Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center lg:hidden mb-8">
            <h2 className="text-3xl font-bold text-white">Intelligent Training Plans</h2>
            <p className="text-white/80 mt-2">
              Experience AI-powered training that adapts to your performance
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="backdrop-blur-md bg-white/10 rounded-xl p-6 border border-white/20">
              <AITrainingGenerator />
            </div>
            <div className="space-y-6">
              <div className="hidden lg:block">
                <h2 className="text-3xl font-bold text-white">Intelligent Training Plans</h2>
                <p className="text-white/80 mt-2">
                  Our AI analyzes your running history, fitness level, and goals to create personalized training plans that evolve with you.
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 mr-2 text-[#4df0b0] flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">Race-specific preparation for 5K to marathon distances</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 mr-2 text-[#4df0b0] flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">Progressive training loads that match your adaptive capacity</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 mr-2 text-[#4df0b0] flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">Recovery-based adjustments to prevent overtraining</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center lg:hidden mb-8">
            <h2 className="text-3xl font-bold text-white">Seamless Device Integration</h2>
            <p className="text-white/80 mt-2">
              Connect all your fitness platforms in one place
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 order-last lg:order-first">
              <div className="hidden lg:block">
                <h2 className="text-3xl font-bold text-white">Seamless Device Integration</h2>
                <p className="text-white/80 mt-2">
                  Connect your favorite fitness devices and platforms to AetherRun for a comprehensive view of your training and health metrics.
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 mr-2 text-[#4df0b0] flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">Automatic activity synchronization from Strava, Garmin, and Polar</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 mr-2 text-[#4df0b0] flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">Health metric consolidation across all your devices</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 mr-2 text-[#4df0b0] flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">AI-powered insights from your combined fitness data</span>
                </li>
              </ul>
            </div>
            <div className="backdrop-blur-md bg-white/10 rounded-xl p-6 border border-white/20">
              <FitnessIntegration />
            </div>
          </div>
        </div>
      </section>

      {/* Premium Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl font-bold text-white">Premium Benefits</h2>
            <p className="text-white/80 mt-2">Unlock advanced features with AetherRun Premium</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="backdrop-blur-md bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-[#f04d6a] to-[#8a4df0] p-2 rounded-lg mr-3 text-white flex-shrink-0">
                  <Zap size={24} />
                </div>
                <h3 className="font-bold text-lg text-white">Human Coach Access</h3>
              </div>
              <p className="text-white/80">
                Get personalized guidance from experienced running coaches who can fine-tune your training plan and provide expert advice.
              </p>
            </div>
            
            <div className="backdrop-blur-md bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-[#4df0b0] to-[#4d9df0] p-2 rounded-lg mr-3 text-white flex-shrink-0">
                  <Heart size={24} />
                </div>
                <h3 className="font-bold text-lg text-white">Advanced Nutrition</h3>
              </div>
              <p className="text-white/80">
                Receive AI-generated nutrition recommendations tailored to your training schedule, goals, and dietary preferences.
              </p>
            </div>
            
            <div className="backdrop-blur-md bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-[#8a4df0] to-[#3a4db9] p-2 rounded-lg mr-3 text-white flex-shrink-0">
                  <Activity size={24} />
                </div>
                <h3 className="font-bold text-lg text-white">Recovery Analysis</h3>
              </div>
              <p className="text-white/80">
                Get detailed recovery analytics and recommendations based on your biometric data to optimize your training cycle.
              </p>
            </div>
          </div>

          <div className="text-center mt-8 md:mt-12">
            <Link href="/auth?tab=register">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-[#8a4df0] to-[#f04d6a] border-none hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:-translate-y-0.5">
                Start 14-Day Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <AppFooter />
    </div>
  );
}
