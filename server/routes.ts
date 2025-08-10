import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFarmSchema, insertPlotSchema, insertPathSchema, insertUserSchema, insertSeasonalDataSchema } from "@shared/schema";

// Simple session interface for authentication
// In production, this would integrate with Supabase Auth or similar
interface AuthenticatedRequest extends Express.Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

// Middleware to simulate user authentication
// In production, replace with actual Supabase Auth middleware
const authenticateUser = (req: any, res: any, next: any) => {
  // For development, create a demo user if none exists
  // In production, this would verify JWT tokens from Supabase Auth
  if (!req.headers.authorization) {
    // Default demo user for development
    req.user = {
      id: "demo-user-id",
      email: "demo@farm-planner.com", 
      name: "Demo Farmer"
    };
  } else {
    // In production: decode JWT and get user info
    // const token = req.headers.authorization.replace('Bearer ', '');
    // const user = await supabase.auth.getUser(token);
    req.user = {
      id: "demo-user-id",
      email: "demo@farm-planner.com",
      name: "Demo Farmer"
    };
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply authentication middleware to all API routes
  app.use("/api", authenticateUser);

  // User authentication routes
  app.post("/api/auth/login", async (req: AuthenticatedRequest, res) => {
    try {
      const { email } = req.body;
      
      // Check if user exists, create if not (simplified for demo)
      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.createUser({ 
          email, 
          name: req.body.name || "Farmer" 
        });
      }
      
      // In production: generate JWT token here
      res.json({ 
        user, 
        message: "Login successful",
        token: `demo-token-${user.id}` // In production: real JWT
      });
    } catch (error) {
      res.status(400).json({ message: "Login failed" });
    }
  });

  // Enhanced farm routes with user context and project details
  // GET /api/projects - Get all farm projects for authenticated user
  app.get("/api/projects", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Ensure demo user exists in storage
      let user = await storage.getUser(userId);
      if (!user) {
        user = await storage.createUser({ 
          email: req.user!.email, 
          name: req.user!.name || null
        });
      }
      
      // Fetch all farm projects for this user
      const farms = await storage.getFarmsByUserId(userId);
      
      // Return simplified project list for dashboard
      const projects = farms.map(farm => ({
        id: farm.id,
        name: farm.name,
        location: farm.location,
        ownerName: farm.ownerName,
        farmSize: farm.farmSize,
        crops: farm.crops,
        createdAt: farm.createdAt,
        updatedAt: farm.updatedAt,
      }));
      
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch farm projects" });
    }
  });

  // GET /api/projects/:id - Get detailed farm project with layout data
  app.get("/api/projects/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const projectId = req.params.id;
      
      // Get farm project ensuring user owns it
      const farm = await storage.getFarm(projectId, userId);
      if (!farm) {
        return res.status(404).json({ message: "Farm project not found" });
      }

      // Also fetch plots and paths for complete project data
      const plots = await storage.getPlotsByFarmId(projectId);
      const paths = await storage.getPathsByFarmId(projectId);
      
      res.json({
        ...farm,
        plots,
        paths,
      });
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch farm project" });
    }
  });

  // POST /api/projects - Save new farm project with all details
  app.post("/api/projects", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Parse and validate project data including coordinates and layout
      const validatedData = insertFarmSchema.parse({
        ...req.body,
        userId, // Ensure project belongs to authenticated user
      });

      // Create the farm project in database
      const farm = await storage.createFarm(validatedData);
      
      // If layout data includes plots/paths, save them too
      if (req.body.plots && Array.isArray(req.body.plots)) {
        for (const plotData of req.body.plots) {
          await storage.createPlot({
            ...plotData,
            farmId: farm.id,
          });
        }
      }

      if (req.body.paths && Array.isArray(req.body.paths)) {
        for (const pathData of req.body.paths) {
          await storage.createPath({
            ...pathData,
            farmId: farm.id,
          });
        }
      }

      res.status(201).json({
        ...farm,
        message: "Farm project saved successfully"
      });
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ 
        message: "Failed to save farm project",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // PUT /api/projects/:id - Update existing farm project
  app.put("/api/projects/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const projectId = req.params.id;
      
      // Validate update data (partial schema)
      const validatedData = insertFarmSchema.partial().parse(req.body);
      
      // Update farm ensuring user owns it
      const farm = await storage.updateFarm(projectId, validatedData, userId);
      if (!farm) {
        return res.status(404).json({ message: "Farm project not found or access denied" });
      }

      res.json({
        ...farm,
        message: "Farm project updated successfully"
      });
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(400).json({ 
        message: "Failed to update farm project",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // DELETE /api/projects/:id - Delete farm project
  app.delete("/api/projects/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const projectId = req.params.id;
      
      // Delete farm ensuring user owns it
      const deleted = await storage.deleteFarm(projectId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Farm project not found or access denied" });
      }
      
      res.json({ message: "Farm project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete farm project" });
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

  // Seasonal Data routes for baseline data collection
  app.get("/api/farms/:farmId/seasonal-data", async (req, res) => {
    try {
      const seasonalData = await storage.getSeasonalDataByFarmId(req.params.farmId);
      res.json(seasonalData);
    } catch (error) {
      console.error("Error fetching seasonal data:", error);
      res.status(500).json({ message: "Failed to fetch seasonal data" });
    }
  });

  app.post("/api/farms/:farmId/seasonal-data", async (req, res) => {
    try {
      const validatedData = insertSeasonalDataSchema.parse({
        ...req.body,
        farmId: req.params.farmId,
      });
      const seasonalData = await storage.createSeasonalData(validatedData);
      res.status(201).json(seasonalData);
    } catch (error) {
      console.error("Error creating seasonal data:", error);
      res.status(400).json({ 
        message: "Invalid seasonal data", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/seasonal-data/:id", async (req, res) => {
    try {
      const seasonalData = await storage.getSeasonalData(req.params.id);
      if (!seasonalData) {
        return res.status(404).json({ message: "Seasonal data not found" });
      }
      res.json(seasonalData);
    } catch (error) {
      console.error("Error fetching seasonal data:", error);
      res.status(500).json({ message: "Failed to fetch seasonal data" });
    }
  });

  app.put("/api/seasonal-data/:id", async (req, res) => {
    try {
      const validatedData = insertSeasonalDataSchema.partial().parse(req.body);
      const seasonalData = await storage.updateSeasonalData(req.params.id, validatedData);
      if (!seasonalData) {
        return res.status(404).json({ message: "Seasonal data not found" });
      }
      res.json(seasonalData);
    } catch (error) {
      console.error("Error updating seasonal data:", error);
      res.status(400).json({ 
        message: "Invalid seasonal data", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.delete("/api/seasonal-data/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSeasonalData(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Seasonal data not found" });
      }
      res.json({ message: "Seasonal data deleted successfully" });
    } catch (error) {
      console.error("Error deleting seasonal data:", error);
      res.status(500).json({ message: "Failed to delete seasonal data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
