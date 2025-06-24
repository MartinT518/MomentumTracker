import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, LucideIcon, Lock } from 'lucide-react';
import { Link } from 'wouter';

interface SubscriptionGateProps {
  /**
   * The children to render if the user has access to the feature
   */
  children: ReactNode;
  
  /**
   * The minimum subscription level required to access the feature
   */
  requiredSubscription: 'monthly' | 'annual';
  
  /**
   * The feature name to display in the upgrade message
   */
  featureName: string;
  
  /**
   * Optional icon to display in the upgrade card
   */
  icon?: LucideIcon;
  
  /**
   * Additional description of the premium feature
   */
  description?: string;
}

/**
 * A component that conditionally renders its children based on the user's subscription status
 * If the user doesn't have the required subscription, it shows an upgrade prompt instead
 */
export function SubscriptionGate({
  children,
  requiredSubscription,
  featureName,
  icon: Icon = Lock,
  description
}: SubscriptionGateProps) {
  const { hasSubscription, isMonthly, isAnnual } = useSubscription();
  
  // Allow access based on subscription level
  if (requiredSubscription === 'monthly' && (isMonthly || isAnnual)) {
    return <>{children}</>;
  }
  
  if (requiredSubscription === 'annual' && isAnnual) {
    return <>{children}</>;
  }
  
  // If we get here, the user doesn't have the required subscription level
  return (
    <Card className="border-2 border-dashed border-primary/40 bg-muted/50">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2">
          {requiredSubscription === 'annual' ? (
            <Crown className="h-10 w-10 text-purple-500" />
          ) : (
            <Icon className="h-10 w-10 text-primary" />
          )}
        </div>
        <CardTitle>{featureName} {requiredSubscription === 'annual' ? 'Annual' : 'Premium'} Feature</CardTitle>
        <CardDescription>
          {description || `Upgrade your subscription to access ${featureName}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        {requiredSubscription === 'annual' && hasSubscription ? (
          <p className="text-sm text-muted-foreground">This feature is only available with an annual subscription.</p>
        ) : (
          <p className="text-sm text-muted-foreground">Subscribe to CatholicRun to unlock this feature and many more.</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button asChild>
          <Link to="/subscription">
            {hasSubscription && requiredSubscription === 'annual' 
              ? 'Upgrade to Annual' 
              : 'View Subscription Options'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}