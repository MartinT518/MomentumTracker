import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validateRequest, validateQuery } from '../middleware/validation';
import { aiLimiter } from '../middleware/rate-limit';
import { storage } from '../storage';

const router = Router();

// Validation schemas
const createNutritionLogSchema = z.object({
  log_date: z.string().optional(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  food_name: z.string().min(1).max(200),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(50),
  calories: z.number().min(0).optional(),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  fiber: z.number().min(0).optional(),
  notes: z.string().max(500).optional()
});

const getNutritionLogsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional()
});

const nutritionPreferencesSchema = z.object({
  dietary_restrictions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  preferred_cuisines: z.array(z.string()).optional(),
  daily_calorie_goal: z.number().int().min(1000).max(5000).optional(),
  protein_goal: z.number().min(0).optional(),
  carb_goal: z.number().min(0).optional(),
  fat_goal: z.number().min(0).optional()
});

const generateMealPlanSchema = z.object({
  days: z.number().int().min(1).max(14).default(7),
  caloriesPerDay: z.number().int().min(1000).max(5000).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  preferredCuisines: z.array(z.string()).optional(),
  mealsPerDay: z.number().int().min(3).max(6).default(3)
});

// Apply authentication to all routes
router.use(requireAuth);

// Get nutrition logs
router.get('/', validateQuery(getNutritionLogsQuerySchema), async (req, res) => {
  try {
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (req.query.startDate) {
      startDate = new Date(req.query.startDate as string);
    }
    
    if (req.query.endDate) {
      endDate = new Date(req.query.endDate as string);
    }
    
    const logs = await storage.getNutritionLogs(req.user!.id, startDate, endDate);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching nutrition logs:', error);
    res.status(500).json({ error: 'Failed to fetch nutrition logs' });
  }
});

// Create nutrition log entry
router.post('/', validateRequest(createNutritionLogSchema), async (req, res) => {
  try {
    const logData = {
      ...req.body,
      user_id: req.user!.id,
      log_date: req.body.log_date || new Date().toISOString().split('T')[0]
    };
    
    const log = await storage.createNutritionLog(logData);
    res.status(201).json(log);
  } catch (error) {
    console.error('Error creating nutrition log:', error);
    res.status(500).json({ error: 'Failed to create nutrition log' });
  }
});

// Update nutrition log entry
router.patch('/:id', validateRequest(createNutritionLogSchema.partial()), async (req, res) => {
  try {
    const logId = parseInt(req.params.id);
    if (isNaN(logId)) {
      return res.status(400).json({ error: 'Invalid log ID' });
    }

    // Check if log exists and belongs to user
    const existingLog = await storage.getNutritionLog(logId);
    if (!existingLog) {
      return res.status(404).json({ error: 'Nutrition log not found' });
    }

    if (existingLog.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedLog = await storage.updateNutritionLog(logId, req.body);
    res.json(updatedLog);
  } catch (error) {
    console.error('Error updating nutrition log:', error);
    res.status(500).json({ error: 'Failed to update nutrition log' });
  }
});

// Get nutrition preferences
router.get('/preferences', async (req, res) => {
  try {
    const preferences = await storage.getNutritionPreferences(req.user!.id);
    res.json(preferences);
  } catch (error) {
    console.error('Error fetching nutrition preferences:', error);
    res.status(500).json({ error: 'Failed to fetch nutrition preferences' });
  }
});

// Update nutrition preferences
router.post('/preferences', validateRequest(nutritionPreferencesSchema), async (req, res) => {
  try {
    const preferences = await storage.updateNutritionPreferences(req.user!.id, req.body);
    res.json(preferences);
  } catch (error) {
    console.error('Error updating nutrition preferences:', error);
    res.status(500).json({ error: 'Failed to update nutrition preferences' });
  }
});

// Get meal plan for specific date
router.get('/meal-plans/:date', async (req, res) => {
  try {
    const date = req.params.date;
    const mealPlan = await storage.getMealPlan(req.user!.id, date);
    res.json(mealPlan);
  } catch (error) {
    console.error('Error fetching meal plan:', error);
    res.status(500).json({ error: 'Failed to fetch meal plan' });
  }
});

// Search food items
router.get('/food-items/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const foodItems = await storage.searchFoodItems(query.trim());
    res.json(foodItems);
  } catch (error) {
    console.error('Error searching food items:', error);
    res.status(500).json({ error: 'Failed to search food items' });
  }
});

// Get food items by category
router.get('/food-items/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const foodItems = await storage.getFoodItemsByCategory(category);
    res.json(foodItems);
  } catch (error) {
    console.error('Error fetching food items by category:', error);
    res.status(500).json({ error: 'Failed to fetch food items' });
  }
});

// Generate AI meal plan (rate limited)
router.post('/generate', aiLimiter, validateRequest(generateMealPlanSchema), async (req, res) => {
  try {
    // Check if OpenAI is available
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(503).json({ error: 'AI service is not available. Missing API key.' });
    }

    const params = req.body;

    // In production, this would call the OpenAI API to generate a meal plan
    // For now, return a sample meal plan
    const sampleMealPlan = {
      title: `${params.days}-Day Nutrition Plan`,
      description: 'A balanced meal plan tailored to your preferences and goals',
      totalDays: params.days,
      dailyCalories: params.caloriesPerDay || 2000,
      days: Array.from({ length: params.days }, (_, i) => ({
        day: i + 1,
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        meals: [
          {
            type: 'breakfast',
            name: 'Oatmeal with Berries',
            calories: 350,
            protein: 12,
            carbs: 65,
            fat: 8,
            ingredients: ['1 cup oats', '1/2 cup blueberries', '1 tbsp honey', '1/4 cup almonds']
          },
          {
            type: 'lunch',
            name: 'Grilled Chicken Salad',
            calories: 450,
            protein: 35,
            carbs: 20,
            fat: 25,
            ingredients: ['6oz chicken breast', 'Mixed greens', 'Cherry tomatoes', 'Olive oil dressing']
          },
          {
            type: 'dinner',
            name: 'Salmon with Quinoa',
            calories: 550,
            protein: 40,
            carbs: 45,
            fat: 22,
            ingredients: ['6oz salmon fillet', '1 cup quinoa', 'Steamed broccoli', 'Lemon']
          }
        ]
      }))
    };

    res.json(sampleMealPlan);
  } catch (error) {
    console.error('Error generating meal plan:', error);
    res.status(500).json({ error: 'Failed to generate meal plan' });
  }
});

// Get simple meal plan (public endpoint for basic recommendations)
router.get('/simple-meal-plan', async (req, res) => {
  try {
    // Return a basic meal plan without AI generation
    const simplePlan = {
      breakfast: {
        name: 'Balanced Breakfast',
        options: ['Oatmeal with fruit', 'Greek yogurt with granola', 'Whole grain toast with avocado']
      },
      lunch: {
        name: 'Nutritious Lunch',
        options: ['Quinoa salad with vegetables', 'Lean protein with brown rice', 'Soup with whole grain bread']
      },
      dinner: {
        name: 'Healthy Dinner',
        options: ['Grilled fish with vegetables', 'Lean meat with sweet potato', 'Plant-based protein bowl']
      },
      snacks: {
        name: 'Healthy Snacks',
        options: ['Mixed nuts', 'Fresh fruit', 'Vegetable sticks with hummus']
      }
    };

    res.json(simplePlan);
  } catch (error) {
    console.error('Error fetching simple meal plan:', error);
    res.status(500).json({ error: 'Failed to fetch meal plan' });
  }
});

export { router as nutritionRoutes };

