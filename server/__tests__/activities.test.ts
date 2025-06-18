import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { activityRoutes } from '@/server/routes/activities';

// Mock the storage module
const mockStorage = {
  getActivities: vi.fn(),
  getRecentActivities: vi.fn(),
  createActivity: vi.fn(),
  getActivity: vi.fn(),
  updateActivity: vi.fn(),
  deleteActivity: vi.fn(),
};

vi.mock('@/server/storage', () => ({
  storage: mockStorage,
}));

// Mock auth middleware
const mockRequireAuth = (req: any, res: any, next: any) => {
  req.user = { id: 1, username: 'testuser' };
  next();
};

vi.mock('@/server/middleware/auth', () => ({
  requireAuth: mockRequireAuth,
}));

describe('Activity Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/activities', activityRoutes);
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('GET /api/activities', () => {
    it('should return user activities', async () => {
      const mockActivities = [
        { id: 1, activity_type: 'run', distance: 5, user_id: 1 },
        { id: 2, activity_type: 'bike', distance: 10, user_id: 1 },
      ];

      mockStorage.getActivities.mockResolvedValue(mockActivities);

      const response = await request(app)
        .get('/api/activities')
        .expect(200);

      expect(response.body).toEqual(mockActivities);
      expect(mockStorage.getActivities).toHaveBeenCalledWith(1);
    });

    it('should handle storage errors', async () => {
      mockStorage.getActivities.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/activities')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to fetch activities');
    });
  });

  describe('POST /api/activities', () => {
    it('should create a new activity', async () => {
      const newActivity = {
        activity_type: 'run',
        distance: 5,
        duration: 30,
        effort_level: 'moderate',
      };

      const createdActivity = {
        id: 1,
        ...newActivity,
        user_id: 1,
        activity_date: new Date().toISOString().split('T')[0],
      };

      mockStorage.createActivity.mockResolvedValue(createdActivity);

      const response = await request(app)
        .post('/api/activities')
        .send(newActivity)
        .expect(201);

      expect(response.body).toEqual(createdActivity);
      expect(mockStorage.createActivity).toHaveBeenCalledWith({
        ...newActivity,
        user_id: 1,
        activity_date: expect.any(String),
      });
    });

    it('should validate required fields', async () => {
      const invalidActivity = {
        distance: 5, // missing activity_type
      };

      const response = await request(app)
        .post('/api/activities')
        .send(invalidActivity)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('GET /api/activities/recent', () => {
    it('should return recent activities with default limit', async () => {
      const mockRecentActivities = [
        { id: 1, activity_type: 'run', distance: 5, user_id: 1 },
      ];

      mockStorage.getRecentActivities.mockResolvedValue(mockRecentActivities);

      const response = await request(app)
        .get('/api/activities/recent')
        .expect(200);

      expect(response.body).toEqual(mockRecentActivities);
      expect(mockStorage.getRecentActivities).toHaveBeenCalledWith(1, 5);
    });

    it('should respect custom limit', async () => {
      const mockRecentActivities = [];
      mockStorage.getRecentActivities.mockResolvedValue(mockRecentActivities);

      await request(app)
        .get('/api/activities/recent?limit=10')
        .expect(200);

      expect(mockStorage.getRecentActivities).toHaveBeenCalledWith(1, 10);
    });
  });
});

