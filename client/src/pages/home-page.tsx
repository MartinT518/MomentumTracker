import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import aetherRunLogo from "@assets/Minimalist_AetherRun_logo_with_Aether_in_bold_-1747657788061.png";

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
    <div className="min-h-screen relative overflow-hidden">
      <style>{`
        :root {
          --primary-gradient: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          --secondary-gradient: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          --accent-gradient: linear-gradient(135deg, #00d4aa 0%, #00bcd4 100%);
          --energy-gradient: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          --glass-bg: rgba(255, 255, 255, 0.08);
          --glass-border: rgba(255, 255, 255, 0.15);
          --text-primary: #ffffff;
          --text-secondary: rgba(255, 255, 255, 0.85);
          --shadow-lg: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          --shadow-xl: 0 32px 64px -12px rgba(0, 0, 0, 0.35);
        }

        body {
          font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 30%, #06b6d4 70%, #00d4aa 100%);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .floating-shapes {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: -1;
        }

        .floating-shape {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
          animation: float 20s infinite ease-in-out;
        }

        .floating-shape:nth-child(1) {
          width: 300px;
          height: 300px;
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .floating-shape:nth-child(2) {
          width: 200px;
          height: 200px;
          top: 60%;
          right: 10%;
          animation-delay: 7s;
        }

        .floating-shape:nth-child(3) {
          width: 150px;
          height: 150px;
          bottom: 20%;
          left: 60%;
          animation-delay: 14s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(90deg); }
          50% { transform: translateY(0px) rotate(180deg); }
          75% { transform: translateY(20px) rotate(270deg); }
        }

        .glass-morphism {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: var(--shadow-lg);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-morphism:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: var(--shadow-xl);
          background: rgba(255, 255, 255, 0.18);
        }

        .neumorphism-btn {
          background: linear-gradient(145deg, #0ea5e9, #0284c7);
          border: none;
          border-radius: 16px;
          padding: 16px 32px;
          color: white;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 
            5px 5px 15px rgba(14, 165, 233, 0.4),
            -5px -5px 15px rgba(2, 132, 199, 0.4),
            inset 0 0 0 rgba(255, 255, 255, 0.1);
        }

        .neumorphism-btn:hover {
          transform: translateY(-2px);
          box-shadow: 
            8px 8px 25px rgba(14, 165, 233, 0.5),
            -8px -8px 25px rgba(2, 132, 199, 0.5),
            inset 2px 2px 5px rgba(255, 255, 255, 0.1);
        }

        .neumorphism-btn:active {
          transform: translateY(0px);
          box-shadow: 
            inset 3px 3px 10px rgba(14, 165, 233, 0.4),
            inset -3px -3px 10px rgba(2, 132, 199, 0.4);
        }

        .neumorphism-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s ease;
        }

        .neumorphism-btn:hover::before {
          left: 100%;
        }

        .modern-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(25px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          padding: 32px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .modern-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent);
        }

        .modern-card:hover {
          transform: translateY(-12px);
          background: rgba(255, 255, 255, 0.22);
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.2);
        }

        .gradient-text {
          background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #ecfeff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 800;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .pulse-dot {
          width: 12px;
          height: 12px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s infinite;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.8);
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }

        .floating-icon {
          animation: floatIcon 6s ease-in-out infinite;
        }

        @keyframes floatIcon {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .metric-card {
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(15px);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .metric-card:hover {
          background: rgba(0, 0, 0, 0.3);
          transform: scale(1.05);
        }

        .ai-badge {
          background: linear-gradient(135deg, #10b981 0%, #0ea5e9 100%);
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.5);
        }

        .interactive-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin: 24px 0;
        }

        .grid-cell {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 12px 8px;
          text-align: center;
          transition: all 0.3s ease;
          cursor: pointer;
          min-height: 80px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .grid-cell:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 8px 25px rgba(255, 255, 255, 0.1);
        }

        .hero-animation {
          position: relative;
          height: 200px;
          overflow: hidden;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%);
        }

        .running-track {
          position: absolute;
          bottom: 30%;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(79, 172, 254, 0.8) 30%, 
            rgba(79, 172, 254, 0.8) 70%, 
            transparent 100%);
          border-radius: 2px;
        }

        .runner-animated {
          position: absolute;
          bottom: 35%;
          font-size: 32px;
          animation: runAnimation 8s linear infinite;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
        }

        @keyframes runAnimation {
          0% { left: -5%; }
          100% { left: 100%; }
        }

        .insights-popup {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 16px;
          border: 1px solid rgba(0, 242, 254, 0.3);
          min-width: 200px;
          animation: fadeInUp 1s ease;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modern-header {
          backdrop-filter: blur(20px);
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
        }

        .nav-link {
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transform: translateY(-1px);
        }

        .logo-transparent {
          filter: brightness(1.2) contrast(1.1);
          background: transparent;
          mix-blend-mode: multiply;
        }

        .logo-transparent::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(6, 182, 212, 0.1));
          mix-blend-mode: overlay;
        }
      `}</style>

      {/* Floating Background Shapes */}
      <div className="floating-shapes">
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
      </div>
      {/* Modern Fixed Header */}
      <header className="modern-header">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center relative">
              <div className="text-3xl font-bold text-white">
                AetherRun
              </div>
            </div>
            <nav className="hidden md:flex space-x-2">
              <Link href="/faq" className="nav-link">Features</Link>
              <Link href="/subscription" className="nav-link">Pricing</Link>
              <Link href="/faq" className="nav-link">Support</Link>
              <a href="#" className="nav-link">Blog</a>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <button className="nav-link">Sign In</button>
              </Link>
              <Link href="/auth?tab=register">
                <button className="neumorphism-btn">Get Started</button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          
          {/* Hero Section */}
          <section className="text-center mb-20">
            <div className="max-w-4xl mx-auto">
              <div className="ai-badge mb-8 inline-block">
                ✨ Powered by Advanced AI
              </div>
              <h1 className="text-6xl md:text-7xl font-black mb-8 leading-tight">
                Transform Your
                <span className="gradient-text block">Running Journey</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
                AetherRun combines cutting-edge AI training plans, seamless platform integration, 
                and intelligent health insights to push your limits and achieve peak performance.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Link href="/auth?tab=register">
                  <button className="neumorphism-btn text-lg px-8 py-4">
                    Start Free Trial
                  </button>
                </Link>
                <Link href="/auth">
                  <button className="text-white/90 hover:text-white font-semibold text-lg px-8 py-4 rounded-xl border border-white/20 hover:border-white/40 transition-all duration-300 hover:-translate-y-1">
                    Sign In
                  </button>
                </Link>
              </div>
            </div>
          </section>

          {/* Feature Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            
            {/* AI Training Card */}
            <div className="glass-morphism p-8">
              <div className="floating-icon text-4xl mb-6">🧠</div>
              <h3 className="text-2xl font-bold mb-4">AI-Powered Training</h3>
              <p className="text-white/80 mb-6">
                Personalized training plans generated by advanced AI that adapt to your performance and goals.
              </p>
              <div className="hero-animation mb-6">
                <div className="running-track"></div>
                <div className="runner-animated">🏃‍♂️</div>
                <div className="insights-popup">
                  <div className="text-xs font-bold text-cyan-400 mb-2">AI INSIGHTS</div>
                  <div className="text-xs space-y-1">
                    <div>Pace: 4:30 min/km</div>
                    <div>Efficiency: 92%</div>
                    <div className="flex items-center gap-1">
                      <div className="pulse-dot"></div>
                      <span>Analyzing...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Integration Card */}
            <div className="glass-morphism p-8">
              <div className="floating-icon text-4xl mb-6">🔗</div>
              <h3 className="text-2xl font-bold mb-4">Seamless Integration</h3>
              <p className="text-white/80 mb-6">
                Connect with Strava, Garmin, Polar, and more. All your data in one intelligent platform.
              </p>
              <div className="metric-card">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-cyan-400 font-semibold text-sm">LIVE DATA SYNC</span>
                  <div className="pulse-dot"></div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">162</div>
                    <div className="text-xs text-white/60">HR</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">8.2</div>
                    <div className="text-xs text-white/60">Sleep</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">52</div>
                    <div className="text-xs text-white/60">VO2</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Features Card */}
            <div className="glass-morphism p-8">
              <div className="floating-icon text-4xl mb-6">⭐</div>
              <h3 className="text-2xl font-bold mb-4">Premium Experience</h3>
              <p className="text-white/80 mb-6">
                Unlock advanced features including human coach access and detailed analytics.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center text-sm">👨‍🏫</div>
                  <span className="text-sm">Expert Coach Access</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-sm">🍎</div>
                  <span className="text-sm">AI Nutrition Plans</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-sm">📊</div>
                  <span className="text-sm">Advanced Analytics</span>
                </div>
              </div>
            </div>
          </section>

          {/* Training Plan Showcase */}
          <section className="glass-morphism p-8 mb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">AI Training Plan Generator</h2>
                <p className="text-white/80">Personalized weekly schedules that evolve with your progress</p>
              </div>
              <div className="ai-badge">🎯 Active Plan</div>
            </div>
            
            <div className="interactive-grid">
              <div className="text-center font-bold text-white/90 text-sm">MON</div>
              <div className="text-center font-bold text-white/90 text-sm">TUE</div>
              <div className="text-center font-bold text-white/90 text-sm">WED</div>
              <div className="text-center font-bold text-white/90 text-sm">THU</div>
              <div className="text-center font-bold text-white/90 text-sm">FRI</div>
              <div className="text-center font-bold text-white/90 text-sm">SAT</div>
              <div className="text-center font-bold text-white/90 text-sm">SUN</div>
              
              <div className="grid-cell">
                <div className="text-xs text-white/70 mb-1">Long Run</div>
                <div className="text-sm font-bold">12K</div>
                <div className="text-xs text-cyan-400">Easy pace</div>
              </div>
              <div className="grid-cell">
                <div className="text-xs text-white/70 mb-1">Recovery</div>
                <div className="text-sm font-bold">5K</div>
                <div className="text-xs text-green-400">Recovery</div>
              </div>
              <div className="grid-cell">
                <div className="text-xs text-white/70 mb-1">Intervals</div>
                <div className="text-sm font-bold">8x400m</div>
                <div className="text-xs text-orange-400">Hard</div>
              </div>
              <div className="grid-cell">
                <div className="text-xs text-white/70 mb-1">Hills</div>
                <div className="text-sm font-bold">6x200m</div>
                <div className="text-xs text-red-400">Intense</div>
              </div>
              <div className="grid-cell">
                <div className="text-xs text-white/70 mb-1">Tempo</div>
                <div className="text-sm font-bold">8K</div>
                <div className="text-xs text-yellow-400">Moderate</div>
              </div>
              <div className="grid-cell">
                <div className="text-xs text-white/70 mb-1">Easy Run</div>
                <div className="text-sm font-bold">6K</div>
                <div className="text-xs text-blue-400">Easy</div>
              </div>
              <div className="grid-cell">
                <div className="text-xs text-white/70 mb-1">Rest</div>
                <div className="text-sm font-bold">🧘‍♂️</div>
                <div className="text-xs text-gray-400">Recovery</div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <div className="modern-card max-w-2xl mx-auto">
              <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Running?</h2>
              <p className="text-xl text-white/80 mb-8">
                Join thousands of runners who have already elevated their performance with AetherRun's AI-powered platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth?tab=register">
                  <button className="neumorphism-btn text-lg px-10 py-4">
                    Start Your 14-Day Free Trial
                  </button>
                </Link>
                <Link href="/subscription">
                  <button className="text-white/90 hover:text-white font-semibold text-lg px-10 py-4 rounded-xl border border-white/20 hover:border-white/40 transition-all duration-300 hover:-translate-y-1">
                    View Pricing
                  </button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
