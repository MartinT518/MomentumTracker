import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { and, eq, desc, asc, gte, lte, or, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  goals,
  activities,
  workouts,
  health_metrics,
  training_plans,
  nutrition_logs,
  food_items,
  meal_plans,
  meals,
  meal_food_items,
  nutrition_preferences,
  integration_connections,
  sync_logs,
  coaches,
  coaching_sessions,
  subscription_plans,
  onboarding_status,
  fitness_goals,
  experience_levels,
  training_preferences,
} from "@shared/schema";

// Functions for synchronizing data from third-party platforms
interface SyncOptions {
  userId: number;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  forceSync?: boolean;
  syncLogId?: number;
}

// Sync activities from Strava
async function syncStravaData(options: SyncOptions): Promise<void> {
  const { userId, access_token, refresh_token, expires_at, forceSync = false, syncLogId } = options;
  let token = access_token;
  let syncLogEntry = syncLogId;
  
  try {
    // If no sync log ID was provided, create one
    if (!syncLogEntry) {
      const [syncLog] = await db.insert(sync_logs)
        .values({
          user_id: userId,
          platform: 'strava',
          sync_start_time: new Date(),
          status: 'in_progress'
        })
        .returning();
      
      syncLogEntry = syncLog.id;
    }
    
    // Check if token needs refreshing
    if (expires_at && expires_at < Math.floor(Date.now() / 1000)) {
      console.log('Refreshing Strava token...');
      
      // Token has expired, refresh it
      const refreshResponse = await axios.post('https://www.strava.com/oauth/token', {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token,
        grant_type: 'refresh_token'
      });
      
      // Update token info
      token = refreshResponse.data.access_token;
      const newRefreshToken = refreshResponse.data.refresh_token;
      const newExpiresAt = refreshResponse.data.expires_at;
      
      // Update stored token
      await db.update(integration_connections)
        .set({
          access_token: token,
          refresh_token: newRefreshToken,
          token_expires_at: new Date(newExpiresAt * 1000),
          updated_at: new Date()
        })
        .where(and(
          eq(integration_connections.user_id, userId),
          eq(integration_connections.platform, 'strava')
        ));
    }
    
    // Determine since when to fetch activities
    let sinceDate: Date | undefined;
    
    if (!forceSync) {
      // Get the last sync time
      const [connection] = await db.select()
        .from(integration_connections)
        .where(and(
          eq(integration_connections.user_id, userId),
          eq(integration_connections.platform, 'strava')
        ));
      
      sinceDate = connection.last_sync_at;
    }
    
    // Fetch activities from Strava
    const sinceTimestamp = sinceDate ? Math.floor(sinceDate.getTime() / 1000) : undefined;
    const activitiesUrl = `https://www.strava.com/api/v3/athlete/activities?per_page=100${sinceTimestamp ? `&after=${sinceTimestamp}` : ''}`;
    
    const activitiesResponse = await axios.get(activitiesUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const stravaActivities = activitiesResponse.data;
    
    let activitiesCreated = 0;
    let activitiesUpdated = 0;
    let activitiesSkipped = 0;
    
    // Process each activity
    for (const stravaActivity of stravaActivities) {
      // Check if activity already exists
      const [existingActivity] = await db.select()
        .from(activities)
        .where(and(
          eq(activities.user_id, userId),
          eq(activities.external_id, stravaActivity.id.toString()),
          eq(activities.source_platform, 'strava')
        ));
      
      const activityData = {
        user_id: userId,
        external_id: stravaActivity.id.toString(),
        activity_type: mapStravaActivityType(stravaActivity.type),
        source_platform: 'strava',
        activity_date: new Date(stravaActivity.start_date),
        start_time: new Date(stravaActivity.start_date),
        end_time: stravaActivity.elapsed_time 
          ? new Date(new Date(stravaActivity.start_date).getTime() + stravaActivity.elapsed_time * 1000) 
          : undefined,
        duration: stravaActivity.elapsed_time,
        distance: stravaActivity.distance / 1000, // Convert meters to kilometers
        elevation_gain: stravaActivity.total_elevation_gain,
        average_heart_rate: stravaActivity.average_heartrate,
        max_heart_rate: stravaActivity.max_heartrate,
        calories: stravaActivity.calories,
        average_pace: stravaActivity.average_speed ? (1000 / stravaActivity.average_speed) : undefined, // Convert m/s to sec/km
        notes: stravaActivity.description || '',
        is_race: stravaActivity.workout_type === 1, // 1 = race in Strava
        is_manual_entry: false,
        created_at: new Date(),
        polyline: stravaActivity.map?.summary_polyline,
        raw_data: stravaActivity
      };
      
      if (existingActivity) {
        // Update existing activity
        await db.update(activities)
          .set(activityData)
          .where(eq(activities.id, existingActivity.id));
        
        activitiesUpdated++;
      } else {
        // Create new activity
        await db.insert(activities)
          .values(activityData);
        
        activitiesCreated++;
      }
    }
    
    // Update sync log status
    await db.update(sync_logs)
      .set({
        sync_end_time: new Date(),
        status: 'completed',
        activities_synced: stravaActivities.length,
        activities_created: activitiesCreated,
        activities_updated: activitiesUpdated,
        activities_skipped: activitiesSkipped
      })
      .where(eq(sync_logs.id, syncLogEntry));
    
    // Update last sync time
    await db.update(integration_connections)
      .set({
        last_sync_at: new Date(),
        updated_at: new Date()
      })
      .where(and(
        eq(integration_connections.user_id, userId),
        eq(integration_connections.platform, 'strava')
      ));
      
  } catch (error) {
    console.error('Error syncing Strava data:', error);
    
    // Update sync log with error
    if (syncLogEntry) {
      await db.update(sync_logs)
        .set({
          sync_end_time: new Date(),
          status: 'failed',
          error: error.message || 'Unknown error',
        })
        .where(eq(sync_logs.id, syncLogEntry));
    }
  }
}

// Sync activities from Garmin
async function syncGarminData(options: SyncOptions): Promise<void> {
  const { userId, access_token, forceSync = false, syncLogId } = options;
  let syncLogEntry = syncLogId;
  
  try {
    // If no sync log ID was provided, create one
    if (!syncLogEntry) {
      const [syncLog] = await db.insert(sync_logs)
        .values({
          user_id: userId,
          platform: 'garmin',
          sync_start_time: new Date(),
          status: 'in_progress'
        })
        .returning();
      
      syncLogEntry = syncLog.id;
    }
    
    // Determine since when to fetch activities
    let sinceDate: Date | undefined;
    
    if (!forceSync) {
      // Get the last sync time
      const [connection] = await db.select()
        .from(integration_connections)
        .where(and(
          eq(integration_connections.user_id, userId),
          eq(integration_connections.platform, 'garmin')
        ));
      
      sinceDate = connection.last_sync_at;
    }
    
    // Fetch activities from Garmin
    // Note: Garmin's API implementation is more complex and would require a 
    // separate OAuth library to handle the specifics of their authentication flow
    const sinceTimestamp = sinceDate ? sinceDate.toISOString() : undefined;
    const activitiesUrl = `https://apis.garmin.com/wellness-api/rest/activities?start=${sinceTimestamp || '0'}&limit=100`;
    
    const activitiesResponse = await axios.get(activitiesUrl, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const garminActivities = activitiesResponse.data.activities || [];
    
    let activitiesCreated = 0;
    let activitiesUpdated = 0;
    let activitiesSkipped = 0;
    
    // Process each activity (simplified for demonstration)
    for (const garminActivity of garminActivities) {
      // Check if activity already exists
      const [existingActivity] = await db.select()
        .from(activities)
        .where(and(
          eq(activities.user_id, userId),
          eq(activities.external_id, garminActivity.activityId.toString()),
          eq(activities.source_platform, 'garmin')
        ));
      
      const activityData = {
        user_id: userId,
        external_id: garminActivity.activityId.toString(),
        activity_type: mapGarminActivityType(garminActivity.activityType),
        source_platform: 'garmin',
        activity_date: new Date(garminActivity.startTimeInSeconds * 1000),
        start_time: new Date(garminActivity.startTimeInSeconds * 1000),
        end_time: new Date((garminActivity.startTimeInSeconds + garminActivity.durationInSeconds) * 1000),
        duration: garminActivity.durationInSeconds,
        distance: (garminActivity.distanceInMeters || 0) / 1000, // Convert meters to kilometers
        elevation_gain: garminActivity.elevationGainInMeters,
        average_heart_rate: garminActivity.averageHeartRateInBeatsPerMinute,
        max_heart_rate: garminActivity.maxHeartRateInBeatsPerMinute,
        calories: garminActivity.activeKilocalories,
        is_manual_entry: false,
        created_at: new Date(),
        raw_data: garminActivity
      };
      
      if (existingActivity) {
        // Update existing activity
        await db.update(activities)
          .set(activityData)
          .where(eq(activities.id, existingActivity.id));
        
        activitiesUpdated++;
      } else {
        // Create new activity
        await db.insert(activities)
          .values(activityData);
        
        activitiesCreated++;
      }
    }
    
    // Update sync log status
    await db.update(sync_logs)
      .set({
        sync_end_time: new Date(),
        status: 'completed',
        activities_synced: garminActivities.length,
        activities_created: activitiesCreated,
        activities_updated: activitiesUpdated,
        activities_skipped: activitiesSkipped
      })
      .where(eq(sync_logs.id, syncLogEntry));
    
    // Update last sync time
    await db.update(integration_connections)
      .set({
        last_sync_at: new Date(),
        updated_at: new Date()
      })
      .where(and(
        eq(integration_connections.user_id, userId),
        eq(integration_connections.platform, 'garmin')
      ));
      
  } catch (error) {
    console.error('Error syncing Garmin data:', error);
    
    // Update sync log with error
    if (syncLogEntry) {
      await db.update(sync_logs)
        .set({
          sync_end_time: new Date(),
          status: 'failed',
          error: error.message || 'Unknown error',
        })
        .where(eq(sync_logs.id, syncLogEntry));
    }
  }
}

// Sync activities from Polar
async function syncPolarData(options: SyncOptions): Promise<void> {
  const { userId, access_token, forceSync = false, syncLogId } = options;
  let syncLogEntry = syncLogId;
  
  try {
    // If no sync log ID was provided, create one
    if (!syncLogEntry) {
      const [syncLog] = await db.insert(sync_logs)
        .values({
          user_id: userId,
          platform: 'polar',
          sync_start_time: new Date(),
          status: 'in_progress'
        })
        .returning();
      
      syncLogEntry = syncLog.id;
    }
    
    // Determine since when to fetch activities
    let sinceDate: Date | undefined;
    
    if (!forceSync) {
      // Get the last sync time
      const [connection] = await db.select()
        .from(integration_connections)
        .where(and(
          eq(integration_connections.user_id, userId),
          eq(integration_connections.platform, 'polar')
        ));
      
      sinceDate = connection.last_sync_at;
    }
    
    // Fetch activities from Polar
    const sinceTimestamp = sinceDate ? sinceDate.toISOString() : undefined;
    const activitiesUrl = `https://www.polaraccesslink.com/v3/users/${userId}/exercise-transactions`;
    
    // Get transaction list
    const transactionResponse = await axios.post(activitiesUrl, {}, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const transactionUrl = transactionResponse.headers.location;
    
    // Get exercises from transaction
    const exercisesResponse = await axios.get(`${transactionUrl}/exercises`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const polarExercises = exercisesResponse.data.exercises || [];
    
    let activitiesCreated = 0;
    let activitiesUpdated = 0;
    let activitiesSkipped = 0;
    
    // Process each exercise
    for (const exerciseUrl of polarExercises) {
      // Get detailed exercise data
      const exerciseResponse = await axios.get(exerciseUrl, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      const exercise = exerciseResponse.data;
      
      // Check if activity already exists
      const [existingActivity] = await db.select()
        .from(activities)
        .where(and(
          eq(activities.user_id, userId),
          eq(activities.external_id, exercise.id),
          eq(activities.source_platform, 'polar')
        ));
      
      const startTime = new Date(exercise.start_time);
      const endTime = new Date(exercise.end_time);
      const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
      
      const activityData = {
        user_id: userId,
        external_id: exercise.id,
        activity_type: mapPolarActivityType(exercise.sport),
        source_platform: 'polar',
        activity_date: startTime,
        start_time: startTime,
        end_time: endTime,
        duration: durationSeconds,
        distance: (exercise.distance || 0) / 1000, // Convert meters to kilometers
        average_heart_rate: exercise.heart_rate?.average,
        max_heart_rate: exercise.heart_rate?.maximum,
        calories: exercise.calories,
        is_manual_entry: false,
        created_at: new Date(),
        raw_data: exercise
      };
      
      if (existingActivity) {
        // Update existing activity
        await db.update(activities)
          .set(activityData)
          .where(eq(activities.id, existingActivity.id));
        
        activitiesUpdated++;
      } else {
        // Create new activity
        await db.insert(activities)
          .values(activityData);
        
        activitiesCreated++;
      }
    }
    
    // Commit the transaction
    await axios.put(`${transactionUrl}`, {}, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    // Update sync log status
    await db.update(sync_logs)
      .set({
        sync_end_time: new Date(),
        status: 'completed',
        activities_synced: polarExercises.length,
        activities_created: activitiesCreated,
        activities_updated: activitiesUpdated,
        activities_skipped: activitiesSkipped
      })
      .where(eq(sync_logs.id, syncLogEntry));
    
    // Update last sync time
    await db.update(integration_connections)
      .set({
        last_sync_at: new Date(),
        updated_at: new Date()
      })
      .where(and(
        eq(integration_connections.user_id, userId),
        eq(integration_connections.platform, 'polar')
      ));
      
  } catch (error) {
    console.error('Error syncing Polar data:', error);
    
    // Update sync log with error
    if (syncLogEntry) {
      await db.update(sync_logs)
        .set({
          sync_end_time: new Date(),
          status: 'failed',
          error: error.message || 'Unknown error',
        })
        .where(eq(sync_logs.id, syncLogEntry));
    }
  }
}

// Helper functions to map activity types from external services to our system
function mapStravaActivityType(stravaType: string): string {
  const typeMap: Record<string, string> = {
    'Run': 'run',
    'Trail Run': 'run',
    'Treadmill': 'run',
    'Track Run': 'run',
    'Virtual Run': 'run',
    'Ride': 'bike',
    'VirtualRide': 'bike',
    'Swim': 'swim',
    'Walk': 'walk',
    'Hike': 'hike',
    'Weight Training': 'strength',
    'Workout': 'strength',
    'Yoga': 'yoga'
  };
  
  return typeMap[stravaType] || 'other';
}

function mapGarminActivityType(garminType: string): string {
  const typeMap: Record<string, string> = {
    'RUNNING': 'run',
    'INDOOR_RUNNING': 'run',
    'TREADMILL_RUNNING': 'run',
    'TRAIL_RUNNING': 'run',
    'CYCLING': 'bike',
    'INDOOR_CYCLING': 'bike',
    'SWIMMING': 'swim',
    'OPEN_WATER_SWIMMING': 'swim',
    'WALKING': 'walk',
    'HIKING': 'hike',
    'STRENGTH_TRAINING': 'strength',
    'YOGA': 'yoga'
  };
  
  return typeMap[garminType] || 'other';
}

function mapPolarActivityType(polarType: string): string {
  const typeMap: Record<string, string> = {
    'RUNNING': 'run',
    'JOGGING': 'run',
    'TREADMILL': 'run',
    'TRAIL_RUNNING': 'run',
    'CYCLING': 'bike',
    'INDOOR_CYCLING': 'bike',
    'SWIMMING': 'swim',
    'WALKING': 'walk',
    'HIKING': 'hike',
    'STRENGTH_TRAINING': 'strength',
    'CIRCUIT_TRAINING': 'strength',
    'YOGA': 'yoga'
  };
  
  return typeMap[polarType] || 'other';
}

// Set up Google AI model for nutrition recommendations
let googleAI: GoogleGenerativeAI | null = null;
let geminiModel: any = null;

try {
  if (process.env.GOOGLE_AI_API_KEY) {
    googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    geminiModel = googleAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    console.log("Google AI model initialized successfully");
  } else {
    console.warn("GOOGLE_AI_API_KEY not set. AI features will be disabled.");
  }
} catch (error) {
  console.error("Failed to initialize Google AI model:", error);
}
import { 
  insertGroupSchema, 
  insertGroupMemberSchema, 
  insertChallengeSchema,
  insertBuddySchema,
  insertNutritionLogSchema,
  insertCoachSchema,
  insertCoachingSessionSchema,
  insertSubscriptionPlanSchema,
  insertHealthMetricsSchema,
  insertIntegrationConnectionSchema,
  subscription_plans,
  users,
  health_metrics,
  integration_connections,
  nutrition_preferences,
  food_items,
  meal_plans,
  meals,
  meal_food_items,
  nutrition_logs
} from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import { db } from "./db";
import { eq, and, like, desc } from "drizzle-orm";
import { WebSocketServer } from "ws";
import ws from "ws";

// Extended types for expanded Stripe resources
interface ExpandedInvoice extends Omit<Stripe.Invoice, 'payment_intent'> {
  payment_intent?: Stripe.PaymentIntent | string | null;
}

interface ExpandedSubscription extends Omit<Stripe.Subscription, 'latest_invoice'> {
  latest_invoice?: ExpandedInvoice | string | null;
}

// Update geminiModel configuration for better results when used
if (geminiModel) {
  try {
    // Enhanced configurations for better nutrition plans
    console.log("Configuring geminiModel with nutrition-optimized settings");
  } catch (error) {
    console.error("Error configuring geminiModel:", error);
  }
}

// API routes for integration data syncing

// Authentication middleware for protected routes
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
}

// Integration sync routes
function setupIntegrationRoutes(app: Express) {
  // Initiate sync for a specific platform
  app.post("/api/integrations/:platform/sync", requireAuth, async (req, res) => {
    const { platform } = req.params;
    const userId = req.user!.id;
    const forceSync = req.body.forceSync === true;
    
    try {
      // Get integration connection
      const [connection] = await db.select()
        .from(integration_connections)
        .where(and(
          eq(integration_connections.user_id, userId),
          eq(integration_connections.platform, platform)
        ));
      
      if (!connection) {
        return res.status(404).json({ 
          error: `No ${platform} integration found. Please connect your account first.` 
        });
      }
      
      // Start sync process in the background
      let syncLogId;
      
      // Create a sync log entry
      const [syncLog] = await db.insert(sync_logs)
        .values({
          user_id: userId,
          platform,
          sync_start_time: new Date(),
          status: 'in_progress'
        })
        .returning();
      
      syncLogId = syncLog.id;
      
      // Initialize sync options
      const syncOptions: SyncOptions = {
        userId,
        access_token: connection.access_token,
        refresh_token: connection.refresh_token || undefined,
        expires_at: connection.token_expires_at ? Math.floor(connection.token_expires_at.getTime() / 1000) : undefined,
        forceSync,
        syncLogId
      };
      
      // Start sync process based on platform
      if (platform === 'strava') {
        // Sync happens asynchronously, we don't await the result
        syncStravaData(syncOptions).catch(error => {
          console.error(`Error during Strava sync for user ${userId}:`, error);
        });
      } else if (platform === 'garmin') {
        syncGarminData(syncOptions).catch(error => {
          console.error(`Error during Garmin sync for user ${userId}:`, error);
        });
      } else if (platform === 'polar') {
        syncPolarData(syncOptions).catch(error => {
          console.error(`Error during Polar sync for user ${userId}:`, error);
        });
      } else {
        await db.update(sync_logs)
          .set({
            sync_end_time: new Date(),
            status: 'failed',
            error: 'Unsupported platform'
          })
          .where(eq(sync_logs.id, syncLogId));
        
        return res.status(400).json({ error: "Unsupported platform" });
      }
      
      res.json({
        message: `Sync with ${platform} initiated successfully`,
        syncLogId
      });
    } catch (error) {
      console.error(`Error initiating ${platform} sync:`, error);
      res.status(500).json({ error: "Failed to initiate sync" });
    }
  });
  
  // Get sync status
  app.get("/api/integrations/:platform/sync/:syncLogId", requireAuth, async (req, res) => {
    const { platform, syncLogId } = req.params;
    const userId = req.user!.id;
    
    try {
      const [syncLog] = await db.select()
        .from(sync_logs)
        .where(and(
          eq(sync_logs.id, parseInt(syncLogId)),
          eq(sync_logs.user_id, userId),
          eq(sync_logs.platform, platform)
        ));
      
      if (!syncLog) {
        return res.status(404).json({ error: "Sync log not found" });
      }
      
      // Calculate progress percentage based on status
      let progress = 0;
      if (syncLog.status === 'completed') {
        progress = 100;
      } else if (syncLog.status === 'in_progress') {
        // Just a rough estimate for now
        progress = 50;
      }
      
      res.json({
        ...syncLog,
        progress
      });
    } catch (error) {
      console.error("Error getting sync status:", error);
      res.status(500).json({ error: "Failed to get sync status" });
    }
  });
  
  // Get recent sync logs
  app.get("/api/integrations/:platform/sync-history", requireAuth, async (req, res) => {
    const { platform } = req.params;
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 5;
    
    try {
      const syncLogs = await db.select()
        .from(sync_logs)
        .where(and(
          eq(sync_logs.user_id, userId),
          eq(sync_logs.platform, platform)
        ))
        .orderBy(desc(sync_logs.sync_start_time))
        .limit(limit);
      
      res.json(syncLogs);
    } catch (error) {
      console.error("Error getting sync history:", error);
      res.status(500).json({ error: "Failed to get sync history" });
    }
  });
  
  // Update sync settings
  app.put("/api/integrations/:platform/settings", requireAuth, async (req, res) => {
    const { platform } = req.params;
    const userId = req.user!.id;
    const { autoSync, syncFrequency } = req.body;
    
    try {
      const [connection] = await db.select()
        .from(integration_connections)
        .where(and(
          eq(integration_connections.user_id, userId),
          eq(integration_connections.platform, platform)
        ));
      
      if (!connection) {
        return res.status(404).json({ 
          error: `No ${platform} integration found. Please connect your account first.` 
        });
      }
      
      // Validate sync frequency
      if (syncFrequency && !['daily', 'realtime'].includes(syncFrequency)) {
        return res.status(400).json({ 
          error: "Invalid sync frequency. Allowed values: 'daily', 'realtime'" 
        });
      }
      
      // Update settings
      await db.update(integration_connections)
        .set({
          auto_sync: autoSync !== undefined ? autoSync : connection.auto_sync,
          sync_frequency: syncFrequency || connection.sync_frequency,
          updated_at: new Date()
        })
        .where(and(
          eq(integration_connections.user_id, userId),
          eq(integration_connections.platform, platform)
        ));
      
      res.json({ 
        message: `${platform} sync settings updated successfully`,
        autoSync: autoSync !== undefined ? autoSync : connection.auto_sync,
        syncFrequency: syncFrequency || connection.sync_frequency
      });
    } catch (error) {
      console.error("Error updating sync settings:", error);
      res.status(500).json({ error: "Failed to update sync settings" });
    }
  });
}

// Helper functions for integration data syncing

// Strava data sync function
async function processStravaSync(connection: any, userId: number) {
  console.log(`Syncing Strava data for user ${userId}`);
  
  // In a real implementation, you would:
  // 1. Use the Strava API to fetch recent activities
  // 2. Use the Strava API to fetch athlete stats for health metrics
  // 3. Store this data in your database
  
  // Mock implementation that simulates a successful sync
  try {
    // Simulate fetching recent activities (last 30 days)
    const activities = [
      {
        id: "strava_123456",
        user_id: userId,
        activity_date: new Date(Date.now() - 3 * 86400000), // 3 days ago
        activity_type: "run",
        distance: 8.2, // km
        duration: 2160, // seconds (36 minutes)
        pace: "7:30", // min/mile
        heart_rate: 156,
        effort_level: "moderate",
        notes: "Evening run with some hill repeats",
        source: "strava"
      },
      {
        id: "strava_123457",
        user_id: userId,
        activity_date: new Date(Date.now() - 5 * 86400000), // 5 days ago
        activity_type: "run",
        distance: 16.1, // km
        duration: 5400, // seconds (90 minutes)
        pace: "8:00", // min/mile
        heart_rate: 149,
        effort_level: "moderate",
        notes: "Long run, felt good",
        source: "strava"
      }
    ];
    
    // Simulate fetching health metrics from Strava
    const healthMetrics = [
      {
        user_id: userId,
        metric_date: new Date(Date.now() - 1 * 86400000), // Yesterday
        hrv_score: 65,
        resting_heart_rate: 51,
        sleep_quality: null,
        sleep_duration: null,
        energy_level: null,
        stress_level: null,
        source: "strava",
        notes: "Auto-imported from Strava"
      }
    ];
    
    // In a real implementation, store this data in the database
    // For now, just log and return success
    console.log(`Found ${activities.length} activities and ${healthMetrics.length} metrics from Strava`);
    
    return {
      activities: activities.length,
      metrics: healthMetrics.length
    };
  } catch (error) {
    console.error("Error syncing Strava data:", error);
    throw new Error(`Failed to sync Strava data: ${error.message}`);
  }
}

// Garmin data sync function
async function processGarminSync(connection: any, userId: number) {
  console.log(`Syncing Garmin data for user ${userId}`);
  
  // In a real implementation, you would:
  // 1. Use the Garmin Connect API to fetch recent activities
  // 2. Use the Garmin Connect API to fetch health metrics
  // 3. Store this data in your database
  
  // Mock implementation that simulates a successful sync
  try {
    // Simulate fetching recent activities (last 30 days)
    const activities = [
      {
        id: "garmin_234567",
        user_id: userId,
        activity_date: new Date(Date.now() - 2 * 86400000), // 2 days ago
        activity_type: "run",
        distance: 5.0, // km
        duration: 1500, // seconds (25 minutes)
        pace: "8:03", // min/mile
        heart_rate: 147,
        effort_level: "easy",
        notes: "Morning recovery run",
        source: "garmin"
      },
      {
        id: "garmin_234568",
        user_id: userId,
        activity_date: new Date(Date.now() - 7 * 86400000), // 7 days ago
        activity_type: "run",
        distance: 10.0, // km
        duration: 2700, // seconds (45 minutes)
        pace: "7:15", // min/mile
        heart_rate: 166,
        effort_level: "hard",
        notes: "Tempo run, pushing the pace",
        source: "garmin"
      }
    ];
    
    // Simulate fetching health metrics from Garmin (more comprehensive)
    const healthMetrics = [
      {
        user_id: userId,
        metric_date: new Date(Date.now() - 1 * 86400000), // Yesterday
        hrv_score: 68,
        resting_heart_rate: 49,
        sleep_quality: 8,
        sleep_duration: 480, // 8 hours in minutes
        energy_level: 9,
        stress_level: 3,
        source: "garmin",
        notes: "Auto-imported from Garmin Connect"
      },
      {
        user_id: userId,
        metric_date: new Date(Date.now() - 2 * 86400000), // 2 days ago
        hrv_score: 62,
        resting_heart_rate: 52,
        sleep_quality: 6,
        sleep_duration: 390, // 6.5 hours in minutes
        energy_level: 7,
        stress_level: 5,
        source: "garmin",
        notes: "Auto-imported from Garmin Connect"
      }
    ];
    
    // In a real implementation, store this data in the database
    // For now, just log and return success
    console.log(`Found ${activities.length} activities and ${healthMetrics.length} metrics from Garmin`);
    
    return {
      activities: activities.length,
      metrics: healthMetrics.length
    };
  } catch (error) {
    console.error("Error syncing Garmin data:", error);
    throw new Error(`Failed to sync Garmin data: ${error.message}`);
  }
}

// Polar data sync function
async function processPolarSync(connection: any, userId: number) {
  console.log(`Syncing Polar data for user ${userId}`);
  
  // In a real implementation, you would:
  // 1. Use the Polar Flow API to fetch recent activities
  // 2. Use the Polar Flow API to fetch health metrics
  // 3. Store this data in your database
  
  // Mock implementation that simulates a successful sync
  try {
    // Simulate fetching recent activities (last 30 days)
    const activities = [
      {
        id: "polar_345678",
        user_id: userId,
        activity_date: new Date(Date.now() - 1 * 86400000), // Yesterday
        activity_type: "run",
        distance: 7.5, // km
        duration: 2100, // seconds (35 minutes)
        pace: "7:45", // min/mile
        heart_rate: 159,
        effort_level: "moderate",
        notes: "Afternoon run through the park",
        source: "polar"
      }
    ];
    
    // Simulate fetching health metrics from Polar
    const healthMetrics = [
      {
        user_id: userId,
        metric_date: new Date(Date.now() - 1 * 86400000), // Yesterday
        hrv_score: 59,
        resting_heart_rate: 53,
        sleep_quality: 7,
        sleep_duration: 450, // 7.5 hours in minutes
        energy_level: 8,
        stress_level: 4,
        source: "polar",
        notes: "Auto-imported from Polar Flow"
      }
    ];
    
    // In a real implementation, store this data in the database
    // For now, just log and return success
    console.log(`Found ${activities.length} activities and ${healthMetrics.length} metrics from Polar`);
    
    return {
      activities: activities.length,
      metrics: healthMetrics.length
    };
  } catch (error) {
    console.error("Error syncing Polar data:", error);
    throw new Error(`Failed to sync Polar data: ${error.message}`);
  }
}

// Authentication and subscription middleware
function checkAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
}

function isSubscribed(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  // Check if user has an active subscription
  if (req.user.subscription_status === 'active') {
    return next();
  }
  
  res.status(403).json({ 
    error: "Subscription required", 
    message: "This feature requires an active subscription" 
  });
}

// Check if user has an annual subscription
function hasAnnualSubscription(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  // First check if user has an active subscription
  if (req.user.subscription_status !== 'active') {
    return res.status(403).json({ 
      error: "Premium subscription required", 
      subscriptionRequired: true 
    });
  }
  
  // Check if user has an annual subscription by examining the subscription_end_date
  // If end date is more than 6 months away, assume it's an annual subscription
  if (req.user.subscription_end_date) {
    const sixMonthsInMs = 15768000000; // approximately 6 months in milliseconds
    const endDate = new Date(req.user.subscription_end_date);
    const now = new Date();
    
    if (endDate.getTime() - now.getTime() > sixMonthsInMs) {
      return next();
    }
  }
  
  // If we get here, user has a subscription but it's not annual
  res.status(403).json({ 
    error: "Annual subscription required for this feature", 
    requiresAnnual: true 
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up coaching routes (annual subscribers only)
  app.get("/api/coaches", checkAuth, hasAnnualSubscription, async (req, res) => {
    try {
      const coaches = await db.select().from(coaches);
      res.json(coaches);
    } catch (error) {
      console.error("Error fetching coaches:", error);
      res.status(500).json({ error: "Failed to fetch coaches" });
    }
  });

  app.get("/api/coaches/:id", checkAuth, hasAnnualSubscription, async (req, res) => {
    try {
      const coachId = parseInt(req.params.id);
      const [coach] = await db.select().from(coaches).where(eq(coaches.id, coachId));
      
      if (!coach) {
        return res.status(404).json({ error: "Coach not found" });
      }
      
      res.json(coach);
    } catch (error) {
      console.error("Error fetching coach:", error);
      res.status(500).json({ error: "Failed to fetch coach details" });
    }
  });

  app.post("/api/coaching-sessions", checkAuth, hasAnnualSubscription, async (req, res) => {
    try {
      const sessionData = req.body;
      
      // Validate that the user is the same as the authenticated user
      if (sessionData.athlete_id !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const [session] = await db.insert(coaching_sessions).values({
        ...sessionData,
        status: "scheduled"
      }).returning();
      
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating coaching session:", error);
      res.status(500).json({ error: "Failed to create coaching session" });
    }
  });

  // Set up authentication routes
  setupAuth(app);
  
  // Set up integration sync routes
  setupIntegrationRoutes(app);
  
  // Achievement routes
  // Get user's achievements
  app.get("/api/users/:userId/achievements", checkAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ error: "Not authorized to view other user's achievements" });
      }
      
      const userAchievements = await db.select().from(user_achievements)
        .where(eq(user_achievements.user_id, userId))
        .orderBy(desc(user_achievements.earned_at));
      
      res.json(userAchievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });
  
  // Get unviewed achievements for current user
  app.get("/api/achievements/unviewed", checkAuth, async (req, res) => {
    try {
      const userAchievements = await db.select().from(user_achievements)
        .where(and(
          eq(user_achievements.user_id, req.user.id),
          eq(user_achievements.viewed, false)
        ))
        .orderBy(desc(user_achievements.earned_at));
      
      res.json(userAchievements);
    } catch (error) {
      console.error("Error fetching unviewed achievements:", error);
      res.status(500).json({ error: "Failed to fetch unviewed achievements" });
    }
  });
  
  // Mark achievement as viewed
  app.patch("/api/achievements/:achievementId/viewed", checkAuth, async (req, res) => {
    try {
      const achievementId = parseInt(req.params.achievementId);
      
      // Get the achievement to verify ownership
      const [achievement] = await db.select().from(user_achievements)
        .where(eq(user_achievements.id, achievementId));
      
      if (!achievement) {
        return res.status(404).json({ error: "Achievement not found" });
      }
      
      if (achievement.user_id !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ error: "Not authorized to modify this achievement" });
      }
      
      await db.update(user_achievements)
        .set({ viewed: true })
        .where(eq(user_achievements.id, achievementId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking achievement as viewed:", error);
      res.status(500).json({ error: "Failed to update achievement" });
    }
  });
  
  // Process activity completion and check for achievements
  app.post("/api/achievements/check", checkAuth, async (req, res) => {
    try {
      const { activity } = req.body;
      
      if (!activity) {
        return res.status(400).json({ error: "Activity data required" });
      }
      
      // Get user's previous activities
      const previousActivities = await db.select().from(activities)
        .where(eq(activities.user_id, req.user.id));
      
      // Set for tracking earned achievements
      const earnedAchievements = [];
      
      // Check for first run (if this is the first activity)
      if (previousActivities.length === 0) {
        const firstRunAchievement = {
          user_id: req.user.id,
          title: "First Steps",
          description: "Completed your first run",
          achievement_type: "milestone",
          earned_at: new Date(),
          times_earned: 1,
          viewed: false,
          achievement_data: {}
        };
        
        const [savedAchievement] = await db.insert(user_achievements)
          .values(firstRunAchievement)
          .returning();
          
        earnedAchievements.push(savedAchievement);
      }
      
      // Check for personal best
      // (We would implement logic similar to client-side checkForPersonalBest)
      
      // Check for distance milestones
      // (We would implement logic similar to client-side checkForCumulativeAchievements)
      
      // Check for streak achievements
      // (We would implement logic similar to client-side checkForStreakAchievements)
      
      // Check for race completion
      if (activity.is_race) {
        let raceType = "Race";
        
        // Determine race type based on distance
        const distance = activity.distance;
        if (distance >= 3 && distance < 3.5) raceType = "5K";
        else if (distance >= 6 && distance < 6.5) raceType = "10K";
        else if (distance >= 13 && distance < 13.5) raceType = "Half Marathon";
        else if (distance >= 26 && distance < 26.5) raceType = "Marathon";
        else if (distance >= 31) raceType = "Ultra";
        
        const raceAchievement = {
          user_id: req.user.id,
          title: `${raceType} Finisher`,
          description: `Completed a ${raceType} race`,
          achievement_type: "race",
          earned_at: new Date(),
          times_earned: 1,
          viewed: false,
          achievement_data: {
            race_type: raceType,
            distance: activity.distance,
            time: activity.duration
          }
        };
        
        const [savedRaceAchievement] = await db.insert(user_achievements)
          .values(raceAchievement)
          .returning();
          
        earnedAchievements.push(savedRaceAchievement);
      }
      
      res.json(earnedAchievements);
    } catch (error) {
      console.error("Error checking for achievements:", error);
      res.status(500).json({ error: "Failed to process achievement check" });
    }
  });
  
  // Create test achievement (for development/testing)
  app.post("/api/achievements/test", checkAuth, async (req, res) => {
    try {
      if (!req.user.isAdmin && process.env.NODE_ENV === "production") {
        return res.status(403).json({ error: "Not authorized to create test achievements in production" });
      }
      
      const achievementData = {
        user_id: req.user.id,
        title: req.body.title || "Test Achievement",
        description: req.body.description || "This is a test achievement",
        achievement_type: req.body.type || "milestone",
        badge_image: req.body.badge_image,
        earned_at: new Date(),
        times_earned: 1,
        viewed: false,
        achievement_data: req.body.achievement_data || {}
      };
      
      const [savedAchievement] = await db.insert(user_achievements)
        .values(achievementData)
        .returning();
        
      res.status(201).json(savedAchievement);
    } catch (error) {
      console.error("Error creating test achievement:", error);
      res.status(500).json({ error: "Failed to create test achievement" });
    }
  });
  
  // Initialize Stripe
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('Missing STRIPE_SECRET_KEY environment variable. Stripe integration will not work.');
  }
  
  const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY) 
    : null;

  // API Routes
  // Current user's goal
  app.get("/api/goals/current", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // In a real app, this would fetch the user's current goal from the database
    res.json({
      name: "Chicago Marathon",
      date: "October 8, 2023",
      daysRemaining: 87,
      progress: 68,
      trainingPlan: {
        currentWeek: 8,
        totalWeeks: 16,
      },
      activitiesCompleted: 43,
      totalDistance: 278.6,
    });
  });

  // Weekly metrics
  app.get("/api/metrics/weekly", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // In a real app, this would calculate the user's weekly metrics
    res.json({
      distance: {
        value: 32.4,
        unit: "miles",
        change: 12
      },
      pace: {
        value: "8:42",
        unit: "min/mile",
        change: "0:18 faster"
      },
      activeTime: {
        value: "4:51",
        unit: "hours",
        change: "42 minutes more"
      }
    });
  });

  // Chart data
  app.get("/api/charts/distance", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const timeRange = req.query.timeRange || "week";
    
    // In a real app, this would fetch the user's distance data for the specified time range
    const weekData = [
      { name: "Mon", value: 3 },
      { name: "Tue", value: 7 },
      { name: "Wed", value: 4.5 },
      { name: "Thu", value: 9 },
      { name: "Fri", value: 7 },
      { name: "Sat", value: 12 },
      { name: "Sun", value: 0 }
    ];
    
    const monthData = Array.from({ length: 30 }, (_, i) => ({
      name: `Day ${i + 1}`,
      value: Math.random() * 10 + 2
    }));
    
    const yearData = Array.from({ length: 12 }, (_, i) => ({
      name: `Month ${i + 1}`,
      value: Math.random() * 100 + 50
    }));
    
    let responseData;
    switch (timeRange) {
      case "month":
        responseData = monthData;
        break;
      case "year":
        responseData = yearData;
        break;
      default:
        responseData = weekData;
    }
    
    res.json(responseData);
  });

  app.get("/api/charts/pace", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const timeRange = req.query.timeRange || "week";
    const runType = req.query.runType || "all";
    
    // In a real app, this would fetch the user's pace data for the specified time range and run type
    
    // Sample pace data grouped by run type
    const paceDataByType = {
      easy: [
        { name: "Week 1", value: 9.8, date: "2023-07-01" },
        { name: "Week 2", value: 9.7, date: "2023-07-08" },
        { name: "Week 3", value: 9.5, date: "2023-07-15" },
        { name: "Week 4", value: 9.4, date: "2023-07-22" },
        { name: "Week 5", value: 9.3, date: "2023-07-29" },
        { name: "Week 6", value: 9.2, date: "2023-08-05" }
      ],
      tempo: [
        { name: "Week 1", value: 8.5, date: "2023-07-04" },
        { name: "Week 2", value: 8.3, date: "2023-07-11" },
        { name: "Week 3", value: 8.2, date: "2023-07-18" },
        { name: "Week 4", value: 8.1, date: "2023-07-25" },
        { name: "Week 5", value: 8.0, date: "2023-08-01" }
      ],
      long: [
        { name: "Week 1", value: 9.3, date: "2023-07-02" },
        { name: "Week 2", value: 9.2, date: "2023-07-09" },
        { name: "Week 3", value: 9.1, date: "2023-07-16" },
        { name: "Week 4", value: 9.0, date: "2023-07-23" },
        { name: "Week 5", value: 8.9, date: "2023-07-30" },
        { name: "Week 6", value: 8.8, date: "2023-08-06" }
      ],
      interval: [
        { name: "Week 1", value: 7.8, date: "2023-07-05" },
        { name: "Week 2", value: 7.7, date: "2023-07-12" },
        { name: "Week 3", value: 7.6, date: "2023-07-19" },
        { name: "Week 4", value: 7.5, date: "2023-07-26" },
        { name: "Week 5", value: 7.4, date: "2023-08-02" }
      ]
    };
    
    // Create combined data that includes all run types with their data points
    const allData = Object.keys(paceDataByType).flatMap(type => 
      paceDataByType[type].map(item => ({
        ...item,
        runType: type
      }))
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Month and year data would be handled similarly but with different time ranges
    const monthData = runType === 'all' 
      ? allData 
      : paceDataByType[runType as string] || [];
      
    const yearData = runType === 'all'
      ? allData
      : paceDataByType[runType as string] || [];
    
    let responseData;
    switch (timeRange) {
      case "month":
        responseData = monthData;
        break;
      case "year":
        responseData = yearData;
        break;
      default:
        responseData = runType === 'all' 
          ? allData 
          : paceDataByType[runType as string] || [];
    }
    
    res.json(responseData);
  });

  // Training calendar
  app.get("/api/calendar", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // In a real app, this would fetch the user's training calendar
    res.json({
      weeks: [
        {
          days: [
            { day: 30, isCurrentMonth: false, isToday: false },
            { day: 1, isCurrentMonth: true, isToday: true, workout: { type: "Easy", description: "5 mi Easy", color: "primary" } },
            { day: 2, isCurrentMonth: true, isToday: false, workout: { type: "Interval", description: "Interval", color: "secondary" } },
            { day: 3, isCurrentMonth: true, isToday: false, workout: { type: "Rest", description: "Rest", color: "accent" } },
            { day: 4, isCurrentMonth: true, isToday: false, workout: { type: "Tempo", description: "6 mi Tempo", color: "primary" } },
            { day: 5, isCurrentMonth: true, isToday: false, workout: { type: "Cross", description: "Cross", color: "accent" } },
            { day: 6, isCurrentMonth: true, isToday: false, workout: { type: "Long", description: "12 mi Long", color: "secondary" } },
          ]
        },
        {
          days: [
            { day: 7, isCurrentMonth: true, isToday: false, workout: { type: "Rest", description: "Rest", color: "accent" } },
            { day: 8, isCurrentMonth: true, isToday: false, workout: { type: "Easy", description: "5 mi Easy", color: "primary" } },
            { day: 9, isCurrentMonth: true, isToday: false, workout: { type: "Speed", description: "Speed", color: "secondary" } },
            { day: 10, isCurrentMonth: true, isToday: false, workout: { type: "Rest", description: "Rest", color: "accent" } },
            { day: 11, isCurrentMonth: true, isToday: false, workout: { type: "Tempo", description: "6 mi Tempo", color: "primary" } },
            { day: 12, isCurrentMonth: true, isToday: false, workout: { type: "Cross", description: "Cross", color: "accent" } },
            { day: 13, isCurrentMonth: true, isToday: false, workout: { type: "Long", description: "14 mi Long", color: "secondary" } },
          ]
        },
        {
          days: [
            { day: 14, isCurrentMonth: true, isToday: false, workout: { type: "Rest", description: "Rest", color: "accent" } },
            { day: 15, isCurrentMonth: true, isToday: false, workout: { type: "Easy", description: "6 mi Easy", color: "primary" } },
            { day: 16, isCurrentMonth: true, isToday: false, workout: { type: "Hills", description: "Hills", color: "secondary" } },
            { day: 17, isCurrentMonth: true, isToday: false, workout: { type: "Rest", description: "Rest", color: "accent" } },
            { day: 18, isCurrentMonth: true, isToday: false, workout: { type: "Tempo", description: "7 mi Tempo", color: "primary" } },
            { day: 19, isCurrentMonth: true, isToday: false, workout: { type: "Cross", description: "Cross", color: "accent" } },
            { day: 20, isCurrentMonth: true, isToday: false, workout: { type: "Long", description: "16 mi Long", color: "secondary" } },
          ]
        }
      ]
    });
  });

  // Today's workout
  app.get("/api/workouts/today", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // In a real app, this would fetch the user's workout for today
    res.json({
      type: "Easy Run",
      targetDistance: "5 miles",
      targetPace: "9:00-9:30 min/mile",
      zone: "Zone 2 (Easy)",
      estimatedTime: "~45-50 minutes",
      notes: "Focus on maintaining a conversational pace throughout the run. This is a recovery run intended to build aerobic base without creating additional fatigue."
    });
  });

  // Weekly progress
  app.get("/api/progress/weekly", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // In a real app, this would fetch the user's weekly progress
    res.json({
      distanceGoal: {
        current: 32.4,
        target: 35,
        percentage: 92
      },
      workoutsCompleted: {
        current: 4,
        target: 5,
        percentage: 80
      },
      improvementRate: {
        status: "On Track",
        percentage: 85
      }
    });
  });

  // Recent activities
  app.get("/api/activities/recent", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // In a real app, this would fetch the user's recent activities
    res.json([
      {
        id: 1,
        date: "Jul 30, 2023",
        type: {
          name: "Long Run",
          icon: "chart",
          color: "secondary"
        },
        distance: "12.6 mi",
        time: "1:51:24",
        pace: "8:51 /mi",
        heartRate: "152 bpm",
        effort: {
          level: "moderate",
          label: "Moderate"
        }
      },
      {
        id: 2,
        date: "Jul 28, 2023",
        type: {
          name: "Tempo Run",
          icon: "speed",
          color: "primary"
        },
        distance: "6.2 mi",
        time: "48:36",
        pace: "7:50 /mi",
        heartRate: "165 bpm",
        effort: {
          level: "hard",
          label: "Hard"
        }
      },
      {
        id: 3,
        date: "Jul 26, 2023",
        type: {
          name: "Easy Run",
          icon: "activity",
          color: "accent"
        },
        distance: "5.0 mi",
        time: "47:15",
        pace: "9:27 /mi",
        heartRate: "139 bpm",
        effort: {
          level: "easy",
          label: "Easy"
        }
      }
    ]);
  });

  // Community Features API

  // Groups
  app.get("/api/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groups = await storage.getGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  app.get("/api/groups/me", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groups = await storage.getGroupsByUser(req.user.id);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ error: "Failed to fetch your groups" });
    }
  });

  app.get("/api/groups/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groupId = parseInt(req.params.id);
      const group = await storage.getGroupById(groupId);
      
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      res.json(group);
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ error: "Failed to fetch group" });
    }
  });

  app.post("/api/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validation = insertGroupSchema.safeParse({
        ...req.body,
        created_by: req.user.id
      });
      
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      
      const group = await storage.createGroup(validation.data);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ error: "Failed to create group" });
    }
  });

  app.post("/api/groups/:id/join", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groupId = parseInt(req.params.id);
      const group = await storage.getGroupById(groupId);
      
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      const memberData = {
        group_id: groupId,
        user_id: req.user.id,
        role: "member",
        status: "active"
      };
      
      const member = await storage.addUserToGroup(memberData);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error joining group:", error);
      res.status(500).json({ error: "Failed to join group" });
    }
  });

  app.post("/api/groups/:id/leave", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groupId = parseInt(req.params.id);
      const group = await storage.getGroupById(groupId);
      
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      await storage.removeUserFromGroup(groupId, req.user.id);
      res.status(200).json({ message: "Successfully left the group" });
    } catch (error) {
      console.error("Error leaving group:", error);
      res.status(500).json({ error: "Failed to leave group" });
    }
  });

  // Buddies
  app.get("/api/buddies", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const buddies = await storage.getBuddies(req.user.id);
      res.json(buddies);
    } catch (error) {
      console.error("Error fetching buddies:", error);
      res.status(500).json({ error: "Failed to fetch buddies" });
    }
  });

  app.get("/api/buddies/requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const requests = await storage.getBuddyRequests(req.user.id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching buddy requests:", error);
      res.status(500).json({ error: "Failed to fetch buddy requests" });
    }
  });

  app.post("/api/buddies/request", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validation = insertBuddySchema.safeParse({
        user_id: req.user.id,
        buddy_id: req.body.buddy_id,
        status: "pending"
      });
      
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      
      const buddy = await storage.requestBuddy(validation.data);
      res.status(201).json(buddy);
    } catch (error) {
      console.error("Error sending buddy request:", error);
      res.status(500).json({ error: "Failed to send buddy request" });
    }
  });

  app.post("/api/buddies/:id/accept", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const buddyRequestId = parseInt(req.params.id);
      const updatedBuddy = await storage.updateBuddyStatus(buddyRequestId, "accepted");
      res.json(updatedBuddy);
    } catch (error) {
      console.error("Error accepting buddy request:", error);
      res.status(500).json({ error: "Failed to accept buddy request" });
    }
  });

  app.post("/api/buddies/:id/decline", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const buddyRequestId = parseInt(req.params.id);
      const updatedBuddy = await storage.updateBuddyStatus(buddyRequestId, "declined");
      res.json(updatedBuddy);
    } catch (error) {
      console.error("Error declining buddy request:", error);
      res.status(500).json({ error: "Failed to decline buddy request" });
    }
  });

  app.post("/api/buddies/:id/remove", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const buddyId = parseInt(req.params.id);
      await storage.removeBuddy(req.user.id, buddyId);
      res.status(200).json({ message: "Buddy removed successfully" });
    } catch (error) {
      console.error("Error removing buddy:", error);
      res.status(500).json({ error: "Failed to remove buddy" });
    }
  });

  // Challenges
  app.get("/api/challenges", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const challenges = await storage.getChallenges();
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ error: "Failed to fetch challenges" });
    }
  });

  app.get("/api/challenges/me", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const challenges = await storage.getChallengesByUser(req.user.id);
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching user challenges:", error);
      res.status(500).json({ error: "Failed to fetch your challenges" });
    }
  });

  app.get("/api/challenges/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const challengeId = parseInt(req.params.id);
      const challenge = await storage.getChallengeById(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      res.json(challenge);
    } catch (error) {
      console.error("Error fetching challenge:", error);
      res.status(500).json({ error: "Failed to fetch challenge" });
    }
  });

  app.post("/api/challenges", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validation = insertChallengeSchema.safeParse({
        ...req.body,
        created_by: req.user.id
      });
      
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      
      const challenge = await storage.createChallenge(validation.data);
      res.status(201).json(challenge);
    } catch (error) {
      console.error("Error creating challenge:", error);
      res.status(500).json({ error: "Failed to create challenge" });
    }
  });

  app.post("/api/challenges/:id/join", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const challengeId = parseInt(req.params.id);
      const challenge = await storage.getChallengeById(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      const participantData = {
        challenge_id: challengeId,
        user_id: req.user.id,
        current_progress: 0,
        status: "active"
      };
      
      const participant = await storage.joinChallenge(participantData);
      res.status(201).json(participant);
    } catch (error) {
      console.error("Error joining challenge:", error);
      res.status(500).json({ error: "Failed to join challenge" });
    }
  });

  app.post("/api/challenges/:id/leave", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const challengeId = parseInt(req.params.id);
      const challenge = await storage.getChallengeById(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      await storage.leaveChallenge(challengeId, req.user.id);
      res.status(200).json({ message: "Successfully left the challenge" });
    } catch (error) {
      console.error("Error leaving challenge:", error);
      res.status(500).json({ error: "Failed to leave challenge" });
    }
  });

  app.post("/api/challenges/:id/progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const challengeId = parseInt(req.params.id);
      const progress = parseFloat(req.body.progress);
      
      if (isNaN(progress)) {
        return res.status(400).json({ error: "Invalid progress value" });
      }
      
      await storage.updateChallengeProgress(challengeId, req.user.id, progress);
      res.status(200).json({ message: "Progress updated successfully" });
    } catch (error) {
      console.error("Error updating challenge progress:", error);
      res.status(500).json({ error: "Failed to update challenge progress" });
    }
  });

  // Achievements
  app.get("/api/achievements", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.get("/api/achievements/me", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userAchievements = await storage.getUserAchievements(req.user.id);
      res.json(userAchievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ error: "Failed to fetch your achievements" });
    }
  });

  // Nutrition Tracking
  app.get("/api/nutrition", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }
      
      const logs = await storage.getNutritionLogs(req.user.id, startDate, endDate);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching nutrition logs:", error);
      res.status(500).json({ error: "Failed to fetch nutrition logs" });
    }
  });

  app.post("/api/nutrition", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validation = insertNutritionLogSchema.safeParse({
        ...req.body,
        user_id: req.user.id
      });
      
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      
      const log = await storage.createNutritionLog(validation.data);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating nutrition log:", error);
      res.status(500).json({ error: "Failed to create nutrition log" });
    }
  });

  app.patch("/api/nutrition/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const logId = parseInt(req.params.id);
      const updatedLog = await storage.updateNutritionLog(logId, req.body);
      res.json(updatedLog);
    } catch (error) {
      console.error("Error updating nutrition log:", error);
      res.status(500).json({ error: "Failed to update nutrition log" });
    }
  });

  // Coaching
  app.get("/api/coaches", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const coaches = await storage.getCoaches();
      res.json(coaches);
    } catch (error) {
      console.error("Error fetching coaches:", error);
      res.status(500).json({ error: "Failed to fetch coaches" });
    }
  });

  app.get("/api/coaches/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const coachId = parseInt(req.params.id);
      const coach = await storage.getCoachById(coachId);
      
      if (!coach) {
        return res.status(404).json({ error: "Coach not found" });
      }
      
      res.json(coach);
    } catch (error) {
      console.error("Error fetching coach:", error);
      res.status(500).json({ error: "Failed to fetch coach" });
    }
  });

  app.post("/api/coaches", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validation = insertCoachSchema.safeParse({
        ...req.body,
        user_id: req.user.id
      });
      
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      
      const coach = await storage.createCoach(validation.data);
      res.status(201).json(coach);
    } catch (error) {
      console.error("Error creating coach profile:", error);
      res.status(500).json({ error: "Failed to create coach profile" });
    }
  });

  app.get("/api/coaching-sessions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const role = req.query.role as 'coach' | 'athlete' || 'athlete';
      const sessions = await storage.getCoachingSessions(req.user.id, role);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching coaching sessions:", error);
      res.status(500).json({ error: "Failed to fetch coaching sessions" });
    }
  });

  app.post("/api/coaching-sessions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validation = insertCoachingSessionSchema.safeParse({
        ...req.body,
        athlete_id: req.user.id
      });
      
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      
      const session = await storage.createCoachingSession(validation.data);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error booking coaching session:", error);
      res.status(500).json({ error: "Failed to book coaching session" });
    }
  });

  app.patch("/api/coaching-sessions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const sessionId = parseInt(req.params.id);
      const updatedSession = await storage.updateCoachingSession(sessionId, req.body);
      res.json(updatedSession);
    } catch (error) {
      console.error("Error updating coaching session:", error);
      res.status(500).json({ error: "Failed to update coaching session" });
    }
  });

  // Health Metrics API
  app.get("/api/health-metrics", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Parse date query parameters if provided
      let startDate = undefined;
      let endDate = undefined;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }
      
      const metrics = await storage.getHealthMetrics(req.user.id, startDate, endDate);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching health metrics:", error);
      res.status(500).json({ error: "Failed to fetch health metrics" });
    }
  });

  app.post("/api/health-metrics", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validation = insertHealthMetricsSchema.safeParse({
        ...req.body,
        user_id: req.user.id,
        metric_date: req.body.metric_date ? new Date(req.body.metric_date) : new Date()
      });
      
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      
      const metric = await storage.createHealthMetric(validation.data);
      res.status(201).json(metric);
    } catch (error) {
      console.error("Error creating health metric:", error);
      res.status(500).json({ error: "Failed to create health metric" });
    }
  });

  app.patch("/api/health-metrics/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const metricId = parseInt(req.params.id);
      const updatedMetric = await storage.updateHealthMetric(metricId, req.body);
      res.json(updatedMetric);
    } catch (error) {
      console.error("Error updating health metric:", error);
      res.status(500).json({ error: "Failed to update health metric" });
    }
  });

  // Integration connections API
  app.get("/api/integrations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const connections = await storage.getIntegrationConnections(req.user.id);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  app.get("/api/integrations/:platform", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const platform = req.params.platform;
      const connection = await storage.getIntegrationConnection(req.user.id, platform);
      
      if (!connection) {
        return res.status(404).json({ error: "Integration connection not found" });
      }
      
      res.json(connection);
    } catch (error) {
      console.error("Error fetching integration:", error);
      res.status(500).json({ error: "Failed to fetch integration" });
    }
  });

  app.post("/api/integrations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validation = insertIntegrationConnectionSchema.safeParse({
        ...req.body,
        user_id: req.user.id
      });
      
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      
      const connection = await storage.createIntegrationConnection(validation.data);
      res.status(201).json(connection);
    } catch (error) {
      console.error("Error creating integration connection:", error);
      res.status(500).json({ error: "Failed to create integration connection" });
    }
  });

  app.patch("/api/integrations/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const connectionId = parseInt(req.params.id);
      const updatedConnection = await storage.updateIntegrationConnection(connectionId, req.body);
      res.json(updatedConnection);
    } catch (error) {
      console.error("Error updating integration connection:", error);
      res.status(500).json({ error: "Failed to update integration connection" });
    }
  });

  app.delete("/api/integrations/:platform", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const platform = req.params.platform;
      await storage.removeIntegrationConnection(req.user.id, platform);
      res.status(200).json({ message: `Successfully removed ${platform} integration` });
    } catch (error) {
      console.error("Error removing integration connection:", error);
    }
  });

  // New endpoints for connecting to platforms and syncing data
  app.post("/api/integrations/connect/:platform", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const platform = req.params.platform;
      let authUrl;
      
      // Platform-specific connection logic
      switch (platform) {
        case "strava":
          // Generate Strava OAuth URL
          // In production, you'd use Strava's OAuth API
          authUrl = `https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=${encodeURIComponent(`${req.protocol}://${req.get('host')}/api/integrations/callback/strava`)}&approval_prompt=force&scope=read,activity:read,activity:read_all`;
          break;
        case "garmin":
          // Garmin Connect API OAuth process
          authUrl = `/api/integrations/garmin/auth?userId=${req.user.id}`;
          break;
        case "polar":
          // Polar Flow API OAuth process
          authUrl = `https://flow.polar.com/oauth2/authorization?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=${encodeURIComponent(`${req.protocol}://${req.get('host')}/api/integrations/callback/polar`)}`;
          break;
        default:
          return res.status(400).json({ error: `Unsupported platform: ${platform}` });
      }
      
      res.json({ authUrl });
    } catch (error) {
      console.error(`Error connecting to ${req.params.platform}:`, error);
      res.status(500).json({ error: `Failed to connect to ${req.params.platform}` });
    }
  });
  
  // OAuth callback handlers for each platform
  app.get("/api/integrations/callback/:platform", async (req, res) => {
    // Handle OAuth callback
    const platform = req.params.platform;
    const { code, error } = req.query;
    
    if (error) {
      // Auth was denied or failed
      return res.redirect(`/settings?tab=integrations&error=${error}`);
    }
    
    if (!code) {
      return res.redirect("/settings?tab=integrations&error=missing_code");
    }
    
    try {
      let tokenData;
      
      switch (platform) {
        case "strava":
          // Exchange code for token using Strava's API
          // In production, you'd use actual API calls to Strava
          tokenData = {
            access_token: "sample_access_token",
            refresh_token: "sample_refresh_token",
            expires_at: new Date(Date.now() + 21600000), // 6 hours from now
            athlete_id: "12345"
          };
          break;
        case "garmin":
          // Exchange code for token using Garmin's API
          tokenData = {
            access_token: "sample_access_token",
            refresh_token: "sample_refresh_token",
            expires_at: new Date(Date.now() + 3600000), // 1 hour from now
            athlete_id: "67890"
          };
          break;
        case "polar":
          // Exchange code for token using Polar's API
          tokenData = {
            access_token: "sample_access_token",
            refresh_token: "sample_refresh_token",
            expires_at: new Date(Date.now() + 86400000), // 24 hours from now
            athlete_id: "11223"
          };
          break;
      }
      
      if (!req.isAuthenticated()) {
        // If user is not logged in, store token in session for later
        // In a real app, this would require more secure handling
        req.session.pendingIntegration = { platform, tokenData };
        return res.redirect("/auth?redirect=/settings?tab=integrations");
      }
      
      // Create or update the integration connection
      const connectionData = {
        user_id: req.user.id,
        platform,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: tokenData.expires_at,
        athlete_id: tokenData.athlete_id,
        is_active: true
      };
      
      // Check if connection already exists
      const existingConnection = await storage.getIntegrationConnection(req.user.id, platform);
      
      if (existingConnection) {
        await storage.updateIntegrationConnection(existingConnection.id, connectionData);
      } else {
        await storage.createIntegrationConnection(connectionData);
      }
      
      res.redirect(`/settings?tab=integrations&success=${platform}`);
    } catch (error) {
      console.error(`Error completing ${platform} integration:`, error);
      res.redirect(`/settings?tab=integrations&error=integration_failed`);
    }
  });
  
  // Data sync endpoint for each integration
  app.post("/api/integrations/sync/:platform", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const platform = req.params.platform;
    
    try {
      // Get the integration connection
      const connection = await storage.getIntegrationConnection(req.user.id, platform);
      
      if (!connection) {
        return res.status(404).json({ error: `No ${platform} integration found` });
      }
      
      if (!connection.is_active) {
        return res.status(400).json({ error: `${platform} integration is not active` });
      }
      
      // Check if token is expired and refresh if needed
      const now = new Date();
      if (connection.token_expires_at && new Date(connection.token_expires_at) < now) {
        // Token is expired, refresh it
        // In a real app, you'd call the platform's API to refresh the token
        console.log(`Refreshing ${platform} token`);
        
        // Mock refreshed token
        const refreshedToken = {
          access_token: `new_${platform}_access_token`,
          refresh_token: `new_${platform}_refresh_token`,
          expires_at: new Date(Date.now() + 21600000), // 6 hours from now
        };
        
        // Update the connection with new token
        await storage.updateIntegrationConnection(connection.id, {
          access_token: refreshedToken.access_token,
          refresh_token: refreshedToken.refresh_token,
          token_expires_at: refreshedToken.expires_at
        });
        
        // Update our local connection object
        connection.access_token = refreshedToken.access_token;
      }
      
      // Platform-specific sync logic
      let syncResults = { activities: 0, metrics: 0 };
      
      switch (platform) {
        case "strava":
          // Fetch activities from Strava
          // In a real app, you'd use the Strava API client
          syncResults = await syncStravaData(connection, req.user.id);
          break;
        case "garmin":
          // Fetch data from Garmin Connect
          syncResults = await syncGarminData(connection, req.user.id);
          break;
        case "polar":
          // Fetch data from Polar Flow
          syncResults = await syncPolarData(connection, req.user.id);
          break;
      }
      
      // Update last_sync_at
      await storage.updateIntegrationConnection(connection.id, {
        last_sync_at: new Date()
      });
      
      res.json({
        success: true,
        platform,
        ...syncResults
      });
    } catch (error) {
      console.error(`Error syncing data from ${platform}:`, error);
      res.status(500).json({ error: `Failed to sync data from ${platform}` });
    }
  });
  
  // Subscription Plans API
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });
  
  // Developer endpoint to activate premium subscription for testing
  app.post("/api/dev/activate-premium", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "You must be logged in" });
    }
    
    try {
      const user = req.user;
      
      // Set subscription to active for 30 days
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      // Update user subscription status
      await storage.updateUserSubscription(user.id, {
        status: 'active',
        endDate: endDate,
        stripeSubscriptionId: 'dev_test_subscription'
      });
      
      // Return updated user information
      const updatedUser = await storage.getUser(user.id);
      
      res.json({
        success: true,
        message: "Premium features activated for testing",
        expiresAt: endDate,
        user: updatedUser
      });
    } catch (error) {
      console.error("Error activating premium features:", error);
      res.status(500).json({ error: "Failed to activate premium features" });
    }
  });

  app.get("/api/subscription-plans/:id", async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getSubscriptionPlanById(planId);
      
      if (!plan) {
        return res.status(404).json({ error: "Subscription plan not found" });
      }
      
      res.json(plan);
    } catch (error) {
      console.error("Error fetching subscription plan:", error);
      res.status(500).json({ error: "Failed to fetch subscription plan" });
    }
  });

  app.post("/api/subscription-plans", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Check if the user is an admin 
    // For now, we'll assume the first user is an admin
    if (req.user.id !== 1) {
      return res.status(403).json({ error: "Only admins can create subscription plans" });
    }
    
    try {
      const validation = insertSubscriptionPlanSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      
      const plan = await storage.createSubscriptionPlan(validation.data);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      res.status(500).json({ error: "Failed to create subscription plan" });
    }
  });
  
  // Seed subscription plans for development
  app.post("/api/seed-subscription-plans", async (req, res) => {
    try {
      // Check if there are already subscription plans in the database
      const existingPlans = await db.select().from(subscription_plans);
      console.log("Existing plans:", existingPlans);
      
      if (existingPlans.length > 0) {
        return res.status(200).json({ message: 'Subscription plans already exist. Skipping seed.', planCount: existingPlans.length });
      }
      
      // Define the plans to insert
      const plans = [
        {
          name: 'Premium Monthly',
          description: 'Full access to all premium features with monthly billing',
          price: '9.99',
          billing_interval: 'month',
          stripe_price_id: 'price_monthly', // Replace with actual Stripe price ID
          features: JSON.stringify([
            'Advanced training analytics',
            'Custom training plans',
            'Unlimited training history',
            'AI-powered recommendations',
            'Priority support',
            'Early access to new features'
          ]),
          is_active: true
        },
        {
          name: 'Premium Annual',
          description: 'Full access to all premium features with annual billing (save 20%)',
          price: '95.88',
          billing_interval: 'year',
          stripe_price_id: 'price_annual', // Replace with actual Stripe price ID
          features: JSON.stringify([
            'Advanced training analytics',
            'Custom training plans',
            'Unlimited training history',
            'AI-powered recommendations',
            'Priority support',
            'Early access to new features',
            'Exclusive annual subscriber benefits'
          ]),
          is_active: true
        }
      ];
      
      console.log("Plans to insert:", plans);
      
      // Insert plans into the database
      const result = await db.insert(subscription_plans).values(plans);
      console.log("Insert result:", result);
      
      return res.status(201).json({ message: 'Successfully seeded subscription plans!', planCount: plans.length });
    } catch (error) {
      console.error("Error seeding subscription plans:", error);
      // More detailed error in the response
      res.status(500).json({ 
        error: "Failed to seed subscription plans", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Stripe Subscription Endpoints
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    if (!stripe) {
      return res.status(500).json({ error: "Stripe integration is not configured" });
    }
    
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId: req.user.id.toString()
        }
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/get-or-create-subscription', async (req, res) => {
    console.log("Subscription request received:", req.body);
    
    if (!req.isAuthenticated()) {
      console.log("Unauthorized subscription request");
      return res.sendStatus(401);
    }
    
    if (!stripe) {
      console.error("Stripe integration is not configured");
      return res.status(500).json({ error: "Stripe integration is not configured" });
    }
    
    let user = req.user;
    console.log("User requesting subscription:", { id: user.id, hasStripeCustomerId: !!user.stripe_customer_id });
    
    try {
      // If the user already has a subscription, retrieve it
      if (user.stripe_subscription_id) {
        const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id) as ExpandedSubscription;
        
        let clientSecret = null;
        const latestInvoice = subscription.latest_invoice;
        
        if (latestInvoice && typeof latestInvoice !== 'string') {
          const paymentIntent = latestInvoice.payment_intent;
          
          if (typeof paymentIntent === 'string') {
            const pi = await stripe.paymentIntents.retrieve(paymentIntent);
            clientSecret = pi.client_secret;
          } else if (paymentIntent) {
            clientSecret = paymentIntent.client_secret;
          }
        }
        
        res.send({
          subscriptionId: subscription.id,
          clientSecret: clientSecret || undefined
        });
        
        return;
      }
      
      // Create a new customer if needed
      if (!user.stripe_customer_id) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: user.username,
          metadata: {
            userId: user.id.toString()
          }
        });
        
        user = await storage.updateUserSubscription(user.id, {
          stripeCustomerId: customer.id
        });
      }
      
      // Validate there's a price ID
      if (!req.body.priceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }
      
      // We need to get the subscription plan to get the price information
      const subscriptionPlan = await storage.getSubscriptionPlanByStripeId(req.body.priceId);
      if (!subscriptionPlan) {
        return res.status(400).json({ error: "Invalid price ID" });
      }
      
      // Check if this is a placeholder price id
      if (req.body.priceId === 'price_monthly' || req.body.priceId === 'price_annual') {
        // Create a price in Stripe first
        try {
          // First create a product if it doesn't exist
          const product = await stripe.products.create({
            name: subscriptionPlan.name,
            description: subscriptionPlan.description || undefined,
          });
          
          // Create a price for the product
          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(Number(subscriptionPlan.price) * 100), // Convert to cents
            currency: 'usd',
            recurring: {
              interval: subscriptionPlan.billing_interval as 'month' | 'year',
            },
          });
          
          // Update the subscription plan in the database with the real Stripe price ID
          await storage.updateSubscriptionPlan(subscriptionPlan.id, {
            stripe_price_id: price.id,
          });
          
          // Use the new price ID
          req.body.priceId = price.id;
          
        } catch (error: any) {
          console.error("Error creating Stripe product and price:", error);
          return res.status(500).json({ 
            error: { 
              message: "Failed to create Stripe product and price",
              details: error.message
            } 
          });
        }
      }
      
      // Create the subscription
      console.log("Creating Stripe subscription with params:", {
        customerId: user.stripe_customer_id,
        priceId: req.body.priceId
      });
      
      const subscription = await stripe.subscriptions.create({
        customer: user.stripe_customer_id!,
        items: [{
          price: req.body.priceId,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      }) as ExpandedSubscription;
      
      console.log("Subscription created:", {
        id: subscription.id,
        status: subscription.status,
        hasLatestInvoice: !!subscription.latest_invoice,
        latestInvoiceType: typeof subscription.latest_invoice
      });
      
      // Update the user record with subscription info
      await storage.updateUserSubscription(user.id, {
        stripeSubscriptionId: subscription.id,
        status: subscription.status
      });
      
      // Get the client secret to complete the payment
      let clientSecret = null;
      const latestInvoice = subscription.latest_invoice;
      
      console.log("Processing latest invoice:", {
        hasInvoice: !!latestInvoice,
        invoiceType: typeof latestInvoice
      });
      
      if (latestInvoice && typeof latestInvoice !== 'string') {
        const paymentIntent = latestInvoice.payment_intent;
        
        console.log("Processing payment intent:", {
          hasPaymentIntent: !!paymentIntent,
          paymentIntentType: typeof paymentIntent
        });
        
        if (typeof paymentIntent === 'string') {
          console.log("Retrieving payment intent details for ID:", paymentIntent);
          const pi = await stripe.paymentIntents.retrieve(paymentIntent);
          clientSecret = pi.client_secret;
          console.log("Retrieved client secret from payment intent");
        } else if (paymentIntent && paymentIntent.client_secret) {
          clientSecret = paymentIntent.client_secret;
          console.log("Using embedded client secret from payment intent");
        } else {
          console.log("No payment intent or client secret found on invoice");
          
          // Attempt to retrieve a fresh payment intent
          if (latestInvoice.id) {
            try {
              const retrievedInvoice = await stripe.invoices.retrieve(latestInvoice.id, {
                expand: ['payment_intent']
              });
              
              if (retrievedInvoice.payment_intent && 
                  typeof retrievedInvoice.payment_intent !== 'string' && 
                  retrievedInvoice.payment_intent.client_secret) {
                clientSecret = retrievedInvoice.payment_intent.client_secret;
                console.log("Retrieved client secret from fetched invoice payment intent");
              }
            } catch (error) {
              console.error("Error retrieving invoice:", error);
            }
          }
        }
      } else {
        console.log("No valid invoice found on subscription");
      }
      
      // Create a payment intent if we don't have a client secret yet
      if (!clientSecret) {
        console.log("No client secret found, creating a setup intent instead");
        try {
          // For subscriptions, a SetupIntent is more appropriate than a PaymentIntent
          // when we don't have a payment_intent from the subscription process
          const setupIntent = await stripe.setupIntents.create({
            customer: user.stripe_customer_id!,
            payment_method_types: ['card'],
            usage: 'off_session',
            metadata: {
              subscription_id: subscription.id,
            },
          });
          
          clientSecret = setupIntent.client_secret;
          console.log("Created setup intent with client secret:", setupIntent.id);
          
          // Associate the setup intent with the subscription
          await stripe.subscriptions.update(subscription.id, {
            expand: ['latest_invoice.payment_intent'],
            metadata: {
              setup_intent_id: setupIntent.id
            }
          });
        } catch (siError) {
          console.error("Error creating setup intent:", siError);
          
          // Fallback to regular payment intent if setup intent fails
          try {
            const paymentIntent = await stripe.paymentIntents.create({
              amount: Math.round(Number(subscriptionPlan.price) * 100), // Convert to cents
              currency: 'usd',
              customer: user.stripe_customer_id!,
              setup_future_usage: 'off_session',
              metadata: {
                subscription_id: subscription.id,
              },
            });
            
            clientSecret = paymentIntent.client_secret;
            console.log("Created fallback payment intent with client secret:", paymentIntent.id);
          } catch (piError) {
            console.error("Error creating fallback payment intent:", piError);
          }
        }
      }
      
      // Final response with client secret
      const responseData = {
        subscriptionId: subscription.id,
        clientSecret: clientSecret
      };
      
      console.log("Sending subscription response:", responseData);
      res.json(responseData);
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  // Webhook to handle subscription updates
  app.post('/api/webhook', async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe integration is not configured" });
    }
    
    const signature = req.headers['stripe-signature'] as string;
    
    let event;
    
    try {
      // This is just a placeholder - in a real app, you need to set up proper webhook secret verification
      // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      // event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
      
      // For now, just parse the body as a Stripe event
      event = req.body;
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        // Get the customer ID
        const customerId = subscription.customer as string;
        
        // Find the user with this stripe customer ID
        const [user] = await db.select().from(users).where(eq(users.stripe_customer_id, customerId));
        
        if (user) {
          // Update subscription status
          await storage.updateUserSubscription(user.id, {
            status: subscription.status,
            endDate: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : undefined
          });
          console.log(`Updated subscription status to ${subscription.status} for user ${user.id}`);
        }
        break;
        
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription && typeof invoice.subscription === 'string') {
          try {
            // Find the user with this subscription
            const [userRow] = await db
              .select()
              .from(users)
              .where(eq(users.stripe_subscription_id, invoice.subscription));
            
            if (userRow) {
              console.log(`Processing successful payment for user ${userRow.id}`);
              
              // Get subscription details to calculate correct end date
              const subDetails = await stripe.subscriptions.retrieve(invoice.subscription);
              let endDate = new Date();
              
              if (subDetails.current_period_end) {
                // Use the period end from subscription
                endDate = new Date(subDetails.current_period_end * 1000);
              } else {
                // Calculate based on interval
                const interval = subDetails.items.data[0]?.price?.recurring?.interval;
                if (interval === 'month') {
                  endDate = new Date(endDate.setMonth(endDate.getMonth() + 1));
                } else if (interval === 'year') {
                  endDate = new Date(endDate.setFullYear(endDate.getFullYear() + 1));
                } else {
                  // Default to 30 days
                  endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                }
              }
              
              // Update the subscription status to active with end date
              await storage.updateUserSubscription(userRow.id, {
                status: 'active',
                endDate: endDate
              });
              console.log(`Updated subscription to active until ${endDate.toISOString()} for user ${userRow.id}`);
            }
          } catch (error) {
            console.error('Error processing invoice payment success:', error);
          }
        }
        break;
        
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        
        if (failedInvoice.subscription && typeof failedInvoice.subscription === 'string') {
          try {
            // Find the user with this subscription
            const [userRow] = await db
              .select()
              .from(users)
              .where(eq(users.stripe_subscription_id, failedInvoice.subscription));
            
            if (userRow) {
              console.log(`Updating subscription status to 'past_due' for user ${userRow.id}`);
              
              // Update the subscription status to past_due
              await storage.updateUserSubscription(userRow.id, {
                status: 'past_due'
              });
            }
          } catch (error) {
            console.error('Error processing invoice payment failure:', error);
          }
        }
        break;
        
      case 'setup_intent.succeeded':
        const setupIntent = event.data.object as Stripe.SetupIntent;
        
        try {
          // Check for subscription ID in metadata
          const subscriptionId = setupIntent.metadata?.subscription_id;
          
          if (subscriptionId) {
            console.log(`Setup intent succeeded for subscription ${subscriptionId}`);
            
            // Get the payment method that was set up
            const paymentMethodId = setupIntent.payment_method;
            
            if (paymentMethodId && typeof paymentMethodId === 'string') {
              // Attach payment method to subscription
              await stripe.subscriptions.update(subscriptionId, {
                default_payment_method: paymentMethodId,
              });
              
              // Find the user with this subscription
              const [userRow] = await db
                .select()
                .from(users)
                .where(eq(users.stripe_subscription_id, subscriptionId));
              
              if (userRow) {
                console.log(`Payment method set up for user ${userRow.id}`);
                
                // Update subscription to active
                await storage.updateUserSubscription(userRow.id, {
                  status: 'active'
                });
              }
            }
          }
        } catch (error) {
          console.error('Error processing setup intent success:', error);
        }
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    // Return a 200 response to acknowledge receipt of the event
    res.send({ received: true });
  });

  // AI Training Plan Generation API
  app.post("/api/generate-training-plan", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!geminiModel) {
      return res.status(503).json({ error: "AI service is not available. Missing API key." });
    }

    try {
      const params = req.body;
      
      // Validate required parameters
      if (!params.fitnessLevel || !params.availableDaysPerWeek) {
        return res.status(400).json({ 
          error: "Missing required parameters: fitnessLevel and availableDaysPerWeek are required" 
        });
      }

      // Build the prompt
      const prompt = `
        As an experienced running coach, create a detailed training plan with the following specifications:
        
        USER PROFILE:
        - Target Race: ${params.targetRace || 'General fitness'}
        - Race Distance: ${params.raceDistance || 'Not specified'}
        - Goal Time: ${params.goalTime || 'Completion'}
        - Fitness Level: ${params.fitnessLevel}
        - Current Weekly Mileage: ${params.currentWeeklyMileage || 'Not specified'} miles per week
        - Available Days: ${params.availableDaysPerWeek} days per week
        - Time Per Session: ${params.timePerSessionMinutes || 60} minutes
        - Preferred Workout Types: ${params.preferredWorkoutTypes?.join(', ') || 'Any'}
        - Injuries/Limitations: ${params.injuries?.join(', ') || 'None'}
        - Age: ${params.userAge || 'Not specified'}
        - Weight: ${params.userWeight || 'Not specified'} kg
        - Height: ${params.userHeight || 'Not specified'} cm
        - Start Date: ${params.startDate || 'Immediate'}
        - End Date/Race Day: ${params.endDate || 'Not specified'}
        
        I need a comprehensive training plan in JSON format with the following structure:
        
        {
          "overview": {
            "title": "string",
            "description": "string",
            "weeklyMileage": "string",
            "workoutsPerWeek": number,
            "longRunDistance": "string",
            "qualityWorkouts": number
          },
          "philosophy": "string explaining training approach",
          "recommendedGear": ["string array of recommended gear"],
          "nutritionTips": "string with nutrition guidance",
          "weeklyPlans": [
            {
              "weekNumber": number,
              "focus": "string explaining week's focus",
              "totalMileage": "string",
              "workouts": [
                {
                  "id": number,
                  "day": "string - day of week",
                  "type": "string - workout type",
                  "description": "string",
                  "duration": "string",
                  "distance": "string",
                  "intensity": "string - one of: easy, moderate, hard, recovery, race",
                  "warmUp": "string",
                  "mainSet": ["string array of main workout components"],
                  "coolDown": "string",
                  "notes": "string with special considerations"
                }
              ]
            }
          ]
        }
        
        Make sure the response is in valid JSON format that can be parsed directly.
      `;

      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse the response as JSON
      try {
        const trainingPlan = JSON.parse(text);
        res.json(trainingPlan);
      } catch (error) {
        console.error("Error parsing AI response as JSON:", error);
        
        // If we couldn't parse as JSON, try to extract JSON portion
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const jsonText = jsonMatch[0];
            const trainingPlan = JSON.parse(jsonText);
            res.json(trainingPlan);
          } catch (jsonError) {
            res.status(500).json({ 
              error: "Failed to parse training plan. Please try again." 
            });
          }
        } else {
          res.status(500).json({ 
            error: "Failed to generate a valid training plan. Please try again." 
          });
        }
      }
    } catch (error: any) {
      console.error("Error generating training plan:", error);
      res.status(500).json({ 
        error: `Failed to generate training plan: ${error.message}` 
      });
    }
  });

  // Coach API endpoints
  app.get("/api/coaching-sessions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      // Check if user has an active subscription
      const user = req.user;
      
      if (user.subscription_status !== "active") {
        return res.status(403).json({ 
          error: "Active subscription required to access coaching services" 
        });
      }
      
      const sessions = await storage.getCoachingSessions(user.id, 'athlete');
      res.json(sessions);
    } catch (error: any) {
      console.error("Error fetching coaching sessions:", error);
      res.status(500).json({ 
        error: `Failed to fetch coaching sessions: ${error.message}` 
      });
    }
  });

  // Create new coaching session (for users with active subscription)
  app.post("/api/coaching-sessions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const user = req.user;
      
      // Verify subscription status
      if (user.subscription_status !== "active") {
        return res.status(403).json({ 
          error: "Active subscription required to access coaching services" 
        });
      }
      
      const { coach_id, goals, questions } = req.body;
      
      if (!coach_id) {
        return res.status(400).json({ error: "Coach ID is required" });
      }
      
      // Verify coach exists
      const coach = await storage.getCoachById(coach_id);
      if (!coach) {
        return res.status(404).json({ error: "Coach not found" });
      }
      
      // Create coaching session
      const session = await storage.createCoachingSession({
        athlete_id: user.id,
        coach_id,
        status: "active",
        type: "coaching",
        session_date: new Date(),
        duration_minutes: 60,
        notes: `Goals: ${goals || "Not specified"}\nQuestions: ${questions || "None"}`
      });
      
      res.status(201).json(session);
    } catch (error: any) {
      console.error("Error creating coaching session:", error);
      res.status(500).json({ 
        error: `Failed to create coaching session: ${error.message}` 
      });
    }
  });
  
  // Nutrition AI Recommendation System Routes
  
  // Get user's nutrition preferences
  app.get("/api/nutrition/preferences/:userId", checkAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Ensure user can only access their own preferences
      if (parseInt(userId) !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized access to nutrition preferences" });
      }
      
      const [preferences] = await db.select().from(nutrition_preferences)
        .where(eq(nutrition_preferences.user_id, parseInt(userId)));
      
      if (!preferences) {
        return res.status(404).json({ error: "Nutrition preferences not found" });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching nutrition preferences:", error);
      res.status(500).json({ error: "Failed to fetch nutrition preferences" });
    }
  });
  
  // Save or update nutrition preferences
  app.post("/api/nutrition/preferences", checkAuth, async (req, res) => {
    try {
      const { user_id } = req.body;
      
      // Ensure user can only modify their own preferences
      if (parseInt(user_id) !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized to modify these nutrition preferences" });
      }
      
      // Check if preferences already exist
      const [existingPreferences] = await db.select().from(nutrition_preferences)
        .where(eq(nutrition_preferences.user_id, parseInt(user_id)));
      
      let savedPreferences;
      
      if (existingPreferences) {
        // Update existing preferences
        [savedPreferences] = await db.update(nutrition_preferences)
          .set({
            ...req.body,
            updated_at: new Date()
          })
          .where(eq(nutrition_preferences.user_id, parseInt(user_id)))
          .returning();
      } else {
        // Create new preferences
        [savedPreferences] = await db.insert(nutrition_preferences)
          .values(req.body)
          .returning();
      }
      
      res.status(201).json(savedPreferences);
    } catch (error) {
      console.error("Error saving nutrition preferences:", error);
      res.status(500).json({ error: "Failed to save nutrition preferences" });
    }
  });
  
  // Get meal plan for a specific date
  app.get("/api/nutrition/meal-plans/:userId/:date", checkAuth, async (req, res) => {
    try {
      const { userId, date } = req.params;
      
      // Ensure user can only access their own meal plans
      if (parseInt(userId) !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized access to meal plans" });
      }
      
      // First get the meal plan
      const [mealPlan] = await db.select().from(meal_plans)
        .where(and(
          eq(meal_plans.user_id, parseInt(userId)),
          eq(meal_plans.plan_date, date),
          eq(meal_plans.is_active, true)
        ));
      
      if (!mealPlan) {
        return res.status(404).json({ error: "Meal plan not found" });
      }
      
      // Get all meals for this plan
      const mealsList = await db.select().from(meals)
        .where(eq(meals.meal_plan_id, mealPlan.id));
      
      // Get all food items for these meals
      const foodItemsMap = new Map();
      for (const meal of mealsList) {
        const mealFoodItems = await db.select({
          mealFoodItem: meal_food_items,
          foodItem: food_items
        })
        .from(meal_food_items)
        .innerJoin(food_items, eq(meal_food_items.food_item_id, food_items.id))
        .where(eq(meal_food_items.meal_id, meal.id));
        
        foodItemsMap.set(meal.id, mealFoodItems.map(item => ({
          ...item.foodItem,
          quantity: item.mealFoodItem.quantity
        })));
      }
      
      // Construct the response
      const result = {
        ...mealPlan,
        meals: mealsList.map(meal => ({
          ...meal,
          foodItems: foodItemsMap.get(meal.id) || []
        }))
      };
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching meal plan:", error);
      res.status(500).json({ error: "Failed to fetch meal plan" });
    }
  });
  
  // List food items by category
  app.get("/api/nutrition/food-items/:category", checkAuth, async (req, res) => {
    try {
      const { category } = req.params;
      
      const foodItemsList = await db.select().from(food_items)
        .where(eq(food_items.category, category))
        .limit(100);
      
      res.json(foodItemsList);
    } catch (error) {
      console.error(`Error fetching food items for category ${req.params.category}:`, error);
      res.status(500).json({ error: "Failed to fetch food items" });
    }
  });
  
  // Search food items
  app.get("/api/nutrition/food-items/search", checkAuth, async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.length < 2) {
        return res.status(400).json({ error: "Search query must be at least 2 characters" });
      }
      
      const searchResults = await db.select().from(food_items)
        .where(like(food_items.name, `%${query}%`))
        .limit(50);
      
      res.json(searchResults);
    } catch (error) {
      console.error("Error searching food items:", error);
      res.status(500).json({ error: "Failed to search food items" });
    }
  });
  
  // Generate AI meal plan recommendations
  app.post("/api/nutrition/generate", checkAuth, isSubscribed, async (req, res) => {
    try {
      if (!googleAI) {
        return res.status(503).json({ error: "AI service is not available" });
      }
      
      const {
        userId,
        date,
        trainingLoad,
        userPreferences,
        activityLevel,
        fitnessGoals,
        healthConditions,
        recoverySituation,
        useWeeklyMealPlanning
      } = req.body;
      
      // Ensure user can only generate meal plans for themselves
      if (parseInt(userId) !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized to generate meal plans for this user" });
      }
      
      // Prepare the context for the AI
      const context = `
      You are a professional sports nutritionist specializing in endurance athletes, particularly runners.
      Create a detailed meal plan optimized for an athlete with the following profile:
      
      Date: ${date}
      Training Load: ${trainingLoad}
      Activity Level: ${activityLevel}
      Fitness Goals: ${fitnessGoals.join(", ")}
      ${healthConditions ? `Health Conditions: ${healthConditions.join(", ")}` : ""}
      ${recoverySituation ? `Recovery Situation: ${recoverySituation}` : ""}
      
      Dietary Preferences:
      ${userPreferences.dietaryRestrictions ? `Restrictions: ${userPreferences.dietaryRestrictions.join(", ")}` : "No specific dietary restrictions"}
      ${userPreferences.allergies ? `Allergies: ${userPreferences.allergies.join(", ")}` : "No allergies"}
      ${userPreferences.dislikedFoods ? `Dislikes: ${userPreferences.dislikedFoods.join(", ")}` : ""}
      ${userPreferences.favoriteFoods ? `Favorites: ${userPreferences.favoriteFoods.join(", ")}` : ""}
      
      Nutrition Targets:
      ${userPreferences.calorieGoal ? `Calories: ${userPreferences.calorieGoal} calories` : ""}
      ${userPreferences.proteinGoal ? `Protein: ${userPreferences.proteinGoal}%` : ""}
      ${userPreferences.carbsGoal ? `Carbs: ${userPreferences.carbsGoal}%` : ""}
      ${userPreferences.fatGoal ? `Fat: ${userPreferences.fatGoal}%` : ""}
      
      Please create a ${useWeeklyMealPlanning ? 'weekly' : 'daily'} meal plan with detailed macronutrient information.
      For each meal, provide:
      1. Meal name and type (breakfast, lunch, dinner, snack)
      2. List of ingredients with quantities
      3. Nutritional information (calories, protein, carbs, fat)
      4. Simple recipe instructions
      
      Ensure the meals are practical for an athlete, focus on whole foods, and align with the training load for the day.
      For heavy training days, include more carbohydrates. For recovery days, emphasize protein and anti-inflammatory foods.
      
      Return ONLY the meal plan in JSON format with the following structure:
      {
        "dailyPlan": {
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number,
          "hydration": number,
          "meals": [
            {
              "name": string,
              "mealType": string,
              "timeOfDay": string,
              "calories": number,
              "protein": number,
              "carbs": number,
              "fat": number,
              "foods": [
                {
                  "name": string,
                  "quantity": number,
                  "servingUnit": string,
                  "calories": number,
                  "protein": number,
                  "carbs": number,
                  "fat": number
                }
              ],
              "recipe": string,
              "preparationTime": number
            }
          ]
        },
        "weeklyPlans": [...] (only if weeklyPlanning is true),
        "notes": string
      }
      `;
      
      // Generate the AI meal plan
      const result = await geminiModel.generateContent(context);
      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      try {
        // Find the JSON object in the text (in case the model added explanatory text)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in the response");
        }
        
        const mealPlan = JSON.parse(jsonMatch[0]);
        res.json(mealPlan);
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        console.log("Raw AI response:", text);
        res.status(500).json({ 
          error: "Failed to parse AI meal plan",
          rawResponse: text
        });
      }
    } catch (error) {
      console.error("Error generating AI meal plan:", error);
      res.status(500).json({ error: "Failed to generate AI meal plan" });
    }
  });
  
  // Save meal plan to database
  app.post("/api/nutrition/save-plan", checkAuth, async (req, res) => {
    try {
      const { mealPlan, meals, foodItems } = req.body;
      
      // Ensure user can only save meal plans for themselves
      if (parseInt(mealPlan.user_id) !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized to save meal plans for this user" });
      }
      
      // Start a transaction
      return await db.transaction(async (tx) => {
        // First insert (or update) the meal plan
        let savedMealPlanId;
        
        // Check if a meal plan already exists for this date
        const [existingPlan] = await tx.select().from(meal_plans)
          .where(and(
            eq(meal_plans.user_id, parseInt(mealPlan.user_id)),
            eq(meal_plans.plan_date, mealPlan.plan_date)
          ));
        
        if (existingPlan) {
          // Deactivate the existing plan
          await tx.update(meal_plans)
            .set({ is_active: false })
            .where(eq(meal_plans.id, existingPlan.id));
        }
        
        // Insert the new meal plan
        const [savedMealPlan] = await tx.insert(meal_plans)
          .values(mealPlan)
          .returning();
        
        savedMealPlanId = savedMealPlan.id;
        
        // Insert each meal
        const savedMeals = [];
        for (const meal of meals) {
          const mealToSave = {
            ...meal,
            meal_plan_id: savedMealPlanId
          };
          
          const [savedMeal] = await tx.insert(meals)
            .values(mealToSave)
            .returning();
          
          savedMeals.push(savedMeal);
          
          // Get meal's food items
          const mealFoodItems = foodItems.filter(item => item.mealId === meal.tempId);
          
          // Insert each food item
          for (const foodItem of mealFoodItems) {
            // Check if food item already exists
            let foodItemId;
            const [existingFoodItem] = await tx.select().from(food_items)
              .where(eq(food_items.name, foodItem.name));
            
            if (existingFoodItem) {
              foodItemId = existingFoodItem.id;
            } else {
              // If not, insert it
              const itemToSave = {
                name: foodItem.name,
                category: foodItem.category || 'other',
                calories: foodItem.calories,
                protein: foodItem.protein,
                carbs: foodItem.carbs,
                fat: foodItem.fat,
                serving_size: foodItem.servingSize || '1',
                serving_unit: foodItem.servingUnit || 'serving'
              };
              
              const [savedFoodItem] = await tx.insert(food_items)
                .values(itemToSave)
                .returning();
              
              foodItemId = savedFoodItem.id;
            }
            
            // Connect food item to meal
            await tx.insert(meal_food_items)
              .values({
                meal_id: savedMeal.id,
                food_item_id: foodItemId,
                quantity: foodItem.quantity || 1
              });
          }
        }
        
        res.status(201).json({
          mealPlan: savedMealPlan,
          meals: savedMeals
        });
      });
    } catch (error) {
      console.error("Error saving meal plan:", error);
      res.status(500).json({ error: "Failed to save meal plan" });
    }
  });

  // Third-party fitness platform integrations
  // Route to get all user integrations
  app.get('/api/integrations', checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get all integration connections for the user
      const connections = await db.select()
        .from(integration_connections)
        .where(eq(integration_connections.user_id, userId));
      
      // Format response as key-value object with platform names as keys
      const result: Record<string, boolean> = {
        strava: false,
        garmin: false,
        polar: false
      };
      
      connections.forEach(connection => {
        if (connection.is_active) {
          result[connection.platform] = true;
        }
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      res.status(500).json({ error: 'Failed to fetch integrations' });
    }
  });
  
  // Route to get sync status for a specific platform
  app.get('/api/integrations/:platform/sync-status', checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const platform = req.params.platform;
      
      // Get the integration connection
      const [connection] = await db.select()
        .from(integration_connections)
        .where(and(
          eq(integration_connections.user_id, userId),
          eq(integration_connections.platform, platform),
          eq(integration_connections.is_active, true)
        ));
      
      if (!connection) {
        return res.status(404).json({ error: 'Integration not found' });
      }
      
      // Get the most recent successful sync log
      const [lastSuccessfulSync] = await db.select()
        .from(sync_logs)
        .where(and(
          eq(sync_logs.user_id, userId),
          eq(sync_logs.platform, platform),
          eq(sync_logs.status, 'completed')
        ))
        .orderBy(desc(sync_logs.sync_end_time))
        .limit(1);
      
      res.json({
        lastSynced: connection.last_sync_at?.toISOString() || null,
        autoSync: connection.auto_sync,
        syncFrequency: connection.sync_frequency,
        activitiesSynced: lastSuccessfulSync ? lastSuccessfulSync.activities_synced : 0
      });
    } catch (error) {
      console.error(`Error fetching sync status for ${req.params.platform}:`, error);
      res.status(500).json({ error: `Failed to fetch sync status for ${req.params.platform}` });
    }
  });
  
  // Route to authenticate with Strava
  app.post('/api/integrations/strava/authenticate', checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
      }
      
      // Exchange authorization code for access token
      const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      });
      
      const { access_token, refresh_token, expires_at, athlete } = tokenResponse.data;
      
      // Check if connection already exists
      const [existingConnection] = await db.select()
        .from(integration_connections)
        .where(and(
          eq(integration_connections.user_id, userId),
          eq(integration_connections.platform, 'strava')
        ));
      
      if (existingConnection) {
        // Update existing connection
        await db.update(integration_connections)
          .set({
            access_token,
            refresh_token,
            token_expires_at: new Date(expires_at * 1000),
            is_active: true,
            updated_at: new Date()
          })
          .where(eq(integration_connections.id, existingConnection.id));
      } else {
        // Create new connection
        await db.insert(integration_connections).values({
          user_id: userId,
          platform: 'strava',
          access_token,
          refresh_token,
          token_expires_at: new Date(expires_at * 1000),
          athlete_id: athlete.id.toString(),
          is_active: true,
          auto_sync: true,
          sync_frequency: 'daily'
        });
      }
      
      // Create sync log entry
      await db.insert(sync_logs).values({
        user_id: userId,
        platform: 'strava',
        sync_start_time: new Date(),
        status: 'in_progress'
      });
      
      // Initiate background sync process
      void syncStravaData({ userId, access_token, refresh_token, expires_at });
      
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error authenticating with Strava:', error);
      res.status(500).json({ 
        error: 'Failed to authenticate with Strava',
        details: error.response?.data || error.message
      });
    }
  });
  
  // Route to authenticate with Garmin
  app.post('/api/integrations/garmin/authenticate', checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
      }
      
      // Exchange authorization code for access token
      // Note: Garmin's OAuth implementation is different from the standard
      // This is a simplified example - in reality, you'd need to follow Garmin's specific API
      const tokenResponse = await axios.post('https://connectapi.garmin.com/oauth-service/oauth/token', {
        client_id: process.env.GARMIN_CLIENT_ID,
        client_secret: process.env.GARMIN_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      });
      
      const { access_token, refresh_token, expires_in, user_id: athleteId } = tokenResponse.data;
      
      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
      
      // Check if connection already exists
      const [existingConnection] = await db.select()
        .from(integration_connections)
        .where(and(
          eq(integration_connections.user_id, userId),
          eq(integration_connections.platform, 'garmin')
        ));
      
      if (existingConnection) {
        // Update existing connection
        await db.update(integration_connections)
          .set({
            access_token,
            refresh_token,
            token_expires_at: expiresAt,
            is_active: true,
            updated_at: new Date()
          })
          .where(eq(integration_connections.id, existingConnection.id));
      } else {
        // Create new connection
        await db.insert(integration_connections).values({
          user_id: userId,
          platform: 'garmin',
          access_token,
          refresh_token,
          token_expires_at: expiresAt,
          athlete_id: athleteId.toString(),
          is_active: true,
          auto_sync: true,
          sync_frequency: 'daily'
        });
      }
      
      // Create sync log entry
      await db.insert(sync_logs).values({
        user_id: userId,
        platform: 'garmin',
        sync_start_time: new Date(),
        status: 'in_progress'
      });
      
      // Initiate background sync process
      void syncGarminData({ userId, access_token, refresh_token, expires_at: expiresAt.getTime() / 1000 });
      
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error authenticating with Garmin:', error);
      res.status(500).json({ 
        error: 'Failed to authenticate with Garmin',
        details: error.response?.data || error.message 
      });
    }
  });
  
  // Route to authenticate with Polar
  app.post('/api/integrations/polar/authenticate', checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
      }
      
      // Exchange authorization code for access token
      const tokenResponse = await axios.post('https://polarremote.com/v2/oauth2/token', {
        client_id: process.env.POLAR_CLIENT_ID,
        client_secret: process.env.POLAR_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      });
      
      const { access_token, x_user_id } = tokenResponse.data;
      
      // Polar tokens don't expire, so we don't need to store an expiration time
      
      // Check if connection already exists
      const [existingConnection] = await db.select()
        .from(integration_connections)
        .where(and(
          eq(integration_connections.user_id, userId),
          eq(integration_connections.platform, 'polar')
        ));
      
      if (existingConnection) {
        // Update existing connection
        await db.update(integration_connections)
          .set({
            access_token,
            is_active: true,
            updated_at: new Date()
          })
          .where(eq(integration_connections.id, existingConnection.id));
      } else {
        // Create new connection
        await db.insert(integration_connections).values({
          user_id: userId,
          platform: 'polar',
          access_token,
          athlete_id: x_user_id,
          is_active: true,
          auto_sync: true,
          sync_frequency: 'daily'
        });
      }
      
      // Create sync log entry
      await db.insert(sync_logs).values({
        user_id: userId,
        platform: 'polar',
        sync_start_time: new Date(),
        status: 'in_progress'
      });
      
      // Initiate background sync process
      void syncPolarData({ userId, access_token });
      
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error authenticating with Polar:', error);
      res.status(500).json({ 
        error: 'Failed to authenticate with Polar',
        details: error.response?.data || error.message 
      });
    }
  });
  
  // Route to disconnect an integration
  app.delete('/api/integrations/:platform', checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const platform = req.params.platform;
      
      // Update the connection to inactive
      await db.update(integration_connections)
        .set({ 
          is_active: false,
          updated_at: new Date()
        })
        .where(and(
          eq(integration_connections.user_id, userId),
          eq(integration_connections.platform, platform)
        ));
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error(`Error disconnecting ${req.params.platform}:`, error);
      res.status(500).json({ error: `Failed to disconnect ${req.params.platform}` });
    }
  });
  
  // Route to manually sync activities from a platform
  app.post('/api/integrations/:platform/sync', checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const platform = req.params.platform;
      const { forceSync = false } = req.body;
      
      // Get the integration connection
      const [connection] = await db.select()
        .from(integration_connections)
        .where(and(
          eq(integration_connections.user_id, userId),
          eq(integration_connections.platform, platform),
          eq(integration_connections.is_active, true)
        ));
      
      if (!connection) {
        return res.status(404).json({ error: 'Integration not found or not active' });
      }
      
      // Create sync log entry
      const [syncLog] = await db.insert(sync_logs)
        .values({
          user_id: userId,
          platform: platform,
          sync_start_time: new Date(),
          status: 'in_progress'
        })
        .returning();
      
      // Initiate sync based on platform
      let syncPromise;
      
      switch (platform) {
        case 'strava':
          syncPromise = syncStravaData({
            userId,
            access_token: connection.access_token,
            refresh_token: connection.refresh_token,
            expires_at: connection.token_expires_at?.getTime() ? connection.token_expires_at.getTime() / 1000 : undefined,
            forceSync,
            syncLogId: syncLog.id
          });
          break;
          
        case 'garmin':
          syncPromise = syncGarminData({
            userId,
            access_token: connection.access_token,
            refresh_token: connection.refresh_token,
            expires_at: connection.token_expires_at?.getTime() ? connection.token_expires_at.getTime() / 1000 : undefined,
            forceSync,
            syncLogId: syncLog.id
          });
          break;
          
        case 'polar':
          syncPromise = syncPolarData({
            userId,
            access_token: connection.access_token,
            forceSync,
            syncLogId: syncLog.id
          });
          break;
          
        default:
          return res.status(400).json({ error: 'Unsupported platform' });
      }
      
      // We don't await the sync to complete, as it may take time
      void syncPromise;
      
      // Respond immediately with the sync initiation status
      res.status(200).json({ 
        message: 'Sync initiated',
        syncId: syncLog.id,
        estimatedTimeInSeconds: 30 // Estimated time for sync to complete
      });
    } catch (error) {
      console.error(`Error initiating sync for ${req.params.platform}:`, error);
      res.status(500).json({ error: `Failed to initiate sync for ${req.params.platform}` });
    }
  });
  
  // Route to update sync settings for a platform
  app.patch('/api/integrations/:platform/settings', checkAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const platform = req.params.platform;
      const { autoSync, syncFrequency } = req.body;
      
      // Validate input
      if (typeof autoSync !== 'boolean') {
        return res.status(400).json({ error: 'autoSync must be a boolean' });
      }
      
      if (syncFrequency && !['daily', 'realtime'].includes(syncFrequency)) {
        return res.status(400).json({ error: 'syncFrequency must be either "daily" or "realtime"' });
      }
      
      // Update the connection settings
      await db.update(integration_connections)
        .set({ 
          auto_sync: autoSync,
          ...(syncFrequency && { sync_frequency: syncFrequency }),
          updated_at: new Date()
        })
        .where(and(
          eq(integration_connections.user_id, userId),
          eq(integration_connections.platform, platform),
          eq(integration_connections.is_active, true)
        ));
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error(`Error updating sync settings for ${req.params.platform}:`, error);
      res.status(500).json({ error: `Failed to update sync settings for ${req.params.platform}` });
    }
  });

  // Onboarding routes
  app.get('/api/onboarding/status', requireAuth, async (req, res) => {
    try {
      const [status] = await db
        .select()
        .from(onboarding_status)
        .where(eq(onboarding_status.user_id, req.user!.id));
      
      if (!status) {
        return res.status(404).json({ message: 'Onboarding status not found' });
      }
      
      res.json(status);
    } catch (error) {
      console.error('Error fetching onboarding status:', error);
      res.status(500).json({ message: 'Failed to fetch onboarding status' });
    }
  });

  app.post('/api/onboarding/status', requireAuth, async (req, res) => {
    try {
      // Check if status already exists
      const [existingStatus] = await db
        .select()
        .from(onboarding_status)
        .where(eq(onboarding_status.user_id, req.user!.id));
      
      if (existingStatus) {
        // Update existing status
        const [updatedStatus] = await db
          .update(onboarding_status)
          .set({
            ...req.body,
            updated_at: new Date(),
          })
          .where(eq(onboarding_status.id, existingStatus.id))
          .returning();
        
        return res.json(updatedStatus);
      }
      
      // Create new status
      const [newStatus] = await db
        .insert(onboarding_status)
        .values({
          user_id: req.user!.id,
          ...req.body,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning();
      
      res.status(201).json(newStatus);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      res.status(500).json({ message: 'Failed to save onboarding status' });
    }
  });

  // Fitness goals
  app.get('/api/onboarding/fitness-goals', requireAuth, async (req, res) => {
    try {
      const [goals] = await db
        .select()
        .from(fitness_goals)
        .where(eq(fitness_goals.user_id, req.user!.id));
      
      if (!goals) {
        return res.status(404).json({ message: 'Fitness goals not found' });
      }
      
      res.json(goals);
    } catch (error) {
      console.error('Error fetching fitness goals:', error);
      res.status(500).json({ message: 'Failed to fetch fitness goals' });
    }
  });

  app.post('/api/onboarding/fitness-goals', requireAuth, async (req, res) => {
    try {
      // Check if goals already exist
      const [existingGoals] = await db
        .select()
        .from(fitness_goals)
        .where(eq(fitness_goals.user_id, req.user!.id));
      
      if (existingGoals) {
        // Update existing goals
        // Extract only the fields that exist in our schema
        const {
          primary_goal,
          goal_event_type,
          goal_distance,
          goal_time,
          goal_date,
          has_target_race,
          weight_goal,
          target_weight,
          current_weight
        } = req.body;
        
        // Map client data to database schema - avoiding using 'notes' which doesn't exist
        const goalsData = {
          goal_type: primary_goal || existingGoals.goal_type,
          target_value: goal_distance,
          target_unit: goal_event_type ? "km" : existingGoals.target_unit,
          target_date: goal_date ? new Date(goal_date) : existingGoals.target_date,
          // Store additional information in available fields
          race_distance: goal_event_type || existingGoals.race_distance,
          target_time: goal_time || existingGoals.target_time,
          experience_level: weight_goal || existingGoals.experience_level,
          weekly_mileage: current_weight || existingGoals.weekly_mileage,
          frequency_per_week: has_target_race ? 3 : 2, // Default frequency based on whether they have a race goal
          updated_at: new Date(),
        };
        
        const [updatedGoals] = await db
          .update(fitness_goals)
          .set(goalsData)
          .where(eq(fitness_goals.id, existingGoals.id))
          .returning();
        
        return res.json(updatedGoals);
      }
      
      // Create new goals
      // Extract only the fields that exist in our schema
      const {
        primary_goal,
        goal_event_type,
        goal_distance,
        goal_time,
        goal_date,
        has_target_race,
        weight_goal,
        target_weight,
        current_weight
      } = req.body;
      
      // Map client data to database schema - avoiding using 'notes' which doesn't exist
      const goalsData = {
        user_id: req.user!.id,
        goal_type: primary_goal || "general_fitness",
        target_value: goal_distance,
        target_unit: goal_event_type ? "km" : null,
        time_frame: null,
        time_frame_unit: null,
        start_date: new Date(),
        target_date: goal_date ? new Date(goal_date) : null,
        status: "active",
        // Store goal_time in race_distance since we don't have notes field
        race_distance: goal_event_type || null,
        target_time: goal_time || null,
        experience_level: weight_goal || "intermediate",
        weekly_mileage: current_weight, // Use an existing numeric field
        frequency_per_week: has_target_race ? 3 : 2, // Default frequency based on whether they have a race goal
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      const [newGoals] = await db
        .insert(fitness_goals)
        .values(goalsData)
        .returning();
      
      res.status(201).json(newGoals);
    } catch (error) {
      console.error('Error saving fitness goals:', error);
      res.status(500).json({ message: 'Failed to save fitness goals' });
    }
  });

  // Goals management
  app.post('/api/goals', requireAuth, async (req, res) => {
    try {
      // Extract data from request body
      const {
        primary_goal,
        goal_event_type,
        goal_distance,
        goal_time,
        goal_date,
        has_target_race,
        weight_goal,
        target_weight,
        current_weight,
        experience_level
      } = req.body;
      
      // Map client data to database schema
      const goalsData = {
        user_id: req.user!.id,
        goal_type: primary_goal || "general_fitness",
        target_value: goal_distance || (target_weight ? parseFloat(current_weight) - parseFloat(target_weight) : null),
        target_unit: primary_goal === "race" ? "km" : (primary_goal === "weight" ? "kg" : null),
        time_frame: null,
        time_frame_unit: null,
        start_date: new Date(),
        target_date: goal_date ? new Date(goal_date) : null,
        status: "active",
        race_distance: goal_event_type || null,
        target_time: goal_time || null,
        experience_level: experience_level || "intermediate",
        weekly_mileage: current_weight ? parseFloat(current_weight) : null,
        frequency_per_week: has_target_race ? 3 : 2,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      const [newGoal] = await db
        .insert(fitness_goals)
        .values(goalsData)
        .returning();
      
      res.status(201).json(newGoal);
    } catch (error) {
      console.error('Error creating goal:', error);
      res.status(500).json({ message: 'Failed to create goal' });
    }
  });
  
  app.get('/api/goals', requireAuth, async (req, res) => {
    try {
      const goals = await db
        .select()
        .from(fitness_goals)
        .where(eq(fitness_goals.user_id, req.user!.id))
        .orderBy(desc(fitness_goals.created_at));
      
      res.json(goals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      res.status(500).json({ message: 'Failed to fetch goals' });
    }
  });
  
  app.get('/api/goals/:id', requireAuth, async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      
      const [goal] = await db
        .select()
        .from(fitness_goals)
        .where(and(
          eq(fitness_goals.id, goalId),
          eq(fitness_goals.user_id, req.user!.id)
        ));
      
      if (!goal) {
        return res.status(404).json({ message: 'Goal not found' });
      }
      
      res.json(goal);
    } catch (error) {
      console.error('Error fetching goal:', error);
      res.status(500).json({ message: 'Failed to fetch goal' });
    }
  });
  
  // Get activities related to a goal for visualization
  app.get('/api/goals/:id/activities', requireAuth, async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      
      // First verify goal exists and belongs to user
      const [goal] = await db
        .select()
        .from(fitness_goals)
        .where(and(
          eq(fitness_goals.id, goalId), 
          eq(fitness_goals.user_id, req.user!.id)
        ));
        
      if (!goal) {
        return res.status(404).json({ message: 'Goal not found' });
      }
      
      // Get all running activities after the goal creation date
      const goalActivities = await db
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.user_id, req.user!.id),
            gte(activities.activity_date, goal.created_at || new Date())
          )
        )
        .orderBy(activities.activity_date);
      
      // Determine which activities contribute to the goal
      const enhancedActivities = goalActivities.map(activity => {
        // For race goals, any running activity contributes
        const isCompleted = goal.goal_type === 'race' 
          ? activity.activity_type.toLowerCase().includes('run')
          : true; // For other goals, all activities count
        
        return {
          ...activity,
          is_completed: isCompleted
        };
      });
      
      res.json(enhancedActivities);
    } catch (error) {
      console.error('Error getting goal activities:', error);
      res.status(500).json({ message: 'Failed to get goal activities' });
    }
  });
  
  // Get goal comparison data (compared with other users with similar goals)
  app.get('/api/goals/:id/comparison', requireAuth, async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      
      // First verify goal exists and belongs to user
      const [goal] = await db
        .select()
        .from(fitness_goals)
        .where(and(
          eq(fitness_goals.id, goalId), 
          eq(fitness_goals.user_id, req.user!.id)
        ));
        
      if (!goal) {
        return res.status(404).json({ message: 'Goal not found' });
      }
      
      // Get similar goals from other users
      const similarGoals = await db
        .select()
        .from(fitness_goals)
        .where(
          and(
            eq(fitness_goals.goal_type, goal.goal_type),
            ne(fitness_goals.user_id, req.user!.id),
            // For race goals, match by target distance
            goal.goal_type === 'race' && goal.target_distance 
              ? eq(fitness_goals.target_distance, goal.target_distance) 
              : undefined
          )
        );
      
      // Extract progress value (can be stored in target_value or a custom progress field)
      // For the purpose of demo, let's use a progress calculation based on the goal type
      let progressValue = 0;
      if (goal.goal_type === 'race') {
        // For race goals, calculate progress based on training completed percentage
        progressValue = 75; // Example progress value - in real app would be calculated
      } else if (goal.goal_type === 'weight_loss') {
        // For weight loss goals, calculate progress based on weight lost
        progressValue = 60; // Example progress value
      } else {
        // For other goals, use a default calculation
        progressValue = 50;
      }
      
      // Calculate similar goals progress values
      const goalWithProgress = {
        ...goal,
        progress: progressValue
      };
      
      const similarGoalsWithProgress = similarGoals.map(g => {
        // Simulate progress for similar goals - in real app would be calculated
        const randomProgress = Math.floor(Math.random() * 100);
        return {
          ...g,
          progress: randomProgress
        };
      });
      
      // Calculate percentile ranking
      const totalUsers = similarGoalsWithProgress.length + 1; // Include current user
      const usersAhead = similarGoalsWithProgress.filter(g => (g.progress || 0) > (goalWithProgress.progress || 0)).length;
      
      const percentile = totalUsers > 1 
        ? Math.round(100 - (usersAhead / totalUsers) * 100)
        : 50; // Default to 50th percentile if no comparison data
      
      // Generate comparison data points
      const weeklyProgressPoints = 7; // Number of data points to generate
      
      // Calculate average progress for similar users
      const comparisonData = [];
      
      for (let i = 1; i <= weeklyProgressPoints; i++) {
        const weekProgress = Math.round((goalWithProgress.progress || 50) * (i / weeklyProgressPoints));
        
        // Calculate average progress for similar users at this point
        const avgProgress = similarGoalsWithProgress.length > 0
          ? Math.round(similarGoalsWithProgress.reduce((sum, g) => sum + ((g.progress || 0) * (i / weeklyProgressPoints)), 0) / similarGoalsWithProgress.length)
          : Math.round(weekProgress * 0.8); // Default to 80% of user's progress
        
        // Calculate top performers (90th percentile)
        const topProgress = similarGoalsWithProgress.length > 3
          ? Math.round(
              similarGoalsWithProgress
                .map(g => (g.progress || 0) * (i / weeklyProgressPoints))
                .sort((a, b) => b - a)
                .slice(0, Math.max(1, Math.floor(similarGoalsWithProgress.length * 0.1)))
                .reduce((sum, p) => sum + p, 0) / Math.max(1, Math.floor(similarGoalsWithProgress.length * 0.1))
            )
          : Math.round(weekProgress * 1.2); // Default to 120% of user's progress
        
        comparisonData.push({
          name: `Week ${i}`,
          you: weekProgress,
          average: avgProgress,
          top: topProgress
        });
      }
      
      // Add current point
      comparisonData.push({
        name: 'Now',
        you: goalWithProgress.progress || 0,
        average: similarGoalsWithProgress.length > 0
          ? Math.round(similarGoalsWithProgress.reduce((sum, g) => sum + (g.progress || 0), 0) / similarGoalsWithProgress.length)
          : Math.round((goalWithProgress.progress || 0) * 0.8),
        top: similarGoalsWithProgress.length > 3
          ? Math.round(
              similarGoalsWithProgress
                .map(g => g.progress || 0)
                .sort((a, b) => b - a)
                .slice(0, Math.max(1, Math.floor(similarGoalsWithProgress.length * 0.1)))
                .reduce((sum, p) => sum + p, 0) / Math.max(1, Math.floor(similarGoalsWithProgress.length * 0.1))
            )
          : Math.round((goalWithProgress.progress || 0) * 1.2)
      });
      
      // Determine position based on percentile
      let position = "Average";
      if (percentile >= 90) position = "Top 10%";
      else if (percentile >= 75) position = "Top 25%";
      else if (percentile >= 50) position = "Above Average";
      else if (percentile >= 25) position = "Below Average";
      else position = "Bottom 25%";
      
      res.json({
        comparisonData,
        percentile,
        position,
        similarGoals: similarGoals.length,
        totalUsers
      });
    } catch (error) {
      console.error('Error getting goal comparison data:', error);
      res.status(500).json({ message: 'Failed to get goal comparison data' });
    }
  });
  
  // Get weight tracking data for weight loss goals
  app.get('/api/goals/:id/weight-data', requireAuth, async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      
      // First verify goal exists and belongs to user
      const [goal] = await db
        .select()
        .from(fitness_goals)
        .where(and(
          eq(fitness_goals.id, goalId), 
          eq(fitness_goals.user_id, req.user!.id)
        ));
        
      if (!goal) {
        return res.status(404).json({ message: 'Goal not found' });
      }
      
      if (goal.goal_type !== 'weight_loss') {
        return res.status(400).json({ message: 'This endpoint is only for weight loss goals' });
      }
      
      // Extract weight information from goal
      const startingWeight = parseFloat(goal.weekly_mileage?.toString() || '0'); // Using weekly_mileage for current_weight
      const targetValue = parseFloat(goal.target_value?.toString() || '0');
      const targetWeight = startingWeight - targetValue;
      
      // Calculate progress similar to the comparison endpoint
      let progressValue = 0;
      if (goal.goal_type === 'weight_loss') {
        // For weight loss goals, calculate progress based on weight lost
        progressValue = 60; // Example progress value
      } else {
        // Default fallback
        progressValue = 50;
      }
      
      // Calculate current weight based on progress
      const progress = progressValue;
      const weightLost = (targetValue * progress) / 100;
      const currentWeight = startingWeight - weightLost;
      
      // Get all weight check-ins from activities (could be from a separate table in a real app)
      const now = new Date();
      const createdDate = goal.created_at || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
      const targetDate = goal.target_date || new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // Default to 60 days in future
      
      // Generate weight data
      const weightData = [];
      const daysBetween = Math.round((now.getTime() - createdDate.getTime()) / (24 * 60 * 60 * 1000));
      const totalDays = Math.round((targetDate.getTime() - createdDate.getTime()) / (24 * 60 * 60 * 1000));
      const daysLeft = Math.round((targetDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      
      // Calculate needed weight loss per day to hit target
      const lossPerDay = targetValue / totalDays;
      
      // Calculate current daily loss rate
      const currentRate = weightLost / Math.max(1, daysBetween);
      
      // Determine if on track
      const isOnTrack = currentRate >= lossPerDay;
      
      // Calculate estimated completion
      let estimatedCompletionDate = new Date(targetDate);
      if (!isOnTrack && currentRate > 0) {
        // Calculate days needed to reach target weight
        const daysNeeded = (targetValue - weightLost) / currentRate;
        estimatedCompletionDate = new Date(now);
        estimatedCompletionDate.setDate(now.getDate() + daysNeeded);
      }
      
      // Calculate projected final weight
      const projectedLoss = currentRate * daysLeft;
      const expectedFinalWeight = parseFloat((currentWeight - projectedLoss).toFixed(1));
      
      // Add historical data points (weekly intervals)
      const weeksPassed = Math.ceil(daysBetween / 7);
      
      // Function to format date for chart
      const formatChartDate = (date: Date): string => {
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) return 'Today';
        
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric'
        }).format(date);
      };
      
      for (let i = 0; i < weeksPassed; i++) {
        const pastDate = new Date(createdDate);
        pastDate.setDate(createdDate.getDate() + (i * 7));
        
        // Calculate expected weight at this point
        const daysFromStart = Math.round((pastDate.getTime() - createdDate.getTime()) / (24 * 60 * 60 * 1000));
        const expectedLoss = lossPerDay * daysFromStart;
        const expectedWeight = parseFloat((startingWeight - expectedLoss).toFixed(1));
        
        // Calculate actual weight (simulated)
        const progressAtPoint = i / weeksPassed;
        const actualLoss = weightLost * progressAtPoint;
        const actualWeight = parseFloat((startingWeight - actualLoss).toFixed(1));
        
        weightData.push({
          name: formatChartDate(pastDate),
          weight: actualWeight,
          target: expectedWeight
        });
      }
      
      // Add current weight
      weightData.push({
        name: 'Now',
        weight: parseFloat(currentWeight.toFixed(1)),
        target: parseFloat((startingWeight - (lossPerDay * daysBetween)).toFixed(1))
      });
      
      // Add future projections
      const weeksLeft = Math.ceil(daysLeft / 7);
      
      for (let i = 1; i <= weeksLeft; i++) {
        const futureDate = new Date(now);
        futureDate.setDate(now.getDate() + (i * 7));
        
        // Calculate target weight at this point
        const daysFromStart = daysBetween + (i * 7);
        const targetLoss = lossPerDay * daysFromStart;
        const targetWeightAtPoint = parseFloat((startingWeight - targetLoss).toFixed(1));
        
        // Calculate projected weight
        const projectedLossAtPoint = currentRate * (i * 7);
        const projectedWeightAtPoint = parseFloat((currentWeight - projectedLossAtPoint).toFixed(1));
        
        weightData.push({
          name: formatChartDate(futureDate),
          weight: null, // No actual weight for future dates
          projected: projectedWeightAtPoint,
          target: targetWeightAtPoint
        });
      }
      
      res.json({
        startingWeight,
        currentWeight: parseFloat(currentWeight.toFixed(1)),
        targetWeight,
        weightData,
        projection: {
          estimatedCompletionDate,
          isOnTrack,
          expectedFinalWeight
        }
      });
    } catch (error) {
      console.error('Error getting weight data:', error);
      res.status(500).json({ message: 'Failed to get weight data' });
    }
  });
  
  app.put('/api/goals/:id', requireAuth, async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      
      // Check if goal exists and belongs to user
      const [existingGoal] = await db
        .select()
        .from(fitness_goals)
        .where(and(
          eq(fitness_goals.id, goalId),
          eq(fitness_goals.user_id, req.user!.id)
        ));
      
      if (!existingGoal) {
        return res.status(404).json({ message: 'Goal not found' });
      }
      
      // Extract data from request body
      const {
        goal_type,
        target_value,
        target_unit,
        target_date,
        status,
        race_distance,
        target_time,
        experience_level
      } = req.body;
      
      // Update goal
      const [updatedGoal] = await db
        .update(fitness_goals)
        .set({
          goal_type: goal_type || existingGoal.goal_type,
          target_value: target_value !== undefined ? target_value : existingGoal.target_value,
          target_unit: target_unit || existingGoal.target_unit,
          target_date: target_date ? new Date(target_date) : existingGoal.target_date,
          status: status || existingGoal.status,
          race_distance: race_distance || existingGoal.race_distance,
          target_time: target_time || existingGoal.target_time,
          experience_level: experience_level || existingGoal.experience_level,
          updated_at: new Date()
        })
        .where(eq(fitness_goals.id, goalId))
        .returning();
      
      res.json(updatedGoal);
    } catch (error) {
      console.error('Error updating goal:', error);
      res.status(500).json({ message: 'Failed to update goal' });
    }
  });
  
  app.delete('/api/goals/:id', requireAuth, async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      
      // Check if goal exists and belongs to user
      const [existingGoal] = await db
        .select()
        .from(fitness_goals)
        .where(and(
          eq(fitness_goals.id, goalId),
          eq(fitness_goals.user_id, req.user!.id)
        ));
      
      if (!existingGoal) {
        return res.status(404).json({ message: 'Goal not found' });
      }
      
      // Delete goal
      await db
        .delete(fitness_goals)
        .where(eq(fitness_goals.id, goalId));
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting goal:', error);
      res.status(500).json({ message: 'Failed to delete goal' });
    }
  });

  // User experience
  app.get('/api/onboarding/user-experience', requireAuth, async (req, res) => {
    try {
      const [experience] = await db
        .select()
        .from(experience_levels)
        .where(eq(experience_levels.user_id, req.user!.id));
      
      if (!experience) {
        return res.status(404).json({ message: 'User experience not found' });
      }
      
      res.json(experience);
    } catch (error) {
      console.error('Error fetching user experience:', error);
      res.status(500).json({ message: 'Failed to fetch user experience' });
    }
  });

  app.post('/api/onboarding/user-experience', requireAuth, async (req, res) => {
    try {
      // Check if experience already exists
      const [existingExperience] = await db
        .select()
        .from(experience_levels)
        .where(eq(experience_levels.user_id, req.user!.id));
      
      if (existingExperience) {
        // Update existing experience
        const [updatedExperience] = await db
          .update(experience_levels)
          .set({
            ...req.body,
            // Map experience_level from client to current_level in database
            current_level: req.body.experience_level,
            updated_at: new Date(),
          })
          .where(eq(experience_levels.id, existingExperience.id))
          .returning();
        
        return res.json(updatedExperience);
      }
      
      // Create new experience
      const [newExperience] = await db
        .insert(experience_levels)
        .values({
          user_id: req.user!.id,
          ...req.body,
          // Map experience_level from client to current_level in database
          current_level: req.body.experience_level,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning();
      
      res.status(201).json(newExperience);
    } catch (error) {
      console.error('Error saving user experience:', error);
      res.status(500).json({ message: 'Failed to save user experience' });
    }
  });

  // Training preferences
  app.get('/api/onboarding/training-preferences', requireAuth, async (req, res) => {
    try {
      const [preferences] = await db
        .select()
        .from(training_preferences)
        .where(eq(training_preferences.user_id, req.user!.id));
      
      if (!preferences) {
        return res.status(404).json({ message: 'Training preferences not found' });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error('Error fetching training preferences:', error);
      res.status(500).json({ message: 'Failed to fetch training preferences' });
    }
  });
  
  // Update onboarding preferences (for updating from settings page)
  app.put('/api/onboarding/update-preferences', requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { training_preferences: trainingPrefs, experience, fitness_goals: goals } = req.body;
      
      // Update training preferences
      if (trainingPrefs) {
        const existingPrefs = await db.query.training_preferences.findFirst({
          where: eq(training_preferences.user_id, userId)
        });
        
        if (existingPrefs) {
          await db.update(training_preferences)
            .set({
              ...trainingPrefs,
              updated_at: new Date()
            })
            .where(eq(training_preferences.user_id, userId));
        } else {
          await db.insert(training_preferences).values({
            user_id: userId,
            ...trainingPrefs,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
      
      // Update experience level
      if (experience) {
        const existingExp = await db.query.experience_levels.findFirst({
          where: eq(experience_levels.user_id, userId)
        });
        
        if (existingExp) {
          await db.update(experience_levels)
            .set({
              ...experience,
              updated_at: new Date()
            })
            .where(eq(experience_levels.user_id, userId));
        } else {
          await db.insert(experience_levels).values({
            user_id: userId,
            ...experience,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
      
      // Update fitness goals
      if (goals) {
        const existingGoals = await db.query.fitness_goals.findFirst({
          where: eq(fitness_goals.user_id, userId)
        });
        
        if (existingGoals) {
          await db.update(fitness_goals)
            .set({
              ...goals,
              updated_at: new Date()
            })
            .where(eq(fitness_goals.user_id, userId));
        } else {
          await db.insert(fitness_goals).values({
            user_id: userId,
            ...goals,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
      
      res.status(200).json({ message: 'Preferences updated successfully' });
    } catch (error) {
      console.error('Error updating preferences:', error);
      res.status(500).json({ message: 'Failed to update preferences' });
    }
  });

  app.post('/api/onboarding/training-preferences', requireAuth, async (req, res) => {
    try {
      // Check if preferences already exist
      const [existingPreferences] = await db
        .select()
        .from(training_preferences)
        .where(eq(training_preferences.user_id, req.user!.id));
      
      if (existingPreferences) {
        // Update existing preferences
        // Convert arrays to JSON strings for database storage
        const preferenceData = {
          rest_days: typeof req.body.rest_days === 'number' ? req.body.rest_days.toString() : req.body.rest_days,
          cross_training: req.body.cross_training || false,
          cross_training_activities: Array.isArray(req.body.cross_training_activities) 
            ? JSON.stringify(req.body.cross_training_activities) 
            : req.body.cross_training_activities,
          updated_at: new Date(),
        };
        
        // Add other fields that might be present
        if (req.body.preferred_days) {
          preferenceData.preferred_days = typeof req.body.preferred_days === 'object' 
            ? JSON.stringify(req.body.preferred_days) 
            : req.body.preferred_days;
        }
        
        if (req.body.preferred_time) {
          preferenceData.preferred_time = req.body.preferred_time;
        }
        
        if (req.body.long_run_day) {
          preferenceData.long_run_day = req.body.long_run_day;
        }
        
        // Store additional data in notes field as JSON
        const additionalData = {
          preferred_workout_types: req.body.preferred_workout_types || [],
          avoid_workout_types: req.body.avoid_workout_types || [],
          cross_training_days: req.body.cross_training_days,
          max_workout_duration: req.body.max_workout_duration
        };
        
        preferenceData.notes = JSON.stringify(additionalData);
        
        const [updatedPreferences] = await db
          .update(training_preferences)
          .set(preferenceData)
          .where(eq(training_preferences.id, existingPreferences.id))
          .returning();
        
        return res.json(updatedPreferences);
      }
      
      // Create new preferences
      // Convert arrays to JSON strings for database storage
      const preferenceData = {
        user_id: req.user!.id,
        rest_days: typeof req.body.rest_days === 'number' ? req.body.rest_days.toString() : req.body.rest_days,
        cross_training: req.body.cross_training || false,
        cross_training_activities: Array.isArray(req.body.cross_training_activities) 
          ? JSON.stringify(req.body.cross_training_activities) 
          : req.body.cross_training_activities,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      // Add other fields that might be present
      if (req.body.preferred_days) {
        preferenceData.preferred_days = typeof req.body.preferred_days === 'object' 
          ? JSON.stringify(req.body.preferred_days) 
          : req.body.preferred_days;
      }
      
      if (req.body.preferred_time) {
        preferenceData.preferred_time = req.body.preferred_time;
      }
      
      if (req.body.long_run_day) {
        preferenceData.long_run_day = req.body.long_run_day;
      }
      
      // Store additional data in notes field as JSON
      const additionalData = {
        preferred_workout_types: req.body.preferred_workout_types || [],
        avoid_workout_types: req.body.avoid_workout_types || [],
        cross_training_days: req.body.cross_training_days,
        max_workout_duration: req.body.max_workout_duration
      };
      
      preferenceData.notes = JSON.stringify(additionalData);
      
      const [newPreferences] = await db
        .insert(training_preferences)
        .values(preferenceData)
        .returning();
      
      res.status(201).json(newPreferences);
    } catch (error) {
      console.error('Error saving training preferences:', error);
      res.status(500).json({ message: 'Failed to save training preferences' });
    }
  });

  // Complete onboarding endpoint
  app.post('/api/onboarding/complete', requireAuth, async (req, res) => {
    try {
      // Update onboarding status to completed
      const [status] = await db
        .select()
        .from(onboarding_status)
        .where(eq(onboarding_status.user_id, req.user!.id));
      
      try {
        if (status) {
          // Use raw SQL to update all fields including the 'step' field that isn't in our schema
          await db.execute(`
            UPDATE onboarding_status 
            SET completed = true, 
                current_step = 'completed', 
                step = 'completed',
                last_updated = NOW(),
                updated_at = NOW()
            WHERE id = ${status.id}
          `);
        } else {
          // Use raw SQL to insert with all required fields
          await db.execute(`
            INSERT INTO onboarding_status 
            (user_id, completed, current_step, step, steps_completed, last_updated, created_at, updated_at)
            VALUES 
            (
              ${req.user!.id}, 
              true, 
              'completed', 
              'completed', 
              ARRAY['welcome', 'fitness-goals', 'experience', 'training-preferences', 'summary'], 
              NOW(), 
              NOW(), 
              NOW()
            )
          `);
        }
      } catch (error) {
        console.error('Error updating onboarding status with raw SQL:', error);
        throw error;
      }
      
      // Also update the user's profile if needed
      if (req.body.profile_updates) {
        await db
          .update(users)
          .set(req.body.profile_updates)
          .where(eq(users.id, req.user!.id));
      }
      
      res.json({ success: true, message: 'Onboarding completed successfully' });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      res.status(500).json({ message: 'Failed to complete onboarding' });
    }
  });

  const httpServer = createServer(app);
  
  // Add WebSocket server for coaching chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Track active connections by session ID and user ID
  const activeConnections: Map<string, Map<string, ws.WebSocket>> = new Map();
  
  wss.on('connection', (socket: ws.WebSocket, req: any) => {
    console.log('Client connected to coaching chat');
    let userId: string | null = null;
    let sessionId: string | null = null;
    
    socket.on('message', async (message: ws.RawData) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle initialization message
        if (data.type === 'init') {
          userId = data.userId;
          sessionId = data.sessionId;
          
          // Store connection for this user and session
          if (userId && sessionId) {
            if (!activeConnections.has(sessionId)) {
              activeConnections.set(sessionId, new Map());
            }
            const sessionMap = activeConnections.get(sessionId);
            if (sessionMap) {
              sessionMap.set(userId, socket);
            }
            
            // Send confirmation
            if (socket.readyState === ws.WebSocket.OPEN) {
              socket.send(JSON.stringify({ 
                type: 'init_confirmed', 
                sessionId 
              }));
            }
          }
        }
        // Handle chat messages
        else if (data.type === 'chat_message') {
          // Verify user is authenticated to send messages
          if (!userId || !sessionId) {
            if (socket.readyState === ws.WebSocket.OPEN) {
              socket.send(JSON.stringify({
                type: 'error',
                message: 'Not initialized. Send init message first.'
              }));
            }
            return;
          }
          
          // Save message to database (would implement in a real system)
          // For now, just broadcast to participants
          
          // Broadcast message to all users in this session
          const sessionConnections = activeConnections.get(sessionId);
          if (sessionConnections) {
            sessionConnections.forEach((clientSocket, clientId) => {
              if (clientSocket.readyState === ws.WebSocket.OPEN) {
                clientSocket.send(JSON.stringify({
                  type: 'chat_message',
                  message: data.message,
                  sender: userId,
                  timestamp: new Date().toISOString()
                }));
              }
            });
          }
          
          // If message mentions training plan and sender is coach
          if (data.message.toLowerCase().includes('training plan') && 
              data.isCoach) {
            // Flag that coach has suggested plan modifications
            // (In a real implementation, update the database)
            
            // Notify the athlete that the plan requires approval
            const athleteConnection = sessionConnections?.get(data.athleteId);
            if (athleteConnection && athleteConnection.readyState === ws.WebSocket.OPEN) {
              athleteConnection.send(JSON.stringify({
                type: 'plan_update_request',
                coachId: userId,
                message: 'Your coach has suggested changes to your training plan. Review and approve them in your dashboard.'
              }));
            }
          }
        }
        // Handle training plan approvals
        else if (data.type === 'plan_update_response') {
          if (!sessionId) return;
          
          if (data.approved) {
            // Update the plan (would implement in a real system)
            // For now, just notify coach
            
            // Notify coach of approval
            const sessionConnections = activeConnections.get(sessionId);
            const coachConnection = sessionConnections?.get(data.coachId);
            
            if (coachConnection && coachConnection.readyState === ws.WebSocket.OPEN) {
              coachConnection.send(JSON.stringify({
                type: 'plan_update_approved',
                athleteId: userId,
                message: 'The athlete has approved your training plan changes.'
              }));
            }
          } else {
            // Notify coach of rejection
            const sessionConnections = activeConnections.get(sessionId);
            const coachConnection = sessionConnections?.get(data.coachId);
            
            if (coachConnection && coachConnection.readyState === ws.WebSocket.OPEN) {
              coachConnection.send(JSON.stringify({
                type: 'plan_update_rejected',
                athleteId: userId,
                message: 'The athlete has declined your training plan changes.'
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
        if (socket.readyState === ws.WebSocket.OPEN) {
          socket.send(JSON.stringify({ 
            type: 'error', 
            message: 'Failed to process message' 
          }));
        }
      }
    });
    
    socket.on('close', () => {
      console.log('Client disconnected from coaching chat');
      
      // Remove connection from active connections
      if (userId && sessionId && activeConnections.has(sessionId)) {
        const sessionConnections = activeConnections.get(sessionId);
        if (sessionConnections) {
          sessionConnections.delete(userId);
          
          // If no more connections in this session, remove the session
          if (sessionConnections.size === 0) {
            activeConnections.delete(sessionId);
          }
        }
      }
    });
  });
  
  return httpServer;
}
