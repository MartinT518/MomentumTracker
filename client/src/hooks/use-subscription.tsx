import { useAuth } from '@/hooks/use-auth';

type SubscriptionType = 'none' | 'monthly' | 'annual';

/**
 * Custom hook to check subscription status and type
 * Determines whether the user has no subscription, a monthly subscription, or an annual subscription
 * Annual subscriptions are determined by checking if the subscription end date is more than 6 months away
 */
export function useSubscription() {
  const { user } = useAuth();
  
  // Check if user has an active subscription
  const hasSubscription = user?.subscription_status === 'active';
  
  // Determine subscription type
  let subscriptionType: SubscriptionType = 'none';
  
  if (hasSubscription) {
    // Check if user has an annual subscription by looking at expiration date
    // If end date is more than ~6 months away, assume it's an annual subscription
    if (user?.subscription_end_date) {
      const sixMonthsInMs = 15768000000; // approximately 6 months in milliseconds
      const endDate = new Date(user.subscription_end_date);
      const now = new Date();
      
      if (endDate.getTime() - now.getTime() > sixMonthsInMs) {
        subscriptionType = 'annual';
      } else {
        subscriptionType = 'monthly';
      }
    } else {
      // Default to monthly if end date isn't available but subscription is active
      subscriptionType = 'monthly';
    }
  }

  return {
    hasSubscription,
    subscriptionType,
    isMonthly: subscriptionType === 'monthly',
    isAnnual: subscriptionType === 'annual',
    
    // Helper function to check feature access
    canAccess: (feature: 'basic' | 'monthly' | 'annual') => {
      if (feature === 'basic') return true;
      if (feature === 'monthly') return hasSubscription;
      if (feature === 'annual') return subscriptionType === 'annual';
      return false;
    }
  };
}