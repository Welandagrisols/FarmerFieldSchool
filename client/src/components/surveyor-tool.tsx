import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Ruler, 
  MapPin, 
  Target, 
  Move, 
  RotateCcw, 
  Save, 
  Plus,
  Minus,
  Navigation,
  Calculator
} from "lucide-react";

interface Point {
  id: string;
  x: number;
  y: number;
  label: string;
  type: 'marker' | 'corner' | 'reference';
}

interface Measurement {
  id: string;
  from: Point;
  to: Point;
  distance: number;
  angle?: number;
  label: string;
}

interface SurveyorToolProps {
  farmId: string;
  gridSize?: number;
  onSaveMeasurements?: (measurements: Measurement[]) => void;
}

export function SurveyorTool({ 
  farmId, 
  gridSize = 50, 
  onSaveMeasurements 
}: SurveyorToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [selectedTool, setSelectedTool] = useState<'point' | 'measure' | 'move'>('point');
  const [selectedPoints, setSelectedPoints] = useState<Point[]>([]);
  const [scale, setScale] = useState(1); // meters per pixel
  const [isDrawing, setIsDrawing] = useState(false);
  const [draggedPoint, setDraggedPoint] = useState<Point | null>(null);
  
  // Canvas dimensions
  const canvasWidth = 800;
  const canvasHeight = 600;

  useEffect(() => {
    drawCanvas();
  }, [points, measurements, selectedPoints]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw grid
    drawGrid(ctx);
    
    // Draw measurements
    measurements.forEach(measurement => drawMeasurement(ctx, measurement));
    
    // Draw points
    points.forEach(point => drawPoint(ctx, point));
    
    // Draw selected points highlight
    selectedPoints.forEach(point => drawPointHighlight(ctx, point));
  };

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 0.5;
    
    // Vertical lines
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }
  };

  const drawPoint = (ctx: CanvasRenderingContext2D, point: Point) => {
    const colors = {
      marker: '#3b82f6',
      corner: '#ef4444', 
      reference: '#10b981'
    };
    
    ctx.fillStyle = colors[point.type];
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    
    // Draw point circle
    ctx.beginPath();
    ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Draw label
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    ctx.fillText(point.label, point.x + 10, point.y - 10);
  };

  const drawPointHighlight = (ctx: CanvasRenderingContext2D, point: Point) => {
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const drawMeasurement = (ctx: CanvasRenderingContext2D, measurement: Measurement) => {
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(measurement.from.x, measurement.from.y);
    ctx.lineTo(measurement.to.x, measurement.to.y);
    ctx.stroke();
    
    // Draw distance label
    const midX = (measurement.from.x + measurement.to.x) / 2;
    const midY = (measurement.from.y + measurement.to.y) / 2;
    
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillRect(midX - 25, midY - 10, 50, 20);
    ctx.fillStyle = '#fff';
    ctx.fillText(`${measurement.distance.toFixed(1)}m`, midX - 20, midY + 3);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (selectedTool === 'point') {
      addPoint(x, y);
    } else if (selectedTool === 'measure') {
      handleMeasureClick(x, y);
    }
  };

  const addPoint = (x: number, y: number) => {
    const newPoint: Point = {
      id: `point-${Date.now()}`,
      x,
      y,
      label: `P${points.length + 1}`,
      type: 'marker'
    };
    setPoints([...points, newPoint]);
  };

  const handleMeasureClick = (x: number, y: number) => {
    // Find nearest point
    const nearestPoint = findNearestPoint(x, y, 15);
    if (!nearestPoint) return;

    if (selectedPoints.length === 0) {
      setSelectedPoints([nearestPoint]);
    } else if (selectedPoints.length === 1) {
      if (selectedPoints[0].id !== nearestPoint.id) {
        createMeasurement(selectedPoints[0], nearestPoint);
        setSelectedPoints([]);
      }
    }
  };

  const findNearestPoint = (x: number, y: number, threshold: number): Point | null => {
    let nearest: Point | null = null;
    let minDistance = threshold;

    points.forEach(point => {
      const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
      if (distance < minDistance) {
        nearest = point;
        minDistance = distance;
      }
    });

    return nearest;
  };

  const createMeasurement = (from: Point, to: Point) => {
    const pixelDistance = Math.sqrt(
      Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)
    );
    const realDistance = pixelDistance * scale;
    
    const angle = Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);

    const newMeasurement: Measurement = {
      id: `measure-${Date.now()}`,
      from,
      to,
      distance: realDistance,
      angle,
      label: `${from.label}-${to.label}`
    };

    setMeasurements([...measurements, newMeasurement]);
  };

  const calculateArea = (selectedPointsForArea: Point[]): number => {
    if (selectedPointsForArea.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < selectedPointsForArea.length; i++) {
      const j = (i + 1) % selectedPointsForArea.length;
      area += selectedPointsForArea[i].x * selectedPointsForArea[j].y;
      area -= selectedPointsForArea[j].x * selectedPointsForArea[i].y;
    }
    area = Math.abs(area) / 2;
    return area * scale * scale; // Convert to real area
  };

  const clearAll = () => {
    setPoints([]);
    setMeasurements([]);
    setSelectedPoints([]);
  };

  const exportMeasurements = () => {
    if (onSaveMeasurements) {
      onSaveMeasurements(measurements);
    }
    
    // Also create downloadable report
    const report = {
      farmId,
      timestamp: new Date().toISOString(),
      scale: scale,
      points: points,
      measurements: measurements.map(m => ({
        ...m,
        distance: parseFloat(m.distance.toFixed(2)),
        angle: m.angle ? parseFloat(m.angle.toFixed(1)) : undefined
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `farm-survey-${farmId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Surveyor Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedTool === 'point' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTool('point')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Add Points
            </Button>
            <Button
              variant={selectedTool === 'measure' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTool('measure')}
            >
              <Ruler className="h-4 w-4 mr-2" />
              Measure
            </Button>
            <Button
              variant={selectedTool === 'move' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTool('move')}
            >
              <Move className="h-4 w-4 mr-2" />
              Move
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="sm" onClick={clearAll}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button variant="outline" size="sm" onClick={exportMeasurements}>
              <Save className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="scale">Scale (meters per pixel)</Label>
              <Input
                id="scale"
                type="number"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value) || 1)}
                step="0.1"
                min="0.1"
              />
            </div>
            <div>
              <Label>Selected Points</Label>
              <div className="text-sm text-gray-600">
                {selectedPoints.length > 0 ? 
                  selectedPoints.map(p => p.label).join(', ') : 
                  'None'
                }
              </div>
            </div>
            <div>
              <Label>Total Points</Label>
              <div className="text-lg font-semibold">{points.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card>
        <CardContent className="p-4">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onClick={handleCanvasClick}
            className="border border-gray-300 rounded cursor-crosshair"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </CardContent>
      </Card>

      {/* Measurements Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Measurements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {measurements.map(measurement => (
                <div key={measurement.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{measurement.label}</div>
                    <div className="text-sm text-gray-600">
                      Distance: {measurement.distance.toFixed(2)}m
                      {measurement.angle && (
                        <span className="ml-2">
                          Angle: {measurement.angle.toFixed(1)}°
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMeasurements(measurements.filter(m => m.id !== measurement.id))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {measurements.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No measurements yet. Select two points to create a measurement.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Survey Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {points.map(point => (
                <div key={point.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{point.label}</div>
                    <div className="text-sm text-gray-600">
                      X: {point.x.toFixed(1)}, Y: {point.y.toFixed(1)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={point.type === 'marker' ? 'default' : 
                               point.type === 'corner' ? 'destructive' : 'secondary'}
                    >
                      {point.type}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPoints(points.filter(p => p.id !== point.id))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {points.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No survey points yet. Click on the canvas to add points.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-gray-600">
            <strong>Instructions:</strong>
            <ul className="mt-2 space-y-1">
              <li>• Click "Add Points" and click on the canvas to place survey points</li>
              <li>• Click "Measure" and select two points to create distance measurements</li>
              <li>• Adjust the scale to match your actual field measurements</li>
              <li>• Use "Export" to save your survey data</li>
              <li>• Selected points are highlighted in yellow</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}