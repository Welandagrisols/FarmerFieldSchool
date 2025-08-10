import { Farm, Plot, InsertFarm, InsertPlot } from '@shared/schema';

const FARMS_KEY = 'farm-planner-farms';
const PLOTS_KEY = 'farm-planner-plots';

export class LocalStorageService {
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Farm operations
  getFarms(): Farm[] {
    const data = localStorage.getItem(FARMS_KEY);
    return data ? JSON.parse(data) : [];
  }

  getFarm(id: string): Farm | undefined {
    const farms = this.getFarms();
    return farms.find(farm => farm.id === id);
  }

  createFarm(farm: InsertFarm): Farm {
    const farms = this.getFarms();
    const newFarm: Farm = {
      ...farm,
      id: this.generateId(),
    };
    farms.push(newFarm);
    localStorage.setItem(FARMS_KEY, JSON.stringify(farms));
    return newFarm;
  }

  updateFarm(id: string, updates: Partial<InsertFarm>): Farm | undefined {
    const farms = this.getFarms();
    const index = farms.findIndex(farm => farm.id === id);
    if (index === -1) return undefined;

    farms[index] = { ...farms[index], ...updates };
    localStorage.setItem(FARMS_KEY, JSON.stringify(farms));
    return farms[index];
  }

  deleteFarm(id: string): boolean {
    const farms = this.getFarms();
    const filtered = farms.filter(farm => farm.id !== id);
    if (filtered.length === farms.length) return false;

    // Also delete all plots for this farm
    const plots = this.getPlots();
    const filteredPlots = plots.filter(plot => plot.farmId !== id);
    localStorage.setItem(PLOTS_KEY, JSON.stringify(filteredPlots));

    localStorage.setItem(FARMS_KEY, JSON.stringify(filtered));
    return true;
  }

  // Plot operations
  getPlots(): Plot[] {
    const data = localStorage.getItem(PLOTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  getPlotsByFarmId(farmId: string): Plot[] {
    const plots = this.getPlots();
    return plots.filter(plot => plot.farmId === farmId);
  }

  createPlot(plot: InsertPlot): Plot {
    const plots = this.getPlots();
    const newPlot: Plot = {
      ...plot,
      id: this.generateId(),
    };
    plots.push(newPlot);
    localStorage.setItem(PLOTS_KEY, JSON.stringify(plots));
    return newPlot;
  }

  updatePlot(id: string, updates: Partial<InsertPlot>): Plot | undefined {
    const plots = this.getPlots();
    const index = plots.findIndex(plot => plot.id === id);
    if (index === -1) return undefined;

    plots[index] = { ...plots[index], ...updates };
    localStorage.setItem(PLOTS_KEY, JSON.stringify(plots));
    return plots[index];
  }

  deletePlot(id: string): boolean {
    const plots = this.getPlots();
    const filtered = plots.filter(plot => plot.id !== id);
    if (filtered.length === plots.length) return false;

    localStorage.setItem(PLOTS_KEY, JSON.stringify(filtered));
    return true;
  }
}

export const localStorageService = new LocalStorageService();
