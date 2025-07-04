import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireSubscription, requireAdmin } from '../middleware/auth';
import { validateRequest, validateQuery } from '../middleware/validation';
import { storage } from '../storage';

const router = Router();

// Validation schemas
const createCoachingSessionSchema = z.object({
  coach_id: z.number().int().positive(),
  session_date: z.string(),
  session_time: z.string(),
  session_type: z.enum(['video_call', 'phone_call', 'in_person', 'video_analysis']),
  notes: z.string().max(1000).optional(),
  duration_minutes: z.number().int().min(15).max(180).default(60)
});

const createCoachSchema = z.object({
  name: z.string().min(1).max(100),
  bio: z.string().max(2000),
  specialties: z.array(z.string()),
  experience_years: z.number().int().min(0).max(50),
  certifications: z.array(z.string()),
  hourly_rate: z.number().positive(),
  profile_image: z.string().url().optional(),
  availability: z.object({}).passthrough().optional()
});

// Apply authentication to all routes
router.use(requireAuth);

// Get available coaches (requires annual subscription)
router.get('/', requireSubscription('annual'), async (req, res) => {
  try {
    const coaches = await storage.getCoaches();
    res.json(coaches);
  } catch (error) {
    console.error('Error fetching coaches:', error);
    res.status(500).json({ error: 'Failed to fetch coaches' });
  }
});

// Get all coaches (admin only)
router.get('/all', requireAdmin, async (req, res) => {
  try {
    const coaches = await storage.getAllCoaches();
    res.json(coaches);
  } catch (error) {
    console.error('Error fetching all coaches:', error);
    res.status(500).json({ error: 'Failed to fetch coaches' });
  }
});

// Get specific coach details (requires annual subscription)
router.get('/:id', requireSubscription('annual'), async (req, res) => {
  try {
    const coachId = parseInt(req.params.id);
    if (isNaN(coachId)) {
      return res.status(400).json({ error: 'Invalid coach ID' });
    }

    const coach = await storage.getCoach(coachId);
    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' });
    }

    res.json(coach);
  } catch (error) {
    console.error('Error fetching coach details:', error);
    res.status(500).json({ error: 'Failed to fetch coach details' });
  }
});

// Create new coach (admin only)
router.post('/', requireAdmin, validateRequest(createCoachSchema), async (req, res) => {
  try {
    const coach = await storage.createCoach(req.body);
    res.status(201).json(coach);
  } catch (error) {
    console.error('Error creating coach:', error);
    res.status(500).json({ error: 'Failed to create coach' });
  }
});

// Update coach (admin only)
router.put('/:id', requireAdmin, validateRequest(createCoachSchema.partial()), async (req, res) => {
  try {
    const coachId = parseInt(req.params.id);
    if (isNaN(coachId)) {
      return res.status(400).json({ error: 'Invalid coach ID' });
    }

    const existingCoach = await storage.getCoach(coachId);
    if (!existingCoach) {
      return res.status(404).json({ error: 'Coach not found' });
    }

    const updatedCoach = await storage.updateCoach(coachId, req.body);
    res.json(updatedCoach);
  } catch (error) {
    console.error('Error updating coach:', error);
    res.status(500).json({ error: 'Failed to update coach' });
  }
});

// Delete coach (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const coachId = parseInt(req.params.id);
    if (isNaN(coachId)) {
      return res.status(400).json({ error: 'Invalid coach ID' });
    }

    const existingCoach = await storage.getCoach(coachId);
    if (!existingCoach) {
      return res.status(404).json({ error: 'Coach not found' });
    }

    await storage.deleteCoach(coachId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting coach:', error);
    res.status(500).json({ error: 'Failed to delete coach' });
  }
});

// Get coaching sessions for user (requires annual subscription)
router.get('/sessions', requireSubscription('annual'), async (req, res) => {
  try {
    const userId = req.user!.id;
    const role = req.query.coach_id ? 'athlete' : 'coach';
    
    const sessions = await storage.getCoachingSessions(userId, role);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching coaching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch coaching sessions' });
  }
});

// Book coaching session (requires annual subscription)
router.post('/sessions', requireSubscription('annual'), validateRequest(createCoachingSessionSchema), async (req, res) => {
  try {
    const sessionData = {
      ...req.body,
      athlete_id: req.user!.id,
      status: 'scheduled'
    };

    const session = await storage.createCoachingSession(sessionData);
    res.status(201).json(session);
  } catch (error) {
    console.error('Error booking coaching session:', error);
    res.status(500).json({ error: 'Failed to book coaching session' });
  }
});

// Update coaching session
router.patch('/sessions/:id', requireSubscription('annual'), async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const existingSession = await storage.getCoachingSession(sessionId);
    if (!existingSession) {
      return res.status(404).json({ error: 'Coaching session not found' });
    }

    // Check if user is the athlete or coach for this session
    if (existingSession.athlete_id !== req.user!.id && existingSession.coach_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedSession = await storage.updateCoachingSession(sessionId, req.body);
    res.json(updatedSession);
  } catch (error) {
    console.error('Error updating coaching session:', error);
    res.status(500).json({ error: 'Failed to update coaching session' });
  }
});

export { router as coachingRoutes };

