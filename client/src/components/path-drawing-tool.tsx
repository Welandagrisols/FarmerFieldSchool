import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Route, X, Undo } from "lucide-react";
import { localStorageService } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface Point {
  x: number;
  y: number;
}

interface PathDrawingToolProps {
  farmId: string;
  cellSize: number;
  gridWidth: number;
  gridHeight: number;
  onPathCreated: () => void;
  onDrawingModeChange: (isDrawing: boolean, onGridClick?: (e: React.MouseEvent) => void) => void;
}

export function PathDrawingTool({ 
  farmId, 
  cellSize, 
  gridWidth, 
  gridHeight, 
  onPathCreated,
  onDrawingModeChange
}: PathDrawingToolProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDrawing, setIsDrawing] = useState(false);
  const [pathPoints, setPathPoints] = useState<Point[]>([]);
  const [pathName, setPathName] = useState("Walking Path");
  const [pathColor, setPathColor] = useState("brown");
  const [pathWidth, setPathWidth] = useState(3);
  
  const createPathMutation = useMutation({
    mutationFn: (pathData: any) => localStorageService.createPath(pathData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'paths'] });
      toast({
        title: "Path created",
        description: "Walking path has been added to your farm.",
      });
      onPathCreated();
      resetDrawing();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create path. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetDrawing = () => {
    setIsDrawing(false);
    setPathPoints([]);
    onDrawingModeChange(false);
  };

  const startDrawing = () => {
    setIsDrawing(true);
    onDrawingModeChange(true, handleGridClick);
  };

  const cancelDrawing = () => {
    resetDrawing();
  };

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    // Constrain to grid boundaries
    const constrainedX = Math.max(0, Math.min(gridWidth - 1, x));
    const constrainedY = Math.max(0, Math.min(gridHeight - 1, y));

    setPathPoints(prev => [...prev, { x: constrainedX, y: constrainedY }]);
  };

  const undoLastPoint = () => {
    setPathPoints(prev => prev.slice(0, -1));
  };

  const finishPath = () => {
    if (pathPoints.length < 2) {
      toast({
        title: "Path too short",
        description: "A path needs at least 2 points.",
        variant: "destructive",
      });
      return;
    }

    createPathMutation.mutate({
      farmId,
      name: pathName,
      points: JSON.stringify(pathPoints),
      width: pathWidth,
      color: pathColor,
    });
  };

  // Render current drawing path
  const renderDrawingPath = () => {
    if (pathPoints.length < 2) return null;

    const pathString = pathPoints.reduce((acc, point, index) => {
      const x = point.x * cellSize + cellSize / 2;
      const y = point.y * cellSize + cellSize / 2;
      
      if (index === 0) {
        return `M ${x} ${y}`;
      }
      return `${acc} L ${x} ${y}`;
    }, "");

    const getPathColor = (color: string) => {
      switch (color) {
        case "brown": return "#8B4513";
        case "gray": return "#6B7280"; 
        case "yellow": return "#EAB308";
        default: return "#8B4513";
      }
    };

    return (
      <g>
        <path
          d={pathString}
          stroke={getPathColor(pathColor)}
          strokeWidth={pathWidth * 2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-60"
          strokeDasharray="5,5"
        />
      </g>
    );
  };

  // Render path points
  const renderPathPoints = () => {
    return pathPoints.map((point, index) => (
      <circle
        key={index}
        cx={point.x * cellSize + cellSize / 2}
        cy={point.y * cellSize + cellSize / 2}
        r="4"
        fill={pathColor === "brown" ? "#8B4513" : pathColor === "gray" ? "#6B7280" : "#EAB308"}
        stroke="white"
        strokeWidth="1"
        className="opacity-80"
      />
    ));
  };

  return (
    <>
      {/* Path Drawing Controls */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
            <Route className="w-4 h-4 mr-2" />
            Walking Paths
          </h4>
        </div>
        
        {!isDrawing ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              placeholder="Path name"
              value={pathName}
              onChange={(e) => setPathName(e.target.value)}
              className="text-sm"
            />
            
            <Select value={pathColor} onValueChange={setPathColor}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brown">Brown (Dirt)</SelectItem>
                <SelectItem value="gray">Gray (Stone)</SelectItem>
                <SelectItem value="yellow">Yellow (Sand)</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={pathWidth.toString()} onValueChange={(value) => setPathWidth(parseInt(value))}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">Narrow (2)</SelectItem>
                <SelectItem value="3">Medium (3)</SelectItem>
                <SelectItem value="4">Wide (4)</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={startDrawing}
              className="bg-amber-600 text-white hover:bg-amber-700 text-sm"
            >
              <Route className="w-4 h-4 mr-1" />
              Draw Path
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Click on the grid to add path points. You need at least 2 points to create a path.
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Points: {pathPoints.length}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={undoLastPoint}
                disabled={pathPoints.length === 0}
              >
                <Undo className="w-4 h-4 mr-1" />
                Undo
              </Button>
              <Button
                size="sm"
                onClick={finishPath}
                disabled={pathPoints.length < 2 || createPathMutation.isPending}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {createPathMutation.isPending ? "Creating..." : "Finish Path"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={cancelDrawing}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Drawing mode overlay (will be integrated into parent grid) */}
      {isDrawing && (
        <div className="drawing-mode-active">

        </div>
      )}
    </>
  );
}