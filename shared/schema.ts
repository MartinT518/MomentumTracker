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
  // Subscription information
  stripe_customer_id: text("stripe_customer_id"),
  stripe_subscription_id: text("stripe_subscription_id"),
  subscription_status: varchar("subscription_status", { length: 20 }).default("free"), // free, active, canceled, past_due
  subscription_end_date: timestamp("subscription_end_date"),
  // Admin and role management
  is_admin: boolean("is_admin").default(false),
  role: varchar("role", { length: 20 }).default("user"), // user, coach, admin
  permissions: json("permissions").default([]), // Array of permission strings
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

// New tables for nutrition recommendations

// Food items database
export const food_items = pgTable("food_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // e.g., protein, carbs, vegetable, fruit
  calories: integer("calories").notNull(),
  protein: integer("protein").notNull(), // in grams
  carbs: integer("carbs").notNull(), // in grams
  fat: integer("fat").notNull(), // in grams
  fiber: integer("fiber"), // in grams
  sugar: integer("sugar"), // in grams
  sodium: integer("sodium"), // in mg
  image_url: text("image_url"),
  serving_size: varchar("serving_size", { length: 50 }).notNull(),
  serving_unit: varchar("serving_unit", { length: 20 }).notNull(),
  is_vegetarian: boolean("is_vegetarian").default(false),
  is_vegan: boolean("is_vegan").default(false),
  is_gluten_free: boolean("is_gluten_free").default(false),
  glycemic_index: integer("glycemic_index"),
  created_at: timestamp("created_at").defaultNow(),
});

// Meal plans recommended to users
export const meal_plans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  plan_date: date("plan_date").notNull(),
  training_load: varchar("training_load", { length: 20 }), // rest, light, moderate, heavy
  calories_target: integer("calories_target"),
  protein_target: integer("protein_target"),
  carbs_target: integer("carbs_target"),
  fat_target: integer("fat_target"),
  hydration_target: integer("hydration_target"),
  notes: text("notes"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

// Individual meals within a meal plan
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  meal_plan_id: integer("meal_plan_id").references(() => meal_plans.id).notNull(),
  meal_type: varchar("meal_type", { length: 20 }).notNull(), // breakfast, lunch, dinner, snack
  time_of_day: varchar("time_of_day", { length: 20 }), // morning, afternoon, evening
  calories: integer("calories"),
  protein: integer("protein"),
  carbs: integer("carbs"),
  fat: integer("fat"),
  created_at: timestamp("created_at").defaultNow(),
});

// Food items in each meal
export const meal_food_items = pgTable("meal_food_items", {
  id: serial("id").primaryKey(),
  meal_id: integer("meal_id").references(() => meals.id).notNull(),
  food_item_id: integer("food_item_id").references(() => food_items.id).notNull(),
  quantity: decimal("quantity").notNull(),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    unq: unique().on(table.meal_id, table.food_item_id),
  };
});

// User nutrition preferences
export const nutrition_preferences = pgTable("nutrition_preferences", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  dietary_restrictions: varchar("dietary_restrictions", { length: 255 }), // comma-separated list: vegetarian, vegan, gluten-free, etc.
  allergies: varchar("allergies", { length: 255 }), // comma-separated list
  disliked_foods: varchar("disliked_foods", { length: 255 }), // comma-separated list
  favorite_foods: varchar("favorite_foods", { length: 255 }), // comma-separated list
  breakfast_time: varchar("breakfast_time", { length: 10 }),
  lunch_time: varchar("lunch_time", { length: 10 }),
  dinner_time: varchar("dinner_time", { length: 10 }),
  snack_times: varchar("snack_times", { length: 50 }),
  calorie_goal: integer("calorie_goal"),
  protein_goal: integer("protein_goal"), // % of total calories
  carbs_goal: integer("carbs_goal"), // % of total calories
  fat_goal: integer("fat_goal"), // % of total calories
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

// External fitness platform integrations
export const integration_connections = pgTable("integration_connections", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  platform: varchar("platform", { length: 50 }).notNull(), // strava, garmin, polar
  access_token: text("access_token").notNull(),
  refresh_token: text("refresh_token"),
  token_expires_at: timestamp("token_expires_at"),
  athlete_id: varchar("athlete_id", { length: 100 }), // External platform's user ID
  is_active: boolean("is_active").default(true),
  last_sync_at: timestamp("last_sync_at"),
  auto_sync: boolean("auto_sync").default(true),
  sync_frequency: varchar("sync_frequency", { length: 20 }).default("daily"), // "daily" or "realtime"
  scope: text("scope"), // Permissions granted by the user
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    unq: unique().on(table.user_id, table.platform),
  };
});

// Sync logs for tracking integration data synchronization
export const sync_logs = pgTable("sync_logs", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  platform: varchar("platform", { length: 50 }).notNull(), // strava, garmin, polar
  sync_start_time: timestamp("sync_start_time").notNull(),
  sync_end_time: timestamp("sync_end_time"),
  status: varchar("status", { length: 20 }).notNull(), // in_progress, completed, failed
  activities_synced: integer("activities_synced").default(0),
  activities_created: integer("activities_created").default(0),
  activities_updated: integer("activities_updated").default(0),
  activities_skipped: integer("activities_skipped").default(0),
  error: text("error"),
  created_at: timestamp("created_at").defaultNow(),
});

// Health metrics (HRV, resting HR, sleep quality)
export const health_metrics = pgTable("health_metrics", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  metric_date: date("metric_date").notNull(),
  hrv_score: integer("hrv_score"), // Heart rate variability score
  resting_heart_rate: integer("resting_heart_rate"), // BPM
  sleep_quality: integer("sleep_quality"), // 1-10 scale
  sleep_duration: integer("sleep_duration"), // In minutes
  energy_level: integer("energy_level"), // 1-10 scale
  stress_level: integer("stress_level"), // 1-10 scale
  source: varchar("source", { length: 50 }).default("manual"), // manual, strava, garmin, polar
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    unq: unique().on(table.user_id, table.metric_date),
  };
});

// User onboarding and fitness profile
export const onboarding_status = pgTable("onboarding_status", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  step: varchar("step", { length: 50 }).default("welcome").notNull(), // Required step field
  completed: boolean("completed").default(false),
  current_step: varchar("current_step", { length: 50 }).default("welcome"),
  steps_completed: text("steps_completed").array(), // Array of completed step IDs
  last_updated: timestamp("last_updated").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Removed duplicate onboarding_drafts table - defined later in file

// User fitness goals for onboarding
export const fitness_goals = pgTable("fitness_goals", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  goal_type: varchar("goal_type", { length: 50 }).notNull(), // running, weight_loss, general_fitness, etc.
  target_value: decimal("target_value"), // Numeric target value (if applicable)
  target_unit: varchar("target_unit", { length: 20 }), // miles, kg, etc.
  time_frame: integer("time_frame"), // Number of weeks/months
  time_frame_unit: varchar("time_frame_unit", { length: 20 }), // weeks, months
  start_date: date("start_date").defaultNow(),
  target_date: date("target_date"),
  status: varchar("status", { length: 20 }).default("active"), // active, completed, abandoned
  // Additional fields from actual database
  frequency_per_week: integer("frequency_per_week"),
  weekly_mileage: decimal("weekly_mileage"),
  race_distance: varchar("race_distance", { length: 50 }),
  target_time: varchar("target_time", { length: 20 }),
  experience_level: varchar("experience_level", { length: 20 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// User experience level - matches experience_levels table
export const experience_levels = pgTable("experience_levels", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  running_years: integer("running_years"), // Years of running experience
  weekly_mileage: decimal("weekly_mileage"), // Current weekly mileage
  current_level: varchar("current_level", { length: 50 }), // beginner, intermediate, advanced
  races_completed: text("races_completed"), // Stored as text, not array
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// User training preferences - matches training_preferences table
export const training_preferences = pgTable("training_preferences", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  cross_training: boolean("cross_training").default(false),
  rest_days: text("rest_days"), // Stored as text, list of rest days
  cross_training_activities: text("cross_training_activities"), // Stored as text
  preferred_days: text("preferred_days"), // Days of week preferred for running
  preferred_time: varchar("preferred_time", { length: 20 }), // morning, afternoon, evening
  long_run_day: varchar("long_run_day", { length: 10 }), // day of week for long run
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Note: We already have a training_preferences table defined above
// that matches the actual database structure



// Onboarding drafts for saving step progress
export const onboarding_drafts = pgTable("onboarding_drafts", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  step_name: varchar("step_name", { length: 50 }).notNull(),
  draft_data: json("draft_data").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserStep: unique().on(table.user_id, table.step_name),
}));

// Subscription plans
export const subscription_plans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  description: text("description"),
  price: decimal("price").notNull(),
  billing_interval: varchar("billing_interval", { length: 20 }).notNull().default("month"), // month, year
  stripe_price_id: text("stripe_price_id"),
  features: json("features"), // Array of features included in this plan
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Insert schemas for validations
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true,
  subscription_status: true,
  stripe_customer_id: true,
  stripe_subscription_id: true,
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

export const insertIntegrationConnectionSchema = createInsertSchema(integration_connections).omit({
  id: true,
  created_at: true,
  updated_at: true,
  last_sync_at: true,
});

export const insertHealthMetricsSchema = createInsertSchema(health_metrics).omit({
  id: true,
  created_at: true,
});

export const insertSyncLogSchema = createInsertSchema(sync_logs).omit({
  id: true,
  created_at: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscription_plans).omit({
  id: true,
  created_at: true,
  updated_at: true,
  is_active: true,
});

// Insert schemas for nutrition recommendation
export const insertFoodItemSchema = createInsertSchema(food_items).omit({
  id: true,
  created_at: true,
});

export const insertMealPlanSchema = createInsertSchema(meal_plans).omit({
  id: true,
  created_at: true,
});

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true,
  created_at: true,
});

export const insertMealFoodItemSchema = createInsertSchema(meal_food_items).omit({
  id: true,
  created_at: true,
});

export const insertNutritionPreferenceSchema = createInsertSchema(nutrition_preferences).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Onboarding schema inserts
export const insertOnboardingStatusSchema = createInsertSchema(onboarding_status).omit({
  id: true,
  created_at: true,
});

export const insertOnboardingDraftSchema = createInsertSchema(onboarding_drafts).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertFitnessGoalSchema = createInsertSchema(fitness_goals).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertExperienceLevelSchema = createInsertSchema(experience_levels).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertTrainingPreferencesSchema = createInsertSchema(training_preferences).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SubscriptionPlan = typeof subscription_plans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SyncLog = typeof sync_logs.$inferSelect;
export type InsertSyncLog = z.infer<typeof insertSyncLogSchema>;
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
export type IntegrationConnection = typeof integration_connections.$inferSelect;
export type InsertIntegrationConnection = z.infer<typeof insertIntegrationConnectionSchema>;
export type HealthMetric = typeof health_metrics.$inferSelect;
export type InsertHealthMetric = z.infer<typeof insertHealthMetricsSchema>;

// Types for nutrition recommendation
export type FoodItem = typeof food_items.$inferSelect;
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;

export type MealPlan = typeof meal_plans.$inferSelect;
export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;

export type MealFoodItem = typeof meal_food_items.$inferSelect;
export type InsertMealFoodItem = z.infer<typeof insertMealFoodItemSchema>;

export type NutritionPreference = typeof nutrition_preferences.$inferSelect;
export type InsertNutritionPreference = z.infer<typeof insertNutritionPreferenceSchema>;

// Onboarding types
export type OnboardingStatus = typeof onboarding_status.$inferSelect;
export type InsertOnboardingStatus = z.infer<typeof insertOnboardingStatusSchema>;

export type OnboardingDraft = typeof onboarding_drafts.$inferSelect;
export type InsertOnboardingDraft = z.infer<typeof insertOnboardingDraftSchema>;

export type FitnessGoal = typeof fitness_goals.$inferSelect;
export type InsertFitnessGoal = z.infer<typeof insertFitnessGoalSchema>;

export type ExperienceLevel = typeof experience_levels.$inferSelect;
export type InsertExperienceLevel = z.infer<typeof insertExperienceLevelSchema>;

export type TrainingPreference = typeof training_preferences.$inferSelect;
export type InsertTrainingPreference = z.infer<typeof insertTrainingPreferencesSchema>;

// Platform integrations for fitness trackers and health data
export const platform_integrations = pgTable("platform_integrations", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  platform: varchar("platform", { length: 50 }).notNull(), // strava, garmin, polar, google_fit, whoop, apple_health, fitbit
  access_token: text("access_token"),
  refresh_token: text("refresh_token"),
  token_expiry: timestamp("token_expiry"),
  platform_user_id: varchar("platform_user_id", { length: 100 }),
  is_active: boolean("is_active").default(true),
  auto_sync: boolean("auto_sync").default(true),
  last_synced: timestamp("last_synced"),
  connected_at: timestamp("connected_at").defaultNow(),
  data_consent: boolean("data_consent").default(false), // User consents to data processing
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    user_platform: unique().on(table.user_id, table.platform),
  }
});

// Create insert schema for platform integrations
export const insertPlatformIntegrationSchema = createInsertSchema(platform_integrations, {
  platform: z.enum(['strava', 'garmin', 'polar', 'google_fit', 'whoop', 'apple_health', 'fitbit'])
}).omit({ id: true });

// Export types for platform integrations
export type PlatformIntegration = typeof platform_integrations.$inferSelect;
export type InsertPlatformIntegration = z.infer<typeof insertPlatformIntegrationSchema>;
