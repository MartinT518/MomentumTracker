import { 
  users, groups, group_members, buddies, challenges, challenge_participants, 
  achievements, user_achievements, nutrition_logs, coaches, coaching_sessions,
  subscription_plans,
  type User, type InsertUser, type Group, type InsertGroup, 
  type GroupMember, type InsertGroupMember, type Buddy, type InsertBuddy,
  type Challenge, type InsertChallenge, type NutritionLog, type InsertNutritionLog, 
  type Coach, type InsertCoach, type CoachingSession, type InsertCoachingSession,
  type SubscriptionPlan, type InsertSubscriptionPlan
} from "@shared/schema";

// Type aliases for types not explicitly exported from schema
type ChallengeParticipant = typeof challenge_participants.$inferSelect;
type UserAchievement = typeof user_achievements.$inferSelect;
type InsertChallengeParticipant = {
  challenge_id: number;
  user_id: number;
  current_progress?: number;
  status?: string;
};
import { db } from "./db";
import { eq, and, or, sql, asc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  
  // Groups
  getGroups(): Promise<Group[]>;
  getGroupById(id: number): Promise<Group | undefined>;
  getGroupsByUser(userId: number): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  addUserToGroup(groupMember: InsertGroupMember): Promise<GroupMember>;
  removeUserFromGroup(groupId: number, userId: number): Promise<void>;
  
  // Buddies
  getBuddies(userId: number): Promise<Buddy[]>;
  getBuddyRequests(userId: number): Promise<Buddy[]>;
  requestBuddy(buddyData: InsertBuddy): Promise<Buddy>;
  updateBuddyStatus(id: number, status: string): Promise<Buddy>;
  removeBuddy(userId: number, buddyId: number): Promise<void>;
  
  // Challenges
  getChallenges(): Promise<Challenge[]>;
  getChallengeById(id: number): Promise<Challenge | undefined>;
  getChallengesByUser(userId: number): Promise<Challenge[]>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  joinChallenge(participantData: InsertChallengeParticipant): Promise<ChallengeParticipant>;
  leaveChallenge(challengeId: number, userId: number): Promise<void>;
  updateChallengeProgress(challengeId: number, userId: number, progress: number): Promise<void>;
  
  // Achievements
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  awardAchievement(userId: number, achievementId: number): Promise<UserAchievement>;
  
  // Nutrition
  getNutritionLogs(userId: number, startDate?: Date, endDate?: Date): Promise<NutritionLog[]>;
  createNutritionLog(log: InsertNutritionLog): Promise<NutritionLog>;
  updateNutritionLog(id: number, data: Partial<NutritionLog>): Promise<NutritionLog>;
  
  // Coaching
  getCoaches(): Promise<Coach[]>;
  getCoachById(id: number): Promise<Coach | undefined>;
  createCoach(coach: InsertCoach): Promise<Coach>;
  getCoachingSessions(userId: number, role: 'coach' | 'athlete'): Promise<CoachingSession[]>;
  createCoachingSession(session: InsertCoachingSession): Promise<CoachingSession>;
  updateCoachingSession(id: number, data: Partial<CoachingSession>): Promise<CoachingSession>;
  
  // Subscriptions
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan>;
  updateUserSubscription(
    userId: number, 
    data: { 
      stripeCustomerId?: string, 
      stripeSubscriptionId?: string, 
      status?: string, 
      endDate?: Date 
    }
  ): Promise<User>;
  
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updated_at: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Groups
  async getGroups(): Promise<Group[]> {
    return db.select().from(groups);
  }

  async getGroupById(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async getGroupsByUser(userId: number): Promise<Group[]> {
    const memberGroups = await db
      .select({
        group: groups
      })
      .from(group_members)
      .innerJoin(groups, eq(group_members.group_id, groups.id))
      .where(eq(group_members.user_id, userId));
    
    return memberGroups.map(item => item.group);
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db
      .insert(groups)
      .values(group)
      .returning();
    
    // Also add the creator as an admin member
    await this.addUserToGroup({
      group_id: newGroup.id,
      user_id: newGroup.created_by,
      role: "admin",
      status: "active"
    });
    
    return newGroup;
  }

  async addUserToGroup(groupMember: InsertGroupMember): Promise<GroupMember> {
    const [newMember] = await db
      .insert(group_members)
      .values(groupMember)
      .returning();
    
    // Update member count
    await db
      .update(groups)
      .set({ 
        member_count: db
          .select({ count: sql`count(*)` })
          .from(group_members)
          .where(and(
            eq(group_members.group_id, groupMember.group_id),
            eq(group_members.status, "active")
          ))
          .limit(1),
        updated_at: new Date()
      })
      .where(eq(groups.id, groupMember.group_id));
    
    return newMember;
  }

  async removeUserFromGroup(groupId: number, userId: number): Promise<void> {
    await db
      .delete(group_members)
      .where(
        and(
          eq(group_members.group_id, groupId),
          eq(group_members.user_id, userId)
        )
      );
    
    // Update member count
    await db
      .update(groups)
      .set({ 
        member_count: db
          .select({ count: sql`count(*)` })
          .from(group_members)
          .where(and(
            eq(group_members.group_id, groupId),
            eq(group_members.status, "active")
          ))
          .limit(1),
        updated_at: new Date()
      })
      .where(eq(groups.id, groupId));
  }

  // Buddies
  async getBuddies(userId: number): Promise<Buddy[]> {
    return db
      .select()
      .from(buddies)
      .where(
        and(
          or(
            eq(buddies.user_id, userId),
            eq(buddies.buddy_id, userId)
          ),
          eq(buddies.status, "accepted")
        )
      );
  }

  async getBuddyRequests(userId: number): Promise<Buddy[]> {
    return db
      .select()
      .from(buddies)
      .where(
        and(
          eq(buddies.buddy_id, userId),
          eq(buddies.status, "pending")
        )
      );
  }

  async requestBuddy(buddyData: InsertBuddy): Promise<Buddy> {
    const [newBuddy] = await db
      .insert(buddies)
      .values(buddyData)
      .returning();
    return newBuddy;
  }

  async updateBuddyStatus(id: number, status: string): Promise<Buddy> {
    const [updatedBuddy] = await db
      .update(buddies)
      .set({ 
        status, 
        updated_at: new Date() 
      })
      .where(eq(buddies.id, id))
      .returning();
    return updatedBuddy;
  }

  async removeBuddy(userId: number, buddyId: number): Promise<void> {
    await db
      .delete(buddies)
      .where(
        or(
          and(
            eq(buddies.user_id, userId),
            eq(buddies.buddy_id, buddyId)
          ),
          and(
            eq(buddies.user_id, buddyId),
            eq(buddies.buddy_id, userId)
          )
        )
      );
  }

  // Challenges
  async getChallenges(): Promise<Challenge[]> {
    return db.select().from(challenges);
  }

  async getChallengeById(id: number): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge;
  }

  async getChallengesByUser(userId: number): Promise<Challenge[]> {
    const userChallenges = await db
      .select({
        challenge: challenges
      })
      .from(challenge_participants)
      .innerJoin(challenges, eq(challenge_participants.challenge_id, challenges.id))
      .where(eq(challenge_participants.user_id, userId));
    
    return userChallenges.map(item => item.challenge);
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const [newChallenge] = await db
      .insert(challenges)
      .values(challenge)
      .returning();
    return newChallenge;
  }

  async joinChallenge(participantData: InsertChallengeParticipant): Promise<ChallengeParticipant> {
    const [participant] = await db
      .insert(challenge_participants)
      .values(participantData)
      .returning();
    return participant;
  }

  async leaveChallenge(challengeId: number, userId: number): Promise<void> {
    await db
      .delete(challenge_participants)
      .where(
        and(
          eq(challenge_participants.challenge_id, challengeId),
          eq(challenge_participants.user_id, userId)
        )
      );
  }

  async updateChallengeProgress(challengeId: number, userId: number, progress: number): Promise<void> {
    await db
      .update(challenge_participants)
      .set({ 
        current_progress: progress,
        status: progress >= 100 ? "completed" : "active"
      })
      .where(
        and(
          eq(challenge_participants.challenge_id, challengeId),
          eq(challenge_participants.user_id, userId)
        )
      );
  }

  // Achievements
  async getAchievements(): Promise<Achievement[]> {
    return db.select().from(achievements);
  }

  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return db
      .select()
      .from(user_achievements)
      .where(eq(user_achievements.user_id, userId));
  }

  async awardAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
    // Check if user already has this achievement
    const [existingAchievement] = await db
      .select()
      .from(user_achievements)
      .where(
        and(
          eq(user_achievements.user_id, userId),
          eq(user_achievements.achievement_id, achievementId)
        )
      );
    
    if (existingAchievement) {
      // Increment times earned
      const [updatedAchievement] = await db
        .update(user_achievements)
        .set({ 
          times_earned: existingAchievement.times_earned + 1,
          earned_at: new Date()
        })
        .where(eq(user_achievements.id, existingAchievement.id))
        .returning();
      return updatedAchievement;
    } else {
      // Create new user achievement
      const [newAchievement] = await db
        .insert(user_achievements)
        .values({
          user_id: userId,
          achievement_id: achievementId,
          times_earned: 1
        })
        .returning();
      return newAchievement;
    }
  }

  // Nutrition
  async getNutritionLogs(userId: number, startDate?: Date, endDate?: Date): Promise<NutritionLog[]> {
    let query = db
      .select()
      .from(nutrition_logs)
      .where(eq(nutrition_logs.user_id, userId));
    
    if (startDate) {
      query = query.where(sql`${nutrition_logs.log_date} >= ${startDate}`);
    }
    
    if (endDate) {
      query = query.where(sql`${nutrition_logs.log_date} <= ${endDate}`);
    }
    
    return query.orderBy(nutrition_logs.log_date);
  }

  async createNutritionLog(log: InsertNutritionLog): Promise<NutritionLog> {
    const [newLog] = await db
      .insert(nutrition_logs)
      .values(log)
      .returning();
    return newLog;
  }

  async updateNutritionLog(id: number, data: Partial<NutritionLog>): Promise<NutritionLog> {
    const [updatedLog] = await db
      .update(nutrition_logs)
      .set({ 
        ...data,
        updated_at: new Date() 
      })
      .where(eq(nutrition_logs.id, id))
      .returning();
    return updatedLog;
  }

  // Coaching
  async getCoaches(): Promise<Coach[]> {
    return db
      .select()
      .from(coaches)
      .where(eq(coaches.available, true));
  }

  async getCoachById(id: number): Promise<Coach | undefined> {
    const [coach] = await db
      .select()
      .from(coaches)
      .where(eq(coaches.id, id));
    return coach;
  }

  async createCoach(coach: InsertCoach): Promise<Coach> {
    const [newCoach] = await db
      .insert(coaches)
      .values(coach)
      .returning();
    return newCoach;
  }

  async getCoachingSessions(userId: number, role: 'coach' | 'athlete'): Promise<CoachingSession[]> {
    if (role === 'coach') {
      // Get sessions where user is the coach
      const coachSessions = await db
        .select({
          session: coaching_sessions
        })
        .from(coaching_sessions)
        .innerJoin(coaches, eq(coaching_sessions.coach_id, coaches.id))
        .where(eq(coaches.user_id, userId));
      
      return coachSessions.map(item => item.session);
    } else {
      // Get sessions where user is the athlete
      return db
        .select()
        .from(coaching_sessions)
        .where(eq(coaching_sessions.athlete_id, userId));
    }
  }

  async createCoachingSession(session: InsertCoachingSession): Promise<CoachingSession> {
    const [newSession] = await db
      .insert(coaching_sessions)
      .values(session)
      .returning();
    return newSession;
  }

  async updateCoachingSession(id: number, data: Partial<CoachingSession>): Promise<CoachingSession> {
    const [updatedSession] = await db
      .update(coaching_sessions)
      .set({ 
        ...data,
        updated_at: new Date() 
      })
      .where(eq(coaching_sessions.id, id))
      .returning();
    return updatedSession;
  }

  // Subscription plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return db
      .select()
      .from(subscription_plans)
      .where(eq(subscription_plans.is_active, true))
      .orderBy(asc(subscription_plans.price));
  }
  
  async getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscription_plans)
      .where(eq(subscription_plans.id, id));
      
    return plan;
  }
  
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db
      .insert(subscription_plans)
      .values(plan)
      .returning();
      
    return newPlan;
  }
  
  async updateSubscriptionPlan(id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const [updatedPlan] = await db
      .update(subscription_plans)
      .set({
        ...data,
        updated_at: new Date()
      })
      .where(eq(subscription_plans.id, id))
      .returning();
      
    return updatedPlan;
  }
  
  async updateUserSubscription(
    userId: number,
    data: { 
      stripeCustomerId?: string, 
      stripeSubscriptionId?: string, 
      status?: string, 
      endDate?: Date 
    }
  ): Promise<User> {
    const updateData: any = {};
    
    if (data.stripeCustomerId) {
      updateData.stripe_customer_id = data.stripeCustomerId;
    }
    
    if (data.stripeSubscriptionId) {
      updateData.stripe_subscription_id = data.stripeSubscriptionId;
    }
    
    if (data.status) {
      updateData.subscription_status = data.status;
    }
    
    if (data.endDate) {
      updateData.subscription_end_date = data.endDate;
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }
}

// Fallback to memory storage if DB connection fails
import createMemoryStore from "memorystore";
const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24h
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

// Use DatabaseStorage by default, but fall back to MemStorage if there's an issue
let storage: IStorage;

try {
  storage = new DatabaseStorage();
  console.log("Using database storage");
} catch (error) {
  console.warn("Failed to initialize database storage, falling back to memory storage:", error);
  storage = new MemStorage();
}

export { storage };
