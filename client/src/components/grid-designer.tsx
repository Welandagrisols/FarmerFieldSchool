import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plot } from "@shared/schema";
import { DraggablePlot } from "./draggable-plot";
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

  const { data: plots = [] } = useQuery({
    queryKey: ['/api/farms', farmId, 'plots'],
    queryFn: () => localStorageService.getPlotsByFarmId(farmId),
  });

  const updatePlotMutation = useMutation({
    mutationFn: ({ plotId, updates }: { plotId: string; updates: Partial<Plot> }) =>
      localStorageService.updatePlot(plotId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'plots'] });
    },
  });

  const deletePlotMutation = useMutation({
    mutationFn: (plotId: string) => localStorageService.deletePlot(plotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'plots'] });
      toast({
        title: "Plot deleted",
        description: "The plot has been removed from your farm.",
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

  const handleClearGrid = () => {
    if (!confirm("Are you sure you want to clear all plots from the grid?")) {
      return;
    }
    clearAllPlotsMutation.mutate();
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
              disabled={plots.length === 0}
            >
              <Eraser className="w-4 h-4 mr-1" />
              Clear Grid
            </Button>
          </div>
        </div>
        
        {/* Farm Grid Canvas */}
        <div className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden" style={{ minHeight: "600px" }}>
          {/* Grid Background Pattern */}
          <div 
            className="absolute inset-0 opacity-20" 
            style={{
              backgroundImage: `linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)`,
              backgroundSize: `${currentGridConfig.cellSize}px ${currentGridConfig.cellSize}px`
            }}
          />
          
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
          {plots.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium mb-2">No plots yet</p>
                <p className="text-sm">Add plots to start designing your farm layout</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
