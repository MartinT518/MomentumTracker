import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { storage } from '../storage';

const router = Router();

// Validation schemas
const createSubscriptionPlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  price: z.string().regex(/^\d+\.\d{2}$/, 'Price must be in format XX.XX'),
  billing_interval: z.enum(['month', 'year']),
  stripe_price_id: z.string().optional(),
  features: z.array(z.string()),
  is_active: z.boolean().default(true)
});

const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  planId: z.number().int().positive().optional()
});

// Get user's subscription status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    
    const subscriptionData = {
      status: user.subscription_status,
      endDate: user.subscription_end_date,
      planId: user.subscription_plan_id,
      stripeSubscriptionId: user.stripe_subscription_id,
      isActive: user.subscription_status === 'active'
    };
    
    res.json(subscriptionData);
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// Get available subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await storage.getSubscriptionPlans();
    res.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Get specific subscription plan
router.get('/plans/:id', async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    if (isNaN(planId)) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    const plan = await storage.getSubscriptionPlanById(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }
    
    res.json(plan);
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plan' });
  }
});

// Create subscription plan (admin only)
router.post('/plans', requireAdmin, validateRequest(createSubscriptionPlanSchema), async (req, res) => {
  try {
    const planData = {
      ...req.body,
      features: JSON.stringify(req.body.features)
    };

    const plan = await storage.createSubscriptionPlan(planData);
    res.status(201).json(plan);
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    res.status(500).json({ error: 'Failed to create subscription plan' });
  }
});

// Create payment intent for subscription
router.post('/create-payment-intent', requireAuth, validateRequest(createPaymentIntentSchema), async (req, res) => {
  try {
    // Check if Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return res.status(500).json({ error: 'Stripe integration is not configured' });
    }

    const { amount } = req.body;
    
    // In production, this would create a Stripe PaymentIntent
    // For now, return a mock response
    const mockClientSecret = `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({ 
      clientSecret: mockClientSecret,
      amount: amount,
      currency: 'usd'
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Cancel subscription
router.post('/cancel', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    
    if (!user.stripe_subscription_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }
    
    // Handle test subscriptions
    if (user.stripe_subscription_id === 'dev_test_subscription') {
      await storage.updateUserSubscription(user.id, {
        status: null,
        endDate: null,
        stripeSubscriptionId: null
      });
      
      return res.json({ message: 'Test subscription canceled' });
    }
    
    // In production, this would cancel the Stripe subscription
    // For now, just update the database
    const cancelDate = new Date();
    cancelDate.setDate(cancelDate.getDate() + 30); // Cancel at end of current period
    
    await storage.updateUserSubscription(user.id, {
      endDate: cancelDate
    });
    
    res.json({ 
      message: 'Subscription will be canceled at the end of the current billing period',
      cancelAt: cancelDate
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Get or create subscription
router.post('/get-or-create', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    
    // Check if Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return res.status(500).json({ error: 'Stripe integration is not configured' });
    }
    
    // If user already has a subscription, return it
    if (user.stripe_subscription_id) {
      return res.json({
        subscriptionId: user.stripe_subscription_id,
        status: user.subscription_status,
        clientSecret: null // Would be populated from Stripe in production
      });
    }
    
    // In production, this would create a new Stripe subscription
    // For now, return a mock response
    res.json({
      subscriptionId: null,
      status: 'incomplete',
      clientSecret: `seti_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`
    });
  } catch (error) {
    console.error('Error getting or creating subscription:', error);
    res.status(500).json({ error: 'Failed to process subscription request' });
  }
});

// Development endpoints (should be removed in production)
if (process.env.NODE_ENV === 'development') {
  // Activate premium for testing
  router.post('/dev/activate-premium', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      await storage.updateUserSubscription(user.id, {
        status: 'active',
        endDate: endDate,
        stripeSubscriptionId: 'dev_test_subscription'
      });
      
      const updatedUser = await storage.getUser(user.id);
      
      res.json({
        success: true,
        message: 'Premium features activated for testing',
        expiresAt: endDate,
        user: updatedUser
      });
    } catch (error) {
      console.error('Error activating premium features:', error);
      res.status(500).json({ error: 'Failed to activate premium features' });
    }
  });

  // Set premium for any user (development only)
  router.post('/dev/set-premium/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      await storage.updateUserSubscription(userId, {
        status: 'active',
        endDate: endDate,
        stripeSubscriptionId: 'dev_test_subscription',
        planId: 2 // Annual plan
      });
      
      const updatedUser = await storage.getUser(userId);
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ 
        message: 'Premium subscription activated for development',
        user: updatedUser
      });
    } catch (error) {
      console.error('Error setting premium subscription:', error);
      res.status(500).json({ error: 'Failed to set premium subscription' });
    }
  });

  // Seed subscription plans
  router.post('/dev/seed-plans', async (req, res) => {
    try {
      const existingPlans = await storage.getSubscriptionPlans();
      
      if (existingPlans.length > 0) {
        return res.json({ 
          message: 'Subscription plans already exist. Skipping seed.', 
          planCount: existingPlans.length 
        });
      }
      
      const plans = [
        {
          name: 'Premium Monthly',
          description: 'Full access to all premium features with monthly billing',
          price: '9.99',
          billing_interval: 'month',
          stripe_price_id: 'price_monthly',
          features: JSON.stringify([
            'Advanced training analytics',
            'Custom training plans',
            'Unlimited training history',
            'AI-powered recommendations',
            'Priority support'
          ]),
          is_active: true
        },
        {
          name: 'Premium Annual',
          description: 'Full access to all premium features with annual billing (save 20%)',
          price: '95.88',
          billing_interval: 'year',
          stripe_price_id: 'price_annual',
          features: JSON.stringify([
            'Advanced training analytics',
            'Custom training plans',
            'Unlimited training history',
            'AI-powered recommendations',
            'Priority support',
            'Exclusive annual subscriber benefits'
          ]),
          is_active: true
        }
      ];
      
      for (const plan of plans) {
        await storage.createSubscriptionPlan(plan);
      }
      
      res.status(201).json({ 
        message: 'Successfully seeded subscription plans!', 
        planCount: plans.length 
      });
    } catch (error) {
      console.error('Error seeding subscription plans:', error);
      res.status(500).json({ 
        error: 'Failed to seed subscription plans',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
}

export { router as subscriptionRoutes };

