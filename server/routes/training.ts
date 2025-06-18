import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { aiLimiter } from '../middleware/rate-limit';
import { storage } from '../storage';

const router = Router();

// Validation schemas
const generateTrainingPlanSchema = z.object({
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  availableDaysPerWeek: z.number().int().min(1).max(7),
  targetRace: z.string().optional(),
  raceDistance: z.string().optional(),
  goalTime: z.string().optional(),
  currentWeeklyMileage: z.number().positive().optional(),
  timePerSessionMinutes: z.number().int().min(15).max(180).optional(),
  preferredWorkoutTypes: z.array(z.string()).optional(),
  injuries: z.array(z.string()).optional(),
  userAge: z.number().int().min(13).max(100).optional(),
  userWeight: z.number().positive().optional(),
  userHeight: z.number().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

const createTrainingPlanSchema = z.object({
  name: z.string().min(1).max(100),
  duration_weeks: z.number().int().min(1).max(52),
  plan_data: z.object({}).passthrough(), // Allow any JSON structure
  goal_id: z.number().int().positive().optional()
});

// Apply authentication to all routes
router.use(requireAuth);

// Get today's workout
router.get('/workouts/today', async (req, res) => {
  try {
    // In production, this would fetch from the database
    // For now, return a sample workout
    res.json({
      type: 'Easy Run',
      targetDistance: '5 miles',
      targetPace: '9:00-9:30 min/mile',
      zone: 'Zone 2 (Easy)',
      estimatedTime: '~45-50 minutes',
      notes: 'Focus on maintaining a conversational pace throughout the run. This is a recovery run intended to build aerobic base without creating additional fatigue.'
    });
  } catch (error) {
    console.error('Error fetching today\'s workout:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s workout' });
  }
});

// Get user's training plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await storage.getTrainingPlans(req.user!.id);
    res.json(plans);
  } catch (error) {
    console.error('Error fetching training plans:', error);
    res.status(500).json({ error: 'Failed to fetch training plans' });
  }
});

// Get specific training plan
router.get('/plans/:id', async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    if (isNaN(planId)) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    const plan = await storage.getTrainingPlan(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Training plan not found' });
    }

    // Check if plan belongs to user
    if (plan.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(plan);
  } catch (error) {
    console.error('Error fetching training plan:', error);
    res.status(500).json({ error: 'Failed to fetch training plan' });
  }
});

// Create training plan
router.post('/plans', validateRequest(createTrainingPlanSchema), async (req, res) => {
  try {
    const planData = {
      ...req.body,
      user_id: req.user!.id
    };

    const plan = await storage.createTrainingPlan(planData);
    res.status(201).json(plan);
  } catch (error) {
    console.error('Error creating training plan:', error);
    res.status(500).json({ error: 'Failed to create training plan' });
  }
});

// Generate AI training plan (rate limited)
router.post('/generate', aiLimiter, validateRequest(generateTrainingPlanSchema), async (req, res) => {
  try {
    // Check if OpenAI is available
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(503).json({ error: 'AI service is not available. Missing API key.' });
    }

    const params = req.body;

    // Build the prompt for AI
    const prompt = `
      As an experienced running coach, create a detailed training plan with the following specifications:
      
      USER PROFILE:
      - Target Race: ${params.targetRace || 'General fitness'}
      - Race Distance: ${params.raceDistance || 'Not specified'}
      - Goal Time: ${params.goalTime || 'Completion'}
      - Fitness Level: ${params.fitnessLevel}
      - Current Weekly Mileage: ${params.currentWeeklyMileage || 'Not specified'} miles per week
      - Available Days: ${params.availableDaysPerWeek} days per week
      - Time Per Session: ${params.timePerSessionMinutes || 60} minutes
      - Preferred Workout Types: ${params.preferredWorkoutTypes?.join(', ') || 'Any'}
      - Injuries/Limitations: ${params.injuries?.join(', ') || 'None'}
      - Age: ${params.userAge || 'Not specified'}
      - Weight: ${params.userWeight || 'Not specified'} kg
      - Height: ${params.userHeight || 'Not specified'} cm
      - Start Date: ${params.startDate || 'Immediate'}
      - End Date/Race Day: ${params.endDate || 'Not specified'}
      
      Create a comprehensive training plan in JSON format with overview, philosophy, weekly plans, and detailed workouts.
      Make sure the response is valid JSON that can be parsed directly.
    `;

    // In production, this would call the OpenAI API
    // For now, return a sample response
    const samplePlan = {
      overview: {
        title: `${params.fitnessLevel} Training Plan`,
        description: `A ${params.availableDaysPerWeek}-day per week training plan tailored for ${params.fitnessLevel} runners`,
        weeklyMileage: '20-25 miles',
        workoutsPerWeek: params.availableDaysPerWeek,
        longRunDistance: '8-10 miles',
        qualityWorkouts: 2
      },
      philosophy: 'Build aerobic base while incorporating speed and strength work progressively',
      recommendedGear: ['Running shoes', 'Heart rate monitor', 'GPS watch'],
      nutritionTips: 'Focus on whole foods, adequate hydration, and proper pre/post-run nutrition',
      weeklyPlans: [
        {
          weekNumber: 1,
          focus: 'Base building and adaptation',
          totalMileage: '20 miles',
          workouts: [
            {
              id: 1,
              day: 'Monday',
              type: 'Easy Run',
              description: 'Comfortable pace run',
              duration: '30 minutes',
              distance: '3-4 miles',
              intensity: 'easy',
              warmUp: '5 minute walk',
              mainSet: ['25 minutes easy running'],
              coolDown: '5 minute walk',
              notes: 'Focus on form and breathing'
            }
          ]
        }
      ]
    };

    res.json(samplePlan);
  } catch (error) {
    console.error('Error generating training plan:', error);
    res.status(500).json({ error: 'Failed to generate training plan' });
  }
});

// Get weekly progress
router.get('/progress/weekly', async (req, res) => {
  try {
    // In production, this would calculate from actual data
    res.json({
      distanceGoal: {
        current: 32.4,
        target: 35,
        percentage: 92
      },
      workoutsCompleted: {
        current: 4,
        target: 5,
        percentage: 80
      },
      improvementRate: {
        status: 'On Track',
        trend: 'improving'
      }
    });
  } catch (error) {
    console.error('Error fetching weekly progress:', error);
    res.status(500).json({ error: 'Failed to fetch weekly progress' });
  }
});

export { router as trainingRoutes };

