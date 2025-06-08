# API Documentation

## Overview

The AetherRun API provides endpoints for fitness tracking, health metrics, training plans, nutrition logging, and premium features like coaching.

## Base URL
```
Production: https://api.aetherrun.com
Development: http://localhost:5000
```

## Authentication

The API uses session-based authentication with cookies.

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "password": "string",
  "email": "string",
  "age": 25,
  "weight": 70,
  "height": 175
}
```

### Logout
```http
POST /api/auth/logout
```

## Rate Limiting

- General API: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes  
- AI endpoints: 10 requests per hour

## Activities API

### Get Activities
```http
GET /api/activities
Authorization: Required

Query Parameters:
- limit: number (max 100)
- offset: number
- startDate: string (YYYY-MM-DD)
- endDate: string (YYYY-MM-DD)
```

### Create Activity
```http
POST /api/activities
Authorization: Required
Content-Type: application/json

{
  "activity_type": "run" | "cross_train" | "rest",
  "distance": 5.0,
  "duration": 30,
  "pace": "6:00",
  "heart_rate": 150,
  "effort_level": "easy" | "moderate" | "hard",
  "notes": "string",
  "activity_date": "2024-01-15"
}
```

### Get Activity
```http
GET /api/activities/{id}
Authorization: Required
```

### Update Activity
```http
PUT /api/activities/{id}
Authorization: Required
Content-Type: application/json

{
  "distance": 6.0,
  "notes": "Updated notes"
}
```

### Delete Activity
```http
DELETE /api/activities/{id}
Authorization: Required
```

## Health Metrics API

### Get Health Metrics
```http
GET /api/health-metrics
Authorization: Required

Query Parameters:
- startDate: string (YYYY-MM-DD)
- endDate: string (YYYY-MM-DD)
```

### Create Health Metric
```http
POST /api/health-metrics
Authorization: Required
Content-Type: application/json

{
  "metric_date": "2024-01-15",
  "hrv_score": 65,
  "resting_heart_rate": 55,
  "sleep_quality": 8,
  "sleep_duration": 480,
  "energy_level": 7,
  "stress_level": 3,
  "notes": "string"
}
```

### Weekly Summary
```http
GET /api/health-metrics/weekly
Authorization: Required
```

## Training API

### Get Today's Workout
```http
GET /api/training/workouts/today
Authorization: Required
```

### Get Training Plans
```http
GET /api/training/plans
Authorization: Required
```

### Generate AI Training Plan
```http
POST /api/training/generate
Authorization: Required
Rate Limited: 10/hour
Content-Type: application/json

{
  "fitnessLevel": "beginner" | "intermediate" | "advanced",
  "availableDaysPerWeek": 5,
  "targetRace": "5K",
  "goalTime": "25:00",
  "currentWeeklyMileage": 20
}
```

## Nutrition API

### Get Nutrition Logs
```http
GET /api/nutrition
Authorization: Required

Query Parameters:
- startDate: string (YYYY-MM-DD)
- endDate: string (YYYY-MM-DD)
- mealType: "breakfast" | "lunch" | "dinner" | "snack"
```

### Create Nutrition Log
```http
POST /api/nutrition
Authorization: Required
Content-Type: application/json

{
  "meal_type": "breakfast",
  "food_name": "Oatmeal with berries",
  "quantity": 1,
  "unit": "bowl",
  "calories": 350,
  "protein": 12,
  "carbs": 65,
  "fat": 8
}
```

### Search Food Items
```http
GET /api/nutrition/food-items/search?q=oatmeal
Authorization: Required
```

### Generate Meal Plan
```http
POST /api/nutrition/generate
Authorization: Required
Rate Limited: 10/hour
Content-Type: application/json

{
  "days": 7,
  "caloriesPerDay": 2000,
  "dietaryRestrictions": ["vegetarian"],
  "allergies": ["nuts"]
}
```

## Coaching API (Premium)

### Get Coaches
```http
GET /api/coaching
Authorization: Required (Annual Subscription)
```

### Get Coach Details
```http
GET /api/coaching/{id}
Authorization: Required (Annual Subscription)
```

### Book Coaching Session
```http
POST /api/coaching/sessions
Authorization: Required (Annual Subscription)
Content-Type: application/json

{
  "coach_id": 1,
  "session_date": "2024-01-20",
  "session_time": "10:00",
  "session_type": "video_call",
  "notes": "Focus on running form"
}
```

## Subscriptions API

### Get Subscription Status
```http
GET /api/subscriptions/status
Authorization: Required
```

### Get Subscription Plans
```http
GET /api/subscriptions/plans
```

### Create Payment Intent
```http
POST /api/subscriptions/create-payment-intent
Authorization: Required
Content-Type: application/json

{
  "amount": 9.99,
  "planId": 1
}
```

### Cancel Subscription
```http
POST /api/subscriptions/cancel
Authorization: Required
```

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/activities"
}
```

### Validation Error Format
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "activity_type",
      "message": "Required field missing"
    }
  ]
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden / Subscription Required
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

## WebSocket Events

### Coaching Chat
```javascript
// Connect to coaching session
const socket = io('/coaching');

// Join session
socket.emit('join-session', { sessionId: 123 });

// Send message
socket.emit('message', {
  sessionId: 123,
  message: 'Hello coach!'
});

// Receive messages
socket.on('message', (data) => {
  console.log('New message:', data);
});
```

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @aetherrun/api-client
```

```javascript
import { AetherRunClient } from '@aetherrun/api-client';

const client = new AetherRunClient({
  baseURL: 'https://api.aetherrun.com'
});

// Login
await client.auth.login('username', 'password');

// Get activities
const activities = await client.activities.list();

// Create activity
const activity = await client.activities.create({
  activity_type: 'run',
  distance: 5.0,
  duration: 30
});
```

