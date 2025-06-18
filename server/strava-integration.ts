import { Express, Request, Response } from "express";
import axios from "axios";
import { db } from "./db";
import { integration_connections, activities, health_metrics, sync_logs } from "@shared/schema";
import { and, eq } from "drizzle-orm";

// Strava OAuth configuration with your credentials
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID || '163144';
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

if (!STRAVA_CLIENT_SECRET) {
  throw new Error('STRAVA_CLIENT_SECRET environment variable is required');
}

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  start_date: string;
  moving_time: number;
  distance: number;
  average_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  total_elevation_gain: number;
  elev_high?: number;
  elev_low?: number;
}

interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function mapStravaActivityType(stravaType: string): string {
  const typeMap: { [key: string]: string } = {
    'Run': 'run',
    'Ride': 'bike',
    'Walk': 'walk',
    'Hike': 'hike',
    'Swim': 'swim',
    'WeightTraining': 'strength',
    'Workout': 'cross_train',
    'Yoga': 'yoga'
  };
  return typeMap[stravaType] || 'other';
}

async function refreshStravaToken(connection: any): Promise<string> {
  try {
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: connection.refresh_token,
      grant_type: 'refresh_token'
    });

    const { access_token, refresh_token, expires_at } = response.data;

    // Update stored tokens
    await db.update(integration_connections)
      .set({
        access_token,
        refresh_token,
        token_expires_at: new Date(expires_at * 1000),
        updated_at: new Date()
      })
      .where(eq(integration_connections.id, connection.id));

    return access_token;
  } catch (error) {
    console.error('Failed to refresh Strava token:', error);
    throw new Error('Token refresh failed');
  }
}

async function syncStravaActivities(userId: number, accessToken: string): Promise<number> {
  try {
    // Get activities from last 30 days
    const after = Math.floor((Date.now() - (30 * 24 * 60 * 60 * 1000)) / 1000);
    
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        after,
        per_page: 50
      }
    });

    const stravaActivities: StravaActivity[] = response.data;
    let syncedCount = 0;

    for (const activity of stravaActivities) {
      try {
        // Check if activity already exists
        const existingActivity = await db.query.activities.findFirst({
          where: and(
            eq(activities.user_id, userId),
            eq(activities.source, 'strava')
          )
        });

        const activityData = {
          user_id: userId,
          activity_date: activity.start_date.split('T')[0],
          activity_type: mapStravaActivityType(activity.type),
          distance: activity.distance ? (activity.distance / 1609.34).toFixed(2) : null, // Convert m to miles
          duration: activity.moving_time,
          pace: activity.distance > 0 ? 
            Math.floor((activity.moving_time / 60) / (activity.distance / 1609.34)).toString() : null,
          heart_rate: activity.average_heartrate || null,
          elevation_gain: activity.total_elevation_gain || null,
          notes: activity.name,
          source: 'strava',
          created_at: new Date(),
          updated_at: new Date()
        };

        if (!existingActivity) {
          await db.insert(activities).values(activityData);
          syncedCount++;
        }
      } catch (activityError) {
        console.error(`Error syncing activity ${activity.id}:`, activityError);
      }
    }

    return syncedCount;
  } catch (error) {
    console.error('Error syncing Strava activities:', error);
    throw error;
  }
}

export function setupStravaIntegration(app: Express) {
  // Initiate Strava OAuth
  app.get('/api/auth/strava', requireAuth, (req, res) => {
    const scope = 'read,activity:read_all,profile:read_all';
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/strava/callback`;
    
    const authUrl = `https://www.strava.com/oauth/authorize?` +
      `client_id=${STRAVA_CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `approval_prompt=force&` +
      `scope=${scope}&` +
      `state=${req.user!.id}`;
    
    res.redirect(authUrl);
  });

  // Strava OAuth callback
  app.get('/api/auth/strava/callback', requireAuth, async (req, res) => {
    try {
      const { code, state } = req.query;
      const userId = parseInt(state as string);
      
      if (userId !== req.user!.id) {
        return res.status(400).json({ error: 'Invalid state parameter' });
      }
      
      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/strava/callback`;
      
      // Exchange code for tokens
      const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      });
      
      const { access_token, refresh_token, expires_at, athlete } = tokenResponse.data;
      
      // Store connection
      await db.insert(integration_connections)
        .values({
          user_id: userId,
          platform: 'strava',
          access_token,
          refresh_token,
          token_expires_at: new Date(expires_at * 1000),
          athlete_id: athlete.id.toString(),
          is_active: true,
          scope: 'read,activity:read_all,profile:read_all',
          created_at: new Date(),
          updated_at: new Date()
        })
        .onConflictDoUpdate({
          target: [integration_connections.user_id, integration_connections.platform],
          set: {
            access_token,
            refresh_token,
            token_expires_at: new Date(expires_at * 1000),
            athlete_id: athlete.id.toString(),
            is_active: true,
            updated_at: new Date()
          }
        });
      
      // Initial sync
      const syncedCount = await syncStravaActivities(userId, access_token);
      
      res.redirect(`/settings?strava=connected&synced=${syncedCount}`);
    } catch (error) {
      console.error('Strava OAuth error:', error);
      res.redirect('/settings?strava=error');
    }
  });

  // Manual sync trigger
  app.post('/api/integrations/strava/sync', requireAuth, async (req, res) => {
    try {
      const connection = await db.query.integration_connections.findFirst({
        where: and(
          eq(integration_connections.user_id, req.user!.id),
          eq(integration_connections.platform, 'strava'),
          eq(integration_connections.is_active, true)
        )
      });

      if (!connection) {
        return res.status(404).json({ error: 'No active Strava connection found' });
      }

      let accessToken = connection.access_token;

      // Check if token needs refresh
      if (connection.token_expires_at && new Date() >= connection.token_expires_at) {
        accessToken = await refreshStravaToken(connection);
      }

      const syncedCount = await syncStravaActivities(req.user!.id, accessToken);

      // Update last sync time
      await db.update(integration_connections)
        .set({ 
          last_sync_at: new Date(),
          updated_at: new Date()
        })
        .where(eq(integration_connections.id, connection.id));

      res.json({ 
        message: 'Strava sync completed successfully', 
        activitiesSynced: syncedCount 
      });
    } catch (error) {
      console.error('Error syncing Strava data:', error);
      res.status(500).json({ error: 'Failed to sync Strava data' });
    }
  });

  // Disconnect Strava
  app.delete('/api/auth/strava', requireAuth, async (req, res) => {
    try {
      await db.update(integration_connections)
        .set({ 
          is_active: false, 
          updated_at: new Date() 
        })
        .where(and(
          eq(integration_connections.user_id, req.user!.id),
          eq(integration_connections.platform, 'strava')
        ));
      
      res.json({ message: 'Strava integration disconnected successfully' });
    } catch (error) {
      console.error('Error disconnecting Strava:', error);
      res.status(500).json({ error: 'Failed to disconnect Strava integration' });
    }
  });

  // Get connection status
  app.get('/api/integrations/strava/status', requireAuth, async (req, res) => {
    try {
      const connection = await db.query.integration_connections.findFirst({
        where: and(
          eq(integration_connections.user_id, req.user!.id),
          eq(integration_connections.platform, 'strava'),
          eq(integration_connections.is_active, true)
        )
      });

      res.json({
        connected: !!connection,
        lastSync: connection?.last_sync_at || null,
        athleteId: connection?.athlete_id || null
      });
    } catch (error) {
      console.error('Error checking Strava status:', error);
      res.status(500).json({ error: 'Failed to check Strava status' });
    }
  });
}