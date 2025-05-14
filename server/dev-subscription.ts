import { Request, Response } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";

export function setupDevSubscription(app: any) {
  // Development only endpoint to set subscription status for any user by ID
  // WARNING: This should be removed in production
  app.post("/api/dev/set-premium/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Set subscription to active for 30 days
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      // Update user subscription directly through storage interface
      await storage.updateUserSubscription(userId, {
        status: 'active',
        endDate: endDate,
        stripeSubscriptionId: 'dev_test_subscription'
      });
      
      // Update subscription plan ID if available in the storage interface
      try {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        
        if (user) {
          // Set plan ID to 2 (Annual Plan)
          await db.update(users)
            .set({ subscription_plan_id: 2 })
            .where(eq(users.id, userId));
        }
      } catch (planError) {
        console.log("Could not update plan ID, but subscription is still active");
      }
      
      // Get updated user
      const updatedUser = await storage.getUser(userId);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log("Set premium subscription for user ID:", userId);
      res.json({ 
        message: "Premium subscription activated for development",
        user: updatedUser
      });
    } catch (error) {
      console.error("Error setting premium subscription:", error);
      res.status(500).json({ error: "Failed to set premium subscription" });
    }
  });
  
  // Set permanent annual subscription
  app.post("/api/dev/set-annual-permanent/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Set subscription to active with a very distant end date (10 years)
      const endDate = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);
      
      // Update user directly in the database
      await db.update(users)
        .set({ 
          subscription_status: 'active',
          subscription_plan_id: 2, // Annual plan
          subscription_end_date: endDate,
          stripe_subscription_id: 'permanent_annual_dev'
        })
        .where(eq(users.id, userId));
      
      // Get updated user
      const [updatedUser] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log("Set PERMANENT ANNUAL subscription for user ID:", userId);
      res.json({ 
        message: "Permanent annual subscription activated",
        user: updatedUser
      });
    } catch (error) {
      console.error("Error setting permanent annual subscription:", error);
      res.status(500).json({ error: "Failed to set permanent annual subscription" });
    }
  });
}