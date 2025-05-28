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
    <div className="min-h-screen bg-gradient-to-br from-[#2a398f] via-[#3a4db9] to-[#8a4df0] font-['Poppins']">
      {/* Header */}
      <header className="flex justify-between items-center p-8">
        <div className="text-2xl font-bold text-white">
          Aether<span className="text-purple-400">Run</span>
        </div>
        <nav className="hidden md:flex space-x-6">
          <a href="#" className="text-white hover:text-purple-300 transition">Features</a>
          <a href="#" className="text-white hover:text-purple-300 transition">Pricing</a>
          <a href="#" className="text-white hover:text-purple-300 transition">Support</a>
          <a href="#" className="text-white hover:text-purple-300 transition">Blog</a>
        </nav>
        <div className="flex items-center space-x-4">
          <Link href="/auth" className="text-white/90 hover:text-white font-medium transition-colors">
            Login
          </Link>
          <Link href="/auth?tab=register">
            <button className="bg-gradient-to-r from-[#8a4df0] to-[#f04d6a] px-6 py-3 rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:-translate-y-0.5">
              Get Started
            </button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col md:flex-row gap-8 px-8">
        {/* Left Column - Feature Showcase */}
        <div className="w-full md:w-2/3 space-y-8">
          
          {/* Hero Section */}
          <section className="backdrop-blur-md bg-white/10 rounded-2xl p-8 border border-white/20 relative overflow-hidden">
            <h1 className="text-4xl font-bold mb-4 text-white">Transform Your Running Journey</h1>
            <p className="text-lg mb-8 text-white/80">
              AetherRun combines AI-powered training plans, advanced data integration, and 
              intelligent health tracking to push your limits and achieve your running goals.
            </p>
            
            <div className="relative h-48 mb-6">
              <div className="absolute bottom-[10%] left-[5%] w-[90%] h-1 bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              <div className="absolute bottom-[15%] left-[20%] text-[#4df0b0] text-4xl animate-pulse">
                🏃‍♂️
              </div>
              
              <div className="absolute right-[-40px] top-10 bg-black/80 rounded-xl p-3 text-sm text-white">
                <div className="font-bold mb-1 text-[#4df0b0]">AI INSIGHTS:</div>
                <div className="flex items-center mb-1">
                  <span className="w-24">Pace:</span>
                  <span className="font-semibold">1.7 min/km</span>
                </div>
                <div className="flex items-center mb-1">
                  <span className="w-24">Stride Length:</span>
                  <span className="font-semibold">106.3 ft</span>
                </div>
                <div className="flex items-center">
                  <span className="w-24">Form Efficiency:</span>
                  <span className="font-semibold">83%</span>
                </div>
              </div>
            </div>
            
            <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-gradient-to-r from-[#4df0b0] to-[#4d9df0] rounded-full w-[85%] transition-all duration-1000"></div>
            </div>
            <div className="text-xs text-right text-white/70">AI ENERGY ANALYSIS</div>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white/8 rounded-xl p-4 hover:bg-white/12 transition-all duration-300 hover:-translate-y-1">
                <div className="bg-purple-500/20 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                  <Brain size={24} className="text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">AI-Powered Training</h3>
                <p className="text-sm text-white/80">Personalized plans built by OpenAI that adapt to your performance.</p>
              </div>
              <div className="bg-white/8 rounded-xl p-4 hover:bg-white/12 transition-all duration-300 hover:-translate-y-1">
                <div className="bg-purple-500/20 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                  <LineChart size={24} className="text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">Advanced Analytics</h3>
                <p className="text-sm text-white/80">Deep insights into pace, heart rate, and energy patterns.</p>
              </div>
            </div>
          </section>
          
          {/* Platform Integration */}
          <section className="backdrop-blur-md bg-white/10 rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold mb-4 text-white">Platform Integration</h2>
            <p className="mb-6 text-white/80">
              Sync with Strava, Garmin Connect, and Polar seamlessly to keep all your training data in one place.
            </p>
            
            <div className="flex justify-around mb-6">
              <div className="w-6 h-6 text-red-400 animate-pulse">
                <Heart size={24} />
              </div>
              <div className="w-6 h-6 text-blue-400">
                <Activity size={24} />
              </div>
              <div className="w-6 h-6 text-green-400">
                <Zap size={24} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/8 rounded-xl p-4 hover:bg-white/12 transition-all duration-300">
                <h3 className="text-lg font-semibold mb-2 text-white">Platform Integration</h3>
                <p className="text-sm text-white/80">Sync with Strava, Garmin Connect, and Polar seamlessly.</p>
              </div>
              <div className="bg-white/8 rounded-xl p-4 hover:bg-white/12 transition-all duration-300">
                <h3 className="text-lg font-semibold mb-2 text-white">Health Intelligence</h3>
                <p className="text-sm text-white/80">Monitor energy levels calculated from HRV and sleep quality.</p>
              </div>
            </div>
            
            <div className="bg-black/30 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4 text-[#4df0b0]">
                <span className="text-sm font-semibold">GARMIN DATA INSIGHTS</span>
                <span className="text-xs">• SYNCING...</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-white/70">Heart Rate</div>
                  <div className="text-white">
                    <span className="text-xl font-bold">62</span>
                    <span className="text-sm ml-1">bpm</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/70">Sleep</div>
                  <div className="text-white">
                    <span className="text-xl font-bold">7.2</span>
                    <span className="text-sm ml-1">hrs</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/70">VO2 Max</div>
                  <div className="text-white">
                    <span className="text-xl font-bold">48</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* AI Training Plan Generator */}
          <section className="backdrop-blur-md bg-white/10 rounded-2xl p-8 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">AI TRAINING PLAN GENERATOR</h2>
              <span className="text-xs bg-green-400 text-green-900 rounded-full px-3 py-1">• COMPLETE</span>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-xs mb-4">
              <div className="text-center font-semibold text-white mb-2">M</div>
              <div className="text-center font-semibold text-white mb-2">T</div>
              <div className="text-center font-semibold text-white mb-2">W</div>
              <div className="text-center font-semibold text-white mb-2">T</div>
              <div className="text-center font-semibold text-white mb-2">F</div>
              <div className="text-center font-semibold text-white mb-2">S</div>
              <div className="text-center font-semibold text-white mb-2">S</div>
              
              <div className="bg-white/10 rounded-lg p-2 text-center min-h-[60px] flex flex-col justify-center hover:bg-white/20 transition-all duration-300 hover:-translate-y-1">
                <div className="text-white/70">Long Run</div>
                <div className="font-semibold text-white mt-1">8.5 miles</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2 text-center min-h-[60px] flex flex-col justify-center hover:bg-white/20 transition-all duration-300 hover:-translate-y-1">
                <div className="text-white/70">Recovery</div>
                <div className="font-semibold text-white mt-1">3 miles</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2 text-center min-h-[60px] flex flex-col justify-center hover:bg-white/20 transition-all duration-300 hover:-translate-y-1">
                <div className="text-white/70">Intervals</div>
                <div className="font-semibold text-white mt-1">5x400m</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2 text-center min-h-[60px] flex flex-col justify-center hover:bg-white/20 transition-all duration-300 hover:-translate-y-1">
                <div className="text-white/70">Hills</div>
                <div className="font-semibold text-white mt-1">6x200m</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2 text-center min-h-[60px] flex flex-col justify-center hover:bg-white/20 transition-all duration-300 hover:-translate-y-1">
                <div className="text-white/70">Tempo</div>
                <div className="font-semibold text-white mt-1">5 miles</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2 text-center min-h-[60px] flex flex-col justify-center hover:bg-white/20 transition-all duration-300 hover:-translate-y-1">
                <div className="text-white/70">Easy</div>
                <div className="font-semibold text-white mt-1">4 miles</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2 text-center min-h-[60px] flex flex-col justify-center hover:bg-white/20 transition-all duration-300 hover:-translate-y-1">
                <div className="text-white/70">Rest</div>
                <div className="font-semibold text-white mt-1">-</div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Login/Register Cards */}
        <div className="w-full md:w-1/3 space-y-6">
          {/* Login/Register Card */}
          <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 h-[calc(50%-0.75rem)]">
            <h3 className="text-xl font-bold mb-4 text-white">Join AetherRun</h3>
            <p className="text-white/80 mb-6 text-sm">
              Start your AI-powered running journey today and unlock your full potential.
            </p>
            <div className="space-y-3">
              <Link href="/auth?tab=register">
                <button className="w-full bg-gradient-to-r from-[#8a4df0] to-[#f04d6a] px-4 py-3 rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:-translate-y-0.5">
                  Create Account
                </button>
              </Link>
              <Link href="/auth">
                <button className="w-full bg-white/10 border border-white/30 px-4 py-3 rounded-lg font-semibold text-white hover:bg-white/20 transition-all duration-300">
                  Sign In
                </button>
              </Link>
            </div>
          </div>

          {/* Premium Benefits Card */}
          <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 h-[calc(50%-0.75rem)]">
            <h3 className="text-xl font-bold mb-4 text-white">Premium Benefits</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-r from-[#f04d6a] to-[#8a4df0] p-1 rounded">
                  <Zap size={16} className="text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white">Human Coach Access</div>
                  <div className="text-white/70">Get guidance from experienced running coaches</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-r from-[#4df0b0] to-[#4d9df0] p-1 rounded">
                  <Heart size={16} className="text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white">Advanced Nutrition</div>
                  <div className="text-white/70">AI-generated nutrition recommendations</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-r from-[#8a4df0] to-[#3a4db9] p-1 rounded">
                  <Activity size={16} className="text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white">Recovery Analysis</div>
                  <div className="text-white/70">Detailed recovery analytics and insights</div>
                </div>
              </div>
            </div>
            <Link href="/auth?tab=register">
              <button className="w-full mt-6 bg-gradient-to-r from-[#8a4df0] to-[#f04d6a] px-4 py-2 rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:-translate-y-0.5 text-sm">
                Start 14-Day Free Trial
              </button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <AppFooter />
    </div>
  );
}
