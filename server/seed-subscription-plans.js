// This is a utility script to seed some subscription plans

const { db } = require('./db');
const { subscription_plans } = require('../shared/schema');

async function seedSubscriptionPlans() {
  try {
    // Check if there are already subscription plans in the database
    const existingPlans = await db.select().from(subscription_plans);
    
    if (existingPlans.length > 0) {
      console.log('Subscription plans already exist. Skipping seed.');
      return;
    }
    
    // Define the plans to insert
    const plans = [
      {
        name: 'Premium Monthly',
        description: 'Full access to all premium features with monthly billing',
        price: 9.99,
        billing_interval: 'month',
        stripe_price_id: 'price_monthly', // Replace with actual Stripe price ID
        features: JSON.stringify([
          'Advanced training analytics',
          'Custom training plans',
          'Unlimited training history',
          'AI-powered recommendations',
          'Priority support',
          'Early access to new features'
        ]),
        is_active: true
      },
      {
        name: 'Premium Annual',
        description: 'Full access to all premium features with annual billing (save 20%)',
        price: 95.88,
        billing_interval: 'year',
        stripe_price_id: 'price_annual', // Replace with actual Stripe price ID
        features: JSON.stringify([
          'Advanced training analytics',
          'Custom training plans',
          'Unlimited training history',
          'AI-powered recommendations',
          'Priority support',
          'Early access to new features',
          'Exclusive annual subscriber benefits'
        ]),
        is_active: true
      }
    ];
    
    // Insert plans into the database
    await db.insert(subscription_plans).values(plans);
    
    console.log('Successfully seeded subscription plans!');
  } catch (error) {
    console.error('Error seeding subscription plans:', error);
  } finally {
    process.exit();
  }
}

seedSubscriptionPlans();