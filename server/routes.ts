import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertGroupSchema, 
  insertGroupMemberSchema, 
  insertChallengeSchema,
  insertBuddySchema,
  insertNutritionLogSchema,
  insertCoachSchema,
  insertCoachingSessionSchema,
  insertSubscriptionPlanSchema,
  subscription_plans,
  users
} from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { WebSocketServer } from "ws";
import ws from "ws";
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI for generating training plans
if (!process.env.GOOGLE_AI_API_KEY) {
  console.warn('Missing GOOGLE_AI_API_KEY environment variable. AI features will not work.');
}

const googleAI = process.env.GOOGLE_AI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null;

const geminiModel = googleAI?.getGenerativeModel({
  model: "gemini-1.5-pro",
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
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
    
    // In a real app, this would fetch the user's pace data for the specified time range
    const weekData = [
      { name: "Week 1", value: 9.5 },
      { name: "Week 2", value: 9.3 },
      { name: "Week 3", value: 9.0 },
      { name: "Week 4", value: 8.8 },
      { name: "Week 5", value: 8.7 },
      { name: "Week 6", value: 8.5 }
    ];
    
    const monthData = Array.from({ length: 12 }, (_, i) => ({
      name: `Week ${i + 1}`,
      value: 10 - Math.random() * 2
    }));
    
    const yearData = Array.from({ length: 12 }, (_, i) => ({
      name: `Month ${i + 1}`,
      value: 10 - Math.random() * 3
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
    
    // Check if the user is an admin (in a real app, you would have proper role checks)
    if (req.user.role !== 'admin') {
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
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    if (!stripe) {
      return res.status(500).json({ error: "Stripe integration is not configured" });
    }
    
    let user = req.user;
    
    try {
      // If the user already has a subscription, retrieve it
      if (user.stripe_subscription_id) {
        const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
        
        const paymentIntent = subscription.latest_invoice?.payment_intent;
        let clientSecret = null;
        
        if (typeof paymentIntent === 'string') {
          const pi = await stripe.paymentIntents.retrieve(paymentIntent);
          clientSecret = pi.client_secret;
        } else if (paymentIntent) {
          clientSecret = paymentIntent.client_secret;
        }
        
        res.send({
          subscriptionId: subscription.id,
          clientSecret
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
            description: subscriptionPlan.description,
          });
          
          // Create a price for the product
          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(parseFloat(subscriptionPlan.price) * 100), // Convert to cents
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
      const subscription = await stripe.subscriptions.create({
        customer: user.stripe_customer_id!,
        items: [{
          price: req.body.priceId,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
      
      // Update the user record with subscription info
      await storage.updateUserSubscription(user.id, {
        stripeSubscriptionId: subscription.id,
        status: subscription.status
      });
      
      // Get the client secret to complete the payment
      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
      
      res.send({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret
      });
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
