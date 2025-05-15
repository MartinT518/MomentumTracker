import { http, HttpResponse } from 'msw';

// Sample user data
const testUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
};

// Sample health metrics data
const healthMetrics = [
  {
    id: 1,
    user_id: 1,
    metric_date: '2023-05-01',
    hrv_score: 65,
    resting_heart_rate: 52,
    sleep_quality: 8,
    sleep_duration: 480,
    energy_level: 85,
    stress_level: 3,
    source: 'garmin',
    notes: 'Test metric',
    created_at: '2023-05-01T12:00:00Z',
  }
];

// Sample activities data
const activities = [
  {
    id: 1,
    user_id: 1,
    date: '2023-05-01',
    type: 'Run',
    distance: 5.0,
    duration: 1800,
    pace: 6.0,
    calories: 450,
    notes: 'Morning run',
    created_at: '2023-05-01T12:00:00Z',
  }
];

// Define handlers for API mocking
export const handlers = [
  // Auth endpoints
  http.get('/api/user', () => {
    return HttpResponse.json(testUser, { status: 200 });
  }),
  
  http.post('/api/login', () => {
    return HttpResponse.json(testUser, { status: 200 });
  }),
  
  http.post('/api/register', () => {
    return HttpResponse.json(testUser, { status: 201 });
  }),
  
  http.post('/api/logout', () => {
    return new HttpResponse(null, { status: 200 });
  }),
  
  // Health metrics endpoints
  http.get('/api/health-metrics', () => {
    return HttpResponse.json(healthMetrics, { status: 200 });
  }),
  
  http.post('/api/health-metrics', async ({ request }) => {
    const data = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      id: 2,
      user_id: 1,
      created_at: new Date().toISOString(),
      ...data,
    }, { status: 201 });
  }),
  
  // Platform-specific health metrics import endpoints
  http.post('/api/garmin/health-metrics/import', () => {
    return HttpResponse.json({ count: 5 }, { status: 200 });
  }),
  
  http.post('/api/strava/health-metrics/import', () => {
    return HttpResponse.json({ count: 3 }, { status: 200 });
  }),
  
  http.post('/api/polar/health-metrics/import', () => {
    return HttpResponse.json({ count: 4 }, { status: 200 });
  }),
  
  // Activities endpoints
  http.get('/api/activities', () => {
    return HttpResponse.json(activities, { status: 200 });
  }),
  
  http.get('/api/activities/recent', () => {
    return HttpResponse.json(activities, { status: 200 });
  }),
  
  // Integration connections
  http.get('/api/integrations', () => {
    return HttpResponse.json([
      { id: 1, user_id: 1, provider: 'garmin', connected_at: '2023-05-01T12:00:00Z' },
      { id: 2, user_id: 1, provider: 'strava', connected_at: '2023-05-01T12:00:00Z' },
      { id: 3, user_id: 1, provider: 'polar', connected_at: '2023-05-01T12:00:00Z' },
    ], { status: 200 });
  }),
];