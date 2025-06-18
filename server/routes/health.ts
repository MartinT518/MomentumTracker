import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validateRequest, validateQuery } from '../middleware/validation';
import { storage } from '../storage';

const router = Router();

// Validation schemas
const createHealthMetricSchema = z.object({
  metric_date: z.string().optional(),
  hrv_score: z.number().int().min(0).max(100).optional(),
  resting_heart_rate: z.number().int().min(30).max(200).optional(),
  sleep_quality: z.number().int().min(1).max(10).optional(),
  sleep_duration: z.number().int().min(0).max(1440).optional(), // minutes in a day
  energy_level: z.number().int().min(1).max(10).optional(),
  stress_level: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(1000).optional(),
  source: z.string().default('manual')
});

const getHealthMetricsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional()
});

const importConsentSchema = z.object({
  consent: z.boolean().refine(val => val === true, {
    message: 'User consent is required to import health data'
  })
});

// Apply authentication to all routes
router.use(requireAuth);

// Get health metrics for user
router.get('/', validateQuery(getHealthMetricsQuerySchema), async (req, res) => {
  try {
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (req.query.startDate) {
      startDate = new Date(req.query.startDate as string);
    }
    
    if (req.query.endDate) {
      endDate = new Date(req.query.endDate as string);
    }
    
    const metrics = await storage.getHealthMetrics(req.user!.id, startDate, endDate);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching health metrics:', error);
    res.status(500).json({ error: 'Failed to fetch health metrics' });
  }
});

// Create new health metric
router.post('/', validateRequest(createHealthMetricSchema), async (req, res) => {
  try {
    const metricDate = req.body.metric_date || new Date().toISOString().split('T')[0];
    
    const metricData = {
      ...req.body,
      user_id: req.user!.id,
      metric_date: metricDate
    };
    
    const metric = await storage.createHealthMetric(metricData);
    res.status(201).json(metric);
  } catch (error) {
    console.error('Error creating health metric:', error);
    res.status(500).json({ error: 'Failed to create health metric' });
  }
});

// Update health metric
router.patch('/:id', validateRequest(createHealthMetricSchema.partial()), async (req, res) => {
  try {
    const metricId = parseInt(req.params.id);
    if (isNaN(metricId)) {
      return res.status(400).json({ error: 'Invalid metric ID' });
    }

    // Check if metric exists and belongs to user
    const existingMetric = await storage.getHealthMetric(metricId);
    if (!existingMetric) {
      return res.status(404).json({ error: 'Health metric not found' });
    }

    if (existingMetric.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedMetric = await storage.updateHealthMetric(metricId, req.body);
    res.json(updatedMetric);
  } catch (error) {
    console.error('Error updating health metric:', error);
    res.status(500).json({ error: 'Failed to update health metric' });
  }
});

// Get weekly metrics summary
router.get('/weekly', async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    const metrics = await storage.getHealthMetrics(req.user!.id, startDate, endDate);
    
    // Calculate weekly averages
    const summary = {
      avg_hrv: metrics.filter(m => m.hrv_score).reduce((sum, m) => sum + (m.hrv_score || 0), 0) / metrics.filter(m => m.hrv_score).length || 0,
      avg_rhr: metrics.filter(m => m.resting_heart_rate).reduce((sum, m) => sum + (m.resting_heart_rate || 0), 0) / metrics.filter(m => m.resting_heart_rate).length || 0,
      avg_sleep_quality: metrics.filter(m => m.sleep_quality).reduce((sum, m) => sum + (m.sleep_quality || 0), 0) / metrics.filter(m => m.sleep_quality).length || 0,
      avg_sleep_duration: metrics.filter(m => m.sleep_duration).reduce((sum, m) => sum + (m.sleep_duration || 0), 0) / metrics.filter(m => m.sleep_duration).length || 0,
      total_entries: metrics.length
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching weekly metrics:', error);
    res.status(500).json({ error: 'Failed to fetch weekly metrics' });
  }
});

// Import health metrics from Garmin
router.post('/import/garmin', validateRequest(importConsentSchema), async (req, res) => {
  try {
    // Check if user has a Garmin connection
    const connections = await storage.getIntegrationConnections(req.user!.id);
    const garminConnection = connections.find(conn => conn.provider === 'garmin');
    
    if (!garminConnection) {
      return res.status(404).json({ 
        error: 'No Garmin connection found. Please connect your Garmin account first.' 
      });
    }
    
    // In production, this would call the actual Garmin API
    // For now, we'll create sample data
    const today = new Date();
    const healthMetricData = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      healthMetricData.push({
        user_id: req.user!.id,
        metric_date: date.toISOString().split('T')[0],
        hrv_score: Math.floor(Math.random() * 30) + 50,
        resting_heart_rate: Math.floor(Math.random() * 10) + 50,
        sleep_quality: Math.floor(Math.random() * 3) + 7,
        sleep_duration: (Math.floor(Math.random() * 2) + 7) * 60,
        stress_level: Math.floor(Math.random() * 5) + 3,
        source: 'garmin',
        notes: 'Imported from Garmin Connect'
      });
    }
    
    // Insert metrics
    for (const metric of healthMetricData) {
      await storage.createHealthMetric(metric);
    }
    
    res.json({ 
      message: 'Health metrics imported successfully',
      count: healthMetricData.length 
    });
  } catch (error) {
    console.error('Error importing health metrics from Garmin:', error);
    res.status(500).json({ error: 'Failed to import health metrics from Garmin' });
  }
});

// Import health metrics from Strava
router.post('/import/strava', validateRequest(importConsentSchema), async (req, res) => {
  try {
    // Check if user has a Strava connection
    const connections = await storage.getIntegrationConnections(req.user!.id);
    const stravaConnection = connections.find(conn => conn.provider === 'strava');
    
    if (!stravaConnection) {
      return res.status(404).json({ 
        error: 'No Strava connection found. Please connect your Strava account first.' 
      });
    }
    
    // Strava has limited health metrics compared to Garmin
    // Mainly heart rate data from activities
    res.json({ 
      message: 'Strava health metrics import not yet implemented',
      count: 0 
    });
  } catch (error) {
    console.error('Error importing health metrics from Strava:', error);
    res.status(500).json({ error: 'Failed to import health metrics from Strava' });
  }
});

export { router as healthRoutes };

