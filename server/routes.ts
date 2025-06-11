import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { setupAuth } from "./auth";
import { setupDevSubscription } from "./dev-subscription";
import { 
  and, eq, desc, gte, lte, sql, count, sum, avg, or, ne, isNotNull, asc, isNull, inArray
} from "drizzle-orm";
import { 
  users, activities, health_metrics, goals, achievements, user_achievements, 
  coaches, coaching_sessions, nutrition_logs, food_items, meal_plans, meals, 
  meal_food_items, training_plans, workouts, nutrition_preferences, 
  integration_connections, sync_logs, subscription_plans, challenges, 
  challenge_participants
} from "@shared/schema";
import Stripe from "stripe";
import axios from "axios";
import { Request, Response, NextFunction } from "express";
import { selectMealPlan } from "./predefined-meal-plans";
import { generateSimpleMealPlan } from "./simple-meal-plan";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

interface SyncOptions {
  userId: number;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  forceSync?: boolean;
  syncLogId?: number;
}

// Integration sync functions
async function syncStravaData(options: SyncOptions): Promise<void> {
  const { userId, access_token, syncLogId } = options;
  
  try {
    console.log(`Starting Strava sync for user ${userId}`);
    
    // Fetch recent activities
    const activitiesResponse = await axios.get(
      'https://www.strava.com/api/v3/athlete/activities',
      {
        headers: { Authorization: `Bearer ${access_token}` },
        params: { per_page: 30 }
      }
    );

    const activities = activitiesResponse.data;
    let activitiesProcessed = 0;
    let activitiesSkipped = 0;

    for (const activity of activities) {
      // Check if activity already exists
      const existingActivity = await db.select().from(activities).where(
        and(
          eq(activities.user_id, userId),
          eq(activities.external_id, activity.id.toString()),
          eq(activities.source_platform, 'strava')
        )
      ).limit(1);

      if (existingActivity.length > 0) {
        activitiesSkipped++;
        continue;
      }

      // Convert activity data
      const activityData = {
        user_id: userId,
        external_id: activity.id.toString(),
        activity_type: mapStravaActivityType(activity.type),
        source_platform: 'strava',
        activity_date: new Date(activity.start_date),
        start_time: new Date(activity.start_date),
        end_time: activity.elapsed_time ? new Date(new Date(activity.start_date).getTime() + activity.elapsed_time * 1000) : undefined,
        duration: activity.elapsed_time || 0,
        distance: Math.round((activity.distance || 0) / 1000 * 100) / 100, // Convert to km
        calories: activity.calories || 0,
        average_heart_rate: activity.average_heartrate || null,
        max_heart_rate: activity.max_heartrate || null,
        elevation_gain: Math.round((activity.total_elevation_gain || 0)),
        notes: activity.name || '',
        raw_data: activity
      };

      await db.insert(activities).values([activityData]);
      activitiesProcessed++;
    }

    // Update sync log
    if (syncLogId) {
      await db.update(sync_logs).set({
        status: 'completed',
        activities_synced: activitiesProcessed,
        activities_skipped: activitiesSkipped,
        completed_at: new Date()
      }).where(eq(sync_logs.id, syncLogId));
    }

    console.log(`Strava sync completed: ${activitiesProcessed} activities processed, ${activitiesSkipped} skipped`);
  } catch (error) {
    console.error('Strava sync error:', error);
    if (syncLogId) {
      await db.update(sync_logs).set({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date()
      }).where(eq(sync_logs.id, syncLogId));
    }
    throw error;
  }
}

async function syncGarminData(options: SyncOptions): Promise<void> {
  const { userId, access_token, syncLogId } = options;
  
  try {
    console.log(`Starting Garmin sync for user ${userId}`);
    
    // Fetch recent activities from Garmin Connect
    const activitiesResponse = await axios.get(
      'https://connectapi.garmin.com/activitylist-service/activities/search/activities',
      {
        headers: { Authorization: `Bearer ${access_token}` },
        params: { limit: 30 }
      }
    );

    const activities = activitiesResponse.data || [];
    let activitiesProcessed = 0;
    let activitiesSkipped = 0;

    for (const activity of activities) {
      // Check if activity already exists
      const existingActivity = await db.select().from(activities).where(
        and(
          eq(activities.user_id, userId),
          eq(activities.external_id, activity.activityId.toString()),
          eq(activities.source_platform, 'garmin')
        )
      ).limit(1);

      if (existingActivity.length > 0) {
        activitiesSkipped++;
        continue;
      }

      // Convert activity data
      const activityData = {
        user_id: userId,
        external_id: activity.activityId.toString(),
        activity_type: mapGarminActivityType(activity.activityTypeDTO?.typeKey || 'other'),
        source_platform: 'garmin',
        activity_date: new Date(activity.startTimeLocal),
        start_time: new Date(activity.startTimeLocal),
        end_time: new Date(activity.startTimeLocal + (activity.duration || 0) * 1000),
        duration: activity.duration || 0,
        distance: Math.round((activity.distance || 0) / 1000 * 100) / 100,
        calories: activity.calories || 0,
        average_heart_rate: activity.averageHR || null,
        max_heart_rate: activity.maxHR || null,
        elevation_gain: Math.round(activity.elevationGain || 0),
        raw_data: activity
      };

      await db.insert(activities).values([activityData]);
      activitiesProcessed++;
    }

    // Update sync log
    if (syncLogId) {
      await db.update(sync_logs).set({
        status: 'completed',
        activities_synced: activitiesProcessed,
        activities_skipped: activitiesSkipped,
        completed_at: new Date()
      }).where(eq(sync_logs.id, syncLogId));
    }

    console.log(`Garmin sync completed: ${activitiesProcessed} activities processed, ${activitiesSkipped} skipped`);
  } catch (error) {
    console.error('Garmin sync error:', error);
    if (syncLogId) {
      await db.update(sync_logs).set({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date()
      }).where(eq(sync_logs.id, syncLogId));
    }
    throw error;
  }
}

async function syncGoogleFitData(options: SyncOptions): Promise<void> {
  const { userId, access_token, syncLogId } = options;
  
  try {
    console.log(`Starting Google Fit sync for user ${userId}`);
    
    const endTime = Date.now();
    const startTime = endTime - (30 * 24 * 60 * 60 * 1000); // Last 30 days

    // Fetch activities from Google Fit
    const response = await axios.post(
      'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
      {
        aggregateBy: [
          { dataTypeName: 'com.google.activity.segment' },
          { dataTypeName: 'com.google.calories.expended' },
          { dataTypeName: 'com.google.distance.delta' }
        ],
        bucketByTime: { durationMillis: 86400000 }, // Daily buckets
        startTimeMillis: startTime,
        endTimeMillis: endTime
      },
      {
        headers: { Authorization: `Bearer ${access_token}` }
      }
    );

    const buckets = response.data?.bucket || [];
    let activitiesProcessed = 0;
    let activitiesSkipped = 0;

    for (const bucket of buckets) {
      for (const dataset of bucket.dataset) {
        for (const point of dataset.point || []) {
          if (point.dataTypeName === 'com.google.activity.segment') {
            const startTimeMs = parseInt(point.startTimeNanos) / 1000000;
            const endTimeMs = parseInt(point.endTimeNanos) / 1000000;
            const activityType = point.value?.[0]?.intVal;
            
            if (!activityType) continue;

            // Check if activity already exists
            const existingActivity = await db.select().from(activities).where(
              and(
                eq(activities.user_id, userId),
                eq(activities.external_id, `${startTimeMs}_${endTimeMs}`),
                eq(activities.source_platform, 'google_fit')
              )
            ).limit(1);

            if (existingActivity.length > 0) {
              activitiesSkipped++;
              continue;
            }

            const activityData = {
              user_id: userId,
              external_id: `${startTimeMs}_${endTimeMs}`,
              activity_type: 'fitness',
              source_platform: 'google_fit',
              activity_date: new Date(startTimeMs),
              start_time: new Date(startTimeMs),
              end_time: new Date(endTimeMs),
              duration: Math.round((endTimeMs - startTimeMs) / 1000),
              distance: 0,
              calories: 0,
              raw_data: point
            };

            await db.insert(activities).values([activityData]);
            activitiesProcessed++;
          }
        }
      }
    }

    // Update sync log
    if (syncLogId) {
      await db.update(sync_logs).set({
        status: 'completed',
        activities_synced: activitiesProcessed,
        activities_skipped: activitiesSkipped,
        completed_at: new Date()
      }).where(eq(sync_logs.id, syncLogId));
    }

    console.log(`Google Fit sync completed: ${activitiesProcessed} activities processed, ${activitiesSkipped} skipped`);
  } catch (error) {
    console.error('Google Fit sync error:', error);
    if (syncLogId) {
      await db.update(sync_logs).set({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date()
      }).where(eq(sync_logs.id, syncLogId));
    }
    throw error;
  }
}

async function syncWhoopData(options: SyncOptions): Promise<void> {
  const { userId, access_token, syncLogId } = options;
  
  try {
    console.log(`Starting WHOOP sync for user ${userId}`);
    
    // Fetch workouts from WHOOP API
    const response = await axios.get(
      'https://api.prod.whoop.com/developer/v1/activity/workout',
      {
        headers: { Authorization: `Bearer ${access_token}` },
        params: { limit: 30 }
      }
    );

    const workouts = response.data?.records || [];
    let activitiesProcessed = 0;
    let activitiesSkipped = 0;

    for (const workout of workouts) {
      // Check if activity already exists
      const existingActivity = await db.select().from(activities).where(
        and(
          eq(activities.user_id, userId),
          eq(activities.external_id, workout.id.toString()),
          eq(activities.source_platform, 'whoop')
        )
      ).limit(1);

      if (existingActivity.length > 0) {
        activitiesSkipped++;
        continue;
      }

      const activityData = {
        user_id: userId,
        external_id: workout.id.toString(),
        activity_type: workout.sport_id?.toString() || 'workout',
        source_platform: 'whoop',
        activity_date: new Date(workout.start),
        start_time: new Date(workout.start),
        end_time: new Date(workout.end),
        duration: Math.round((new Date(workout.end).getTime() - new Date(workout.start).getTime()) / 1000),
        distance: 0,
        calories: workout.score?.kilojoule || 0,
        raw_data: workout
      };

      await db.insert(activities).values([activityData]);
      activitiesProcessed++;
    }

    // Update sync log
    if (syncLogId) {
      await db.update(sync_logs).set({
        status: 'completed',
        activities_synced: activitiesProcessed,
        activities_skipped: activitiesSkipped,
        completed_at: new Date()
      }).where(eq(sync_logs.id, syncLogId));
    }

    console.log(`WHOOP sync completed: ${activitiesProcessed} activities processed, ${activitiesSkipped} skipped`);
  } catch (error) {
    console.error('WHOOP sync error:', error);
    if (syncLogId) {
      await db.update(sync_logs).set({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date()
      }).where(eq(sync_logs.id, syncLogId));
    }
    throw error;
  }
}

async function syncAppleHealthData(options: SyncOptions): Promise<void> {
  // Apple Health requires native iOS integration, not REST API
  // This would be handled through HealthKit on the client side
  const { userId, syncLogId } = options;
  
  try {
    console.log(`Apple Health sync not implemented for user ${userId} - requires native iOS integration`);
    
    if (syncLogId) {
      await db.update(sync_logs).set({
        status: 'completed',
        activities_synced: 0,
        activities_skipped: 0,
        completed_at: new Date(),
        error: 'Apple Health requires native iOS integration'
      }).where(eq(sync_logs.id, syncLogId));
    }
  } catch (error) {
    console.error('Apple Health sync error:', error);
    if (syncLogId) {
      await db.update(sync_logs).set({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date()
      }).where(eq(sync_logs.id, syncLogId));
    }
    throw error;
  }
}

async function syncFitbitData(options: SyncOptions): Promise<void> {
  const { userId, access_token, syncLogId } = options;
  
  try {
    console.log(`Starting Fitbit sync for user ${userId}`);
    
    // Fetch recent activities
    const response = await axios.get(
      'https://api.fitbit.com/1/user/-/activities/list.json',
      {
        headers: { Authorization: `Bearer ${access_token}` },
        params: { limit: 30, sort: 'desc' }
      }
    );

    const activities = response.data?.activities || [];
    let activitiesProcessed = 0;
    let activitiesSkipped = 0;

    for (const activity of activities) {
      // Check if activity already exists
      const existingActivity = await db.select().from(activities).where(
        and(
          eq(activities.user_id, userId),
          eq(activities.external_id, activity.logId.toString()),
          eq(activities.source_platform, 'fitbit')
        )
      ).limit(1);

      if (existingActivity.length > 0) {
        activitiesSkipped++;
        continue;
      }

      const activityData = {
        user_id: userId,
        external_id: activity.logId.toString(),
        activity_type: activity.activityName?.toLowerCase() || 'exercise',
        source_platform: 'fitbit',
        activity_date: new Date(activity.startDate),
        start_time: new Date(`${activity.startDate}T${activity.startTime}`),
        end_time: new Date(new Date(`${activity.startDate}T${activity.startTime}`).getTime() + activity.duration),
        duration: Math.round(activity.duration / 1000),
        distance: activity.distance || 0,
        calories: activity.calories || 0,
        raw_data: activity
      };

      await db.insert(activities).values([activityData]);
      activitiesProcessed++;
    }

    // Update sync log
    if (syncLogId) {
      await db.update(sync_logs).set({
        status: 'completed',
        activities_synced: activitiesProcessed,
        activities_skipped: activitiesSkipped,
        completed_at: new Date()
      }).where(eq(sync_logs.id, syncLogId));
    }

    console.log(`Fitbit sync completed: ${activitiesProcessed} activities processed, ${activitiesSkipped} skipped`);
  } catch (error) {
    console.error('Fitbit sync error:', error);
    if (syncLogId) {
      await db.update(sync_logs).set({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date()
      }).where(eq(sync_logs.id, syncLogId));
    }
    throw error;
  }
}

async function syncPolarData(options: SyncOptions): Promise<void> {
  const { userId, access_token, syncLogId } = options;
  
  try {
    console.log(`Starting Polar sync for user ${userId}`);
    
    // Fetch recent exercises from Polar API
    const response = await axios.get(
      'https://www.polaraccesslink.com/v3/exercises',
      {
        headers: { 
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/json'
        }
      }
    );

    const exercises = response.data || [];
    let activitiesProcessed = 0;
    let activitiesSkipped = 0;

    for (const exercise of exercises) {
      // Check if activity already exists
      const existingActivity = await db.select().from(activities).where(
        and(
          eq(activities.user_id, userId),
          eq(activities.external_id, exercise.id.toString()),
          eq(activities.source_platform, 'polar')
        )
      ).limit(1);

      if (existingActivity.length > 0) {
        activitiesSkipped++;
        continue;
      }

      const activityData = {
        user_id: userId,
        external_id: exercise.id.toString(),
        activity_type: mapPolarActivityType(exercise.sport || 'other'),
        source_platform: 'polar',
        activity_date: new Date(exercise.start_time),
        start_time: new Date(exercise.start_time),
        end_time: new Date(exercise.start_time + exercise.duration * 1000),
        duration: exercise.duration || 0,
        distance: Math.round((exercise.distance || 0) / 1000 * 100) / 100,
        calories: exercise.calories || 0,
        average_heart_rate: exercise.heart_rate?.average || null,
        max_heart_rate: exercise.heart_rate?.maximum || null,
        raw_data: exercise
      };

      await db.insert(activities).values([activityData]);
      activitiesProcessed++;
    }

    // Update sync log
    if (syncLogId) {
      await db.update(sync_logs).set({
        status: 'completed',
        activities_synced: activitiesProcessed,
        activities_skipped: activitiesSkipped,
        completed_at: new Date()
      }).where(eq(sync_logs.id, syncLogId));
    }

    console.log(`Polar sync completed: ${activitiesProcessed} activities processed, ${activitiesSkipped} skipped`);
  } catch (error) {
    console.error('Polar sync error:', error);
    if (syncLogId) {
      await db.update(sync_logs).set({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date()
      }).where(eq(sync_logs.id, syncLogId));
    }
    throw error;
  }
}

// Activity type mapping functions
function mapStravaActivityType(stravaType: string): string {
  const typeMap: { [key: string]: string } = {
    'Run': 'running',
    'Ride': 'cycling',
    'Swim': 'swimming',
    'Walk': 'walking',
    'Hike': 'hiking',
    'Workout': 'strength',
    'WeightTraining': 'strength',
    'Yoga': 'yoga',
    'CrossTrain': 'cross_training'
  };
  return typeMap[stravaType] || 'other';
}

function mapPolarActivityType(polarType: string): string {
  const typeMap: { [key: string]: string } = {
    'RUNNING': 'running',
    'CYCLING': 'cycling',
    'SWIMMING': 'swimming',
    'WALKING': 'walking',
    'HIKING': 'hiking',
    'FITNESS': 'strength',
    'YOGA': 'yoga',
    'OTHER': 'other'
  };
  return typeMap[polarType.toUpperCase()] || 'other';
}

function mapGarminActivityType(garminType: string): string {
  const typeMap: { [key: string]: string } = {
    'running': 'running',
    'cycling': 'cycling',
    'swimming': 'swimming',
    'walking': 'walking',
    'hiking': 'hiking',
    'strength_training': 'strength',
    'yoga': 'yoga',
    'cardio': 'cardio'
  };
  return typeMap[garminType] || 'other';
}

// Stripe subscription types
interface ExpandedInvoice extends Omit<Stripe.Invoice, 'payment_intent'> {
  payment_intent?: Stripe.PaymentIntent | string | null;
}

interface ExpandedSubscription extends Omit<Stripe.Subscription, 'latest_invoice'> {
  latest_invoice?: ExpandedInvoice | string | null;
}

// Middleware functions
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function setupIntegrationRoutes(app: Express) {
  // Sync endpoint for manual data synchronization
  app.post("/api/sync/:platform", requireAuth, async (req, res) => {
    try {
      const { platform } = req.params;
      const userId = req.user!.id;

      // Get the integration connection
      const connection = await db.select().from(integration_connections)
        .where(and(
          eq(integration_connections.user_id, userId),
          eq(integration_connections.platform, platform),
          eq(integration_connections.is_active, true)
        ))
        .limit(1);

      if (connection.length === 0) {
        return res.status(404).json({ error: "Integration not found or inactive" });
      }

      const conn = connection[0];

      // Create sync log entry
      const [syncLog] = await db.insert(sync_logs).values({
        user_id: userId,
        platform: platform,
        status: 'running',
        started_at: new Date()
      }).returning();

      // Prepare sync options
      const syncOptions: SyncOptions = {
        userId,
        access_token: conn.access_token,
        refresh_token: conn.refresh_token || undefined,
        expires_at: conn.expires_at ? new Date(conn.expires_at).getTime() : undefined,
        forceSync: req.body.forceSync || false,
        syncLogId: syncLog.id
      };

      // Execute platform-specific sync
      switch (platform) {
        case 'strava':
          await processStravaSync(conn, userId);
          break;
        case 'garmin':
          await processGarminSync(conn, userId);
          break;
        case 'polar':
          await processPolarSync(conn, userId);
          break;
        case 'google_fit':
          await processGoogleFitSync(conn, userId);
          break;
        case 'whoop':
          await processWhoopSync(conn, userId);
          break;
        case 'apple_health':
          await processAppleHealthSync(conn, userId);
          break;
        case 'fitbit':
          await processFitbitSync(conn, userId);
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      res.json({ message: "Sync completed successfully", syncLogId: syncLog.id });
    } catch (error) {
      console.error(`Sync error for platform ${req.params.platform}:`, error);
      res.status(500).json({ error: "Sync failed", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
}

// Individual sync processors
async function processStravaSync(connection: any, userId: number) {
  await syncStravaData({
    userId,
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    expires_at: connection.expires_at
  });
}

async function processGarminSync(connection: any, userId: number) {
  await syncGarminData({
    userId,
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    expires_at: connection.expires_at
  });
}

async function processPolarSync(connection: any, userId: number) {
  await syncPolarData({
    userId,
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    expires_at: connection.expires_at
  });
}

async function processGoogleFitSync(connection: any, userId: number) {
  await syncGoogleFitData({
    userId,
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    expires_at: connection.expires_at
  });
}

async function processWhoopSync(connection: any, userId: number) {
  await syncWhoopData({
    userId,
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    expires_at: connection.expires_at
  });
}

async function processAppleHealthSync(connection: any, userId: number) {
  await syncAppleHealthData({
    userId,
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    expires_at: connection.expires_at
  });
}

async function processFitbitSync(connection: any, userId: number) {
  await syncFitbitData({
    userId,
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    expires_at: connection.expires_at
  });
}

// Auth middleware
function checkAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  next();
}

function isSubscribed(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const user = req.user;
  if (user?.subscription_status !== 'active') {
    return res.status(403).json({ error: "Active subscription required" });
  }
  
  next();
}

function hasAnnualSubscription(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const user = req.user;
  if (user?.subscription_status !== 'active' || !user?.stripe_subscription_id?.includes('annual')) {
    return res.status(403).json({ error: "Annual subscription required" });
  }
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  setupDevSubscription(app);
  setupIntegrationRoutes(app);

  // User profile routes
  app.get("/api/profile", checkAuth, async (req, res) => {
    try {
      const user = req.user;
      const profile = {
        id: user?.id,
        username: user?.username,
        email: user?.email,
        age: user?.age,
        weight: user?.weight,
        height: user?.height,
        experience_level: user?.experience_level,
        bio: user?.bio,
        profile_image: user?.profile_image,
        subscription_status: user?.subscription_status,
        subscription_end_date: user?.subscription_end_date,
        is_admin: user?.is_admin,
        role: user?.role
      };
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", checkAuth, async (req, res) => {
    try {
      const { age, weight, height, experience_level, bio } = req.body;
      const userId = req.user!.id;

      await db.update(users).set({
        age,
        weight: weight ? weight.toString() : null,
        height: height ? height.toString() : null,
        experience_level,
        bio,
        updated_at: new Date()
      }).where(eq(users.id, userId));

      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Activities routes
  app.get("/api/activities", checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20, type, dateFrom, dateTo } = req.query;
      
      const offset = (Number(page) - 1) * Number(limit);
      
      let whereConditions = [eq(activities.user_id, userId)];
      
      if (type && type !== 'all') {
        whereConditions.push(eq(activities.activity_type, type as string));
      }
      
      if (dateFrom) {
        whereConditions.push(gte(activities.activity_date, new Date(dateFrom as string)));
      }
      
      if (dateTo) {
        whereConditions.push(lte(activities.activity_date, new Date(dateTo as string)));
      }

      const userActivities = await db.select({
        id: activities.id,
        activity_type: activities.activity_type,
        activity_date: activities.activity_date,
        duration: activities.duration,
        distance: activities.distance,
        calories: activities.calories,
        notes: activities.notes,
        average_heart_rate: activities.average_heart_rate,
        source: activities.source,
      }).from(activities)
        .where(and(...whereConditions))
        .orderBy(desc(activities.activity_date))
        .limit(Number(limit))
        .offset(offset);

      // Get total count for pagination
      const [{ count: totalCount }] = await db.select({ count: count() })
        .from(activities)
        .where(and(...whereConditions));

      const formatChartDate = (date: Date): string => {
        return date.toISOString().split('T')[0];
      };

      const formattedActivities = userActivities.map(activity => ({
        ...activity,
        activity_date: formatChartDate(activity.activity_date),
        duration: Number(activity.duration),
        distance: Number(activity.distance),
        calories: Number(activity.calories)
      }));

      res.json({
        activities: formattedActivities,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / Number(limit))
        }
      });
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", checkAuth, async (req, res) => {
    try {
      const { activity_type, activity_date, duration, distance, calories, notes, average_heart_rate } = req.body;
      const userId = req.user!.id;

      const [newActivity] = await db.insert(activities).values({
        user_id: userId,
        activity_type,
        activity_date: new Date(activity_date),
        duration,
        distance,
        calories,
        notes,
        average_heart_rate,
        source: 'manual'
      }).returning();

      res.status(201).json(newActivity);
    } catch (error) {
      console.error("Error creating activity:", error);
      res.status(500).json({ error: "Failed to create activity" });
    }
  });

  app.get("/api/activities/:id", checkAuth, async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const userId = req.user!.id;

      const [activity] = await db.select().from(activities)
        .where(and(eq(activities.id, activityId), eq(activities.user_id, userId)))
        .limit(1);

      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      res.json(activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  app.put("/api/activities/:id", checkAuth, async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { activity_type, activity_date, duration, distance, calories, notes, average_heart_rate } = req.body;

      const [updatedActivity] = await db.update(activities).set({
        activity_type,
        activity_date: new Date(activity_date),
        duration,
        distance,
        calories,
        notes,
        average_heart_rate,
        updated_at: new Date()
      }).where(and(eq(activities.id, activityId), eq(activities.user_id, userId)))
        .returning();

      if (!updatedActivity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      res.json(updatedActivity);
    } catch (error) {
      console.error("Error updating activity:", error);
      res.status(500).json({ error: "Failed to update activity" });
    }
  });

  app.delete("/api/activities/:id", checkAuth, async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const userId = req.user!.id;

      const [deletedActivity] = await db.delete(activities)
        .where(and(eq(activities.id, activityId), eq(activities.user_id, userId)))
        .returning();

      if (!deletedActivity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      res.json({ message: "Activity deleted successfully" });
    } catch (error) {
      console.error("Error deleting activity:", error);
      res.status(500).json({ error: "Failed to delete activity" });
    }
  });

  // Health metrics routes
  app.get("/api/health-metrics", checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { days = 30 } = req.query;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      const metrics = await db.select().from(health_metrics)
        .where(and(
          eq(health_metrics.user_id, userId),
          gte(health_metrics.recorded_at, startDate)
        ))
        .orderBy(desc(health_metrics.recorded_at));

      res.json(metrics);
    } catch (error) {
      console.error("Error fetching health metrics:", error);
      res.status(500).json({ error: "Failed to fetch health metrics" });
    }
  });

  app.post("/api/health-metrics", checkAuth, async (req, res) => {
    try {
      const { weight, body_fat_percentage, muscle_mass, resting_heart_rate, blood_pressure_systolic, blood_pressure_diastolic, sleep_hours } = req.body;
      const userId = req.user!.id;

      const [newMetric] = await db.insert(health_metrics).values({
        user_id: userId,
        weight,
        body_fat_percentage,
        muscle_mass,
        resting_heart_rate,
        blood_pressure_systolic,
        blood_pressure_diastolic,
        sleep_hours,
        recorded_at: new Date()
      }).returning();

      res.status(201).json(newMetric);
    } catch (error) {
      console.error("Error creating health metric:", error);
      res.status(500).json({ error: "Failed to create health metric" });
    }
  });

  // Goals routes
  app.get("/api/goals", checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      const userGoals = await db.select().from(goals)
        .where(eq(goals.user_id, userId))
        .orderBy(desc(goals.created_at));

      res.json(userGoals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", checkAuth, async (req, res) => {
    try {
      const { title, description, target_value, target_date, goal_type } = req.body;
      const userId = req.user!.id;

      const [newGoal] = await db.insert(goals).values({
        user_id: userId,
        title,
        description,
        target_value,
        target_date: new Date(target_date),
        goal_type,
        status: 'active'
      }).returning();

      res.status(201).json(newGoal);
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.put("/api/goals/:id", checkAuth, async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { title, description, target_value, target_date, current_value, status } = req.body;

      const [updatedGoal] = await db.update(goals).set({
        title,
        description,
        target_value,
        target_date: target_date ? new Date(target_date) : undefined,
        current_value,
        status,
        updated_at: new Date()
      }).where(and(eq(goals.id, goalId), eq(goals.user_id, userId)))
        .returning();

      if (!updatedGoal) {
        return res.status(404).json({ error: "Goal not found" });
      }

      res.json(updatedGoal);
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", checkAuth, async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const userId = req.user!.id;

      const [deletedGoal] = await db.delete(goals)
        .where(and(eq(goals.id, goalId), eq(goals.user_id, userId)))
        .returning();

      if (!deletedGoal) {
        return res.status(404).json({ error: "Goal not found" });
      }

      res.json({ message: "Goal deleted successfully" });
    } catch (error) {
      console.error("Error deleting goal:", error);
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/dashboard", checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { days = 30 } = req.query;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      // Total activities
      const [{ totalActivities }] = await db.select({ totalActivities: count() })
        .from(activities)
        .where(and(
          eq(activities.user_id, userId),
          gte(activities.activity_date, startDate)
        ));

      // Total distance
      const [{ totalDistance }] = await db.select({ totalDistance: sum(activities.distance) })
        .from(activities)
        .where(and(
          eq(activities.user_id, userId),
          gte(activities.activity_date, startDate)
        ));

      // Total duration
      const [{ totalDuration }] = await db.select({ totalDuration: sum(activities.duration) })
        .from(activities)
        .where(and(
          eq(activities.user_id, userId),
          gte(activities.activity_date, startDate)
        ));

      // Total calories
      const [{ totalCalories }] = await db.select({ totalCalories: sum(activities.calories) })
        .from(activities)
        .where(and(
          eq(activities.user_id, userId),
          gte(activities.activity_date, startDate)
        ));

      // Activity breakdown by type
      const activityBreakdown = await db.select({
        activity_type: activities.activity_type,
        count: count(),
        totalDistance: sum(activities.distance),
        totalDuration: sum(activities.duration)
      }).from(activities)
        .where(and(
          eq(activities.user_id, userId),
          gte(activities.activity_date, startDate)
        ))
        .groupBy(activities.activity_type);

      // Recent activities for trend
      const recentActivities = await db.select({
        activity_date: activities.activity_date,
        distance: activities.distance,
        duration: activities.duration,
        calories: activities.calories
      }).from(activities)
        .where(and(
          eq(activities.user_id, userId),
          gte(activities.activity_date, startDate)
        ))
        .orderBy(activities.activity_date);

      res.json({
        summary: {
          totalActivities: Number(totalActivities),
          totalDistance: Number(totalDistance) || 0,
          totalDuration: Number(totalDuration) || 0,
          totalCalories: Number(totalCalories) || 0
        },
        activityBreakdown: activityBreakdown.map(item => ({
          ...item,
          count: Number(item.count),
          totalDistance: Number(item.totalDistance) || 0,
          totalDuration: Number(item.totalDuration) || 0
        })),
        trends: recentActivities.map(activity => ({
          date: activity.activity_date.toISOString().split('T')[0],
          distance: Number(activity.distance) || 0,
          duration: Number(activity.duration) || 0,
          calories: Number(activity.calories) || 0
        }))
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Achievements routes
  app.get("/api/achievements", checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      // Fetch user achievements with proper error handling
      const userAchievements = await db
        .select({
          id: user_achievements.id,
          user_id: user_achievements.user_id,
          achievement_id: user_achievements.achievement_id,
          earned_at: user_achievements.earned_at,
          times_earned: user_achievements.times_earned,
          achievement_name: achievements.name,
          achievement_description: achievements.description,
          achievement_icon: achievements.icon,
          achievement_type: achievements.type
        })
        .from(user_achievements)
        .leftJoin(achievements, eq(user_achievements.achievement_id, achievements.id))
        .where(eq(user_achievements.user_id, userId))
        .orderBy(desc(user_achievements.earned_at));

      res.json(userAchievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.post("/api/achievements/check", checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      // Check for new achievements based on user activities
      // This is a simplified version - in practice, you'd have more sophisticated logic
      
      // Example: Check for "First Run" achievement
      const hasRunning = await db.select().from(activities)
        .where(and(
          eq(activities.user_id, userId),
          eq(activities.activity_type, 'running')
        ))
        .limit(1);

      if (hasRunning.length > 0) {
        // Check if user already has this achievement
        const hasAchievement = await db.select().from(user_achievements)
          .innerJoin(achievements, eq(user_achievements.achievement_id, achievements.id))
          .where(and(
            eq(user_achievements.user_id, userId),
            eq(achievements.achievement_type, 'first_run')
          ))
          .limit(1);

        if (hasAchievement.length === 0) {
          // Award the achievement
          const [firstRunAchievement] = await db.select().from(achievements)
            .where(eq(achievements.achievement_type, 'first_run'))
            .limit(1);

          if (firstRunAchievement) {
            await db.insert(user_achievements).values({
              user_id: userId,
              achievement_id: firstRunAchievement.id,
              earned_at: new Date(),
              times_earned: 1
            });

            return res.json({
              newAchievements: [{
                name: firstRunAchievement.name,
                description: firstRunAchievement.description,
                icon: firstRunAchievement.icon,
                type: firstRunAchievement.type
              }]
            });
          }
        }
      }

      res.json({ newAchievements: [] });
    } catch (error) {
      console.error("Error checking achievements:", error);
      res.status(500).json({ error: "Failed to check achievements" });
    }
  });

  // Integration routes
  app.get("/api/integrations", checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      const connections = await db.select({
        id: integration_connections.id,
        platform: integration_connections.platform,
        is_active: integration_connections.is_active,
        last_sync_at: integration_connections.last_sync_at,
        created_at: integration_connections.created_at
      }).from(integration_connections)
        .where(eq(integration_connections.user_id, userId))
        .orderBy(integration_connections.platform);

      res.json(connections);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  app.delete("/api/integrations/:platform", checkAuth, async (req, res) => {
    try {
      const { platform } = req.params;
      const userId = req.user!.id;

      await db.delete(integration_connections)
        .where(and(
          eq(integration_connections.user_id, userId),
          eq(integration_connections.platform, platform)
        ));

      res.json({ message: "Integration disconnected successfully" });
    } catch (error) {
      console.error("Error disconnecting integration:", error);
      res.status(500).json({ error: "Failed to disconnect integration" });
    }
  });

  // Sync logs routes
  app.get("/api/sync-logs", checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { limit = 10 } = req.query;

      const logs = await db.select().from(sync_logs)
        .where(eq(sync_logs.user_id, userId))
        .orderBy(desc(sync_logs.started_at))
        .limit(Number(limit));

      res.json(logs);
    } catch (error) {
      console.error("Error fetching sync logs:", error);
      res.status(500).json({ error: "Failed to fetch sync logs" });
    }
  });

  // Nutrition routes
  app.get("/api/nutrition/preferences", checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      const [preferences] = await db.select().from(nutrition_preferences)
        .where(eq(nutrition_preferences.user_id, userId))
        .limit(1);

      if (!preferences) {
        // Return default preferences
        return res.json({
          dietary_restrictions: [],
          allergies: [],
          calorie_goal: 2000,
          protein_goal: 150,
          carb_goal: 250,
          fat_goal: 65
        });
      }

      res.json(preferences);
    } catch (error) {
      console.error("Error fetching nutrition preferences:", error);
      res.status(500).json({ error: "Failed to fetch nutrition preferences" });
    }
  });

  app.post("/api/nutrition/preferences", checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { dietary_restrictions, allergies, calorie_goal, protein_goal, carb_goal, fat_goal } = req.body;

      // Check if preferences already exist
      const [existing] = await db.select().from(nutrition_preferences)
        .where(eq(nutrition_preferences.user_id, userId))
        .limit(1);

      if (existing) {
        // Update existing preferences
        const [updated] = await db.update(nutrition_preferences).set({
          dietary_restrictions,
          allergies,
          calorie_goal,
          protein_goal,
          carb_goal,
          fat_goal,
          updated_at: new Date()
        }).where(eq(nutrition_preferences.user_id, userId))
          .returning();

        res.json(updated);
      } else {
        // Create new preferences
        const [newPreferences] = await db.insert(nutrition_preferences).values({
          user_id: userId,
          dietary_restrictions,
          allergies,
          calorie_goal,
          protein_goal,
          carb_goal,
          fat_goal
        }).returning();

        res.status(201).json(newPreferences);
      }
    } catch (error) {
      console.error("Error saving nutrition preferences:", error);
      res.status(500).json({ error: "Failed to save nutrition preferences" });
    }
  });

  // Meal plan generation
  app.post("/api/nutrition/generate-meal-plan", checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = req.user!;

      // Get user preferences
      const [preferences] = await db.select().from(nutrition_preferences)
        .where(eq(nutrition_preferences.user_id, userId))
        .limit(1);

      // Use simple meal plan generation
      const mealPlan = await generateSimpleMealPlan(userId);

      res.json(mealPlan);
    } catch (error) {
      console.error("Error generating meal plan:", error);
      res.status(500).json({ error: "Failed to generate meal plan" });
    }
  });

  // Coaches routes
  app.get("/api/coaches", checkAuth, async (req, res) => {
    try {
      const availableCoaches = await db.select().from(coaches)
        .where(eq(coaches.is_active, true))
        .orderBy(desc(coaches.rating));

      res.json(availableCoaches);
    } catch (error) {
      console.error("Error fetching coaches:", error);
      res.status(500).json({ error: "Failed to fetch coaches" });
    }
  });

  app.get("/api/coaches/:id", checkAuth, async (req, res) => {
    try {
      const coachId = parseInt(req.params.id);

      const [coach] = await db.select().from(coaches)
        .where(and(eq(coaches.id, coachId), eq(coaches.is_active, true)))
        .limit(1);

      if (!coach) {
        return res.status(404).json({ error: "Coach not found" });
      }

      res.json(coach);
    } catch (error) {
      console.error("Error fetching coach:", error);
      res.status(500).json({ error: "Failed to fetch coach" });
    }
  });

  // User coach assignment
  app.post("/api/assign-coach", checkAuth, async (req, res) => {
    try {
      const { coach_id } = req.body;
      const userId = req.user!.id;

      // Check if user already has an active coach assignment
      const existingAssignment = await db.select().from(user_coach_assignments)
        .where(and(
          eq(user_coach_assignments.user_id, userId),
          eq(user_coach_assignments.is_active, true)
        ))
        .limit(1);

      if (existingAssignment.length > 0) {
        // Deactivate existing assignment
        await db.update(user_coach_assignments).set({
          is_active: false,
          updated_at: new Date()
        }).where(eq(user_coach_assignments.id, existingAssignment[0].id));
      }

      // Create new assignment
      const [newAssignment] = await db.insert(user_coach_assignments).values({
        user_id: userId,
        coach_id,
        assigned_at: new Date(),
        is_active: true
      }).returning();

      res.status(201).json(newAssignment);
    } catch (error) {
      console.error("Error assigning coach:", error);
      res.status(500).json({ error: "Failed to assign coach" });
    }
  });

  app.get("/api/my-coach", checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      const assignment = await db.select({
        assignment_id: user_coach_assignments.id,
        assigned_at: user_coach_assignments.assigned_at,
        coach_id: coaches.id,
        coach_name: coaches.name,
        coach_email: coaches.email,
        coach_specialties: coaches.specialties,
        coach_experience: coaches.experience_years,
        coach_bio: coaches.bio,
        coach_rating: coaches.rating
      }).from(user_coach_assignments)
        .innerJoin(coaches, eq(user_coach_assignments.coach_id, coaches.id))
        .where(and(
          eq(user_coach_assignments.user_id, userId),
          eq(user_coach_assignments.is_active, true)
        ))
        .limit(1);

      if (assignment.length === 0) {
        return res.status(404).json({ error: "No active coach assignment found" });
      }

      res.json(assignment[0]);
    } catch (error) {
      console.error("Error fetching coach assignment:", error);
      res.status(500).json({ error: "Failed to fetch coach assignment" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", checkAuth, async (req, res) => {
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Subscription management
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await db.select().from(subscription_plans)
        .where(eq(subscription_plans.is_active, true))
        .orderBy(subscription_plans.price);

      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });

  app.post('/api/get-or-create-subscription', checkAuth, async (req, res) => {
    const user = req.user!;

    if (user.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id) as ExpandedSubscription;

        res.send({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as ExpandedInvoice)?.payment_intent?.client_secret,
        });
        return;
      } catch (error) {
        console.error("Error retrieving existing subscription:", error);
      }
    }
    
    if (!user.email) {
      return res.status(400).json({ error: 'No user email on file' });
    }

    try {
      let customerId = user.stripe_customer_id;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
        });
        customerId = customer.id;

        // Update user with Stripe customer ID
        await db.update(users).set({
          stripe_customer_id: customerId
        }).where(eq(users.id, user.id));
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: process.env.STRIPE_PRICE_ID || 'price_default',
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      }) as ExpandedSubscription;

      // Update user with subscription ID
      await db.update(users).set({
        stripe_subscription_id: subscription.id,
        subscription_status: 'active'
      }).where(eq(users.id, user.id));
  
      res.send({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as ExpandedInvoice)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { page = 1, limit = 20, search = '' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let whereConditions = [];
      if (search) {
        whereConditions.push(
          or(
            sql`${users.username} ILIKE ${`%${search}%`}`,
            sql`${users.email} ILIKE ${`%${search}%`}`
          )
        );
      }

      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        created_at: users.created_at,
        subscription_status: users.subscription_status,
        is_admin: users.is_admin,
        role: users.role
      }).from(users)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(users.created_at))
        .limit(Number(limit))
        .offset(offset);

      const [{ count: totalCount }] = await db.select({ count: count() })
        .from(users)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

      res.json({
        users: allUsers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / Number(limit))
        }
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.put("/api/admin/users/:id/role", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role, is_admin } = req.body;

      // Prevent admin from removing their own admin status
      if (userId === req.user!.id && !is_admin) {
        return res.status(400).json({ error: "Cannot remove admin status from yourself" });
      }

      const [updatedUser] = await db.update(users).set({
        role,
        is_admin,
        updated_at: new Date()
      }).where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Get all coaches (admin only)
  app.get("/api/admin/coaches", requireAdmin, async (req, res) => {
    try {
      const allCoaches = await db.select().from(coaches);
      res.json(allCoaches);
    } catch (error) {
      console.error("Error fetching coaches:", error);
      res.status(500).json({ error: "Failed to fetch coaches" });
    }
  });

  // Create new coach (admin only)
  app.post("/api/admin/coaches", requireAdmin, async (req, res) => {
    try {
      const { name, email, specialties, experience_years, bio, rating } = req.body;

      const [newCoach] = await db.insert(coaches).values({
        name,
        email,
        specialties,
        experience_years,
        bio,
        rating: rating || 5.0,
        is_active: true,
        user_count: 0
      }).returning();

      res.status(201).json(newCoach);
    } catch (error) {
      console.error("Error creating coach:", error);
      res.status(500).json({ error: "Failed to create coach" });
    }
  });

  // Update coach (admin only)
  app.put("/api/admin/coaches/:id", requireAdmin, async (req, res) => {
    try {
      const coachId = parseInt(req.params.id);
      const { name, email, specialties, experience_years, bio, rating, is_active } = req.body;

      const [updatedCoach] = await db.update(coaches).set({
        name,
        email,
        specialties,
        experience_years,
        bio,
        rating,
        is_active,
        updated_at: new Date()
      }).where(eq(coaches.id, coachId))
        .returning();

      if (!updatedCoach) {
        return res.status(404).json({ error: "Coach not found" });
      }

      res.json(updatedCoach);
    } catch (error) {
      console.error("Error updating coach:", error);
      res.status(500).json({ error: "Failed to update coach" });
    }
  });

  // Delete coach (admin only)
  app.delete("/api/admin/coaches/:id", requireAdmin, async (req, res) => {
    try {
      const coachId = parseInt(req.params.id);

      // Check if coach has active assignments
      const activeAssignments = await db.select().from(user_coach_assignments)
        .where(and(
          eq(user_coach_assignments.coach_id, coachId),
          eq(user_coach_assignments.is_active, true)
        ));

      if (activeAssignments.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete coach with active assignments. Please reassign users first." 
        });
      }

      const [deletedCoach] = await db.delete(coaches)
        .where(eq(coaches.id, coachId))
        .returning();

      if (!deletedCoach) {
        return res.status(404).json({ error: "Coach not found" });
      }

      res.json({ message: "Coach deleted successfully" });
    } catch (error) {
      console.error("Error deleting coach:", error);
      res.status(500).json({ error: "Failed to delete coach" });
    }
  });

  // Save onboarding draft
  app.post("/api/onboarding/drafts/:stepName", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { stepName } = req.params;
      const draftData = req.body;

      const draft = await storage.saveOnboardingDraft(userId, stepName, draftData);
      res.json(draft);
    } catch (error) {
      console.error("Error saving onboarding draft:", error);
      res.status(500).json({ error: "Failed to save draft" });
    }
  });

  // Get onboarding draft
  app.get("/api/onboarding/drafts/:stepName", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { stepName } = req.params;

      const draft = await storage.getOnboardingDraft(userId, stepName);
      if (!draft) {
        return res.status(404).json({ error: "Draft not found" });
      }

      res.json(draft.draft_data);
    } catch (error) {
      console.error("Error fetching onboarding draft:", error);
      res.status(500).json({ error: "Failed to fetch draft" });
    }
  });

  // Get all onboarding drafts
  app.get("/api/onboarding/drafts", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      const drafts = await storage.getAllOnboardingDrafts(userId);
      const draftsByStep = drafts.reduce((acc, draft) => {
        acc[draft.step_name] = draft.draft_data;
        return acc;
      }, {} as Record<string, any>);

      res.json(draftsByStep);
    } catch (error) {
      console.error("Error fetching onboarding drafts:", error);
      res.status(500).json({ error: "Failed to fetch drafts" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}