import { pgTable, text, serial, integer, boolean, timestamp, real, numeric, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  avatarInitials: text("avatar_initials").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  avatarInitials: true,
});

export const persons = pgTable("persons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hourlyRate: real("hourly_rate").notNull(),
  deductionRate: real("deduction_rate").notNull(),
});

export const insertPersonSchema = createInsertSchema(persons).pick({
  name: true,
  hourlyRate: true,
  deductionRate: true,
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  name: true,
  color: true,
});

export const workLogs = pgTable("work_logs", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").notNull(),
  activityId: integer("activity_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  durationMinutes: real("duration_minutes").notNull(),
  earnings: numeric("earnings").notNull(),
  deduction: numeric("deduction").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkLogSchema = createInsertSchema(workLogs).pick({
  personId: true,
  activityId: true,
  startTime: true,
  endTime: true,
  durationMinutes: true,
  earnings: true,
  deduction: true,
});

export const finances = pgTable("finances", {
  id: serial("id").primaryKey(),
  amount: numeric("amount").notNull(),
  currency: text("currency").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // income, expense
  category: text("category"),
  date: timestamp("date").defaultNow().notNull(),
  offsetByEarnings: numeric("offset_by_earnings").default("0").notNull(),
});

export const insertFinanceSchema = createInsertSchema(finances).pick({
  amount: true,
  currency: true,
  description: true,
  type: true,
  category: true,
  date: true,
  offsetByEarnings: true,
});

export const debts = pgTable("debts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  totalAmount: numeric("total_amount").notNull(),
  remainingAmount: numeric("remaining_amount").notNull(),
  paidAmount: numeric("paid_amount").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDebtSchema = createInsertSchema(debts).pick({
  name: true,
  totalAmount: true,
  remainingAmount: true,
  paidAmount: true,
});

export const debtPayments = pgTable("debt_payments", {
  id: serial("id").primaryKey(),
  debtId: integer("debt_id").notNull(),
  amount: numeric("amount").notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

export const insertDebtPaymentSchema = createInsertSchema(debtPayments).pick({
  debtId: true,
  amount: true,
  date: true,
});

export const timerSessions = pgTable("timer_sessions", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").notNull(),
  activityId: integer("activity_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  status: text("status").notNull(), // running, paused, stopped
  pausedDurationSeconds: integer("paused_duration_seconds").default(0).notNull(),
  serializedState: json("serialized_state"),
});

export const insertTimerSessionSchema = createInsertSchema(timerSessions).pick({
  personId: true,
  activityId: true,
  startTime: true,
  status: true,
  pausedDurationSeconds: true,
  serializedState: true,
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: json("value").notNull(),
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  key: true,
  value: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Person = typeof persons.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertWorkLog = z.infer<typeof insertWorkLogSchema>;
export type WorkLog = typeof workLogs.$inferSelect;

export type InsertFinance = z.infer<typeof insertFinanceSchema>;
export type Finance = typeof finances.$inferSelect;

export type InsertDebt = z.infer<typeof insertDebtSchema>;
export type Debt = typeof debts.$inferSelect;

export type InsertDebtPayment = z.infer<typeof insertDebtPaymentSchema>;
export type DebtPayment = typeof debtPayments.$inferSelect;

export type InsertTimerSession = z.infer<typeof insertTimerSessionSchema>;
export type TimerSession = typeof timerSessions.$inferSelect;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
