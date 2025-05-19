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
import { Footer } from "@/components/common/footer";

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
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed w-full z-50">
        <div className="container mx-auto flex justify-between items-center p-4">
          <h1 className="text-2xl font-bold font-heading text-neutral-darker flex items-center">
            <span className="text-primary mr-2">Momentum</span>Run
          </h1>
          <div className="flex items-center space-x-4">
            <Link href="/auth" className="text-primary hover:text-primary-dark font-medium">
              Login
            </Link>
            <Link href="/auth?tab=register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 mt-8 lg:mt-0">
              <h1 className="text-3xl md:text-5xl font-bold leading-tight">
                Transform Your Running Journey with AI Power
              </h1>
              <p className="text-lg text-blue-100 leading-relaxed">
                MomentumRun combines AI-powered training plans, advanced data integration, and intelligent health tracking to push your limits and achieve your running goals.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
                <Link href="/auth?tab=register">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 border-0">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 border-white/30 text-white hover:bg-white/20">
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
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Powered by Intelligence</h2>
            <p className="text-neutral-dark mt-2">Discover how AI enhances your running experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="bg-blue-600 p-2 rounded-lg mr-3 text-white flex-shrink-0">
                  <Brain size={24} />
                </div>
                <h3 className="font-bold text-lg">AI-Powered Training</h3>
              </div>
              <p className="text-neutral-dark">
                Personalized plans built by OpenAI that adapt to your performance, goals, and recovery patterns in real-time.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="bg-purple-600 p-2 rounded-lg mr-3 text-white flex-shrink-0">
                  <LineChart size={24} />
                </div>
                <h3 className="font-bold text-lg">Advanced Analytics</h3>
              </div>
              <p className="text-neutral-dark">
                Gain deep insights into your pace, heart rate, and energy levels with visualization tools that help identify patterns and improvements.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-600 p-2 rounded-lg mr-3 text-white flex-shrink-0">
                  <Activity size={24} />
                </div>
                <h3 className="font-bold text-lg">Platform Integration</h3>
              </div>
              <p className="text-neutral-dark">
                Sync your activities automatically from Strava, Garmin Connect, and Polar to keep all your training data in one place.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="bg-green-600 p-2 rounded-lg mr-3 text-white flex-shrink-0">
                  <Heart size={24} />
                </div>
                <h3 className="font-bold text-lg">Health Intelligence</h3>
              </div>
              <p className="text-neutral-dark">
                Monitor energy levels calculated from HRV, resting heart rate, and sleep quality to optimize training and prevent overtraining.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Training Generator Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center lg:hidden mb-8">
            <h2 className="text-3xl font-bold">Intelligent Training Plans</h2>
            <p className="text-neutral-dark mt-2">
              Experience AI-powered training that adapts to your performance
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="mx-auto w-full max-w-md lg:max-w-none">
              <AITrainingGenerator />
            </div>
            <div className="space-y-6">
              <div className="hidden lg:block">
                <h2 className="text-3xl font-bold">Intelligent Training Plans</h2>
                <p className="text-neutral-dark mt-2">
                  Our AI analyzes your running history, fitness level, and goals to create personalized training plans that evolve with you.
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                  <span>Race-specific preparation for 5K to marathon distances</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                  <span>Progressive training loads that match your adaptive capacity</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                  <span>Recovery-based adjustments to prevent overtraining</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center lg:hidden mb-8">
            <h2 className="text-3xl font-bold">Seamless Device Integration</h2>
            <p className="text-neutral-dark mt-2">
              Connect all your fitness platforms in one place
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 order-last lg:order-first">
              <div className="hidden lg:block">
                <h2 className="text-3xl font-bold">Seamless Device Integration</h2>
                <p className="text-neutral-dark mt-2">
                  Connect your favorite fitness devices and platforms to MomentumRun for a comprehensive view of your training and health metrics.
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                  <span>Automatic activity synchronization from Strava, Garmin, and Polar</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                  <span>Health metric consolidation across all your devices</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                  <span>AI-powered insights from your combined fitness data</span>
                </li>
              </ul>
            </div>
            <div className="mx-auto w-full max-w-md lg:max-w-none">
              <FitnessIntegration />
            </div>
          </div>
        </div>
      </section>

      {/* Premium Benefits */}
      <section className="py-16 bg-gradient-to-r from-indigo-900 to-purple-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl font-bold">Premium Benefits</h2>
            <p className="text-blue-100 mt-2">Unlock advanced features with MomentumRun Premium</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <Zap className="text-yellow-400 mr-3 flex-shrink-0" size={24} />
                <h3 className="font-bold text-lg">Human Coach Access</h3>
              </div>
              <p className="text-white/80">
                Get personalized guidance from experienced running coaches who can fine-tune your training plan and provide expert advice.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <Heart className="text-red-400 mr-3 flex-shrink-0" size={24} />
                <h3 className="font-bold text-lg">Advanced Nutrition</h3>
              </div>
              <p className="text-white/80">
                Receive AI-generated nutrition recommendations tailored to your training schedule, goals, and dietary preferences.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <Activity className="text-blue-400 mr-3 flex-shrink-0" size={24} />
                <h3 className="font-bold text-lg">Recovery Analysis</h3>
              </div>
              <p className="text-white/80">
                Get detailed recovery analytics and recommendations based on your biometric data to optimize your training cycle.
              </p>
            </div>
          </div>

          <div className="text-center mt-8 md:mt-12">
            <Link href="/auth?tab=register">
              <Button size="lg" className="w-full sm:w-auto bg-white text-indigo-900 hover:bg-white/90">
                Start 14-Day Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto py-10 md:py-12 px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Information */}
            <div>
              <h4 className="text-lg font-semibold mb-4">MomentumRun</h4>
              <p className="text-sm text-muted-foreground mb-4">
                An AI-powered training platform for runners and athletes, 
                providing personalized training plans and data-driven insights.
              </p>
              <div className="flex space-x-3">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-sm text-muted-foreground hover:text-primary">Home</Link>
                </li>
                <li>
                  <Link href="/activities" className="text-sm text-muted-foreground hover:text-primary">Activities</Link>
                </li>
                <li>
                  <Link href="/coaches" className="text-sm text-muted-foreground hover:text-primary">Coaches</Link>
                </li>
                <li>
                  <Link href="/nutrition" className="text-sm text-muted-foreground hover:text-primary">Nutrition</Link>
                </li>
                <li>
                  <Link href="/subscription" className="text-sm text-muted-foreground hover:text-primary">Pricing</Link>
                </li>
              </ul>
            </div>

            {/* Legal & Info */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Information</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/faq" className="text-sm text-muted-foreground hover:text-primary">FAQs</Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</Link>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Stay Updated</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Subscribe to our newsletter for training tips, updates, and exclusive offers.
              </p>
              <form className="flex flex-col space-y-2">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="bg-background border border-input rounded-md px-3 py-2 text-sm"
                />
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 py-2">
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              © {new Date().getFullYear()} MomentumRun. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary">
                Privacy
              </Link>
              <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary">
                Terms
              </Link>
              <Link href="/faq" className="text-xs text-muted-foreground hover:text-primary">
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
