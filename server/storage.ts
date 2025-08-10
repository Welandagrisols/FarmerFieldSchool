import { type Farm, type InsertFarm, type Plot, type InsertPlot } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Farm operations
  getFarm(id: string): Promise<Farm | undefined>;
  getFarms(): Promise<Farm[]>;
  createFarm(farm: InsertFarm): Promise<Farm>;
  updateFarm(id: string, farm: Partial<InsertFarm>): Promise<Farm | undefined>;
  deleteFarm(id: string): Promise<boolean>;

  // Plot operations
  getPlot(id: string): Promise<Plot | undefined>;
  getPlotsByFarmId(farmId: string): Promise<Plot[]>;
  createPlot(plot: InsertPlot): Promise<Plot>;
  updatePlot(id: string, plot: Partial<InsertPlot>): Promise<Plot | undefined>;
  deletePlot(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private farms: Map<string, Farm>;
  private plots: Map<string, Plot>;

  constructor() {
    this.farms = new Map();
    this.plots = new Map();
  }

  // Farm operations
  async getFarm(id: string): Promise<Farm | undefined> {
    return this.farms.get(id);
  }

  async getFarms(): Promise<Farm[]> {
    return Array.from(this.farms.values());
  }

  async createFarm(insertFarm: InsertFarm): Promise<Farm> {
    const id = randomUUID();
    const farm: Farm = { ...insertFarm, id };
    this.farms.set(id, farm);
    return farm;
  }

  async updateFarm(id: string, farmUpdate: Partial<InsertFarm>): Promise<Farm | undefined> {
    const existing = this.farms.get(id);
    if (!existing) return undefined;
    
    const updated: Farm = { ...existing, ...farmUpdate };
    this.farms.set(id, updated);
    return updated;
  }

  async deleteFarm(id: string): Promise<boolean> {
    // Also delete all plots for this farm
    const plots = Array.from(this.plots.values()).filter(plot => plot.farmId === id);
    plots.forEach(plot => this.plots.delete(plot.id));
    
    return this.farms.delete(id);
  }

  // Plot operations
  async getPlot(id: string): Promise<Plot | undefined> {
    return this.plots.get(id);
  }

  async getPlotsByFarmId(farmId: string): Promise<Plot[]> {
    return Array.from(this.plots.values()).filter(plot => plot.farmId === farmId);
  }

  async createPlot(insertPlot: InsertPlot): Promise<Plot> {
    const id = randomUUID();
    const plot: Plot = { ...insertPlot, id };
    this.plots.set(id, plot);
    return plot;
  }

  async updatePlot(id: string, plotUpdate: Partial<InsertPlot>): Promise<Plot | undefined> {
    const existing = this.plots.get(id);
    if (!existing) return undefined;
    
    const updated: Plot = { ...existing, ...plotUpdate };
    this.plots.set(id, updated);
    return updated;
  }

  async deletePlot(id: string): Promise<boolean> {
    return this.plots.delete(id);
  }
}

export const storage = new MemStorage();
