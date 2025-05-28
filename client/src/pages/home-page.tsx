import { useEffect } from "react";
import { useLocation, Link } from "wouter";
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
    <div style={{
      fontFamily: 'Poppins, sans-serif',
      background: 'linear-gradient(135deg, #2a398f, #3a4db9)',
      color: '#ffffff',
      minHeight: '100vh'
    }}>
      <style>{`
        .glass-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }
        
        .glass-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #8a4df0, #f04d6a);
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(138, 77, 240, 0.3);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(138, 77, 240, 0.4);
        }
        
        .feature-highlight {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 16px;
            transition: all 0.3s ease;
        }
        
        .feature-highlight:hover {
            background: rgba(255, 255, 255, 0.12);
            transform: translateY(-3px);
        }
        
        .highlight-icon {
            background: rgba(138, 77, 240, 0.2);
            border-radius: 12px;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
        }
        
        .progress-bar {
            height: 6px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            overflow: hidden;
            margin: 8px 0;
        }
        
        .progress-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #4df0b0, #4d9df0);
            border-radius: 3px;
            transition: width 1.5s ease;
            width: 85%;
        }
        
        .running-path {
            position: absolute;
            bottom: 10%;
            left: 5%;
            width: 90%;
            height: 3px;
            background: linear-gradient(90deg, 
                rgba(255, 255, 255, 0) 0%, 
                rgba(255, 255, 255, 0.7) 30%, 
                rgba(255, 255, 255, 0.7) 70%, 
                rgba(255, 255, 255, 0) 100%);
        }
        
        .runner-figure {
            position: absolute;
            bottom: 15%;
            left: 20%;
            color: #4df0b0;
            font-size: 36px;
            animation: run 10s infinite linear;
        }
        
        @keyframes run {
            0% { left: 5%; }
            100% { left: 90%; }
        }
        
        .week-schedule {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
            font-size: 0.7rem;
        }
        
        .day-label {
            text-align: center;
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .workout-cell {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            padding: 6px;
            text-align: center;
            font-size: 0.65rem;
            min-height: 60px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            transition: all 0.3s ease;
        }
        
        .workout-cell:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }
        
        .garmin-data {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 16px;
            position: relative;
            overflow: hidden;
        }
        
        .garmin-data-header {
            color: #4df0b0;
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .data-metric {
            margin-bottom: 8px;
        }
        
        .metric-value {
            font-size: 1.4rem;
            font-weight: 700;
            margin-right: 4px;
        }
        
        .metric-unit {
            font-size: 0.8rem;
            opacity: 0.7;
        }
        
        .login-register-card, .premium-benefits-card {
            height: calc(50% - 1rem);
        }
        
        #ai-insights {
            position: relative;
            background: rgba(26, 26, 46, 0.8);
            border-radius: 12px;
            padding: 12px;
            display: inline-block;
            right: -40px;
            top: 40px;
        }
      `}</style>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="text-2xl font-bold">
            Aether<span style={{ color: '#8a4df0' }}>Run</span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <Link href="/faq" className="hover:text-purple-300 transition">Features</Link>
            <Link href="/subscription" className="hover:text-purple-300 transition">Pricing</Link>
            <Link href="/faq" className="hover:text-purple-300 transition">Support</Link>
            <a href="#" className="hover:text-purple-300 transition">Blog</a>
          </nav>
          <button className="md:hidden">
            <i className="fas fa-bars"></i>
          </button>
        </header>

        {/* Main Content */}
        <main className="flex flex-col md:flex-row gap-8">
          {/* Left Column - Feature Showcase */}
          <div className="w-full md:w-2/3 space-y-8">
            {/* Hero Section */}
            <section className="glass-card p-8 relative overflow-hidden">
              <h1 className="text-4xl font-bold mb-4">Transform Your Running Journey</h1>
              <p className="text-lg mb-8 opacity-80">
                AetherRun combines AI-powered training plans, advanced data integration, and 
                intelligent health tracking to push your limits and achieve your running goals.
              </p>
              
              <div className="relative h-48 mb-6">
                <div className="running-path"></div>
                <div className="runner-figure">
                  <i className="fas fa-running"></i>
                </div>
                
                <div id="ai-insights" className="text-sm">
                  <div className="font-bold mb-1">AI INSIGHTS:</div>
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
              
              <div className="progress-bar">
                <div className="progress-bar-fill"></div>
              </div>
              <div className="text-xs text-right opacity-70">AI ENERGY ANALYSIS</div>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="feature-highlight">
                  <div className="highlight-icon">
                    <i className="fas fa-brain" style={{ color: '#8a4df0' }}></i>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">AI-Powered Training</h3>
                  <p className="text-sm opacity-80">Personalized plans built by OpenAI that adapt to your performance.</p>
                </div>
                <div className="feature-highlight">
                  <div className="highlight-icon">
                    <i className="fas fa-chart-line" style={{ color: '#8a4df0' }}></i>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                  <p className="text-sm opacity-80">Deep insights into pace, heart rate, and energy patterns.</p>
                </div>
              </div>
            </section>
            
            {/* Platform Integration */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Platform Integration</h2>
              <p className="mb-6 opacity-80">
                Sync with Strava, Garmin Connect, and Polar seamlessly to keep all your training data in one place.
              </p>
              
              <div className="flex justify-around mb-6">
                <div style={{ width: '24px', height: '24px', color: '#f87171', animation: 'pulse 2s infinite' }}>
                  <i className="fas fa-heart"></i>
                </div>
                <div style={{ width: '24px', height: '24px', color: '#60a5fa' }}>
                  <i className="fas fa-stopwatch"></i>
                </div>
                <div style={{ width: '24px', height: '24px', color: '#34d399' }}>
                  <i className="fas fa-shoe-prints"></i>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="feature-highlight">
                  <h3 className="text-lg font-semibold mb-2">Platform Integration</h3>
                  <p className="text-sm opacity-80">Sync with Strava, Garmin Connect, and Polar seamlessly.</p>
                </div>
                <div className="feature-highlight">
                  <h3 className="text-lg font-semibold mb-2">Health Intelligence</h3>
                  <p className="text-sm opacity-80">Monitor energy levels calculated from HRV and sleep quality.</p>
                </div>
              </div>
              
              <div className="garmin-data mt-8">
                <div className="garmin-data-header">
                  <span>GARMIN DATA INSIGHTS</span>
                  <span className="text-xs">• SYNCING...</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="data-metric">
                    <div className="text-xs opacity-70">Heart Rate</div>
                    <div>
                      <span className="metric-value">62</span>
                      <span className="metric-unit">bpm</span>
                    </div>
                  </div>
                  <div className="data-metric">
                    <div className="text-xs opacity-70">Sleep</div>
                    <div>
                      <span className="metric-value">7.2</span>
                      <span className="metric-unit">hrs</span>
                    </div>
                  </div>
                  <div className="data-metric">
                    <div className="text-xs opacity-70">VO2 Max</div>
                    <div>
                      <span className="metric-value">48</span>
                      <span className="metric-unit"></span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* AI Training Plan Generator */}
            <section className="glass-card p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">AI TRAINING PLAN GENERATOR</h2>
                <span className="text-xs bg-green-400 text-green-900 rounded-full px-3 py-1">• COMPLETE</span>
              </div>
              
              <div className="week-schedule mb-4">
                <div className="day-label">M</div>
                <div className="day-label">T</div>
                <div className="day-label">W</div>
                <div className="day-label">T</div>
                <div className="day-label">F</div>
                <div className="day-label">S</div>
                <div className="day-label">S</div>
                
                <div className="workout-cell">
                  <div className="text-xs opacity-70">Long Run</div>
                  <div className="text-xs font-semibold mt-1">8.5 miles</div>
                </div>
                <div className="workout-cell">
                  <div className="text-xs opacity-70">Recovery Run</div>
                  <div className="text-xs font-semibold mt-1">3 miles</div>
                </div>
                <div className="workout-cell">
                  <div className="text-xs opacity-70">Interval Training</div>
                  <div className="text-xs font-semibold mt-1">5x400m</div>
                </div>
                <div className="workout-cell">
                  <div className="text-xs opacity-70">Hill Repeats</div>
                  <div className="text-xs font-semibold mt-1">6x200m</div>
                </div>
                <div className="workout-cell">
                  <div className="text-xs opacity-70">Tempo Run</div>
                  <div className="text-xs font-semibold mt-1">5 miles</div>
                </div>
                <div className="workout-cell">
                  <div className="text-xs opacity-70">Easy Run</div>
                  <div className="text-xs font-semibold mt-1">4 miles</div>
                </div>
                <div className="workout-cell">
                  <div className="text-xs opacity-70">Rest</div>
                  <div className="text-xs font-semibold mt-1">-</div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Authentication */}
          <div className="w-full md:w-1/3 space-y-8">
            {/* Login/Register Card */}
            <div className="glass-card p-6 login-register-card">
              <h3 className="text-xl font-bold mb-4">Join AetherRun</h3>
              <p className="text-sm opacity-80 mb-6">
                Start your AI-powered running journey today and unlock your full potential.
              </p>
              
              <div className="space-y-4">
                <Link href="/auth?tab=register">
                  <button className="btn-primary w-full">Create Account</button>
                </Link>
                <Link href="/auth">
                  <button className="w-full bg-white bg-opacity-10 border border-white border-opacity-30 py-3 px-4 rounded-lg font-semibold transition-all duration-300 hover:bg-opacity-20">
                    Sign In
                  </button>
                </Link>
              </div>
            </div>

            {/* Premium Benefits Card */}
            <div className="glass-card p-6 premium-benefits-card">
              <h3 className="text-xl font-bold mb-4">Premium Benefits</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded" style={{ background: 'linear-gradient(135deg, #f04d6a, #8a4df0)' }}>
                    <i className="fas fa-bolt text-white text-xs p-1"></i>
                  </div>
                  <div>
                    <div className="font-semibold">Human Coach Access</div>
                    <div className="opacity-70">Get guidance from experienced running coaches</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded" style={{ background: 'linear-gradient(135deg, #4df0b0, #4d9df0)' }}>
                    <i className="fas fa-heart text-white text-xs p-1"></i>
                  </div>
                  <div>
                    <div className="font-semibold">Advanced Nutrition</div>
                    <div className="opacity-70">AI-generated nutrition recommendations</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded" style={{ background: 'linear-gradient(135deg, #8a4df0, #3a4db9)' }}>
                    <i className="fas fa-chart-line text-white text-xs p-1"></i>
                  </div>
                  <div>
                    <div className="font-semibold">Recovery Analysis</div>
                    <div className="opacity-70">Detailed recovery analytics and insights</div>
                  </div>
                </div>
              </div>
              <Link href="/auth?tab=register">
                <button className="btn-primary w-full mt-6 text-sm">Start 14-Day Free Trial</button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
