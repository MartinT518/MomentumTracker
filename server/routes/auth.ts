import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import { authLimiter } from '../middleware/rate-limit';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  username: z.string().min(1, 'Username is required').trim(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  email: z.string().email().optional(),
  age: z.number().int().min(13).max(120).optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  bio: z.string().max(500).optional()
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

// Apply rate limiting to auth routes
router.use(authLimiter);

// These routes are handled by the auth.ts setup, but we define them here for organization
// The actual implementation remains in auth.ts for now to avoid breaking changes

export { router as authRoutes };

