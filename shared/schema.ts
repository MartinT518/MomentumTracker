import { pgTable, text, serial, integer, timestamp, json, boolean, varchar, decimal, date } from "drizzle-orm/pg-core";
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

// Insert schemas for validations
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  age: true,
  weight: true,
  height: true,
  experience_level: true,
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
