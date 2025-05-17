# Third-Party Fitness Platform Integrations

This document provides detailed information about integrating with the third-party fitness platforms supported by MomentumRun: Strava, Garmin Connect, and Polar.

## Supported Platforms

### Strava

Strava integration allows users to import their running activities and related metrics.

#### Authentication Flow

1. **Authorization Request**: Redirect the user to Strava's authorization page
   ```
   https://www.strava.com/oauth/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=activity:read_all,profile:read_all
   ```

2. **Authorization Callback**: Strava redirects back to your app with an authorization code
   ```
   {REDIRECT_URI}?code={AUTHORIZATION_CODE}
   ```

3. **Token Exchange**: Exchange the authorization code for access and refresh tokens
   ```
   POST https://www.strava.com/oauth/token
   {
     "client_id": "{CLIENT_ID}",
     "client_secret": "{CLIENT_SECRET}",
     "code": "{AUTHORIZATION_CODE}",
     "grant_type": "authorization_code"
   }
   ```

4. **Store Tokens**: Save the access token, refresh token, and expiration time in the database.

#### API Usage

After authentication, use the access token to make API requests to Strava.

**Get Athlete Profile**:
```
GET https://www.strava.com/api/v3/athlete
Authorization: Bearer {ACCESS_TOKEN}
```

**List Activities**:
```
GET https://www.strava.com/api/v3/athlete/activities
Authorization: Bearer {ACCESS_TOKEN}
```

**Get Activity Details**:
```
GET https://www.strava.com/api/v3/activities/{ACTIVITY_ID}
Authorization: Bearer {ACCESS_TOKEN}
```

#### Token Refresh

Strava access tokens expire after 6 hours. Refresh the token using:
```
POST https://www.strava.com/oauth/token
{
  "client_id": "{CLIENT_ID}",
  "client_secret": "{CLIENT_SECRET}",
  "refresh_token": "{REFRESH_TOKEN}",
  "grant_type": "refresh_token"
}
```

### Garmin Connect

Garmin Connect integration allows users to import activities and health metrics such as HRV, sleep, and stress data.

#### Authentication Flow

Garmin uses OAuth 1.0a, which is more complex than OAuth 2.0.

1. **Request Token**: Obtain a request token from Garmin
   ```
   POST https://connectapi.garmin.com/oauth-service/oauth/request_token
   ```

2. **User Authorization**: Redirect user to Garmin's authorization page
   ```
   https://connect.garmin.com/oauthConfirm?oauth_token={REQUEST_TOKEN}
   ```

3. **Access Token**: Exchange the authorized request token for an access token
   ```
   POST https://connectapi.garmin.com/oauth-service/oauth/access_token
   ```

#### API Usage

Garmin's APIs require careful request signing using OAuth 1.0a.

**Get User Info**:
```
GET https://apis.garmin.com/wellness-api/rest/user/id
```

**Get Daily Summaries**:
```
GET https://apis.garmin.com/wellness-api/rest/dailies?fromDate={DATE}&untilDate={DATE}
```

**Get Activities**:
```
GET https://apis.garmin.com/activitydetails-service/api/v1/activities/{ACTIVITY_ID}/details
```

**Get Sleep Data**:
```
GET https://apis.garmin.com/wellness-api/rest/sleeps?startDate={DATE}&endDate={DATE}
```

**Get Heart Rate Data**:
```
GET https://apis.garmin.com/wellness-api/rest/heartRates?startDate={DATE}&endDate={DATE}
```

### Polar

Polar integration provides access to training data, activity data, and physical information.

#### Authentication Flow

Polar uses OAuth 2.0 for authentication.

1. **Authorization Request**: Redirect the user to Polar's authorization page
   ```
   https://flow.polar.com/oauth2/authorization?response_type=code&client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}
   ```

2. **Authorization Callback**: Polar redirects back to your app with an authorization code
   ```
   {REDIRECT_URI}?code={AUTHORIZATION_CODE}
   ```

3. **Token Exchange**: Exchange the authorization code for an access token
   ```
   POST https://polarremote.com/v2/oauth2/token
   Content-Type: application/x-www-form-urlencoded
   
   grant_type=authorization_code&code={AUTHORIZATION_CODE}&redirect_uri={REDIRECT_URI}&client_id={CLIENT_ID}&client_secret={CLIENT_SECRET}
   ```

#### API Usage

**Register Exercise**:
```
POST https://www.polaraccesslink.com/v3/exercises
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "transaction-id": "{TRANSACTION_ID}"
}
```

**Get Available Data**:
```
GET https://www.polaraccesslink.com/v3/users/{USER_ID}/exercise-transactions
Authorization: Bearer {ACCESS_TOKEN}
```

**Get Exercise Summary**:
```
GET https://www.polaraccesslink.com/v3/users/{USER_ID}/exercise-transactions/{TRANSACTION_ID}/exercises
Authorization: Bearer {ACCESS_TOKEN}
```

**Get Physical Info**:
```
GET https://www.polaraccesslink.com/v3/users/{USER_ID}/physical-information-transactions/{TRANSACTION_ID}
Authorization: Bearer {ACCESS_TOKEN}
```

## Implementing Integrations in MomentumRun

### Integration Service

The `integration-service.ts` file handles the authentication and data synchronization processes for all third-party platforms.

```typescript
// Example structure
export class IntegrationService {
  async initiateStravaAuth(userId: number): Promise<string> {
    // Return authorization URL
  }
  
  async handleStravaCallback(code: string, userId: number): Promise<void> {
    // Handle authorization callback and token exchange
  }
  
  async syncStravaActivities(userId: number): Promise<Activity[]> {
    // Sync activities from Strava
  }
  
  // Similar methods for Garmin and Polar
}
```

### Database Schema

The application stores integration tokens and user connections in the database:

```typescript
// In schema.ts
export const platform_integrations = pgTable("platform_integrations", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  platform: varchar("platform", { length: 50 }).notNull(), // "strava", "garmin", "polar"
  access_token: text("access_token").notNull(),
  refresh_token: text("refresh_token"),
  token_expiry: timestamp("token_expiry"),
  athlete_id: varchar("athlete_id", { length: 50 }),
  connected_at: timestamp("connected_at").defaultNow(),
  last_sync_at: timestamp("last_sync_at"),
  is_active: boolean("is_active").default(true),
});
```

### Syncing Process

Data synchronization happens in these scenarios:

1. **On-demand sync**: When a user clicks "Sync" in the UI
2. **Scheduled sync**: Background job that runs periodically
3. **Post-connection sync**: Initial sync after connecting an account

```typescript
// Example sync process
async function syncPlatformData(userId: number, platform: string) {
  // 1. Get integration details from the database
  const integration = await db.getIntegration(userId, platform);
  
  // 2. Check if token is expired and refresh if needed
  if (isTokenExpired(integration)) {
    await refreshToken(integration);
  }
  
  // 3. Fetch activities based on platform
  let activities = [];
  switch (platform) {
    case 'strava':
      activities = await fetchStravaActivities(integration);
      break;
    case 'garmin':
      activities = await fetchGarminActivities(integration);
      break;
    case 'polar':
      activities = await fetchPolarActivities(integration);
      break;
  }
  
  // 4. Normalize activities to application format
  const normalizedActivities = normalizeActivities(activities, platform);
  
  // 5. Store activities in the database
  await db.storeActivities(normalizedActivities, userId);
  
  // 6. Update last sync timestamp
  await db.updateIntegrationLastSync(integration.id);
  
  return normalizedActivities;
}
```

### Data Normalization

Each platform returns data in different formats, so normalization is necessary:

```typescript
// Example normalization function
function normalizeActivities(activities: any[], platform: string): Activity[] {
  switch (platform) {
    case 'strava':
      return activities.map(activity => ({
        external_id: `strava_${activity.id}`,
        type: mapActivityType(activity.type),
        start_time: new Date(activity.start_date),
        duration: activity.elapsed_time,
        distance: activity.distance,
        source: 'strava',
        data: activity,
      }));
    
    // Similar mapping for other platforms
  }
}
```

## Health Metrics

### Available Metrics by Platform

| Metric            | Strava | Garmin | Polar |
|-------------------|--------|--------|-------|
| HRV               | ✓      | ✓      | ✓     |
| Resting HR        | ✓      | ✓      | ✓     |
| Sleep Duration    | ✗      | ✓      | ✓     |
| Sleep Quality     | ✗      | ✓      | ✓     |
| Steps             | ✗      | ✓      | ✓     |
| Stress Level      | ✗      | ✓      | ✓     |
| Active Calories   | ✓      | ✓      | ✓     |

### Refresh Frequency

- **Strava**: Every 6 hours (due to token expiration)
- **Garmin**: Daily 
- **Polar**: Every 24 hours

## Error Handling

### Common Errors

1. **Authentication Failures**: 
   - Token expired
   - User revoked access
   - Invalid client credentials

2. **Rate Limiting**:
   - Strava: 100 requests per 15 minutes, 1000 per day
   - Garmin: Varies by endpoint
   - Polar: 120 requests per minute

3. **API Changes**:
   - Platform API updates may break integration

### Error Recovery

1. **Token Expiration**:
   - Automatically refresh tokens when expired
   - Update database with new tokens

2. **Rate Limiting**:
   - Implement exponential backoff
   - Queue requests and process gradually

3. **User Revoked Access**:
   - Detect 401 Unauthorized responses
   - Prompt user to reconnect their account

## Testing Integrations

Use the following approaches to test integrations:

1. **Sandbox Environments**:
   - Strava: Use the Strava sandbox environment
   - Garmin: Test with developer accounts
   - Polar: Use test accounts

2. **Mock Responses**:
   - Create mock data for testing
   - Use MSW to intercept API requests

3. **Integration Tests**:
   - Test the full authentication flow
   - Verify data synchronization

## Privacy Considerations

When implementing integrations, ensure you:

1. Store only necessary data
2. Clearly inform users what data is being accessed
3. Provide options to disconnect integrations
4. Delete integration data when users request it
5. Respect platform terms of service and API limitations