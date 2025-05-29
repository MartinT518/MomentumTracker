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
    price: 14.99,
    interval: "month",
    description: "Unlock AI-powered training and advanced features",
    popular: true,
    features: [
      "Everything in Free",
      "AI-powered training plans",
      "Advanced analytics dashboard",
      "Unlimited platform integrations",
      "Smart nutrition recommendations",
      "Priority email support",
      "Custom goal tracking",
      "Performance predictions"
    ],
    limitations: []
  },
  {
    name: "Premium Annual",
    price: 119.99,
    interval: "year",
    originalPrice: 179.88,
    description: "Best value with exclusive annual features",
    popular: false,
    badge: "Best Value",
    features: [
      "Everything in Premium Monthly",
      "Access to human coaches",
      "Advanced biometric analysis",
      "Early access to new features",
      "Priority chat support",
      "Personalized race strategies",
      "Recovery optimization plans",
      "Exclusive community forums"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg"></div>
                <span className="text-xl font-bold text-gray-900">
                  <span className="text-orange-500">Aether</span>Run
                </span>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <button 
                    className="text-gray-600 hover:text-gray-900 font-medium"
                    onClick={() => setIsLoginModalOpen(true)}
                  >
                    Sign In
                  </button>
                  <button 
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
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
          <Badge className="mb-4 bg-orange-100 text-orange-800 border-orange-200">
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Choose Your Training
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
              Journey
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Start with our free plan and upgrade when you're ready for AI-powered training, 
            advanced analytics, and access to professional coaches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">14-day free trial on all paid plans</span>
            </div>
            <div className="flex items-center space-x-2 text-green-600">
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
              className={`relative transition-all duration-300 hover:shadow-xl ${
                plan.popular ? 'ring-2 ring-orange-500 shadow-lg scale-105' : 'hover:scale-105'
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
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  {plan.description}
                </CardDescription>
                <div className="mt-6">
                  {plan.originalPrice && (
                    <div className="text-sm text-gray-500 line-through">
                      ${plan.originalPrice}/year
                    </div>
                  )}
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">/{plan.interval}</span>
                  </div>
                  {plan.originalPrice && (
                    <div className="text-green-600 text-sm font-medium mt-1">
                      Save ${(plan.originalPrice - plan.price).toFixed(2)}/year
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
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
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose AetherRun?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Training</h3>
              <p className="text-gray-600">
                Personalized training plans that adapt to your progress and goals using advanced AI.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Analytics</h3>
              <p className="text-gray-600">
                Deep insights into your performance with predictive analytics and trend analysis.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Coaches</h3>
              <p className="text-gray-600">
                Access to certified running coaches for personalized guidance and support.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Platform Integration</h3>
              <p className="text-gray-600">
                Seamlessly connect with Strava, Garmin, Polar, and other popular fitness platforms.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What's included in the free trial?
              </h3>
              <p className="text-gray-600">
                You get full access to all Premium features for 14 days, including AI training plans, 
                advanced analytics, and platform integrations. No credit card required.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect 
                immediately, and you'll be charged or credited accordingly.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What's the difference between Monthly and Annual plans?
              </h3>
              <p className="text-gray-600">
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