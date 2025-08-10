import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const farms = pgTable("farms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location").notNull(),
  description: text("description"),
});

export const plots = pgTable("plots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  farmId: varchar("farm_id").notNull(),
  name: text("name").notNull(),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  color: text("color").notNull().default("green"),
});

export const paths = pgTable("paths", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  farmId: varchar("farm_id").notNull(),
  name: text("name").notNull().default("Walking Path"),
  points: text("points").notNull(), // JSON string of path coordinates
  width: integer("width").notNull().default(2),
  color: text("color").notNull().default("brown"),
});

export const insertFarmSchema = createInsertSchema(farms).omit({
  id: true,
});

export const insertPlotSchema = createInsertSchema(plots).omit({
  id: true,
});

export const insertPathSchema = createInsertSchema(paths).omit({
  id: true,
});

export type InsertFarm = z.infer<typeof insertFarmSchema>;
export type Farm = typeof farms.$inferSelect;
export type InsertPlot = z.infer<typeof insertPlotSchema>;
export type Plot = typeof plots.$inferSelect;
export type InsertPath = z.infer<typeof insertPathSchema>;
export type Path = typeof paths.$inferSelect;
