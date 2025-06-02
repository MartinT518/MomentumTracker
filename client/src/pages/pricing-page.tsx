import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Star, Zap, Users, Target, ArrowRight, ArrowLeft, XCircle, AlertCircle, CreditCard, Calendar, DollarSign } from 'lucide-react';
import { LoginModal, RegisterModal } from '@/components/auth/auth-modal';
import { Link } from 'wouter';
import { AppLayout } from '@/components/common/app-layout';
import { AppFooter } from '@/components/common/app-footer';
import { Separator } from '@/components/ui/separator';
import aetherRunLogo from "@assets/Minimalist_AetherRun_logo_with_Aether_in_bold_-1747657788061.png";

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('Missing VITE_STRIPE_PUBLIC_KEY environment variable. Stripe integration will not work.');
}

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY) 
  : null;

type Plan = {
  id: number;
  name: string;
  description: string;
  price: string | number;
  billing_interval: string;
  stripe_price_id: string;
  features: string[];
  is_active: boolean;
};

type UserSubscription = {
  id: number;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  price: number;
  billing_interval: string;
};

// Component for the checkout form with Stripe elements
const CheckoutForm = ({ selectedPlan }: { selectedPlan: Plan | null }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/pricing?payment=success`,
      },
    });

    if (error) {
      setPaymentError(error.message || 'An unexpected error occurred.');
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  if (!selectedPlan) {
    return null;
  }

  return (
    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
      <CardHeader>
        <CardTitle className="text-white drop-shadow-sm">Complete Your Subscription</CardTitle>
        <CardDescription className="text-white/70 drop-shadow-sm">
          Subscribe to {selectedPlan.name} - ${selectedPlan.price}/{selectedPlan.billing_interval}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/5 rounded-lg p-4">
            <PaymentElement />
          </div>
          
          {paymentError && (
            <div className="text-red-300 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {paymentError}
            </div>
          )}
          
          <Button 
            type="submit" 
            disabled={!stripe || isProcessing}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          >
            {isProcessing ? 'Processing...' : `Subscribe to ${selectedPlan.name}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

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
  const { toast } = useToast();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch available plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/subscription-plans');
      return await res.json();
    },
  });

  // Fetch user's current subscription (only for authenticated users)
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['/api/user-subscription'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user-subscription');
      return await res.json();
    },
    enabled: !!user,
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await apiRequest('POST', '/api/create-subscription', { planId });
      return await res.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      toast({
        title: "Subscription Created",
        description: "Please complete your payment to activate your subscription.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/cancel-subscription');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-subscription'] });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will remain active until the end of the current billing period.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = (planName: string, planId?: number) => {
    if (!user) {
      if (planName === "Free") {
        setIsRegisterModalOpen(true);
      } else {
        setIsRegisterModalOpen(true);
      }
    } else if (planId && planName !== "Free") {
      const plan = plans.find((p: Plan) => p.id === planId);
      if (plan) {
        setSelectedPlan(plan);
        createSubscriptionMutation.mutate(planId);
      }
    }
  };

  // Render subscription management for authenticated users
  const renderSubscriptionManagement = () => {
    if (subscriptionLoading) {
      return (
        <div className="text-center py-8">
          <div className="text-white">Loading subscription details...</div>
        </div>
      );
    }

    if (subscription) {
      return (
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white drop-shadow-sm flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/80">Plan:</span>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  {subscription.plan_name}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">Status:</span>
                <Badge className={subscription.status === 'active' ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"}>
                  {subscription.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">Price:</span>
                <span className="text-white">${subscription.price}/{subscription.billing_interval}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">Next billing date:</span>
                <span className="text-white">{new Date(subscription.current_period_end).toLocaleDateString()}</span>
              </div>
              
              {subscription.cancel_at_period_end && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-yellow-300 text-sm">
                    Your subscription will be cancelled at the end of the current billing period.
                  </p>
                </div>
              )}
              
              {!subscription.cancel_at_period_end && (
                <Button 
                  onClick={() => cancelSubscriptionMutation.mutate()}
                  disabled={cancelSubscriptionMutation.isPending}
                  variant="destructive"
                  className="w-full"
                >
                  {cancelSubscriptionMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  // Render pricing cards
  const renderPricingCards = () => {
    const plansToShow = user ? plans : pricingPlans;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {plansToShow.map((plan: any, index: number) => (
          <Card key={plan.name} className={`relative bg-white/10 backdrop-blur-xl border border-white/20 transition-all duration-300 hover:bg-white/15 hover:scale-105 ${plan.popular ? 'ring-2 ring-orange-400 shadow-2xl' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1 text-sm font-medium shadow-lg">
                  Most Popular
                </Badge>
              </div>
            )}
            
            {plan.badge && (
              <div className="absolute -top-4 right-4">
                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 text-xs font-medium shadow-lg">
                  {plan.badge}
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold text-white drop-shadow-lg">{plan.name}</CardTitle>
              <CardDescription className="text-white/80 drop-shadow-md mt-2">{plan.description}</CardDescription>
              
              <div className="mt-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-white drop-shadow-lg">
                    ${typeof plan.price === 'string' ? plan.price : plan.price}
                  </span>
                  <span className="text-white/70 text-lg drop-shadow-md">
                    /{plan.interval || plan.billing_interval}
                  </span>
                </div>
                
                {plan.originalPrice && (
                  <div className="mt-2">
                    <span className="text-white/60 line-through text-lg drop-shadow-md">
                      ${plan.originalPrice}
                    </span>
                    <span className="text-green-400 font-medium ml-2 drop-shadow-md">
                      Save ${(plan.originalPrice - plan.price).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature: string, featureIndex: number) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0 drop-shadow-md" />
                    <span className="text-white/90 text-sm drop-shadow-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {plan.limitations && plan.limitations.length > 0 && (
                <div className="border-t border-white/20 pt-4 mt-6">
                  <p className="text-white/60 text-xs mb-2 drop-shadow-sm">Limitations:</p>
                  <ul className="space-y-1">
                    {plan.limitations.map((limitation: string, limitIndex: number) => (
                      <li key={limitIndex} className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-white/60 text-xs">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              <Button 
                onClick={() => handleSelectPlan(plan.name, plan.id)}
                className={`w-full transition-all duration-300 ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5' 
                    : 'bg-white/20 hover:bg-white/30 text-white border-white/20 hover:border-white/40'
                }`}
                disabled={user && subscription && subscription.plan_name === plan.name}
              >
                {user && subscription && subscription.plan_name === plan.name ? (
                  'Current Plan'
                ) : plan.name === "Free" ? (
                  user ? 'Current Plan' : 'Get Started Free'
                ) : (
                  `Choose ${plan.name}`
                )}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      {user ? (
        // Authenticated user view with subscription management
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-white drop-shadow-lg">
              Subscription & Billing
            </h1>
            <p className="text-xl text-white/80 drop-shadow-md">
              Manage your subscription and explore upgrade options
            </p>
          </div>

          {renderSubscriptionManagement()}
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-white drop-shadow-lg text-center">
              Available Plans
            </h2>
            {renderPricingCards()}
          </div>

          {/* Checkout form for Stripe */}
          {clientSecret && selectedPlan && stripePromise && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm selectedPlan={selectedPlan} />
            </Elements>
          )}
        </div>
      ) : (
        // Non-authenticated user view with standalone pricing
        <div className="min-h-screen -m-4 md:-m-6 bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-800"
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
                <img 
                  src={aetherRunLogo} 
                  alt="AetherRun Logo" 
                  className="w-8 h-8 object-contain"
                />
                <span className="text-xl font-bold text-white">
                  <span className="text-cyan-300">Aether</span>Run
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
      </main>
        </div>
      )}

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
    </AppLayout>
  );
}