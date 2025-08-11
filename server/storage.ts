import { type Farm, type InsertFarm, type Plot, type InsertPlot, type Path, type InsertPath, type User, type InsertUser, type SeasonalData, type InsertSeasonalData, farms, plots, paths, users, seasonalData } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

// Database connection using Supabase/Neon - with fallback handling
let db: any = null;
try {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://')) {
    const sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql);
  }
} catch (error) {
  console.warn("Database connection failed, will use memory storage:", error);
  db = null;
}

export interface IStorage {
  // User operations for authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Farm operations - now includes user context
  getFarm(id: string, userId?: string): Promise<Farm | undefined>;
  getFarmsByUserId(userId: string): Promise<Farm[]>;
  createFarm(farm: InsertFarm): Promise<Farm>;
  updateFarm(id: string, farm: Partial<InsertFarm>, userId?: string): Promise<Farm | undefined>;
  deleteFarm(id: string, userId?: string): Promise<boolean>;

  // Plot operations
  getPlot(id: string): Promise<Plot | undefined>;
  getPlotsByFarmId(farmId: string): Promise<Plot[]>;
  createPlot(plot: InsertPlot): Promise<Plot>;
  updatePlot(id: string, plot: Partial<InsertPlot>): Promise<Plot | undefined>;
  deletePlot(id: string): Promise<boolean>;

  // Path operations
  getPath(id: string): Promise<Path | undefined>;
  getPathsByFarmId(farmId: string): Promise<Path[]>;
  createPath(path: InsertPath): Promise<Path>;
  updatePath(id: string, path: Partial<InsertPath>): Promise<Path | undefined>;
  deletePath(id: string): Promise<boolean>;

  // Seasonal data operations for baseline data collection
  getSeasonalData(id: string): Promise<SeasonalData | undefined>;
  getSeasonalDataByFarmId(farmId: string): Promise<SeasonalData[]>;
  createSeasonalData(seasonalData: InsertSeasonalData): Promise<SeasonalData>;
  updateSeasonalData(id: string, seasonalData: Partial<InsertSeasonalData>): Promise<SeasonalData | undefined>;
  deleteSeasonalData(id: string): Promise<boolean>;
}

// Database storage implementation using Drizzle ORM and Supabase
export class DatabaseStorage implements IStorage {
  
  // User operations for authentication management
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching user:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const userData = {
        id: randomUUID(),
        email: insertUser.email,
        name: insertUser.name || null,
        createdAt: new Date(),
      };
      const result = await db.insert(users).values(userData).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // Farm operations with user context for data isolation
  async getFarm(id: string, userId?: string): Promise<Farm | undefined> {
    try {
      let whereClause = eq(farms.id, id);
      
      // If userId provided, ensure user can only access their own farms
      if (userId) {
        whereClause = and(eq(farms.id, id), eq(farms.userId, userId))!;
      }
      
      const result = await db.select().from(farms).where(whereClause).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching farm:", error);
      return undefined;
    }
  }

  // Get all farms belonging to a specific user
  async getFarmsByUserId(userId: string): Promise<Farm[]> {
    try {
      const result = await db.select().from(farms).where(eq(farms.userId, userId));
      return result;
    } catch (error) {
      console.error("Error fetching farms for user:", error);
      return [];
    }
  }

  async createFarm(insertFarm: InsertFarm): Promise<Farm> {
    try {
      const farmData = {
        ...insertFarm,
        id: randomUUID(),
        latitude: insertFarm.latitude?.toString() || null,
        longitude: insertFarm.longitude?.toString() || null,
        farmSize: insertFarm.farmSize?.toString() || null,
        crops: insertFarm.crops || null,
        notes: insertFarm.notes || null,
        layoutData: insertFarm.layoutData || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await db.insert(farms).values(farmData).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating farm:", error);
      throw error;
    }
  }

  async updateFarm(id: string, farmUpdate: Partial<InsertFarm>, userId?: string): Promise<Farm | undefined> {
    try {
      const updateData = {
        ...farmUpdate,
        latitude: farmUpdate.latitude?.toString() || undefined,
        longitude: farmUpdate.longitude?.toString() || undefined,
        farmSize: farmUpdate.farmSize?.toString() || undefined,
        updatedAt: new Date(),
      };

      let whereClause = eq(farms.id, id);
      if (userId) {
        whereClause = and(eq(farms.id, id), eq(farms.userId, userId))!;
      }

      const result = await db.update(farms)
        .set(updateData)
        .where(whereClause)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating farm:", error);
      return undefined;
    }
  }

  async deleteFarm(id: string, userId?: string): Promise<boolean> {
    try {
      // First delete all plots and paths for this farm
      await db.delete(plots).where(eq(plots.farmId, id));
      await db.delete(paths).where(eq(paths.farmId, id));

      // Then delete the farm itself
      let whereClause = eq(farms.id, id);
      if (userId) {
        whereClause = and(eq(farms.id, id), eq(farms.userId, userId))!;
      }

      const result = await db.delete(farms).where(whereClause);
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting farm:", error);
      return false;
    }
  }

  // Plot operations
  async getPlot(id: string): Promise<Plot | undefined> {
    try {
      const result = await db.select().from(plots).where(eq(plots.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching plot:", error);
      return undefined;
    }
  }

  async getPlotsByFarmId(farmId: string): Promise<Plot[]> {
    try {
      const result = await db.select().from(plots).where(eq(plots.farmId, farmId));
      return result;
    } catch (error) {
      console.error("Error fetching plots:", error);
      return [];
    }
  }

  async createPlot(insertPlot: InsertPlot): Promise<Plot> {
    try {
      const result = await db.insert(plots).values({
        ...insertPlot,
        createdAt: new Date(),
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating plot:", error);
      throw error;
    }
  }

  async updatePlot(id: string, plotUpdate: Partial<InsertPlot>): Promise<Plot | undefined> {
    try {
      const result = await db.update(plots)
        .set(plotUpdate)
        .where(eq(plots.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating plot:", error);
      return undefined;
    }
  }

  async deletePlot(id: string): Promise<boolean> {
    try {
      const result = await db.delete(plots).where(eq(plots.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting plot:", error);
      return false;
    }
  }

  // Path operations
  async getPath(id: string): Promise<Path | undefined> {
    try {
      const result = await db.select().from(paths).where(eq(paths.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching path:", error);
      return undefined;
    }
  }

  async getPathsByFarmId(farmId: string): Promise<Path[]> {
    try {
      const result = await db.select().from(paths).where(eq(paths.farmId, farmId));
      return result;
    } catch (error) {
      console.error("Error fetching paths:", error);
      return [];
    }
  }

  async createPath(insertPath: InsertPath): Promise<Path> {
    try {
      const result = await db.insert(paths).values({
        ...insertPath,
        createdAt: new Date(),
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating path:", error);
      throw error;
    }
  }

  async updatePath(id: string, pathUpdate: Partial<InsertPath>): Promise<Path | undefined> {
    try {
      const result = await db.update(paths)
        .set(pathUpdate)
        .where(eq(paths.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating path:", error);
      return undefined;
    }
  }

  async deletePath(id: string): Promise<boolean> {
    try {
      const result = await db.delete(paths).where(eq(paths.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting path:", error);
      return false;
    }
  }

  // Seasonal data operations for baseline data collection
  async getSeasonalData(id: string): Promise<SeasonalData | undefined> {
    try {
      const result = await db.select().from(seasonalData).where(eq(seasonalData.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching seasonal data:", error);
      return undefined;
    }
  }

  async getSeasonalDataByFarmId(farmId: string): Promise<SeasonalData[]> {
    try {
      const result = await db.select().from(seasonalData).where(eq(seasonalData.farmId, farmId));
      return result;
    } catch (error) {
      console.error("Error fetching seasonal data:", error);
      return [];
    }
  }

  async createSeasonalData(insertSeasonalData: InsertSeasonalData): Promise<SeasonalData> {
    try {
      // Calculate productivity metrics
      const productivityMetrics = this.calculateProductivity(insertSeasonalData);
      
      const seasonalDataRecord = {
        ...insertSeasonalData,
        id: randomUUID(),
        ...productivityMetrics,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = await db.insert(seasonalData).values(seasonalDataRecord).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating seasonal data:", error);
      throw error;
    }
  }

  async updateSeasonalData(id: string, seasonalDataUpdate: Partial<InsertSeasonalData>): Promise<SeasonalData | undefined> {
    try {
      // Recalculate productivity if yield or area data changed
      const productivityMetrics = this.calculateProductivity(seasonalDataUpdate);
      
      const updateData = {
        ...seasonalDataUpdate,
        ...productivityMetrics,
        updatedAt: new Date(),
      };
      
      const result = await db.update(seasonalData)
        .set(updateData)
        .where(eq(seasonalData.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating seasonal data:", error);
      return undefined;
    }
  }

  async deleteSeasonalData(id: string): Promise<boolean> {
    try {
      const result = await db.delete(seasonalData).where(eq(seasonalData.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting seasonal data:", error);
      return false;
    }
  }

  // Helper method to calculate productivity metrics
  private calculateProductivity(data: Partial<InsertSeasonalData>) {
    const metrics: any = {};
    
    if (data.yieldKgs && data.landAreaAcres && data.landAreaM2) {
      metrics.productivityKgsPerAcre = (parseFloat(data.yieldKgs.toString()) / parseFloat(data.landAreaAcres.toString())).toString();
      metrics.productivityKgsPerM2 = (parseFloat(data.yieldKgs.toString()) / parseFloat(data.landAreaM2.toString())).toString();
    }
    
    return metrics;
  }
}

// Fallback memory storage for development (when DATABASE_URL not available)
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private farms: Map<string, Farm>;
  private plots: Map<string, Plot>;
  private paths: Map<string, Path>;
  private seasonalDataRecords: Map<string, SeasonalData>;

  constructor() {
    this.users = new Map();
    this.farms = new Map();
    this.plots = new Map();
    this.paths = new Map();
    this.seasonalDataRecords = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      name: insertUser.name || null,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async getFarm(id: string, userId?: string): Promise<Farm | undefined> {
    const farm = this.farms.get(id);
    if (farm && userId && farm.userId !== userId) {
      return undefined; // User can only access their own farms
    }
    return farm;
  }

  async getFarmsByUserId(userId: string): Promise<Farm[]> {
    return Array.from(this.farms.values()).filter(farm => farm.userId === userId);
  }

  async createFarm(insertFarm: InsertFarm): Promise<Farm> {
    const id = randomUUID();
    const farm: Farm = { 
      ...insertFarm, 
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      latitude: insertFarm.latitude?.toString() || null,
      longitude: insertFarm.longitude?.toString() || null,
      farmSize: insertFarm.farmSize?.toString() || null,
      crops: insertFarm.crops || null,
      notes: insertFarm.notes || null,
      layoutData: insertFarm.layoutData || null,
    };
    this.farms.set(id, farm);
    return farm;
  }

  async updateFarm(id: string, farmUpdate: Partial<InsertFarm>, userId?: string): Promise<Farm | undefined> {
    const existing = this.farms.get(id);
    if (!existing || (userId && existing.userId !== userId)) return undefined;
    
    const updated: Farm = { 
      ...existing, 
      ...farmUpdate,
      updatedAt: new Date(),
      latitude: farmUpdate.latitude?.toString() || existing.latitude,
      longitude: farmUpdate.longitude?.toString() || existing.longitude,
      farmSize: farmUpdate.farmSize?.toString() || existing.farmSize,
    };
    this.farms.set(id, updated);
    return updated;
  }

  async deleteFarm(id: string, userId?: string): Promise<boolean> {
    const existing = this.farms.get(id);
    if (!existing || (userId && existing.userId !== userId)) return false;

    // Delete all plots and paths for this farm
    const plotsToDelete = Array.from(this.plots.values()).filter(plot => plot.farmId === id);
    plotsToDelete.forEach(plot => this.plots.delete(plot.id));
    
    const pathsToDelete = Array.from(this.paths.values()).filter(path => path.farmId === id);
    pathsToDelete.forEach(path => this.paths.delete(path.id));
    
    return this.farms.delete(id);
  }

  async getPlot(id: string): Promise<Plot | undefined> {
    return this.plots.get(id);
  }

  async getPlotsByFarmId(farmId: string): Promise<Plot[]> {
    return Array.from(this.plots.values()).filter(plot => plot.farmId === farmId);
  }

  async createPlot(insertPlot: InsertPlot): Promise<Plot> {
    const id = randomUUID();
    const plot: Plot = { 
      ...insertPlot, 
      id, 
      color: insertPlot.color || "green",
      createdAt: new Date(),
      updatedAt: new Date(),
      cropType: insertPlot.cropType || null,
      seedVariety: insertPlot.seedVariety || null,
      plantingDate: insertPlot.plantingDate ? new Date(insertPlot.plantingDate) : null,
      expectedHarvestDate: insertPlot.expectedHarvestDate ? new Date(insertPlot.expectedHarvestDate) : null,
      basalFertilizerType: insertPlot.basalFertilizerType || null,
      basalFertilizerRate: insertPlot.basalFertilizerRate?.toString() || null,
      basalApplicationDate: insertPlot.basalApplicationDate ? new Date(insertPlot.basalApplicationDate) : null,
      topDressingFertilizerType: insertPlot.topDressingFertilizerType || null,
      topDressingFertilizerRate: insertPlot.topDressingFertilizerRate?.toString() || null,
      topDressingApplicationDate: insertPlot.topDressingApplicationDate ? new Date(insertPlot.topDressingApplicationDate) : null,
      pesticidesUsed: insertPlot.pesticidesUsed || null,
      fungicidesUsed: insertPlot.fungicidesUsed || null,
      herbicidesUsed: insertPlot.herbicidesUsed || null,
      treatmentNotes: insertPlot.treatmentNotes || null,
      expectedYieldPerHectare: insertPlot.expectedYieldPerHectare?.toString() || null,
      actualYieldPerHectare: insertPlot.actualYieldPerHectare?.toString() || null,
      growthStage: insertPlot.growthStage || null,
      notes: insertPlot.notes || null,
    };
    this.plots.set(id, plot);
    return plot;
  }

  async updatePlot(id: string, plotUpdate: Partial<InsertPlot>): Promise<Plot | undefined> {
    const existing = this.plots.get(id);
    if (!existing) return undefined;
    
    const updated: Plot = { 
      ...existing, 
      ...plotUpdate,
      updatedAt: new Date(),
      // Handle date conversions properly
      plantingDate: plotUpdate.plantingDate ? new Date(plotUpdate.plantingDate) : existing.plantingDate,
      expectedHarvestDate: plotUpdate.expectedHarvestDate ? new Date(plotUpdate.expectedHarvestDate) : existing.expectedHarvestDate,
      basalApplicationDate: plotUpdate.basalApplicationDate ? new Date(plotUpdate.basalApplicationDate) : existing.basalApplicationDate,
      topDressingApplicationDate: plotUpdate.topDressingApplicationDate ? new Date(plotUpdate.topDressingApplicationDate) : existing.topDressingApplicationDate,
      // Convert numeric fields to strings to match schema
      basalFertilizerRate: plotUpdate.basalFertilizerRate ? plotUpdate.basalFertilizerRate.toString() : existing.basalFertilizerRate,
      topDressingFertilizerRate: plotUpdate.topDressingFertilizerRate ? plotUpdate.topDressingFertilizerRate.toString() : existing.topDressingFertilizerRate,
      expectedYieldPerHectare: plotUpdate.expectedYieldPerHectare ? plotUpdate.expectedYieldPerHectare.toString() : existing.expectedYieldPerHectare,
      actualYieldPerHectare: plotUpdate.actualYieldPerHectare ? plotUpdate.actualYieldPerHectare.toString() : existing.actualYieldPerHectare,
    };
    this.plots.set(id, updated);
    return updated;
  }

  async deletePlot(id: string): Promise<boolean> {
    return this.plots.delete(id);
  }

  async getPath(id: string): Promise<Path | undefined> {
    return this.paths.get(id);
  }

  async getPathsByFarmId(farmId: string): Promise<Path[]> {
    return Array.from(this.paths.values()).filter(path => path.farmId === farmId);
  }

  async createPath(insertPath: InsertPath): Promise<Path> {
    const id = randomUUID();
    const path: Path = { 
      ...insertPath, 
      id,
      name: insertPath.name || "Walking Path",
      width: insertPath.width || 2,
      color: insertPath.color || "brown",
      createdAt: new Date(),
    };
    this.paths.set(id, path);
    return path;
  }

  async updatePath(id: string, pathUpdate: Partial<InsertPath>): Promise<Path | undefined> {
    const existing = this.paths.get(id);
    if (!existing) return undefined;
    
    const updated: Path = { ...existing, ...pathUpdate };
    this.paths.set(id, updated);
    return updated;
  }

  async deletePath(id: string): Promise<boolean> {
    return this.paths.delete(id);
  }

  // Seasonal data operations
  async getSeasonalData(id: string): Promise<SeasonalData | undefined> {
    return this.seasonalDataRecords.get(id);
  }

  async getSeasonalDataByFarmId(farmId: string): Promise<SeasonalData[]> {
    return Array.from(this.seasonalDataRecords.values()).filter(data => data.farmId === farmId);
  }

  async createSeasonalData(insertSeasonalData: InsertSeasonalData): Promise<SeasonalData> {
    const id = randomUUID();
    
    // Calculate productivity metrics
    const productivityMetrics = this.calculateProductivity(insertSeasonalData);
    
    const seasonalData: SeasonalData = { 
      ...insertSeasonalData,
      id,
      ...productivityMetrics,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.seasonalDataRecords.set(id, seasonalData);
    return seasonalData;
  }

  async updateSeasonalData(id: string, seasonalDataUpdate: Partial<InsertSeasonalData>): Promise<SeasonalData | undefined> {
    const existing = this.seasonalDataRecords.get(id);
    if (!existing) return undefined;

    // Recalculate productivity metrics
    const productivityMetrics = this.calculateProductivity(seasonalDataUpdate);
    
    const updated: SeasonalData = {
      ...existing,
      ...seasonalDataUpdate,
      ...productivityMetrics,
      updatedAt: new Date(),
    };
    
    this.seasonalDataRecords.set(id, updated);
    return updated;
  }

  async deleteSeasonalData(id: string): Promise<boolean> {
    return this.seasonalDataRecords.delete(id);
  }

  // Helper method to calculate productivity metrics
  private calculateProductivity(data: Partial<InsertSeasonalData>) {
    const metrics: any = {};
    
    if (data.yieldKgs && data.landAreaAcres && data.landAreaM2) {
      const yieldKgs = typeof data.yieldKgs === 'string' ? parseFloat(data.yieldKgs) : data.yieldKgs;
      const landAreaAcres = typeof data.landAreaAcres === 'string' ? parseFloat(data.landAreaAcres) : data.landAreaAcres;
      const landAreaM2 = typeof data.landAreaM2 === 'string' ? parseFloat(data.landAreaM2) : data.landAreaM2;
      
      metrics.productivityKgsPerAcre = (yieldKgs / landAreaAcres).toString();
      metrics.productivityKgsPerM2 = (yieldKgs / landAreaM2).toString();
    }
    
    return metrics;
  }
}

// Initialize storage based on environment
// Use DatabaseStorage when DATABASE_URL is available and properly formatted, fallback to MemStorage for development
export const storage: IStorage = (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://') && db)
  ? new DatabaseStorage() 
  : new MemStorage();

console.log(`Using ${(process.env.DATABASE_URL && db) ? 'Database' : 'Memory'} storage`);
