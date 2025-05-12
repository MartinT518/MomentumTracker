import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";

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

  const httpServer = createServer(app);
  return httpServer;
}
