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
import { CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Sidebar } from '@/components/common/sidebar';

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
  price: number;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !selectedPlan) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription/success`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Processing",
          description: "Your subscription is being processed. You'll be redirected shortly.",
        });
      }
    } catch (err: any) {
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
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? "Processing..." : `Subscribe - $${selectedPlan?.price.toFixed(2)}/${selectedPlan?.billing_interval}`}
      </Button>
    </form>
  );
};

// The main subscription page component
export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [clientSecret, setClientSecret] = useState("");

  // Fetch available subscription plans
  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/subscription-plans');
      if (!res.ok) throw new Error('Failed to fetch subscription plans');
      return await res.json() as Plan[];
    },
  });

  // Mutation to create a subscription
  const createSubscriptionMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const res = await apiRequest('POST', '/api/get-or-create-subscription', { priceId });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to create subscription');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle selecting a plan and initiating checkout
  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    if (plan.stripe_price_id) {
      createSubscriptionMutation.mutate(plan.stripe_price_id);
    } else {
      toast({
        title: "Invalid Plan",
        description: "This plan doesn't have a valid price ID",
        variant: "destructive",
      });
    }
  };

  // Feature display component
  const FeatureItem = ({ included, text }: { included: boolean; text: string }) => (
    <div className="flex items-center gap-2 mt-2">
      {included ? (
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-gray-400" />
      )}
      <span className={included ? 'text-foreground' : 'text-muted-foreground'}>{text}</span>
    </div>
  );

  // If the user already has an active subscription
  if (user?.subscription_status === 'active') {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Your Subscription</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Active Subscription
                </CardTitle>
                <CardDescription>
                  Your premium features are active
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg">Your subscription is active until {user.subscription_end_date 
                  ? new Date(user.subscription_end_date).toLocaleDateString() 
                  : 'your next billing cycle'}</p>
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Premium Features Include:</h4>
                  <FeatureItem included={true} text="Advanced training analytics" />
                  <FeatureItem included={true} text="Custom training plans" />
                  <FeatureItem included={true} text="Unlimited training history" />
                  <FeatureItem included={true} text="Priority support" />
                  <FeatureItem included={true} text="Early access to new features" />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Manage Subscription
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Complete Your Subscription</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Checkout</CardTitle>
                <CardDescription>Enter your payment details to subscribe</CardDescription>
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
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your subscription details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium">{selectedPlan.name}</span>
                    <span>${selectedPlan.price.toFixed(2)}/{selectedPlan.billing_interval}</span>
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
                    <span>${selectedPlan.price.toFixed(2)}/{selectedPlan.billing_interval}</span>
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
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="space-y-0.5">
          <h2 className="text-3xl font-bold tracking-tight">Subscription Plans</h2>
          <p className="text-muted-foreground">Choose the perfect plan for your training needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Free Plan */}
          <Card className="border-2 border-muted">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Free Plan</CardTitle>
                <Badge variant="outline">Current</Badge>
              </div>
              <CardDescription>Basic training features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <div className="space-y-2">
                <FeatureItem included={true} text="Basic activity tracking" />
                <FeatureItem included={true} text="Personal dashboard" />
                <FeatureItem included={true} text="Limited training history (30 days)" />
                <FeatureItem included={false} text="Advanced training analytics" />
                <FeatureItem included={false} text="Custom training plans" />
                <FeatureItem included={false} text="AI-powered recommendations" />
              </div>
            </CardContent>
            <CardFooter>
              <Button disabled variant="outline" className="w-full">
                Current Plan
              </Button>
            </CardFooter>
          </Card>

          {/* Display fetched plans */}
          {plans?.map((plan) => (
            <Card key={plan.id} className={plan.name.includes('Premium') ? 'border-2 border-primary shadow-lg' : ''}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.name.includes('Premium') && (
                    <Badge>Recommended</Badge>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold">${plan.price.toFixed(2)}</span>
                  <span className="text-muted-foreground">/{plan.billing_interval}</span>
                </div>
                <div className="space-y-2">
                  {plan.features?.map((feature, index) => (
                    <FeatureItem key={index} included={true} text={feature} />
                  ))}
                  {!plan.features && (
                    <>
                      <FeatureItem included={true} text="All free features" />
                      <FeatureItem included={true} text="Advanced training analytics" />
                      <FeatureItem included={true} text="Custom training plans" />
                      <FeatureItem included={true} text="Unlimited training history" />
                      <FeatureItem included={true} text="AI-powered recommendations" />
                      <FeatureItem included={true} text="Priority support" />
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSelectPlan(plan)} 
                  className="w-full"
                  disabled={createSubscriptionMutation.isPending}
                  variant={plan.name.includes('Premium') ? 'default' : 'outline'}
                >
                  {createSubscriptionMutation.isPending ? 'Processing...' : 'Subscribe'} 
                  {!createSubscriptionMutation.isPending && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}