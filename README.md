# MomentumRun - AI-Powered Running & Fitness Platform

MomentumRun is a comprehensive health and wellness platform that combines intelligent fitness tracking with advanced nutritional insights and professional coaching services. The application leverages cutting-edge AI technologies to provide personalized, adaptive health recommendations.

## Features

### Core Features
- **Personalized Training Plans**: AI-generated running plans based on your goals and fitness level
- **Activity Tracking**: Log and visualize your running activities with detailed metrics
- **Health Metrics Dashboard**: Track important health indicators like HRV, resting heart rate, and sleep quality
- **Goal Setting & Progress Tracking**: Set fitness goals and track your progress visually
- **Nutritional Insights**: Get AI-powered nutrition recommendations and meal plans
- **Achievement System**: Earn badges and rewards for reaching fitness milestones

### Advanced Health Metrics
- **Recovery Readiness Score**: Daily score combining HRV, sleep quality, and resting heart rate
- **Training Load Balance**: Track acute vs chronic training load to prevent overtraining
- **Physiological Age Assessment**: Compare your metrics to population averages
- **Environmental Impact Analysis**: See how weather and elevation affect your performance
- **Heat Map Training Distribution**: Visualize your training intensity distribution
- **Race Prediction & Pacing Strategy**: Get AI-generated race predictions and pacing plans
- **Mental Performance Tracking**: Monitor the connection between mental state and physical performance

### Premium Features (Monthly Subscription)
- **Advanced Analytics**: Get deeper insights into your training patterns and progress
- **Enhanced Training Plans**: More detailed and customizable AI-generated training plans
- **Nutrition Plan Generator**: Personalized meal plans based on your dietary preferences and goals

### Premium Features (Annual Subscription)
- All Monthly Premium features
- **Access to Professional Coaches**: Connect with expert running coaches for personalized guidance
- **Video Analysis**: Upload running form videos for analysis and improvement suggestions
- **Early Access**: Be the first to try new features before they're widely available

### Integrations
- **Strava**: Import activities and metrics from your Strava account
- **Garmin Connect**: Sync your Garmin wearable data for health metrics
- **Polar**: Connect your Polar devices for comprehensive health and fitness tracking
- **Google Fit**: Import activities, steps, heart rate, and other metrics
- **WHOOP**: Import recovery, strain, and sleep metrics for a complete picture
- **Apple Health**: Sync health data from your iPhone and Apple Watch
- **Fitbit**: Import activities, sleep, heart rate, and other fitness metrics

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- API keys for:
  - OpenAI (main AI provider)
  - DeepSeek (backup AI provider)
  - Stripe (payment processing)
  - Authentication details for fitness platforms (optional)

### Environment Variables
The application requires the following environment variables:

```
# Database
DATABASE_URL=postgresql://username:password@hostname:port/database_name

# AI Services
OPENAI_API_KEY=your_openai_api_key
VITE_OPENAI_API_KEY=your_openai_api_key_for_frontend
DEEPSEEK_API_KEY=your_deepseek_api_key

# Payment Processing
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key

# Fitness Platform Integration (Optional)
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
GARMIN_CONSUMER_KEY=your_garmin_consumer_key
GARMIN_CONSUMER_SECRET=your_garmin_consumer_secret
POLAR_CLIENT_ID=your_polar_client_id
POLAR_CLIENT_SECRET=your_polar_client_secret
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables in a `.env` file
4. Push database schema:
   ```bash
   npm run db:push
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions and services
│   │   ├── pages/         # Application pages
│   │   ├── types/         # TypeScript type definitions
│   │   └── App.tsx        # Main application component
├── server/                # Backend Express server
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data access layer
│   ├── auth.ts            # Authentication
│   └── db.ts              # Database connection
├── shared/                # Shared code between client and server
│   └── schema.ts          # Database schema and types
```

## Authentication

The application uses session-based authentication with Passport.js. Users can register, log in, and manage their sessions through the following endpoints:

- `POST /api/register`: Create a new user account
- `POST /api/login`: Authenticate and start a session
- `POST /api/logout`: End the current session
- `GET /api/user`: Get the current authenticated user's details

## API Endpoints

### User & Authentication
- `GET /api/user`: Get current user information
- `POST /api/register`: Register a new user
- `POST /api/login`: Log in existing user
- `POST /api/logout`: Log out current user

### Activities
- `GET /api/activities`: Get all user activities
- `GET /api/activities/recent`: Get recent activities
- `POST /api/activities`: Create a new activity
- `GET /api/activities/:id`: Get activity details
- `PUT /api/activities/:id`: Update an activity
- `DELETE /api/activities/:id`: Delete an activity

### Health Metrics
- `GET /api/health-metrics`: Get all health metrics
- `POST /api/health-metrics`: Add new health metrics
- `GET /api/metrics/weekly`: Get weekly metrics summary

### Training
- `GET /api/workouts/today`: Get today's planned workout
- `GET /api/training-plan`: Get current training plan
- `POST /api/training-plan/generate`: Generate a new training plan

### Nutrition
- `GET /api/nutrition/plan`: Get current nutrition plan
- `POST /api/nutrition/plan/generate`: Generate a new nutrition plan
- `GET /api/nutrition/logs`: Get nutrition logs
- `POST /api/nutrition/logs`: Add a nutrition log entry

### Coaching (Premium Annual)
- `GET /api/coaches`: Get available coaches
- `GET /api/coaches/:id`: Get coach details
- `POST /api/coaching-sessions`: Book a coaching session
- `GET /api/coaching-sessions`: Get user's coaching sessions

### Admin
- `GET /api/coaches/all`: Get all coaches (admin only)
- `POST /api/coaches`: Add a new coach (admin only)
- `PUT /api/coaches/:id`: Update coach details (admin only)
- `DELETE /api/coaches/:id`: Delete a coach (admin only)

### Subscriptions
- `GET /api/subscription/plans`: Get available subscription plans
- `POST /api/subscription/create`: Create a new subscription
- `GET /api/subscription/status`: Get current subscription status
- `POST /api/subscription/cancel`: Cancel current subscription

## Database Schema

The application uses a PostgreSQL database with the following main entities:

- **Users**: User accounts and profile information
- **Activities**: Running and workout activities
- **HealthMetrics**: Health indicators like HRV, sleep, etc.
- **TrainingPlans**: Generated training plans
- **FitnessGoals**: User-defined fitness goals
- **NutritionLogs**: Daily nutrition tracking
- **Coaches**: Professional running coaches
- **CoachingSessions**: Scheduled sessions between users and coaches
- **Achievements**: User achievements and badges
- **SubscriptionPlans**: Available subscription tiers
- **UserSubscriptions**: User subscription information

## Third-Party Integrations

### AI Providers
- **OpenAI**: Primary AI provider for training plans and nutrition advice
- **DeepSeek**: Backup AI provider when OpenAI quota is exceeded

### Payment Processing
- **Stripe**: Handles subscription payments and billing

### Fitness Platforms
- **Strava**: Activity importing and data synchronization
- **Garmin Connect**: Health metrics and activity data
- **Polar**: Health metrics and activity data

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.