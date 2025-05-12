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
  insertCoachingSessionSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

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

  const httpServer = createServer(app);
  return httpServer;
}
