import express from 'express';
import { authRoutes } from './routes/auth';
import { activityRoutes } from './routes/activities';
import { healthRoutes } from './routes/health';
import { trainingRoutes } from './routes/training';
import { nutritionRoutes } from './routes/nutrition';
import { coachingRoutes } from './routes/coaching';
import { subscriptionRoutes } from './routes/subscriptions';
import { apiLimiter } from './middleware/rate-limit';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

export function setupModularRoutes(app: express.Express) {
  // Apply global rate limiting
  app.use('/api', apiLimiter);

  // Mount route modules
  app.use('/api/auth', authRoutes);
  app.use('/api/activities', activityRoutes);
  app.use('/api/health-metrics', healthRoutes);
  app.use('/api/training', trainingRoutes);
  app.use('/api/nutrition', nutritionRoutes);
  app.use('/api/coaching', coachingRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // 404 handler for API routes
  app.use('/api/*', notFoundHandler);

  // Global error handler
  app.use(errorHandler);
}

