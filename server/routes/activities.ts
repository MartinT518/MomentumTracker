import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validateRequest, validateQuery } from '../middleware/validation';
import { storage } from '../storage';

const router = Router();

// Validation schemas
const createActivitySchema = z.object({
  activity_date: z.string().optional(),
  activity_type: z.enum(['run', 'cross_train', 'rest']),
  distance: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  pace: z.string().optional(),
  heart_rate: z.number().int().positive().optional(),
  effort_level: z.enum(['easy', 'moderate', 'hard']).optional(),
  notes: z.string().max(1000).optional(),
  source: z.string().default('manual')
});

const getActivitiesQuerySchema = z.object({
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

// Apply authentication to all routes
router.use(requireAuth);

// Get all activities for user
router.get('/', validateQuery(getActivitiesQuerySchema), async (req, res) => {
  try {
    const activities = await storage.getActivities(req.user!.id);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get recent activities
router.get('/recent', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const activities = await storage.getRecentActivities(req.user!.id, limit);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
});

// Create new activity
router.post('/', validateRequest(createActivitySchema), async (req, res) => {
  try {
    const activityData = {
      ...req.body,
      user_id: req.user!.id,
      activity_date: req.body.activity_date || new Date().toISOString().split('T')[0]
    };
    
    const activity = await storage.createActivity(activityData);
    res.status(201).json(activity);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// Get specific activity
router.get('/:id', async (req, res) => {
  try {
    const activityId = parseInt(req.params.id);
    if (isNaN(activityId)) {
      return res.status(400).json({ error: 'Invalid activity ID' });
    }

    const activity = await storage.getActivity(activityId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Check if activity belongs to user
    if (activity.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Update activity
router.put('/:id', validateRequest(createActivitySchema.partial()), async (req, res) => {
  try {
    const activityId = parseInt(req.params.id);
    if (isNaN(activityId)) {
      return res.status(400).json({ error: 'Invalid activity ID' });
    }

    // Check if activity exists and belongs to user
    const existingActivity = await storage.getActivity(activityId);
    if (!existingActivity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (existingActivity.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedActivity = await storage.updateActivity(activityId, req.body);
    res.json(updatedActivity);
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// Delete activity
router.delete('/:id', async (req, res) => {
  try {
    const activityId = parseInt(req.params.id);
    if (isNaN(activityId)) {
      return res.status(400).json({ error: 'Invalid activity ID' });
    }

    // Check if activity exists and belongs to user
    const existingActivity = await storage.getActivity(activityId);
    if (!existingActivity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (existingActivity.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await storage.deleteActivity(activityId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

export { router as activityRoutes };

