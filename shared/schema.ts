import { pgTable, text, serial, integer, timestamp, json, boolean, varchar, decimal, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: text("password").notNull(),
  email: varchar("email", { length: 100 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  // Profile information
  age: integer("age"),
  weight: decimal("weight"), // In kg
  height: decimal("height"), // In cm
  experience_level: varchar("experience_level", { length: 20 }), // beginner, intermediate, advanced
  bio: text("bio"),
  profile_image: text("profile_image"),
});

// Training goals
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  goal_type: varchar("goal_type", { length: 50 }).notNull(), // race, distance, pace, endurance, weight_loss
  target_date: date("target_date"),
  target_distance: decimal("target_distance"), // For race or distance goals
  target_pace: varchar("target_pace", { length: 20 }), // For pace goals, stored as MM:SS
  status: varchar("status", { length: 20 }).default("active"), // active, completed, archived
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Running activities
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  activity_date: date("activity_date").notNull(),
  activity_type: varchar("activity_type", { length: 50 }).notNull(), // run, cross_train, rest
  distance: decimal("distance"), // In miles
  duration: integer("duration"), // In seconds
  pace: varchar("pace", { length: 20 }), // Stored as MM:SS
  heart_rate: integer("heart_rate"), // Average heart rate
  effort_level: varchar("effort_level", { length: 20 }), // easy, moderate, hard
  notes: text("notes"),
  source: varchar("source", { length: 50 }).default("manual"), // manual, strava, garmin, polar
  created_at: timestamp("created_at").defaultNow(),
});

// Training plans
export const training_plans = pgTable("training_plans", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  goal_id: integer("goal_id").references(() => goals.id),
  name: varchar("name", { length: 100 }).notNull(),
  duration_weeks: integer("duration_weeks").notNull(),
  current_week: integer("current_week").default(1),
  plan_data: json("plan_data").notNull(), // JSON structure containing workout schedule
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Workout schedules
export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  training_plan_id: integer("training_plan_id").references(() => training_plans.id).notNull(),
  scheduled_date: date("scheduled_date").notNull(),
  workout_type: varchar("workout_type", { length: 50 }).notNull(), // easy, tempo, interval, long, rest, cross
  description: text("description"),
  target_distance: decimal("target_distance"),
  target_pace: varchar("target_pace", { length: 20 }),
  target_duration: integer("target_duration"), // In seconds
  completed: boolean("completed").default(false),
  activity_id: integer("activity_id").references(() => activities.id), // Link to completed activity
  created_at: timestamp("created_at").defaultNow(),
});

// Community Features

// Training groups
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 20 }).default("public"), // public, private, training
  goal_type: varchar("goal_type", { length: 50 }), // e.g., 5k, marathon, weight_loss
  created_by: integer("created_by").references(() => users.id).notNull(),
  image: text("image"),
  member_count: integer("member_count").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Group members
export const group_members = pgTable("group_members", {
  id: serial("id").primaryKey(),
  group_id: integer("group_id").references(() => groups.id).notNull(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  role: varchar("role", { length: 20 }).default("member"), // admin, member
  joined_at: timestamp("joined_at").defaultNow(),
  status: varchar("status", { length: 20 }).default("active"), // active, inactive, banned
}, (table) => {
  return {
    unq: unique().on(table.group_id, table.user_id),
  };
});

// Achievements system
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: text("icon"),
  type: varchar("type", { length: 50 }).notNull(), // distance, streak, race, etc.
  threshold: integer("threshold"), // e.g., run 100km, 10 day streak
  created_at: timestamp("created_at").defaultNow(),
});

// User achievements
export const user_achievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  achievement_id: integer("achievement_id").references(() => achievements.id).notNull(),
  earned_at: timestamp("earned_at").defaultNow(),
  times_earned: integer("times_earned").default(1),
}, (table) => {
  return {
    unq: unique().on(table.user_id, table.achievement_id),
  };
});

// Community challenges
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  challenge_type: varchar("challenge_type", { length: 50 }).notNull(), // distance, elevation, streak
  target_value: decimal("target_value").notNull(),
  created_by: integer("created_by").references(() => users.id),
  group_id: integer("group_id").references(() => groups.id),
  is_public: boolean("is_public").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Challenge participants
export const challenge_participants = pgTable("challenge_participants", {
  id: serial("id").primaryKey(),
  challenge_id: integer("challenge_id").references(() => challenges.id).notNull(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  current_progress: decimal("current_progress").default("0"),
  status: varchar("status", { length: 20 }).default("active"), // active, completed, dropped
  joined_at: timestamp("joined_at").defaultNow(),
}, (table) => {
  return {
    unq: unique().on(table.challenge_id, table.user_id),
  };
});

// Training buddies
export const buddies = pgTable("buddies", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  buddy_id: integer("buddy_id").references(() => users.id).notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // pending, accepted, declined
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    unq: unique().on(table.user_id, table.buddy_id),
  };
});

// Nutrition tracking
export const nutrition_logs = pgTable("nutrition_logs", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  log_date: date("log_date").notNull(),
  calories: integer("calories"),
  protein: integer("protein"), // in grams
  carbs: integer("carbs"), // in grams
  fat: integer("fat"), // in grams
  hydration: integer("hydration"), // in ml
  meal_quality: integer("meal_quality"), // 1-5 rating
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Human coaching
export const coaches = pgTable("coaches", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  bio: text("bio"),
  specialty: varchar("specialty", { length: 50 }),
  experience_years: integer("experience_years"),
  certifications: text("certifications"),
  profile_image: text("profile_image"),
  hourly_rate: decimal("hourly_rate"),
  available: boolean("available").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const coaching_sessions = pgTable("coaching_sessions", {
  id: serial("id").primaryKey(),
  coach_id: integer("coach_id").references(() => coaches.id).notNull(),
  athlete_id: integer("athlete_id").references(() => users.id).notNull(),
  session_date: timestamp("session_date").notNull(),
  duration_minutes: integer("duration_minutes").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // video_call, form_analysis, plan_review
  status: varchar("status", { length: 20 }).default("scheduled"), // scheduled, completed, cancelled
  notes: text("notes"),
  recording_url: text("recording_url"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Insert schemas for validations
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  age: true,
  weight: true,
  height: true,
  experience_level: true,
  bio: true,
  profile_image: true,
}).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  created_at: true,
});

export const insertTrainingPlanSchema = createInsertSchema(training_plans).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertWorkoutSchema = createInsertSchema(workouts).omit({
  id: true,
  created_at: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  created_at: true,
  updated_at: true,
  member_count: true,
});

export const insertGroupMemberSchema = createInsertSchema(group_members).omit({
  id: true,
  joined_at: true,
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertBuddySchema = createInsertSchema(buddies).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertNutritionLogSchema = createInsertSchema(nutrition_logs).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertCoachSchema = createInsertSchema(coaches).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertCoachingSessionSchema = createInsertSchema(coaching_sessions).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type TrainingPlan = typeof training_plans.$inferSelect;
export type InsertTrainingPlan = z.infer<typeof insertTrainingPlanSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type GroupMember = typeof group_members.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Buddy = typeof buddies.$inferSelect;
export type InsertBuddy = z.infer<typeof insertBuddySchema>;
export type NutritionLog = typeof nutrition_logs.$inferSelect;
export type InsertNutritionLog = z.infer<typeof insertNutritionLogSchema>;
export type Coach = typeof coaches.$inferSelect;
export type InsertCoach = z.infer<typeof insertCoachSchema>;
export type CoachingSession = typeof coaching_sessions.$inferSelect;
export type InsertCoachingSession = z.infer<typeof insertCoachingSessionSchema>;
