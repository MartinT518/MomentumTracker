import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Define handlers for testing API endpoints
const handlers = [
  // Default handler for API user endpoint (unauthenticated)
  http.get('/api/user', () => {
    return new HttpResponse(null, { status: 401 });
  }),

  // Default health metrics endpoints
  http.get('/api/health-metrics/:userId', () => {
    return HttpResponse.json([
      { 
        id: 1, 
        user_id: 1, 
        date: '2023-05-01', 
        metric_type: 'hrv', 
        value: 65, 
        source: 'garmin' 
      },
      { 
        id: 2, 
        user_id: 1, 
        date: '2023-05-01', 
        metric_type: 'resting_hr', 
        value: 52, 
        source: 'garmin' 
      },
      { 
        id: 3, 
        user_id: 1, 
        date: '2023-05-02', 
        metric_type: 'hrv', 
        value: 67, 
        source: 'garmin' 
      },
    ]);
  }),

  // Default activities endpoints
  http.get('/api/activities/:userId', () => {
    return HttpResponse.json([
      {
        id: 1,
        user_id: 1,
        activity_type: 'run',
        start_time: '2023-05-01T08:00:00Z',
        duration: 3600,
        distance: 10000,
        elevation_gain: 100,
        avg_heart_rate: 145,
        source: 'strava',
      },
      {
        id: 2,
        user_id: 1,
        activity_type: 'bike',
        start_time: '2023-05-02T09:00:00Z',
        duration: 7200,
        distance: 40000,
        elevation_gain: 350,
        avg_heart_rate: 135,
        source: 'garmin',
      },
    ]);
  }),

  // Default integrations endpoint
  http.get('/api/integrations', () => {
    return HttpResponse.json([]);
  }),

  // Default subscription endpoints
  http.get('/api/subscription/:userId', () => {
    return HttpResponse.json({ active: false });
  }),
];

// Set up the MSW server with the defined handlers
export const server = setupServer(...handlers);