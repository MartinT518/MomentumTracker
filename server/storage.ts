import { 
  users, groups, group_members, buddies, challenges, challenge_participants, 
  achievements, user_achievements, nutrition_logs, coaches, coaching_sessions,
  subscription_plans, integration_connections, health_metrics,
  onboarding_status, fitness_goals, experience_levels, training_preferences,
  type User, type InsertUser, type Group, type InsertGroup, 
  type GroupMember, type InsertGroupMember, type Buddy, type InsertBuddy,
  type Challenge, type InsertChallenge, type NutritionLog, type InsertNutritionLog, 
  type Coach, type InsertCoach, type CoachingSession, type InsertCoachingSession,
  type SubscriptionPlan, type InsertSubscriptionPlan,
  type IntegrationConnection, type InsertIntegrationConnection,
  type HealthMetric, type InsertHealthMetric,
  type OnboardingStatus, type InsertOnboardingStatus,
  type FitnessGoal, type InsertFitnessGoal,
  type ExperienceLevel, type InsertExperienceLevel,
  type TrainingPreference, type InsertTrainingPreference
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, sql, asc, desc, gte, lte } from "drizzle-orm";

// Type aliases for types not explicitly exported from schema
type ChallengeParticipant = typeof challenge_participants.$inferSelect;
type UserAchievement = typeof user_achievements.$inferSelect;
type InsertChallengeParticipant = {
  challenge_id: number;
  user_id: number;
  current_progress?: number;
  status?: string;
};
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
  
  // Health metrics
  getHealthMetrics(userId: number, startDate?: Date, endDate?: Date): Promise<HealthMetric[]>;
  createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric>;
  updateHealthMetric(id: number, data: Partial<HealthMetric>): Promise<HealthMetric>;
  
  // Integration connections
  getIntegrationConnections(userId: number): Promise<IntegrationConnection[]>;
  getIntegrationConnection(userId: number, platform: string): Promise<IntegrationConnection | undefined>;
  createIntegrationConnection(connection: InsertIntegrationConnection): Promise<IntegrationConnection>;
  updateIntegrationConnection(id: number, data: Partial<IntegrationConnection>): Promise<IntegrationConnection>;
  removeIntegrationConnection(userId: number, platform: string): Promise<void>;
  
  // Subscriptions
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined>;
  getSubscriptionPlanByStripeId(stripeId: string): Promise<SubscriptionPlan | undefined>;
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
  
  // Onboarding
  getOnboardingStatus(userId: number): Promise<OnboardingStatus | undefined>;
  createOnboardingStatus(data: InsertOnboardingStatus): Promise<OnboardingStatus>;
  updateOnboardingStatus(userId: number, data: Partial<OnboardingStatus>): Promise<OnboardingStatus>;
  
  // Fitness goals
  getFitnessGoals(userId: number): Promise<FitnessGoal[]>;
  createFitnessGoal(data: InsertFitnessGoal): Promise<FitnessGoal>;
  updateFitnessGoal(id: number, data: Partial<FitnessGoal>): Promise<FitnessGoal>;
  
  // User experience
  getUserExperience(userId: number): Promise<ExperienceLevel | undefined>;
  createUserExperience(data: InsertExperienceLevel): Promise<ExperienceLevel>;
  updateUserExperience(id: number, data: Partial<ExperienceLevel>): Promise<ExperienceLevel>;
  
  // Training preferences
  getTrainingPreferences(userId: number): Promise<TrainingPreference | undefined>;
  createTrainingPreferences(data: InsertTrainingPreference): Promise<TrainingPreference>;
  updateTrainingPreferences(id: number, data: Partial<TrainingPreference>): Promise<TrainingPreference>;
  
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
  
  async getSubscriptionPlanByStripeId(stripeId: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscription_plans)
      .where(eq(subscription_plans.stripe_price_id, stripeId));
      
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

  // Health metrics
  async getHealthMetrics(userId: number, startDate?: Date, endDate?: Date): Promise<HealthMetric[]> {
    let query = db
      .select()
      .from(health_metrics)
      .where(eq(health_metrics.user_id, userId));
    
    if (startDate) {
      query = query.where(gte(health_metrics.metric_date, startDate));
    }
    
    if (endDate) {
      query = query.where(lte(health_metrics.metric_date, endDate));
    }
    
    const metrics = await query.orderBy(desc(health_metrics.metric_date));
    return metrics;
  }
  
  async createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric> {
    const [newMetric] = await db
      .insert(health_metrics)
      .values(metric)
      .returning();
    return newMetric;
  }
  
  async updateHealthMetric(id: number, data: Partial<HealthMetric>): Promise<HealthMetric> {
    const [updatedMetric] = await db
      .update(health_metrics)
      .set(data)
      .where(eq(health_metrics.id, id))
      .returning();
    
    if (!updatedMetric) {
      throw new Error(`Health metric with ID ${id} not found`);
    }
    
    return updatedMetric;
  }
  
  // Onboarding status
  async getOnboardingStatus(userId: number): Promise<OnboardingStatus | undefined> {
    const [status] = await db
      .select()
      .from(onboarding_status)
      .where(eq(onboarding_status.user_id, userId));
    return status;
  }
  
  async createOnboardingStatus(data: InsertOnboardingStatus): Promise<OnboardingStatus> {
    const [status] = await db
      .insert(onboarding_status)
      .values(data)
      .returning();
    return status;
  }
  
  async updateOnboardingStatus(userId: number, data: Partial<OnboardingStatus>): Promise<OnboardingStatus> {
    const [updatedStatus] = await db
      .update(onboarding_status)
      .set({ ...data, last_updated: new Date() })
      .where(eq(onboarding_status.user_id, userId))
      .returning();
    
    if (!updatedStatus) {
      throw new Error(`Onboarding status for user ${userId} not found`);
    }
    
    return updatedStatus;
  }
  
  // Fitness goals
  async getFitnessGoals(userId: number): Promise<FitnessGoal[]> {
    const goals = await db
      .select()
      .from(fitness_goals)
      .where(eq(fitness_goals.user_id, userId))
      .orderBy(asc(fitness_goals.priority));
    return goals;
  }
  
  async createFitnessGoal(data: InsertFitnessGoal): Promise<FitnessGoal> {
    const [goal] = await db
      .insert(fitness_goals)
      .values(data)
      .returning();
    return goal;
  }
  
  async updateFitnessGoal(id: number, data: Partial<FitnessGoal>): Promise<FitnessGoal> {
    const [updatedGoal] = await db
      .update(fitness_goals)
      .set({ ...data, updated_at: new Date() })
      .where(eq(fitness_goals.id, id))
      .returning();
    
    if (!updatedGoal) {
      throw new Error(`Fitness goal with ID ${id} not found`);
    }
    
    return updatedGoal;
  }
  
  // User experience
  async getUserExperience(userId: number): Promise<UserExperience | undefined> {
    const [experience] = await db
      .select()
      .from(experience_levels)
      .where(eq(experience_levels.user_id, userId));
    return experience;
  }
  
  async createUserExperience(data: InsertExperienceLevel): Promise<ExperienceLevel> {
    const [experience] = await db
      .insert(experience_levels)
      .values(data)
      .returning();
    return experience;
  }
  
  async updateUserExperience(id: number, data: Partial<ExperienceLevel>): Promise<ExperienceLevel> {
    const [updatedExperience] = await db
      .update(experience_levels)
      .set({ ...data, updated_at: new Date() })
      .where(eq(experience_levels.id, id))
      .returning();
    
    if (!updatedExperience) {
      throw new Error(`User experience with ID ${id} not found`);
    }
    
    return updatedExperience;
  }
  
  // Training preferences
  async getTrainingPreferences(userId: number): Promise<TrainingPreference | undefined> {
    const [preferences] = await db
      .select()
      .from(training_preferences)
      .where(eq(training_preferences.user_id, userId));
    return preferences;
  }
  
  async createTrainingPreferences(data: InsertTrainingPreference): Promise<TrainingPreference> {
    const [preferences] = await db
      .insert(training_preferences)
      .values(data)
      .returning();
    return preferences;
  }
  
  async updateTrainingPreferences(id: number, data: Partial<TrainingPreference>): Promise<TrainingPreference> {
    const [updatedPreferences] = await db
      .update(training_preferences)
      .set({ ...data, updated_at: new Date() })
      .where(eq(training_preferences.id, id))
      .returning();
    
    if (!updatedPreferences) {
      throw new Error(`Training preferences with ID ${id} not found`);
    }
    
    return updatedPreferences;
  }
  
  // Integration connections
  async getIntegrationConnections(userId: number): Promise<IntegrationConnection[]> {
    return db
      .select()
      .from(integration_connections)
      .where(eq(integration_connections.user_id, userId))
      .orderBy(desc(integration_connections.created_at));
  }
  
  async getIntegrationConnection(userId: number, platform: string): Promise<IntegrationConnection | undefined> {
    const [connection] = await db
      .select()
      .from(integration_connections)
      .where(
        and(
          eq(integration_connections.user_id, userId),
          eq(integration_connections.platform, platform)
        )
      );
    
    return connection;
  }
  
  async createIntegrationConnection(connection: InsertIntegrationConnection): Promise<IntegrationConnection> {
    const [newConnection] = await db
      .insert(integration_connections)
      .values({
        ...connection,
        last_sync_at: null
      })
      .returning();
    
    return newConnection;
  }
  
  async updateIntegrationConnection(id: number, data: Partial<IntegrationConnection>): Promise<IntegrationConnection> {
    const [updatedConnection] = await db
      .update(integration_connections)
      .set({
        ...data,
        updated_at: new Date()
      })
      .where(eq(integration_connections.id, id))
      .returning();
    
    if (!updatedConnection) {
      throw new Error(`Integration connection with ID ${id} not found`);
    }
    
    return updatedConnection;
  }
  
  async removeIntegrationConnection(userId: number, platform: string): Promise<void> {
    await db
      .delete(integration_connections)
      .where(
        and(
          eq(integration_connections.user_id, userId),
          eq(integration_connections.platform, platform)
        )
      );
  }
}

// Fallback to memory storage if DB connection fails
import createMemoryStore from "memorystore";
const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private subscriptionPlans: Map<number, SubscriptionPlan>;
  private groups: Map<number, Group>;
  private groupMembers: Map<number, GroupMember>;
  private challenges: Map<number, Challenge>;
  private challengeParticipants: Map<number, ChallengeParticipant>;
  private buddies: Map<number, Buddy>;
  private nutritionLogs: Map<number, NutritionLog>;
  private coaches: Map<number, Coach>;
  private coachingSessions: Map<number, CoachingSession>;
  private achievements: Map<number, any>; // Use any to fix type error
  private userAchievements: Map<number, UserAchievement>;
  private healthMetrics: Map<number, HealthMetric>;
  private integrationConnections: Map<number, IntegrationConnection>;
  private onboardingStatuses: Map<number, OnboardingStatus>;
  private fitnessGoals: Map<number, FitnessGoal>;
  private userExperiences: Map<number, ExperienceLevel>;
  private trainingPreferences: Map<number, TrainingPreference>;
  
  currentId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.subscriptionPlans = new Map();
    this.groups = new Map();
    this.groupMembers = new Map();
    this.challenges = new Map();
    this.challengeParticipants = new Map();
    this.buddies = new Map();
    this.nutritionLogs = new Map();
    this.coaches = new Map();
    this.coachingSessions = new Map();
    this.achievements = new Map();
    this.userAchievements = new Map();
    this.healthMetrics = new Map();
    this.integrationConnections = new Map();
    this.onboardingStatuses = new Map();
    this.fitnessGoals = new Map();
    this.userExperiences = new Map();
    this.trainingPreferences = new Map();
    
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24h
    });
    
    // Initialize with default subscription plans
    this.subscriptionPlans.set(1, {
      id: 1,
      name: "Premium Monthly",
      description: "Full access to all premium features with monthly billing",
      price: "9.99",
      billing_interval: "month",
      stripe_price_id: "price_monthly",
      features: JSON.stringify(["Advanced training analytics", "Custom training plans", "Unlimited training history", "AI-powered recommendations", "Priority support", "Early access to new features"]),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    this.subscriptionPlans.set(2, {
      id: 2,
      name: "Premium Annual",
      description: "Full access to all premium features with annual billing (save 20%)",
      price: "95.88",
      billing_interval: "year",
      stripe_price_id: "price_annual",
      features: JSON.stringify(["Advanced training analytics", "Custom training plans", "Unlimited training history", "AI-powered recommendations", "Priority support", "Early access to new features", "Exclusive annual subscriber benefits"]),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
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
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Groups methods
  async getGroups(): Promise<Group[]> {
    return Array.from(this.groups.values());
  }
  
  async getGroupById(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }
  
  async getGroupsByUser(userId: number): Promise<Group[]> {
    const memberGroups = Array.from(this.groupMembers.values())
      .filter(member => member.user_id === userId)
      .map(member => member.group_id);
      
    return Array.from(this.groups.values())
      .filter(group => memberGroups.includes(group.id));
  }
  
  async createGroup(group: InsertGroup): Promise<Group> {
    const id = this.currentId++;
    const newGroup: Group = { ...group, id, created_at: new Date(), updated_at: new Date() };
    this.groups.set(id, newGroup);
    return newGroup;
  }
  
  async addUserToGroup(groupMember: InsertGroupMember): Promise<GroupMember> {
    const id = this.currentId++;
    const newMember: GroupMember = { ...groupMember, id, created_at: new Date(), updated_at: new Date() };
    this.groupMembers.set(id, newMember);
    return newMember;
  }
  
  async removeUserFromGroup(groupId: number, userId: number): Promise<void> {
    const memberToRemove = Array.from(this.groupMembers.values())
      .find(member => member.group_id === groupId && member.user_id === userId);
      
    if (memberToRemove) {
      this.groupMembers.delete(memberToRemove.id);
    }
  }
  
  // Buddies methods
  async getBuddies(userId: number): Promise<Buddy[]> {
    return Array.from(this.buddies.values())
      .filter(buddy => (buddy.user_id === userId || buddy.buddy_id === userId) && buddy.status === 'accepted');
  }
  
  async getBuddyRequests(userId: number): Promise<Buddy[]> {
    return Array.from(this.buddies.values())
      .filter(buddy => buddy.buddy_id === userId && buddy.status === 'pending');
  }
  
  async requestBuddy(buddyData: InsertBuddy): Promise<Buddy> {
    const id = this.currentId++;
    const newBuddy: Buddy = { ...buddyData, id, created_at: new Date(), updated_at: new Date() };
    this.buddies.set(id, newBuddy);
    return newBuddy;
  }
  
  async updateBuddyStatus(id: number, status: string): Promise<Buddy> {
    const buddy = this.buddies.get(id);
    if (!buddy) {
      throw new Error(`Buddy relationship with ID ${id} not found`);
    }
    
    const updatedBuddy = { ...buddy, status, updated_at: new Date() };
    this.buddies.set(id, updatedBuddy);
    return updatedBuddy;
  }
  
  async removeBuddy(userId: number, buddyId: number): Promise<void> {
    const buddyToRemove = Array.from(this.buddies.values())
      .find(buddy => 
        (buddy.user_id === userId && buddy.buddy_id === buddyId) || 
        (buddy.user_id === buddyId && buddy.buddy_id === userId)
      );
      
    if (buddyToRemove) {
      this.buddies.delete(buddyToRemove.id);
    }
  }
  
  // Challenges methods
  async getChallenges(): Promise<Challenge[]> {
    return Array.from(this.challenges.values());
  }
  
  async getChallengeById(id: number): Promise<Challenge | undefined> {
    return this.challenges.get(id);
  }
  
  async getChallengesByUser(userId: number): Promise<Challenge[]> {
    const participantChallenges = Array.from(this.challengeParticipants.values())
      .filter(participant => participant.user_id === userId)
      .map(participant => participant.challenge_id);
      
    return Array.from(this.challenges.values())
      .filter(challenge => participantChallenges.includes(challenge.id));
  }
  
  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const id = this.currentId++;
    const newChallenge: Challenge = { ...challenge, id, created_at: new Date(), updated_at: new Date() };
    this.challenges.set(id, newChallenge);
    return newChallenge;
  }
  
  async joinChallenge(participantData: InsertChallengeParticipant): Promise<ChallengeParticipant> {
    const id = this.currentId++;
    const newParticipant: ChallengeParticipant = { 
      ...participantData, 
      id, 
      current_progress: 0, 
      status: 'active',
      created_at: new Date(), 
      updated_at: new Date() 
    };
    this.challengeParticipants.set(id, newParticipant);
    return newParticipant;
  }
  
  async leaveChallenge(challengeId: number, userId: number): Promise<void> {
    const participantToRemove = Array.from(this.challengeParticipants.values())
      .find(participant => participant.challenge_id === challengeId && participant.user_id === userId);
      
    if (participantToRemove) {
      this.challengeParticipants.delete(participantToRemove.id);
    }
  }
  
  async updateChallengeProgress(challengeId: number, userId: number, progress: number): Promise<void> {
    const participant = Array.from(this.challengeParticipants.values())
      .find(p => p.challenge_id === challengeId && p.user_id === userId);
      
    if (participant) {
      const updatedParticipant = { ...participant, current_progress: progress, updated_at: new Date() };
      this.challengeParticipants.set(participant.id, updatedParticipant);
    }
  }
  
  // Achievements methods
  async getAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }
  
  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return Array.from(this.userAchievements.values())
      .filter(achievement => achievement.user_id === userId);
  }
  
  async awardAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
    const id = this.currentId++;
    const userAchievement: UserAchievement = { 
      id, 
      user_id: userId, 
      achievement_id: achievementId,
      earned_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
    this.userAchievements.set(id, userAchievement);
    return userAchievement;
  }
  
  // Nutrition methods
  async getNutritionLogs(userId: number, startDate?: Date, endDate?: Date): Promise<NutritionLog[]> {
    let logs = Array.from(this.nutritionLogs.values())
      .filter(log => log.user_id === userId);
      
    if (startDate) {
      logs = logs.filter(log => new Date(log.date) >= startDate);
    }
    
    if (endDate) {
      logs = logs.filter(log => new Date(log.date) <= endDate);
    }
    
    return logs;
  }
  
  async createNutritionLog(log: InsertNutritionLog): Promise<NutritionLog> {
    const id = this.currentId++;
    const newLog: NutritionLog = { ...log, id, created_at: new Date(), updated_at: new Date() };
    this.nutritionLogs.set(id, newLog);
    return newLog;
  }
  
  async updateNutritionLog(id: number, data: Partial<NutritionLog>): Promise<NutritionLog> {
    const log = this.nutritionLogs.get(id);
    if (!log) {
      throw new Error(`Nutrition log with ID ${id} not found`);
    }
    
    const updatedLog = { ...log, ...data, updated_at: new Date() };
    this.nutritionLogs.set(id, updatedLog);
    return updatedLog;
  }
  
  // Coaching methods
  async getCoaches(): Promise<Coach[]> {
    return Array.from(this.coaches.values());
  }
  
  async getCoachById(id: number): Promise<Coach | undefined> {
    return this.coaches.get(id);
  }
  
  async createCoach(coach: InsertCoach): Promise<Coach> {
    const id = this.currentId++;
    const newCoach: Coach = { ...coach, id, created_at: new Date(), updated_at: new Date() };
    this.coaches.set(id, newCoach);
    return newCoach;
  }
  
  async getCoachingSessions(userId: number, role: 'coach' | 'athlete'): Promise<CoachingSession[]> {
    return Array.from(this.coachingSessions.values())
      .filter(session => role === 'coach' ? session.coach_id === userId : session.athlete_id === userId);
  }
  
  async createCoachingSession(session: InsertCoachingSession): Promise<CoachingSession> {
    const id = this.currentId++;
    const newSession: CoachingSession = { ...session, id, created_at: new Date(), updated_at: new Date() };
    this.coachingSessions.set(id, newSession);
    return newSession;
  }
  
  async updateCoachingSession(id: number, data: Partial<CoachingSession>): Promise<CoachingSession> {
    const session = this.coachingSessions.get(id);
    if (!session) {
      throw new Error(`Coaching session with ID ${id} not found`);
    }
    
    const updatedSession = { ...session, ...data, updated_at: new Date() };
    this.coachingSessions.set(id, updatedSession);
    return updatedSession;
  }
  
  // Subscription methods
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values());
  }
  
  async getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined> {
    return this.subscriptionPlans.get(id);
  }
  
  async getSubscriptionPlanByStripeId(stripeId: string): Promise<SubscriptionPlan | undefined> {
    return Array.from(this.subscriptionPlans.values())
      .find(plan => plan.stripe_price_id === stripeId);
  }
  
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const id = this.currentId++;
    const newPlan: SubscriptionPlan = { ...plan, id, created_at: new Date(), updated_at: new Date() };
    this.subscriptionPlans.set(id, newPlan);
    return newPlan;
  }
  
  async updateSubscriptionPlan(id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const plan = this.subscriptionPlans.get(id);
    if (!plan) {
      throw new Error(`Subscription plan with ID ${id} not found`);
    }
    
    const updatedPlan = { ...plan, ...data, updated_at: new Date() };
    this.subscriptionPlans.set(id, updatedPlan);
    return updatedPlan;
  }
  
  // Health metrics methods
  async getHealthMetrics(userId: number, startDate?: Date, endDate?: Date): Promise<HealthMetric[]> {
    const metrics = Array.from(this.healthMetrics.values())
      .filter(metric => metric.user_id === userId);
    
    let filteredMetrics = metrics;
    
    if (startDate) {
      filteredMetrics = filteredMetrics.filter(metric => {
        const metricDate = new Date(metric.metric_date);
        return metricDate >= startDate;
      });
    }
    
    if (endDate) {
      filteredMetrics = filteredMetrics.filter(metric => {
        const metricDate = new Date(metric.metric_date);
        return metricDate <= endDate;
      });
    }
    
    return filteredMetrics.sort((a, b) => {
      const dateA = new Date(a.metric_date);
      const dateB = new Date(b.metric_date);
      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    });
  }
  
  async createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric> {
    const id = this.currentId++;
    const newMetric: HealthMetric = { 
      ...metric, 
      id, 
      created_at: new Date() 
    };
    this.healthMetrics.set(id, newMetric);
    return newMetric;
  }
  
  async updateHealthMetric(id: number, data: Partial<HealthMetric>): Promise<HealthMetric> {
    const metric = this.healthMetrics.get(id);
    if (!metric) {
      throw new Error(`Health metric with ID ${id} not found`);
    }
    const updatedMetric = { ...metric, ...data };
    this.healthMetrics.set(id, updatedMetric);
    return updatedMetric;
  }
  
  // Onboarding status
  async getOnboardingStatus(userId: number): Promise<OnboardingStatus | undefined> {
    return Array.from(this.onboardingStatuses.values())
      .find(status => status.user_id === userId);
  }
  
  async createOnboardingStatus(data: InsertOnboardingStatus): Promise<OnboardingStatus> {
    const id = this.currentId++;
    const newStatus: OnboardingStatus = {
      ...data,
      id,
      completed: data.completed || false,
      current_step: data.current_step || "welcome",
      steps_completed: data.steps_completed || [],
      last_updated: new Date(),
      created_at: new Date()
    };
    this.onboardingStatuses.set(id, newStatus);
    return newStatus;
  }
  
  async updateOnboardingStatus(userId: number, data: Partial<OnboardingStatus>): Promise<OnboardingStatus> {
    const status = Array.from(this.onboardingStatuses.values())
      .find(status => status.user_id === userId);
      
    if (!status) {
      throw new Error(`Onboarding status for user ${userId} not found`);
    }
    
    const updatedStatus = { 
      ...status, 
      ...data, 
      last_updated: new Date() 
    };
    
    this.onboardingStatuses.set(status.id, updatedStatus);
    return updatedStatus;
  }
  
  // Fitness goals
  async getFitnessGoals(userId: number): Promise<FitnessGoal[]> {
    return Array.from(this.fitnessGoals.values())
      .filter(goal => goal.user_id === userId)
      .sort((a, b) => (a.priority || 999) - (b.priority || 999));
  }
  
  async createFitnessGoal(data: InsertFitnessGoal): Promise<FitnessGoal> {
    const id = this.currentId++;
    const newGoal: FitnessGoal = {
      ...data,
      id,
      status: data.status || "active",
      priority: data.priority || 1,
      start_date: data.start_date || new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
    this.fitnessGoals.set(id, newGoal);
    return newGoal;
  }
  
  async updateFitnessGoal(id: number, data: Partial<FitnessGoal>): Promise<FitnessGoal> {
    const goal = this.fitnessGoals.get(id);
    
    if (!goal) {
      throw new Error(`Fitness goal with ID ${id} not found`);
    }
    
    const updatedGoal = { 
      ...goal, 
      ...data, 
      updated_at: new Date() 
    };
    
    this.fitnessGoals.set(id, updatedGoal);
    return updatedGoal;
  }
  
  // User experience
  async getUserExperience(userId: number): Promise<UserExperience | undefined> {
    return Array.from(this.userExperiences.values())
      .find(exp => exp.user_id === userId);
  }
  
  async createUserExperience(data: InsertUserExperience): Promise<UserExperience> {
    const id = this.currentId++;
    const newExperience: UserExperience = {
      ...data,
      id,
      max_run_days_per_week: data.max_run_days_per_week || 4,
      preferred_run_days: data.preferred_run_days || [],
      preferred_run_times: data.preferred_run_times || [],
      created_at: new Date(),
      updated_at: new Date()
    };
    this.userExperiences.set(id, newExperience);
    return newExperience;
  }
  
  async updateUserExperience(id: number, data: Partial<UserExperience>): Promise<UserExperience> {
    const experience = this.userExperiences.get(id);
    
    if (!experience) {
      throw new Error(`User experience with ID ${id} not found`);
    }
    
    const updatedExperience = { 
      ...experience, 
      ...data, 
      updated_at: new Date() 
    };
    
    this.userExperiences.set(id, updatedExperience);
    return updatedExperience;
  }
  
  // Training preferences
  async getTrainingPreferences(userId: number): Promise<TrainingPreference | undefined> {
    return Array.from(this.trainingPreferences.values())
      .find(prefs => prefs.user_id === userId);
  }
  
  async createTrainingPreferences(data: InsertTrainingPreference): Promise<TrainingPreference> {
    const id = this.currentId++;
    const newPreferences: TrainingPreference = {
      ...data,
      id,
      preferred_workout_types: data.preferred_workout_types || [],
      avoid_workout_types: data.avoid_workout_types || [],
      cross_training_activities: data.cross_training_activities || [],
      cross_training_days: data.cross_training_days || 1,
      rest_days: data.rest_days || 1,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.trainingPreferences.set(id, newPreferences);
    return newPreferences;
  }
  
  async updateTrainingPreferences(id: number, data: Partial<TrainingPreference>): Promise<TrainingPreference> {
    const preferences = this.trainingPreferences.get(id);
    
    if (!preferences) {
      throw new Error(`Training preferences with ID ${id} not found`);
    }
    
    const updatedPreferences = { 
      ...preferences, 
      ...data, 
      updated_at: new Date() 
    };
    
    this.trainingPreferences.set(id, updatedPreferences);
    return updatedPreferences;
  }
  
  // Integration connections methods
  async getIntegrationConnections(userId: number): Promise<IntegrationConnection[]> {
    return Array.from(this.integrationConnections.values())
      .filter(connection => connection.user_id === userId)
      .sort((a, b) => {
        const dateA = a.created_at || new Date(0);
        const dateB = b.created_at || new Date(0);
        return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
      });
  }
  
  async getIntegrationConnection(userId: number, platform: string): Promise<IntegrationConnection | undefined> {
    return Array.from(this.integrationConnections.values())
      .find(connection => 
        connection.user_id === userId && 
        connection.platform === platform
      );
  }
  
  async createIntegrationConnection(connection: InsertIntegrationConnection): Promise<IntegrationConnection> {
    const id = this.currentId++;
    const newConnection: IntegrationConnection = {
      ...connection,
      id,
      created_at: new Date(),
      updated_at: new Date(),
      last_sync_at: null
    };
    this.integrationConnections.set(id, newConnection);
    return newConnection;
  }
  
  async updateIntegrationConnection(id: number, data: Partial<IntegrationConnection>): Promise<IntegrationConnection> {
    const connection = this.integrationConnections.get(id);
    if (!connection) {
      throw new Error(`Integration connection with ID ${id} not found`);
    }
    const updatedConnection = { 
      ...connection, 
      ...data, 
      updated_at: new Date() 
    };
    this.integrationConnections.set(id, updatedConnection);
    return updatedConnection;
  }
  
  async removeIntegrationConnection(userId: number, platform: string): Promise<void> {
    const connection = Array.from(this.integrationConnections.values())
      .find(c => c.user_id === userId && c.platform === platform);
    
    if (connection) {
      this.integrationConnections.delete(connection.id);
    }
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
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const updatedUser = { 
      ...user, 
      stripe_customer_id: data.stripeCustomerId || user.stripe_customer_id,
      stripe_subscription_id: data.stripeSubscriptionId || user.stripe_subscription_id,
      subscription_status: data.status || user.subscription_status,
      subscription_end_date: data.endDate || user.subscription_end_date,
      updated_at: new Date()
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
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
