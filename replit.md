# AetherRun - AI-Powered Running & Fitness Platform

## Overview

AetherRun is a comprehensive health and wellness platform that combines intelligent fitness tracking with advanced nutritional insights and professional coaching services. The application leverages cutting-edge AI technology to provide personalized training plans, nutrition recommendations, and health analytics for runners and fitness enthusiasts.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server for fast development experience
- **TailwindCSS** for utility-first styling with shadcn/ui components
- **Wouter** for lightweight client-side routing
- **Tanstack Query** for data fetching, caching, and synchronization
- **React Hook Form** with Zod validation for robust form handling
- **Recharts** for data visualization and analytics

### Backend Architecture
- **Express.js** RESTful API server with TypeScript
- **PostgreSQL** as the primary database with Drizzle ORM for type-safe database operations
- **Passport.js** for authentication with local strategy and session management
- **WebSocket** support for real-time features
- **Multi-tier subscription system** with Stripe integration

### Authentication & Authorization
- Session-based authentication using Passport.js
- Role-based access control (user, coach, admin)
- Permission-based authorization system
- Admin impersonation functionality for support purposes

## Key Components

### User Management System
- Comprehensive user profiles with fitness metrics
- Multi-role system supporting regular users, coaches, and administrators
- Onboarding flow for new users with goal setting and experience assessment
- Admin panel for user management and platform oversight

### Fitness Tracking & Analytics
- Activity logging and import from multiple platforms
- Health metrics tracking (HRV, resting heart rate, sleep quality)
- Goal setting and progress visualization
- Achievement system with badges and rewards
- Advanced analytics including recovery readiness scores

### AI-Powered Features
- **OpenAI GPT-4** integration for training plan generation
- **DeepSeek API** as fallback AI service for redundancy
- **Google Generative AI** for additional AI capabilities
- Personalized nutrition recommendations
- Race prediction and pacing strategies

### Coaching Platform
- Professional coach profiles and booking system
- Video analysis capabilities for form improvement
- Coaching session management and scheduling
- Integration with subscription tiers for access control

### Third-Party Integrations
- **Strava** for activity and metrics import
- **Garmin Connect** for wearable data synchronization
- **Polar** for comprehensive health tracking
- **Google Fit** for cross-platform data integration
- Planned integrations: WHOOP, Apple Health, Fitbit

## Data Flow

### User Registration & Onboarding
1. User creates account with username/password
2. Guided onboarding collects fitness goals and experience level
3. System generates initial training recommendations
4. User profile is populated with preferences and settings

### Activity Data Sync
1. User connects third-party fitness accounts (Strava, Garmin, etc.)
2. OAuth flow exchanges tokens for API access
3. Background sync processes import activities and health metrics
4. Data is normalized and stored in unified schema
5. Analytics are updated and achievements are evaluated

### AI Training Plan Generation
1. User inputs goals, experience level, and preferences
2. System queries user's activity history and current fitness level
3. AI generates personalized training plan using OpenAI API
4. Plan is stored and presented with weekly breakdowns
5. User can request adjustments which trigger plan regeneration

### Subscription Management
1. User selects subscription tier (Free, Monthly Premium, Annual Premium)
2. Stripe handles payment processing and subscription lifecycle
3. System updates user permissions based on subscription status
4. Features are gated based on subscription level

## External Dependencies

### Payment Processing
- **Stripe** for subscription billing and payment processing
- Webhook handling for subscription status updates
- Customer portal integration for self-service billing

### AI Services
- **OpenAI API** (primary) for training plan and nutrition generation
- **DeepSeek API** (fallback) for AI redundancy
- **Google Generative AI** for additional AI capabilities

### Third-Party Fitness Platforms
- **Strava API** for activity import and athlete profiles
- **Garmin Connect IQ** for health metrics and activities
- **Polar AccessLink** for comprehensive fitness data

### Communication Services
- **SendGrid** for transactional email delivery
- Email templates for onboarding, notifications, and marketing

### Development & Testing
- **Playwright** for end-to-end testing
- **Vitest** for unit testing with React Testing Library
- **MSW** (Mock Service Worker) for API mocking in tests

## Deployment Strategy

### Platform Configuration
- **Replit** deployment with autoscale configuration
- **PostgreSQL 16** database provisioning
- **Node.js 20** runtime environment

### Environment Management
- Secure environment variable handling for API keys
- Separate configurations for development, testing, and production
- Database migrations using Drizzle-kit

### Build Process
1. Frontend assets compiled with Vite
2. Backend transpiled with esbuild for production
3. Static files served from Express server
4. Hot module reloading in development mode

### Monitoring & Analytics
- Request logging with duration tracking
- Error handling with comprehensive error responses
- Performance monitoring for API endpoints

## Changelog

- June 26, 2025: Enhanced mobile tab navigation consistency and branding
  - Applied responsive grid layout to training plan page tabs, eliminating horizontal scrolling
  - Standardized tab design pattern across admin panel and training plan pages
  - Mobile tabs now use 3-column grid with stacked icons and shortened labels
  - Desktop maintains horizontal flex layout with full labels and inline icons
  - Updated landing page header to use AetherRun logo image instead of text-based branding
  - Landing page logo sizing: h-80 (320px height) with max-w-lg for optimal visibility
  - Logo file: sinine_musttaust.png (correct AetherRun branding)
- June 25, 2025: Standardized mobile and desktop UI consistency
  - Fixed admin panel tabs to use responsive grid layout without horizontal scrolling
  - Unified label consistency between mobile and desktop views across all components
  - Resolved React Radix UI component structure errors
  - Ensured identical terminology in navigation elements (desktop sidebar matches mobile menu)
- June 24, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.