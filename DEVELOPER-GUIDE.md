# MomentumRun Developer Guide

This guide provides detailed technical information for developers working on the MomentumRun application.

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **TailwindCSS** for styling
- **shadcn/ui** for UI components
- **Tanstack Query** for data fetching and state management
- **Recharts** for data visualization
- **Wouter** for routing
- **Zod** for form validation

### Backend
- **Express** for the API server
- **Drizzle ORM** for database access
- **PostgreSQL** for data storage
- **Passport.js** for authentication
- **OpenAI API** for AI-powered recommendations
- **DeepSeek API** as a fallback AI service

### Testing
- **Vitest** for unit and integration testing
- **React Testing Library** for component testing
- **MSW** (Mock Service Worker) for API mocking

## Development Process

### Getting Started

1. Set up your local environment following the instructions in README.md
2. Familiarize yourself with the codebase structure
3. Run tests to ensure everything is working: `npm run test`

### Making Changes

1. **Frontend Changes**:
   - Component-level changes should be made in `/client/src/components`
   - Page-level changes should be made in `/client/src/pages`
   - Data fetching should use Tanstack Query (see examples in existing code)
   - Forms should use react-hook-form with Zod validation

2. **Backend Changes**:
   - API routes should be added to `/server/routes.ts`
   - Database schema changes should be made to `/shared/schema.ts`
   - After schema changes, run `npm run db:push` to update the database

3. **Testing**:
   - Add tests for new functionality
   - Run tests before submitting changes: `npm run test`

## Code Organization

### Frontend Structure

```
/client/src
├── components/             # Reusable UI components
│   ├── common/             # App-wide components (sidebar, header, etc.)
│   ├── activities/         # Activity-related components
│   ├── coach/              # Coaching-related components
│   ├── health-metrics/     # Health metrics components
│   ├── nutrition/          # Nutrition-related components
│   ├── training/           # Training plan components
│   └── ui/                 # shadcn UI components
│
├── hooks/                  # Custom React hooks
│   ├── use-auth.tsx        # Authentication hook
│   ├── use-subscription.tsx # Subscription management hook
│   └── ...                 
│
├── lib/                    # Utility functions and services
│   ├── ai-service.ts       # AI service for training plans
│   ├── nutrition-ai-service.ts # AI service for nutrition
│   ├── queryClient.ts      # Tanstack Query configuration
│   └── ...                 
│
├── pages/                  # Application pages
│   ├── home-page.tsx       # Dashboard page
│   ├── auth-page.tsx       # Authentication page
│   └── ...                 
│
└── types/                  # TypeScript type definitions
```

### Backend Structure

```
/server
├── routes.ts              # API routes
├── storage.ts             # Data access layer
├── auth.ts                # Authentication logic
├── db.ts                  # Database connection
└── ...                    
```

### Shared Code

```
/shared
└── schema.ts              # Database schema and shared types
```

## Authentication Flow

1. User registers or logs in via `/api/register` or `/api/login`
2. Server creates a session using Passport.js and Express-session
3. Session is stored in the database
4. Client receives a cookie with session ID
5. Protected routes check for authenticated session via `req.isAuthenticated()`
6. Frontend uses `useAuth` hook to access user state and authentication methods

## Subscription Handling

1. User selects a subscription plan
2. Frontend creates a payment intent via Stripe
3. User completes payment
4. Webhook from Stripe confirms payment
5. Backend updates user's subscription status
6. Frontend gates premium features using `useSubscription` hook

## AI Integration

### Training Plan Generation

1. User initiates training plan generation with parameters
2. Server calls OpenAI API with specialized prompt
3. If OpenAI fails, system falls back to DeepSeek API
4. Generated plan is parsed and stored in the database
5. Frontend displays the training plan to the user

### Nutrition Recommendation

1. User requests nutrition advice with parameters
2. Server calls OpenAI API with nutrition-specific prompt
3. If OpenAI fails, system falls back to DeepSeek API
4. Generated nutrition plan is parsed and stored
5. Frontend displays the nutrition recommendations

## Third-Party Integration

### Fitness Platform Authentication

1. User initiates connection to a fitness platform (Strava, Garmin, Polar)
2. System redirects to the platform's OAuth authorization page
3. User authorizes MomentumRun
4. Platform redirects back with authorization code
5. Backend exchanges code for access token
6. Access token is stored for future API calls
7. System begins syncing data from the platform

### Data Synchronization

1. Background job or user-initiated sync begins
2. System uses stored access tokens to call platform APIs
3. Retrieved data is normalized to our schema
4. Data is stored in the database
5. Frontend displays the synchronized data

## Common Development Tasks

### Adding a New API Endpoint

1. Define the route in `/server/routes.ts`
2. Implement the storage method in `/server/storage.ts`
3. Add appropriate validation
4. Update or create frontend query or mutation

### Adding a New Database Table

1. Define the table schema in `/shared/schema.ts`
2. Create insert/select types
3. Update the storage interface and implementation
4. Run `npm run db:push` to update the database

### Adding a New Page

1. Create the page component in `/client/src/pages`
2. Add the route in `/client/src/App.tsx`
3. Add navigation link in the sidebar or header

### Adding a Premium Feature

1. Implement the feature
2. Gate the feature using the `SubscriptionGate` component:
   ```tsx
   <SubscriptionGate requiredPlan="premium" requiredBillingInterval="annual">
     {/* Premium feature content */}
   </SubscriptionGate>
   ```

## Performance Considerations

1. **Query Optimization**:
   - Use indexes for frequently queried fields
   - Keep query result sets small
   - Use pagination for large data sets

2. **Frontend Performance**:
   - Use React.memo for expensive components
   - Virtualize long lists
   - Optimize image sizes

3. **AI Service Usage**:
   - Cache AI-generated results where appropriate
   - Implement rate limiting to prevent excessive API calls
   - Use the most efficient models for each task

## Testing Guidelines

1. **Unit Tests**:
   - Test individual functions and utilities
   - Mock external dependencies

2. **Component Tests**:
   - Test component rendering and interactions
   - Mock API calls with MSW

3. **Integration Tests**:
   - Test interactions between multiple components
   - Test complete user flows

4. **API Tests**:
   - Test API endpoints with various inputs
   - Test error handling

## Debugging

1. **Frontend Issues**:
   - Use React DevTools
   - Check browser console for errors
   - Verify network requests in browser DevTools

2. **Backend Issues**:
   - Check server logs
   - Use debug logging for specific areas
   - Verify database queries

3. **AI Service Issues**:
   - Check API response logs
   - Verify prompt formatting
   - Test with minimal examples

## Deployment

The application is deployed on Replit, which handles the build and deployment process automatically. When making changes:

1. Ensure all tests pass
2. Commit changes to the repository
3. Replit will automatically build and deploy the application

## Best Practices

1. **Code Style**:
   - Follow ESLint and Prettier configurations
   - Use TypeScript for type safety
   - Document complex functions and components

2. **State Management**:
   - Use Tanstack Query for server state
   - Use React state for local UI state
   - Avoid prop drilling with context where appropriate

3. **Error Handling**:
   - Implement proper error boundaries
   - Log errors on the server
   - Display user-friendly error messages

4. **Security**:
   - Validate all user inputs
   - Use parameterized queries to prevent SQL injection
   - Keep API keys secure in environment variables
   - Implement rate limiting for API endpoints

5. **Accessibility**:
   - Use semantic HTML
   - Ensure keyboard navigation works
   - Maintain appropriate color contrast
   - Add ARIA attributes where needed