import { Request, Response } from "express";
import { storage } from "./storage";

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
        const [user] = await storage.db.select().from(storage.users).where(storage.eq(storage.users.id, userId));
        
        if (user) {
          // Set plan ID to 2 (Annual Plan)
          await storage.db.update(storage.users)
            .set({ subscription_plan_id: 2 })
            .where(storage.eq(storage.users.id, userId));
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
}