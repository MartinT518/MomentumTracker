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
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, Star, Zap, Users, Target } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Sidebar } from '@/components/common/sidebar';
import { LoginModal, RegisterModal } from '@/components/auth/auth-modal';

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
  price: string | number; // Handle both string and number
  billing_interval: string;
  stripe_price_id: string;
  features: string[];
  is_active: boolean;
};

// Component for the checkout form with Stripe elements
const CheckoutForm = ({ selectedPlan }: { selectedPlan: Plan | null }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Check for payment result in URL on component mount
  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Check URL for potential payment result from redirect
    const paymentIntentSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );
    
    const setupIntentSecret = new URLSearchParams(window.location.search).get(
      "setup_intent_client_secret"
    );
    
    if (paymentIntentSecret) {
      console.log("Found payment intent client secret in URL");
      
      stripe.retrievePaymentIntent(paymentIntentSecret).then(({ paymentIntent }) => {
        console.log("Retrieved payment intent:", paymentIntent?.status);
        
        switch (paymentIntent?.status) {
          case "succeeded":
            toast({
              title: "Payment Successful",
              description: "Thank you for your subscription!",
              variant: "default",
            });
            break;
          case "processing":
            toast({
              title: "Payment Processing",
              description: "Your payment is processing.",
              variant: "default",
            });
            break;
          case "requires_payment_method":
            setPaymentError("Your payment was not successful, please try again.");
            toast({
              title: "Payment Failed",
              description: "Your payment method was declined. Please try again with a different payment method.",
              variant: "destructive",
            });
            break;
          default:
            setPaymentError("Something went wrong with your payment.");
            toast({
              title: "Payment Error",
              description: "Something went wrong with your payment. Please try again.",
              variant: "destructive",
            });
            break;
        }
      });
    } else if (setupIntentSecret) {
      console.log("Found setup intent client secret in URL");
      
      stripe.retrieveSetupIntent(setupIntentSecret).then(({ setupIntent }) => {
        console.log("Retrieved setup intent:", setupIntent?.status);
        
        switch (setupIntent?.status) {
          case "succeeded":
            toast({
              title: "Setup Successful",
              description: "Your payment method has been saved and your subscription is now active!",
              variant: "default",
            });
            break;
          case "processing":
            toast({
              title: "Setup Processing",
              description: "Your payment method is being processed.",
              variant: "default",
            });
            break;
          case "requires_payment_method":
            setPaymentError("Setting up your payment method failed, please try again.");
            toast({
              title: "Setup Failed",
              description: "Your payment method setup failed. Please try again with a different payment method.",
              variant: "destructive",
            });
            break;
          default:
            setPaymentError("Something went wrong with setting up your payment method.");
            toast({
              title: "Setup Error",
              description: "Something went wrong with setting up your payment method. Please try again.",
              variant: "destructive",
            });
            break;
        }
      });
    }
  }, [stripe, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !selectedPlan) {
      toast({
        title: "Payment System Unavailable",
        description: "Please try again later or contact support.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);
    
    try {
      // First, determine if this is a PaymentIntent or SetupIntent based on client secret format
      // SetupIntents have _seti_ in their client secret, PaymentIntents have _pi_
      const clientSecretFromElements = elements.getElement(PaymentElement)?.options?.clientSecret;
      const isSetupIntent = window.location.href.includes('setup_intent') || 
                            (clientSecretFromElements && clientSecretFromElements.includes('_seti_'));
      
      console.log(`Confirming ${isSetupIntent ? 'setup' : 'payment'} with Stripe...`);
      
      let error;
      
      if (isSetupIntent) {
        // Handle SetupIntent confirmation
        const result = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/subscription/success`,
          },
        });
        error = result.error;
      } else {
        // Handle PaymentIntent confirmation
        const result = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/subscription/success`,
          },
        });
        error = result.error;
      }

      if (error) {
        console.error(`${isSetupIntent ? 'Setup' : 'Payment'} confirmation error:`, error);
        setPaymentError(error.message || "Unknown error");
        toast({
          title: `${isSetupIntent ? 'Setup' : 'Payment'} Failed`,
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log(`${isSetupIntent ? 'Setup' : 'Payment'} confirmation initiated successfully`);
        toast({
          title: `${isSetupIntent ? 'Setup' : 'Payment'} Processing`,
          description: "Your subscription is being processed. You'll be redirected shortly.",
        });
      }
    } catch (err: any) {
      console.error("Payment processing exception:", err);
      setPaymentError(err.message || "An unexpected error occurred");
      toast({
        title: "Payment Error",
        description: err.message || "An error occurred during payment processing",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-6">
      {paymentError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 mb-4">
          <p className="text-sm font-medium">{paymentError}</p>
        </div>
      )}
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? "Processing..." : `Subscribe - $${formatPrice(selectedPlan?.price)}/${selectedPlan?.billing_interval}`}
      </Button>
      <p className="text-sm text-muted-foreground mt-2 text-center">
        Your payment is securely processed by Stripe
      </p>
    </form>
  );
};

// Helper function to format prices consistently
const formatPrice = (price: string | number | undefined): string => {
  if (!price) return '0.00';
  return parseFloat(price.toString()).toFixed(2);
};

// The main subscription page component
export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [loadingPlanId, setLoadingPlanId] = useState<number | null>(null);
  const [isActivatingTest, setIsActivatingTest] = useState(false);

  // Fetch available subscription plans
  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/subscription-plans');
      if (!res.ok) throw new Error('Failed to fetch subscription plans');
      return await res.json() as Plan[];
    },
  });

  // Mutation to activate test premium mode
  const activateTestPremiumMutation = useMutation({
    mutationFn: async () => {
      setIsActivatingTest(true);
      const res = await apiRequest('POST', '/api/dev/activate-premium');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to activate test premium');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      setIsActivatingTest(false);
      toast({
        title: "Test Premium Activated",
        description: `Premium features are now available until ${new Date(data.expiresAt).toLocaleDateString()}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: Error) => {
      setIsActivatingTest(false);
      toast({
        title: "Activation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to create a subscription
  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ priceId, planId }: { priceId: string, planId: number }) => {
      console.log("Creating subscription with price ID:", priceId);
      setLoadingPlanId(planId);
      
      const res = await apiRequest('POST', '/api/get-or-create-subscription', { priceId });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Subscription creation failed:", errorData);
        throw new Error(errorData.error?.message || 'Failed to create subscription');
      }
      
      const data = await res.json();
      console.log("Subscription created successfully:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("Setting client secret from subscription response:", {
        hasClientSecret: !!data.clientSecret,
        clientSecretType: typeof data.clientSecret
      });
      
      setLoadingPlanId(null);
      
      if (!data.clientSecret) {
        toast({
          title: "Subscription Error",
          description: "Payment setup failed. Please try again or contact support.",
          variant: "destructive",
        });
        return;
      }
      
      setClientSecret(data.clientSecret);
    },
    onError: (error: Error) => {
      console.error("Subscription mutation error:", error);
      setLoadingPlanId(null);
      toast({
        title: "Subscription Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle selecting a plan and initiating checkout
  // Mutation to cancel a subscription
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/cancel-subscription');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Subscription Canceled",
        description: `Your subscription will remain active until ${new Date(data.cancelAt).toLocaleDateString()}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = (plan: Plan) => {
    // Handle the free plan (cancel subscription) case
    if (plan.stripe_price_id === 'cancel') {
      if (confirm('Are you sure you want to cancel your subscription? You will still have access to premium features until the end of your billing period.')) {
        cancelSubscriptionMutation.mutate();
      }
      return;
    }
    
    // Handle subscription to a paid plan
    setSelectedPlan(plan);
    if (plan.stripe_price_id) {
      createSubscriptionMutation.mutate({ 
        priceId: plan.stripe_price_id,
        planId: plan.id
      });
    } else {
      toast({
        title: "Invalid Plan",
        description: "This plan doesn't have a valid price ID",
        variant: "destructive",
      });
    }
  };

  // Feature display component
  const FeatureItem = ({ included, text, isHighlighted = false }: { included: boolean; text: string; isHighlighted?: boolean }) => (
    <div className={`flex items-center gap-2 mt-2 ${isHighlighted ? 'bg-white/10 p-1.5 rounded-md' : ''}`}>
      {included ? (
        <CheckCircle2 className={`h-5 w-5 ${isHighlighted ? 'text-purple-400' : 'text-green-400'}`} />
      ) : (
        <XCircle className="h-5 w-5 text-gray-400" />
      )}
      <span className={included 
        ? `${isHighlighted ? 'text-white font-medium drop-shadow-sm' : 'text-white drop-shadow-sm'}`
        : 'text-white/60 drop-shadow-sm'
      }>
        {text}
        {isHighlighted && <span className="ml-1 text-xs text-purple-300 drop-shadow-sm">(Annual only)</span>}
      </span>
    </div>
  );

  // Calculate subscription type information
  const isSubscribed = user?.subscription_status === 'active';
  const isAnnualPlan = isSubscribed && user.subscription_end_date && 
    new Date(user.subscription_end_date).getTime() - new Date().getTime() > 31536000000 / 2;
  const currentPlanInterval = isAnnualPlan ? 'year' : 'month';

  // Loading state
  if (isLoadingPlans) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Subscription Plans</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-6 bg-muted rounded-md w-3/4"></div>
                  <div className="h-4 bg-muted rounded-md w-1/2"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-10 bg-muted rounded-md w-1/2"></div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-4 bg-muted rounded-md w-full"></div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="h-9 bg-muted rounded-md w-full"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Checkout view when a plan has been selected
  if (selectedPlan && clientSecret) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700">
        <Sidebar />
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Complete Your Subscription</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white drop-shadow-sm">Checkout</CardTitle>
                <CardDescription className="text-white/80 drop-shadow-sm">Enter your payment details to subscribe</CardDescription>
              </CardHeader>
              <CardContent>
                {stripePromise ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm selectedPlan={selectedPlan} />
                  </Elements>
                ) : (
                  <div className="p-4 border rounded-md bg-yellow-50 text-yellow-800">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      <p className="font-medium">Stripe is not properly configured</p>
                    </div>
                    <p className="mt-2 text-sm">Please contact the administrator.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white drop-shadow-sm">Order Summary</CardTitle>
                <CardDescription className="text-white/80 drop-shadow-sm">Review your subscription details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium">{selectedPlan.name}</span>
                    <span>${formatPrice(selectedPlan.price)}/{selectedPlan.billing_interval}</span>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="font-medium">You'll get:</p>
                    {selectedPlan.features?.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${formatPrice(selectedPlan.price)}/{selectedPlan.billing_interval}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Plan selection view
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700">
      <Sidebar />
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="space-y-0.5">
          <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Subscription Plans</h2>
          <p className="text-white/80 drop-shadow-sm">Choose the perfect plan for your training needs</p>
        </div>

        {/* Current subscription info card */}
        {isSubscribed && (
          <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20 border-2 border-green-300/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white drop-shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                Active Subscription
              </CardTitle>
              <CardDescription className="text-white/80 drop-shadow-sm">
                Your premium features are active
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-white drop-shadow-sm">Your subscription is active until {user?.subscription_end_date 
                ? new Date(user.subscription_end_date).toLocaleDateString() 
                : 'your next billing cycle'}</p>
              <div className="mt-2">
                <span className="text-sm text-white/70 drop-shadow-sm">
                  {isAnnualPlan ? 'Annual Plan' : 'Monthly Plan'} - You have access to {isAnnualPlan ? 'all premium features' : 'standard premium features'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Developer Test Card */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 border-2 border-violet-400/50">
            <CardHeader className="bg-white/5">
              <div className="flex justify-between items-center">
                <CardTitle className="text-white drop-shadow-sm">Developer Testing</CardTitle>
                <Badge variant="outline" className="bg-violet-200/20 text-violet-300 hover:bg-violet-200/30 border-violet-400/50">Test Mode</Badge>
              </div>
              <CardDescription className="text-white/80 drop-shadow-sm">Activate premium features for testing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <span className="text-3xl font-bold text-white drop-shadow-sm">$0</span>
                <span className="text-white/70 drop-shadow-sm">/30 days</span>
              </div>
              <div className="space-y-2">
                <FeatureItem included={true} text="All premium features" />
                <FeatureItem included={true} text="Activity tracking" />
                <FeatureItem included={true} text="Goal visualization" />
                <FeatureItem included={true} text="Performance metrics" />
                <FeatureItem included={true} text="No payment required" />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="default" 
                className="w-full bg-violet-600 hover:bg-violet-700" 
                onClick={() => activateTestPremiumMutation.mutate()}
                disabled={isActivatingTest}
              >
                {isActivatingTest ? "Activating..." : "Activate Test Mode"}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Free Plan */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 border-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white drop-shadow-sm">Free Plan</CardTitle>
                {!isSubscribed && <Badge variant="outline" className="bg-white/20 text-white border-white/30">Current</Badge>}
              </div>
              <CardDescription className="text-white/80 drop-shadow-sm">Basic training features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-3xl font-bold text-white drop-shadow-sm">$0</span>
                <span className="text-white/70 drop-shadow-sm">/month</span>
              </div>
              <div className="space-y-2">
                <FeatureItem included={true} text="Basic activity tracking" />
                <FeatureItem included={true} text="Personal dashboard" />
                <FeatureItem included={true} text="Basic goal setting" />
                <FeatureItem included={false} text="Detailed performance metrics" />
                <FeatureItem included={false} text="Advanced goal visualization" />
                <FeatureItem included={false} text="Data from fitness platforms" />
              </div>
            </CardContent>
            <CardFooter>
              {!isSubscribed ? (
                <Button disabled variant="outline" className="w-full">
                  Current Plan
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleSelectPlan({ id: 0, name: 'Free Plan', description: 'Cancel subscription', price: '0', billing_interval: 'month', stripe_price_id: 'cancel', features: [], is_active: false })}
                >
                  Cancel Subscription
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Display fetched plans */}
          {plans?.map((plan) => {
            const isAnnual = plan.billing_interval === 'year';
            
            return (
              <Card 
                key={plan.id} 
                className={`bg-white/10 backdrop-blur-sm border-white/20 ${isAnnual ? 'border-2 border-purple-400/50' : 'border-2 border-blue-400/50'} transition-all duration-300 hover:shadow-xl`}
              >
                <CardHeader className={`${isAnnual ? 'bg-white/5' : 'bg-white/5'}`}>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white drop-shadow-sm">{plan.name}</CardTitle>
                    {isSubscribed && isAnnual === isAnnualPlan && plan.billing_interval === currentPlanInterval ? (
                      <Badge variant="outline" className="bg-green-200/20 text-green-300 border-green-400/50">Current</Badge>
                    ) : isAnnual ? (
                      <Badge className="bg-purple-500/80 hover:bg-purple-600/80 text-white">Best Value</Badge>
                    ) : (
                      <Badge className="bg-blue-500/80 text-white">Basic Plan</Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2 text-white/80 drop-shadow-sm">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold text-white drop-shadow-sm">${formatPrice(plan.price)}</span>
                    <span className="text-white/70 drop-shadow-sm">/{plan.billing_interval}</span>
                    {isAnnual && (
                      <span className="ml-2 inline-block bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-purple-900/30 dark:text-purple-300">
                        Save 20%
                      </span>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {plan.features?.map((feature, index) => {
                      // Highlight special features for annual plan
                      const isSpecialFeature = isAnnual && (
                        feature.includes("Early access") || 
                        feature.includes("Extended") || 
                        feature.includes("Priority") || 
                        feature.includes("Unlimited") ||
                        feature.includes("Advanced")
                      );
                      
                      return (
                        <FeatureItem 
                          key={index} 
                          included={true} 
                          text={feature}
                          isHighlighted={isSpecialFeature}
                        />
                      );
                    })}
                    {!plan.features && (
                      <>
                        <FeatureItem included={true} text="All free features" />
                        <FeatureItem included={true} text="Full activity tracking" />
                        <FeatureItem included={true} text="Enhanced goal visualization" />
                        <FeatureItem included={true} text="Detailed performance metrics" />
                        <FeatureItem included={true} text="Integration with fitness platforms" />
                        <FeatureItem included={true} text="Standard support" />
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  {isSubscribed && isAnnual === isAnnualPlan && plan.billing_interval === currentPlanInterval ? (
                    <Button 
                      disabled
                      className="w-full"
                      variant="outline"
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleSelectPlan(plan)} 
                      className="w-full"
                      disabled={loadingPlanId === plan.id || createSubscriptionMutation.isPending}
                      variant="default"
                      style={isAnnual ? {backgroundColor: 'rgb(147, 51, 234)', borderColor: 'rgb(147, 51, 234)'} : {}}
                    >
                      {loadingPlanId === plan.id ? 'Processing...' : 'Subscribe'} 
                      {loadingPlanId !== plan.id && !createSubscriptionMutation.isPending && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}