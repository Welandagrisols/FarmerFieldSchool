import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFarmSchema, insertPlotSchema, insertPathSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Farm routes
  app.get("/api/farms", async (req, res) => {
    try {
      const farms = await storage.getFarms();
      res.json(farms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch farms" });
    }
  });

  app.get("/api/farms/:id", async (req, res) => {
    try {
      const farm = await storage.getFarm(req.params.id);
      if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
      }
      res.json(farm);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch farm" });
    }
  });

  app.post("/api/farms", async (req, res) => {
    try {
      const validatedData = insertFarmSchema.parse(req.body);
      const farm = await storage.createFarm(validatedData);
      res.status(201).json(farm);
    } catch (error) {
      res.status(400).json({ message: "Invalid farm data" });
    }
  });

  app.put("/api/farms/:id", async (req, res) => {
    try {
      const validatedData = insertFarmSchema.partial().parse(req.body);
      const farm = await storage.updateFarm(req.params.id, validatedData);
      if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
      }
      res.json(farm);
    } catch (error) {
      res.status(400).json({ message: "Invalid farm data" });
    }
  });

  app.delete("/api/farms/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteFarm(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Farm not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete farm" });
    }
  });

  // Plot routes
  app.get("/api/farms/:farmId/plots", async (req, res) => {
    try {
      const plots = await storage.getPlotsByFarmId(req.params.farmId);
      res.json(plots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch plots" });
    }
  });

  app.post("/api/farms/:farmId/plots", async (req, res) => {
    try {
      const validatedData = insertPlotSchema.parse({
        ...req.body,
        farmId: req.params.farmId,
      });
      const plot = await storage.createPlot(validatedData);
      res.status(201).json(plot);
    } catch (error) {
      res.status(400).json({ message: "Invalid plot data" });
    }
  });

  app.put("/api/plots/:id", async (req, res) => {
    try {
      const validatedData = insertPlotSchema.partial().parse(req.body);
      const plot = await storage.updatePlot(req.params.id, validatedData);
      if (!plot) {
        return res.status(404).json({ message: "Plot not found" });
      }
      res.json(plot);
    } catch (error) {
      res.status(400).json({ message: "Invalid plot data" });
    }
  });

  app.delete("/api/plots/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePlot(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Plot not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete plot" });
    }
  });

  // Path routes
  app.get("/api/farms/:farmId/paths", async (req, res) => {
    try {
      const paths = await storage.getPathsByFarmId(req.params.farmId);
      res.json(paths);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch paths" });
    }
  });

  app.post("/api/farms/:farmId/paths", async (req, res) => {
    try {
      const validatedData = insertPathSchema.parse({
        ...req.body,
        farmId: req.params.farmId,
      });
      const path = await storage.createPath(validatedData);
      res.status(201).json(path);
    } catch (error) {
      res.status(400).json({ message: "Invalid path data" });
    }
  });

  app.put("/api/paths/:id", async (req, res) => {
    try {
      const validatedData = insertPathSchema.partial().parse(req.body);
      const path = await storage.updatePath(req.params.id, validatedData);
      if (!path) {
        return res.status(404).json({ message: "Path not found" });
      }
      res.json(path);
    } catch (error) {
      res.status(400).json({ message: "Invalid path data" });
    }
  });

  app.delete("/api/paths/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePath(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Path not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete path" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
