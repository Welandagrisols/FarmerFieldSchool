import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Plot, Path } from "@shared/schema";
import { DraggablePlot } from "./draggable-plot";
import { PathDrawer } from "./path-drawer";
import { PathDrawingTool } from "./path-drawing-tool";
import { localStorageService } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eraser } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GridDesignerProps {
  farmId: string;
}

export function GridDesigner({ farmId }: GridDesignerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [gridSize, setGridSize] = useState("30x30");
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [pathClickHandler, setPathClickHandler] = useState<((e: React.MouseEvent) => void) | null>(null);
  const [currentDrawingPoints, setCurrentDrawingPoints] = useState<{x: number, y: number}[]>([]);
  const [drawingPathColor, setDrawingPathColor] = useState("brown");
  const [drawingPathWidth, setDrawingPathWidth] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);

  const { data: plots = [] } = useQuery({
    queryKey: ['/api/farms', farmId, 'plots'],
    queryFn: async () => localStorageService.getPlotsByFarmId(farmId),
  });

  const { data: paths = [] } = useQuery({
    queryKey: ['/api/farms', farmId, 'paths'],
    queryFn: async () => localStorageService.getPathsByFarmId(farmId),
  });

  const updatePlotMutation = useMutation({
    mutationFn: async ({ plotId, updates }: { plotId: string; updates: Partial<Plot> }) =>
      localStorageService.updatePlot(plotId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'plots'] });
    },
  });

  const deletePlotMutation = useMutation({
    mutationFn: async (plotId: string) => localStorageService.deletePlot(plotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'plots'] });
      toast({
        title: "Plot deleted",
        description: "The plot has been removed from your farm.",
      });
    },
  });

  const deletePathMutation = useMutation({
    mutationFn: async (pathId: string) => localStorageService.deletePath(pathId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'paths'] });
      toast({
        title: "Path deleted",
        description: "The walking path has been removed from your farm.",
      });
    },
  });

  const clearAllPlotsMutation = useMutation({
    mutationFn: async () => {
      for (const plot of plots) {
        localStorageService.deletePlot(plot.id);
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'plots'] });
      toast({
        title: "Grid cleared",
        description: "All plots have been removed from the grid.",
      });
    },
  });

  const handlePlotMove = (plotId: string, newX: number, newY: number) => {
    updatePlotMutation.mutate({
      plotId,
      updates: { x: newX, y: newY }
    });
  };

  const handlePlotDelete = (plotId: string) => {
    deletePlotMutation.mutate(plotId);
  };

  const handlePathDelete = (pathId: string) => {
    deletePathMutation.mutate(pathId);
  };

  const handleClearGrid = () => {
    const itemCount = plots.length + paths.length;
    if (!confirm(`Are you sure you want to clear all ${itemCount} items (plots and paths) from the grid?`)) {
      return;
    }
    clearAllPlotsMutation.mutate();
  };

  const handleDrawingModeChange = (isDrawing: boolean, onGridClick?: (e: React.MouseEvent) => void, currentPoints?: {x: number, y: number}[], pathColor?: string, pathWidth?: number) => {
    setIsDrawingPath(isDrawing);
    setPathClickHandler(onGridClick || null);
    if (currentPoints) setCurrentDrawingPoints(currentPoints);
    if (pathColor) setDrawingPathColor(pathColor);
    if (pathWidth !== undefined) setDrawingPathWidth(pathWidth);
  };

  const handleUndoPoint = () => {
    setCurrentDrawingPoints(prev => prev.slice(0, -1));
  };

  const renderCurrentDrawingPath = () => {
    if (!isDrawingPath || currentDrawingPoints.length === 0) return null;

    const getPathColor = (color: string) => {
      switch (color) {
        case "brown": return "#8B4513";
        case "gray": return "#6B7280"; 
        case "yellow": return "#EAB308";
        default: return "#8B4513";
      }
    };

    // Always render points
    const points = currentDrawingPoints.map((point, index) => (
      <circle
        key={index}
        cx={point.x * currentGridConfig.cellSize + currentGridConfig.cellSize / 2}
        cy={point.y * currentGridConfig.cellSize + currentGridConfig.cellSize / 2}
        r="4"
        fill={getPathColor(drawingPathColor)}
        stroke="white"
        strokeWidth="1"
        className="opacity-80"
      />
    ));

    // Only render path line if we have 2+ points
    if (currentDrawingPoints.length < 2) {
      return <g>{points}</g>;
    }

    const pathString = currentDrawingPoints.reduce((acc, point, index) => {
      const x = point.x * currentGridConfig.cellSize + currentGridConfig.cellSize / 2;
      const y = point.y * currentGridConfig.cellSize + currentGridConfig.cellSize / 2;
      
      if (index === 0) {
        return `M ${x} ${y}`;
      }
      return `${acc} L ${x} ${y}`;
    }, "");

    return (
      <g>
        <path
          d={pathString}
          stroke={getPathColor(drawingPathColor)}
          strokeWidth={drawingPathWidth * 2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-60"
          strokeDasharray="5,5"
        />
        {points}
      </g>
    );
  };

  const gridSizeMap = {
    "20x20": { width: 20, height: 20, cellSize: 30 },
    "30x30": { width: 30, height: 30, cellSize: 20 },
    "40x40": { width: 40, height: 40, cellSize: 15 },
  };

  const currentGridConfig = gridSizeMap[gridSize as keyof typeof gridSizeMap];

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-full">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Farm Layout Grid</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Grid Size:</label>
              <Select value={gridSize} onValueChange={setGridSize}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20x20">20×20</SelectItem>
                  <SelectItem value="30x30">30×30</SelectItem>
                  <SelectItem value="40x40">40×40</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearGrid}
              className="text-gray-500 hover:text-red-500"
              disabled={plots.length === 0 && paths.length === 0}
            >
              <Eraser className="w-4 h-4 mr-1" />
              Clear Grid
            </Button>
          </div>
        </div>

        {/* Path Drawing Tool */}
        <PathDrawingTool
          farmId={farmId}
          cellSize={currentGridConfig.cellSize}
          gridWidth={currentGridConfig.width}
          gridHeight={currentGridConfig.height}
          onPathCreated={() => {
            // Path created, reset drawing state
            setIsDrawingPath(false);
            setCurrentDrawingPoints([]);
          }}
          onDrawingModeChange={handleDrawingModeChange}
          currentPoints={currentDrawingPoints}
          onUndoPoint={handleUndoPoint}
        />
        
        {/* Farm Grid Canvas */}
        <div 
          ref={gridRef}
          className={`relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden ${isDrawingPath ? "cursor-crosshair" : ""}`}
          style={{ minHeight: "600px" }}
          onClick={(e) => {
            if (isDrawingPath) {
              const gridElement = e.currentTarget as HTMLElement;
              const rect = gridElement.getBoundingClientRect();
              const x = Math.floor((e.clientX - rect.left) / currentGridConfig.cellSize);
              const y = Math.floor((e.clientY - rect.top) / currentGridConfig.cellSize);

              // Constrain to grid boundaries
              const constrainedX = Math.max(0, Math.min(currentGridConfig.width - 1, x));
              const constrainedY = Math.max(0, Math.min(currentGridConfig.height - 1, y));

              // Add point directly to current drawing points
              setCurrentDrawingPoints(prev => [...prev, { x: constrainedX, y: constrainedY }]);
              console.log("Added point to grid:", { x: constrainedX, y: constrainedY });
            }
          }}
        >
          {/* Grid Background Pattern */}
          <div 
            className="absolute inset-0 opacity-20" 
            style={{
              backgroundImage: `linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)`,
              backgroundSize: `${currentGridConfig.cellSize}px ${currentGridConfig.cellSize}px`
            }}
          />

          {/* Paths Layer (behind plots) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {paths.map((path) => (
              <PathDrawer
                key={path.id}
                path={path}
                cellSize={currentGridConfig.cellSize}
                onDelete={handlePathDelete}
              />
            ))}
            {renderCurrentDrawingPath()}
          </svg>
          
          {/* Plots */}
          {plots.map((plot) => (
            <DraggablePlot
              key={plot.id}
              plot={plot}
              cellSize={currentGridConfig.cellSize}
              gridWidth={currentGridConfig.width}
              gridHeight={currentGridConfig.height}
              onMove={handlePlotMove}
              onDelete={handlePlotDelete}
            />
          ))}

          {/* Empty State */}
          {plots.length === 0 && paths.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium mb-2">No plots or paths yet</p>
                <p className="text-sm">Add plots and walking paths to design your farm layout</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
