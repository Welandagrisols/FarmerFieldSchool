import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication - using Supabase auth.users structure
export const users = pgTable("users", {
  id: varchar("id").primaryKey(), // Supabase UUID
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced farms table with user ownership and detailed project data
export const farms = pgTable("farms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Reference to auth user
  name: text("name").notNull(), // Project name
  ownerName: text("owner_name").notNull(), // Owner/farmer name
  location: text("location").notNull(), // Address or description
  latitude: decimal("latitude", { precision: 10, scale: 8 }), // GPS coordinates
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  farmSize: decimal("farm_size", { precision: 10, scale: 2 }), // Size in acres/hectares
  crops: text("crops").array(), // Array of crop types
  notes: text("notes"), // Additional project notes
  layoutData: jsonb("layout_data"), // JSON data for plot layouts and paths
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Plots table - now references farms with enhanced structure
export const plots = pgTable("plots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  farmId: varchar("farm_id").notNull(),
  name: text("name").notNull(),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  color: text("color").notNull().default("green"),
  cropType: text("crop_type"), // What's planted in this plot
  createdAt: timestamp("created_at").defaultNow(),
});

// Paths table for farm layout design
export const paths = pgTable("paths", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  farmId: varchar("farm_id").notNull(),
  name: text("name").notNull().default("Walking Path"),
  points: text("points").notNull(), // JSON string of path coordinates
  width: integer("width").notNull().default(2),
  color: text("color").notNull().default("brown"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema validation for user input
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Farm project schema - includes all project details
export const insertFarmSchema = createInsertSchema(farms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Add custom validation for coordinates
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  farmSize: z.number().positive().optional().nullable(),
  crops: z.array(z.string()).optional().nullable(),
});

export const insertPlotSchema = createInsertSchema(plots).omit({
  id: true,
  createdAt: true,
});

export const insertPathSchema = createInsertSchema(paths).omit({
  id: true,
  createdAt: true,
});

// TypeScript types for the application
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertFarm = z.infer<typeof insertFarmSchema>;
export type Farm = typeof farms.$inferSelect;
export type InsertPlot = z.infer<typeof insertPlotSchema>;
export type Plot = typeof plots.$inferSelect;
export type InsertPath = z.infer<typeof insertPathSchema>;
export type Path = typeof paths.$inferSelect;
