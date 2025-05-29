import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Star, Zap, Users, Target, ArrowRight } from 'lucide-react';
import { LoginModal, RegisterModal } from '@/components/auth/auth-modal';
import { Link } from 'wouter';

const pricingPlans = [
  {
    name: "Free",
    price: 0,
    interval: "forever",
    description: "Perfect for getting started with basic tracking",
    popular: false,
    features: [
      "Basic activity tracking",
      "Simple workout logs",
      "Community access",
      "Basic goal setting",
      "Weekly progress reports"
    ],
    limitations: [
      "Limited AI insights",
      "No advanced analytics",
      "No coach access",
      "Standard support only"
    ]
  },
  {
    name: "Premium Monthly",
    price: 9.99,
    interval: "month",
    description: "Unlock AI-powered training and advanced features",
    popular: true,
    features: [
      "Everything in Free",
      "Advanced training analytics",
      "Custom training plans",
      "Unlimited training history",
      "AI-powered recommendations",
      "Priority support",
      "Early access to new features"
    ],
    limitations: []
  },
  {
    name: "Premium Annual",
    price: 95.88,
    interval: "year",
    originalPrice: 119.88,
    description: "Best value with exclusive annual features",
    popular: false,
    badge: "Best Value",
    features: [
      "Everything in Premium Monthly",
      "Exclusive annual subscriber benefits",
      "Access to human coaches",
      "Advanced biometric analysis",
      "Priority chat support",
      "Personalized race strategies",
      "Recovery optimization plans"
    ],
    limitations: []
  }
];

export default function PricingPage() {
  const { user } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleSelectPlan = (planName: string) => {
    if (!user) {
      if (planName === "Free") {
        setIsRegisterModalOpen(true);
      } else {
        setIsRegisterModalOpen(true);
      }
    } else {
      // Redirect to subscription page for authenticated users
      window.location.href = '/subscription';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-800"
         style={{
           background: `
             linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(79, 70, 229, 0.8) 100%),
             radial-gradient(circle at 30% 50%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
             radial-gradient(circle at 70% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)
           `
         }}>
      {/* Header */}
      <header className="border-b border-white/20 bg-white/10 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg"></div>
                <span className="text-xl font-bold text-white">
                  <span className="text-orange-400">Aether</span>Run
                </span>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard">
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-white/20">Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <button 
                    className="text-white/90 hover:text-white font-medium"
                    onClick={() => setIsLoginModalOpen(true)}
                  >
                    Sign In
                  </button>
                  <button 
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5"
                    onClick={() => setIsRegisterModalOpen(true)}
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Choose Your Training
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400">
              Journey
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
            Start with our free plan and upgrade when you're ready for AI-powered training, 
            advanced analytics, and access to professional coaches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-center space-x-2 text-green-300">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">14-day free trial on all paid plans</span>
            </div>
            <div className="flex items-center space-x-2 text-green-300">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`relative transition-all duration-300 hover:shadow-2xl backdrop-blur-xl bg-white/10 border-white/20 text-white ${
                plan.popular ? 'ring-2 ring-orange-400 shadow-lg scale-105 bg-white/15' : 'hover:scale-105 hover:bg-white/15'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-orange-500 text-white px-4 py-1">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              {plan.badge && !plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-500 text-white px-4 py-1">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                <CardDescription className="text-white/70 mt-2">
                  {plan.description}
                </CardDescription>
                <div className="mt-6">
                  {plan.originalPrice && (
                    <div className="text-sm text-white/50 line-through">
                      ${plan.originalPrice}/year
                    </div>
                  )}
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-white">
                      ${plan.price}
                    </span>
                    <span className="text-white/70 ml-2">/{plan.interval}</span>
                  </div>
                  {plan.originalPrice && (
                    <div className="text-green-300 text-sm font-medium mt-1">
                      Save ${(plan.originalPrice - plan.price).toFixed(2)}/year
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                      <span className="text-white/90">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              
              <CardFooter className="pt-6">
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700' 
                      : plan.name === 'Free' 
                        ? 'bg-gray-900 hover:bg-gray-800' 
                        : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                  onClick={() => handleSelectPlan(plan.name)}
                >
                  {plan.name === 'Free' ? 'Get Started Free' : `Start ${plan.interval === 'month' ? 'Monthly' : 'Annual'} Plan`}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Why Choose AetherRun?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Training</h3>
              <p className="text-white/70">
                Personalized training plans that adapt to your progress and goals using advanced AI.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Smart Analytics</h3>
              <p className="text-white/70">
                Deep insights into your performance with predictive analytics and trend analysis.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Expert Coaches</h3>
              <p className="text-white/70">
                Access to certified running coaches for personalized guidance and support.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-purple-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Platform Integration</h3>
              <p className="text-white/70">
                Seamlessly connect with Strava, Garmin, Polar, and other popular fitness platforms.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                What's included in the free trial?
              </h3>
              <p className="text-white/80">
                You get full access to all Premium features for 14 days, including AI training plans, 
                advanced analytics, and platform integrations. No credit card required.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-white/80">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect 
                immediately, and you'll be charged or credited accordingly.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                What's the difference between Monthly and Annual plans?
              </h3>
              <p className="text-white/80">
                Annual subscribers save money and get exclusive features like access to human coaches, 
                early access to new features, and priority support.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Running?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of runners who have already elevated their performance with AetherRun.
          </p>
          <Button 
            size="lg"
            className="bg-white text-orange-600 hover:bg-gray-100 font-semibold px-8 py-4"
            onClick={() => setIsRegisterModalOpen(true)}
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </main>

      {/* Auth Modals */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />
      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </div>
  );
}