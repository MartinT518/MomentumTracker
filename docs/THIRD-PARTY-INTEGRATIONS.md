# Third-Party Fitness Platform Integrations

This document provides detailed information about integrating with the third-party fitness platforms supported by MomentumRun: Strava, Garmin Connect, Polar, Google Fit, WHOOP, Apple Health, and Fitbit.

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

### Google Fit

Google Fit integration allows users to import activities, steps, heart rate, and other health metrics.

#### Authentication Flow

Google Fit uses OAuth 2.0 for authentication.

1. **Authorization Request**: Redirect the user to Google's authorization page
   ```
   https://accounts.google.com/o/oauth2/v2/auth?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.sleep.read
   ```

2. **Authorization Callback**: Google redirects back to your app with an authorization code
   ```
   {REDIRECT_URI}?code={AUTHORIZATION_CODE}
   ```

3. **Token Exchange**: Exchange the authorization code for access and refresh tokens
   ```
   POST https://oauth2.googleapis.com/token
   Content-Type: application/x-www-form-urlencoded
   
   code={AUTHORIZATION_CODE}&client_id={CLIENT_ID}&client_secret={CLIENT_SECRET}&redirect_uri={REDIRECT_URI}&grant_type=authorization_code
   ```

#### API Usage

Google Fit API uses REST endpoints to retrieve fitness data.

**Get User's Activity Data**:
```
GET https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "aggregateBy": [{
    "dataTypeName": "com.google.step_count.delta",
    "dataSourceId": "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
  }],
  "bucketByTime": { "durationMillis": 86400000 },
  "startTimeMillis": {START_TIME_MILLIS},
  "endTimeMillis": {END_TIME_MILLIS}
}
```

**Get Heart Rate Data**:
```
GET https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "aggregateBy": [{
    "dataTypeName": "com.google.heart_rate.bpm"
  }],
  "bucketByTime": { "durationMillis": 86400000 },
  "startTimeMillis": {START_TIME_MILLIS},
  "endTimeMillis": {END_TIME_MILLIS}
}
```

**Get Sleep Data**:
```
GET https://www.googleapis.com/fitness/v1/users/me/sessions
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

#### Token Refresh

Google Fit access tokens expire after 1 hour. Refresh the token using:
```
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

client_id={CLIENT_ID}&client_secret={CLIENT_SECRET}&refresh_token={REFRESH_TOKEN}&grant_type=refresh_token
```

### WHOOP

WHOOP integration allows users to import recovery data, strain, and sleep metrics.

#### Authentication Flow

WHOOP uses OAuth 2.0 for authentication.

1. **Authorization Request**: Redirect the user to WHOOP's authorization page
   ```
   https://api.prod.whoop.com/oauth/oauth2/auth?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=read:recovery read:workout read:sleep read:profile
   ```

2. **Authorization Callback**: WHOOP redirects back to your app with an authorization code
   ```
   {REDIRECT_URI}?code={AUTHORIZATION_CODE}
   ```

3. **Token Exchange**: Exchange the authorization code for access and refresh tokens
   ```
   POST https://api.prod.whoop.com/oauth/oauth2/token
   Content-Type: application/x-www-form-urlencoded
   
   grant_type=authorization_code&code={AUTHORIZATION_CODE}&client_id={CLIENT_ID}&client_secret={CLIENT_SECRET}&redirect_uri={REDIRECT_URI}
   ```

#### API Usage

**Get User Profile**:
```
GET https://api.prod.whoop.com/developer/v1/user/profile
Authorization: Bearer {ACCESS_TOKEN}
```

**Get Recovery Data**:
```
GET https://api.prod.whoop.com/developer/v1/recovery
Authorization: Bearer {ACCESS_TOKEN}
```

**Get Workout Data**:
```
GET https://api.prod.whoop.com/developer/v1/workout
Authorization: Bearer {ACCESS_TOKEN}
```

**Get Sleep Data**:
```
GET https://api.prod.whoop.com/developer/v1/sleep
Authorization: Bearer {ACCESS_TOKEN}
```

#### Token Refresh

WHOOP access tokens expire after 24 hours. Refresh using:
```
POST https://api.prod.whoop.com/oauth/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token={REFRESH_TOKEN}&client_id={CLIENT_ID}&client_secret={CLIENT_SECRET}
```

### Apple Health

Apple Health integration allows users to import health data from their iPhone and Apple Watch.

#### Authentication Flow

Apple Health data is accessed through HealthKit in iOS apps. For a web application, you'll need to build a companion iOS app that acts as a bridge.

1. **iOS App Development**: Create an iOS app that requests HealthKit permissions
2. **Data Collection**: Use the HealthKit API to collect relevant health data
3. **Data Transfer**: Send the data to your server via your API

#### API Implementation (iOS Swift Code)

```swift
import HealthKit

class HealthKitManager {
    let healthStore = HKHealthStore()
    
    func requestAuthorization(completion: @escaping (Bool, Error?) -> Void) {
        let types: Set = [
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!,
            HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)!,
            HKObjectType.quantityType(forIdentifier: .stepCount)!,
            HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
            HKObjectType.quantityType(forIdentifier: .restingHeartRate)!,
            HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!
        ]
        
        healthStore.requestAuthorization(toShare: nil, read: types) { (success, error) in
            completion(success, error)
        }
    }
    
    func fetchHeartRateData(completion: @escaping ([Double], [Date], Error?) -> Void) {
        let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        
        let predicate = HKQuery.predicateForSamples(withStart: Date().addingTimeInterval(-86400), end: Date(), options: .strictStartDate)
        
        let query = HKSampleQuery(sampleType: heartRateType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { (query, samples, error) in
            guard let samples = samples as? [HKQuantitySample], error == nil else {
                completion([], [], error)
                return
            }
            
            let heartRates = samples.map { $0.quantity.doubleValue(for: HKUnit(from: "count/min")) }
            let timestamps = samples.map { $0.startDate }
            
            completion(heartRates, timestamps, nil)
        }
        
        healthStore.execute(query)
    }
    
    // Similar methods for other metrics...
}
```

#### Web API Endpoints

Your iOS app would then send this data to your server:

```
POST https://api.momentumrun.com/api/apple-health/sync
Authorization: Bearer {USER_ACCESS_TOKEN}
Content-Type: application/json

{
  "heartRate": [...],
  "steps": [...],
  "sleep": [...],
  "workouts": [...],
  "hrv": [...]
}
```

### Fitbit

Fitbit integration allows users to import activities, sleep, heart rate, and other metrics.

#### Authentication Flow

Fitbit uses OAuth 2.0 for authentication.

1. **Authorization Request**: Redirect the user to Fitbit's authorization page
   ```
   https://www.fitbit.com/oauth2/authorize?client_id={CLIENT_ID}&response_type=code&scope=activity heartrate sleep profile&redirect_uri={REDIRECT_URI}
   ```

2. **Authorization Callback**: Fitbit redirects back to your app with an authorization code
   ```
   {REDIRECT_URI}?code={AUTHORIZATION_CODE}
   ```

3. **Token Exchange**: Exchange the authorization code for access and refresh tokens
   ```
   POST https://api.fitbit.com/oauth2/token
   Authorization: Basic {BASE64_ENCODED_CLIENT_ID_AND_SECRET}
   Content-Type: application/x-www-form-urlencoded
   
   grant_type=authorization_code&code={AUTHORIZATION_CODE}&redirect_uri={REDIRECT_URI}
   ```

#### API Usage

**Get User Profile**:
```
GET https://api.fitbit.com/1/user/-/profile.json
Authorization: Bearer {ACCESS_TOKEN}
```

**Get Activity Data**:
```
GET https://api.fitbit.com/1/user/-/activities/date/{DATE}.json
Authorization: Bearer {ACCESS_TOKEN}
```

**Get Heart Rate Data**:
```
GET https://api.fitbit.com/1/user/-/activities/heart/date/{DATE}/1d.json
Authorization: Bearer {ACCESS_TOKEN}
```

**Get Sleep Data**:
```
GET https://api.fitbit.com/1.2/user/-/sleep/date/{DATE}.json
Authorization: Bearer {ACCESS_TOKEN}
```

#### Token Refresh

Fitbit access tokens expire after 8 hours. Refresh using:
```
POST https://api.fitbit.com/oauth2/token
Authorization: Basic {BASE64_ENCODED_CLIENT_ID_AND_SECRET}
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token={REFRESH_TOKEN}
```

## Health Metrics

### Available Metrics by Platform

| Metric            | Strava | Garmin | Polar | Google Fit | WHOOP | Apple Health | Fitbit |
|-------------------|--------|--------|-------|------------|-------|--------------|--------|
| HRV               | ✓      | ✓      | ✓     | ✗          | ✓     | ✓            | ✗      |
| Resting HR        | ✓      | ✓      | ✓     | ✓          | ✓     | ✓            | ✓      |
| Sleep Duration    | ✗      | ✓      | ✓     | ✓          | ✓     | ✓            | ✓      |
| Sleep Quality     | ✗      | ✓      | ✓     | ✗          | ✓     | ✓            | ✓      |
| Steps             | ✗      | ✓      | ✓     | ✓          | ✗     | ✓            | ✓      |
| Stress Level      | ✗      | ✓      | ✓     | ✗          | ✓     | ✗            | ✗      |
| Active Calories   | ✓      | ✓      | ✓     | ✓          | ✓     | ✓            | ✓      |
| Recovery Score    | ✗      | ✗      | ✗     | ✗          | ✓     | ✗            | ✗      |
| Strain Score      | ✗      | ✗      | ✗     | ✗          | ✓     | ✗            | ✗      |
| Blood Oxygen      | ✗      | ✓      | ✗     | ✗          | ✗     | ✓            | ✓      |
| Respiratory Rate  | ✗      | ✓      | ✗     | ✗          | ✓     | ✓            | ✓      |

### Refresh Frequency

- **Strava**: Every 6 hours (due to token expiration)
- **Garmin**: Daily 
- **Polar**: Every 24 hours
- **Google Fit**: Every 1 hour (due to token expiration)
- **WHOOP**: Every 24 hours
- **Apple Health**: Manual sync through iOS app
- **Fitbit**: Every 8 hours (due to token expiration)

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