export const config = {
  // Database
  database: {
    url: process.env.DATABASE_URL!,
  },

  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'aetherrun-default-secret-change-in-production',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: process.env.NODE_ENV === 'production',
  },

  // AI Services (Server-only)
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY,
    },
  },

  // Payment Processing (Server-only)
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  // Third-party Integrations (Server-only)
  integrations: {
    strava: {
      clientId: process.env.STRAVA_CLIENT_ID,
      clientSecret: process.env.STRAVA_CLIENT_SECRET,
    },
    garmin: {
      consumerKey: process.env.GARMIN_CONSUMER_KEY,
      consumerSecret: process.env.GARMIN_CONSUMER_SECRET,
    },
    polar: {
      clientId: process.env.POLAR_CLIENT_ID,
      clientSecret: process.env.POLAR_CLIENT_SECRET,
    },
  },

  // Email Service
  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY,
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Application Settings
  app: {
    port: parseInt(process.env.PORT || '5000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Warn about missing optional but recommended variables
const recommendedEnvVars = [
  'SESSION_SECRET',
  'OPENAI_API_KEY',
  'STRIPE_SECRET_KEY',
];

const missingRecommendedVars = recommendedEnvVars.filter(envVar => !process.env[envVar]);

if (missingRecommendedVars.length > 0 && config.app.isProduction) {
  console.warn('Missing recommended environment variables for production:', missingRecommendedVars);
}

