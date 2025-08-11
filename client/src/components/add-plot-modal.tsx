import { useState } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { insertPlotSchema, InsertPlot, Plot } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PlotColor, PLOT_COLORS } from "@/types/farm";

interface AddPlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmId: string;
  onSuccess: () => void;
}

type PlotFormData = Omit<InsertPlot, 'farmId'>;

export function AddPlotModal({ isOpen, onClose, farmId, onSuccess }: AddPlotModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedColor, setSelectedColor] = useState<PlotColor>('green');

  // Get existing plots to calculate next position
  const { data: existingPlots = [] } = useQuery<Plot[]>({
    queryKey: ['/api/farms', farmId, 'plots'],
    enabled: !!farmId,
  });

  // Calculate next available position with proper spacing
  const getNextPlotPosition = (plotWidth: number, plotHeight: number) => {
    const SPACING = 1; // 1 meter spacing between plots
    const BOUNDARY_MARGIN = 1; // 1 meter from farm boundary
    const GRID_MAX_WIDTH = 30; // Grid boundaries
    const GRID_MAX_HEIGHT = 30;
    
    // Start from boundary margin
    let currentX = BOUNDARY_MARGIN;
    let currentY = BOUNDARY_MARGIN;
    
    // Find first available position
    for (let y = BOUNDARY_MARGIN; y <= GRID_MAX_HEIGHT - plotHeight - BOUNDARY_MARGIN; y += plotHeight + SPACING) {
      for (let x = BOUNDARY_MARGIN; x <= GRID_MAX_WIDTH - plotWidth - BOUNDARY_MARGIN; x += plotWidth + SPACING) {
        
        // Check if this position overlaps with any existing plot
        const hasOverlap = existingPlots.some(plot => {
          const plotRight = plot.x + plot.width;
          const plotBottom = plot.y + plot.height;
          const newPlotRight = x + plotWidth;
          const newPlotBottom = y + plotHeight;
          
          // Check if rectangles overlap (including spacing buffer)
          return !(
            x >= plotRight + SPACING || // New plot is to the right with spacing
            newPlotRight <= plot.x - SPACING || // New plot is to the left with spacing
            y >= plotBottom + SPACING || // New plot is below with spacing
            newPlotBottom <= plot.y - SPACING // New plot is above with spacing
          );
        });
        
        if (!hasOverlap) {
          return { x, y };
        }
      }
    }
    
    // If no space found with perfect spacing, try to find any available space
    for (let y = BOUNDARY_MARGIN; y <= GRID_MAX_HEIGHT - plotHeight - BOUNDARY_MARGIN; y++) {
      for (let x = BOUNDARY_MARGIN; x <= GRID_MAX_WIDTH - plotWidth - BOUNDARY_MARGIN; x++) {
        const hasOverlap = existingPlots.some(plot => {
          return !(
            x >= plot.x + plot.width ||
            x + plotWidth <= plot.x ||
            y >= plot.y + plot.height ||
            y + plotHeight <= plot.y
          );
        });
        
        if (!hasOverlap) {
          return { x, y };
        }
      }
    }
    
    // Fallback - place at the first available row
    const maxRow = existingPlots.reduce((max, plot) => Math.max(max, plot.y + plot.height), 0);
    return { 
      x: BOUNDARY_MARGIN, 
      y: Math.max(BOUNDARY_MARGIN, maxRow + SPACING) 
    };
  };

  const form = useForm<PlotFormData>({
    resolver: zodResolver(insertPlotSchema.omit({ farmId: true })),
    defaultValues: {
      name: "",
      x: 0,
      y: 0,
      width: 5,
      height: 3,
      color: "green",
    },
  });

  const createPlotMutation = useMutation({
    mutationFn: async (plotData: InsertPlot) => {
      return apiRequest(`/api/farms/${farmId}/plots`, 'POST', plotData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'plots'] });
      toast({
        title: "Plot added",
        description: "New plot has been added to your farm.",
      });
      form.reset();
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add plot. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: PlotFormData) => {
    // Calculate the best position for this plot
    const position = getNextPlotPosition(data.width, data.height);
    
    createPlotMutation.mutate({
      ...data,
      x: position.x,
      y: position.y,
      color: selectedColor,
      farmId,
    });
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Add New Plot</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Plot Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Tomatoes, Water Tank"
              {...form.register("name")}
              className="w-full"
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-2">
                Width (units)
              </Label>
              <Input
                id="width"
                type="number"
                min="1"
                max="20"
                placeholder="5"
                {...form.register("width", { valueAsNumber: true })}
                className="w-full"
              />
              {form.formState.errors.width && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.width.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
                Height (units)
              </Label>
              <Input
                id="height"
                type="number"
                min="1"
                max="20"
                placeholder="3"
                {...form.register("height", { valueAsNumber: true })}
                className="w-full"
              />
              {form.formState.errors.height && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.height.message}</p>
              )}
            </div>
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Plot Color
            </Label>
            <div className="grid grid-cols-6 gap-2">
              {Object.entries(PLOT_COLORS).map(([colorKey, colorClasses]) => (
                <button
                  key={colorKey}
                  type="button"
                  onClick={() => setSelectedColor(colorKey as PlotColor)}
                  className={`w-8 h-8 rounded-lg ${colorClasses.bg} border-2 ${colorClasses.border} hover:scale-110 transition-transform ${
                    selectedColor === colorKey ? 'ring-2 ring-farm-green' : ''
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={createPlotMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-farm-green text-white hover:bg-farm-deep"
              disabled={createPlotMutation.isPending}
            >
              {createPlotMutation.isPending ? "Adding..." : "Add Plot"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
