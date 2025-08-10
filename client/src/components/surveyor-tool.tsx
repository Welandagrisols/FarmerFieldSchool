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
  Calculator,
  Play,
  Square,
  Footprints
} from "lucide-react";

interface BoundaryPoint {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  timestamp: number;
  accuracy?: number; // GPS accuracy in meters
}

interface FieldMeasurement {
  id: string;
  points: BoundaryPoint[];
  area: {
    squareMeters: number;
    acres: number;
  };
  perimeter: number; // in meters
  completedAt: Date;
  label: string;
}

interface SurveyorToolProps {
  farmId: string;
  onSaveFieldMeasurement?: (measurement: FieldMeasurement) => void;
}

export function SurveyorTool({ 
  farmId, 
  onSaveFieldMeasurement 
}: SurveyorToolProps) {
  const [boundaryPoints, setBoundaryPoints] = useState<BoundaryPoint[]>([]);
  const [fieldMeasurements, setFieldMeasurements] = useState<FieldMeasurement[]>([]);
  const [isWalking, setIsWalking] = useState(false);
  const [currentWalk, setCurrentWalk] = useState<BoundaryPoint[]>([]);
  const [gpsSupported, setGpsSupported] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number, accuracy: number} | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Check GPS availability
    if ("geolocation" in navigator) {
      setGpsSupported(true);
      // Get initial location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => console.log("Location access denied:", error),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
    
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Calculate distance between two GPS coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Calculate polygon area using shoelace formula (adapted for GPS coordinates)
  const calculatePolygonArea = (points: BoundaryPoint[]): number => {
    if (points.length < 3) return 0;
    
    // Convert to Cartesian coordinates for more accurate calculation
    const avgLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
    const avgLon = points.reduce((sum, p) => sum + p.longitude, 0) / points.length;
    
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLon = 111320 * Math.cos(avgLat * Math.PI / 180);
    
    const cartesianPoints = points.map(p => ({
      x: (p.longitude - avgLon) * metersPerDegreeLon,
      y: (p.latitude - avgLat) * metersPerDegreeLat
    }));
    
    let area = 0;
    for (let i = 0; i < cartesianPoints.length; i++) {
      const j = (i + 1) % cartesianPoints.length;
      area += cartesianPoints[i].x * cartesianPoints[j].y;
      area -= cartesianPoints[j].x * cartesianPoints[i].y;
    }
    
    return Math.abs(area) / 2;
  };

  // Calculate perimeter of polygon
  const calculatePerimeter = (points: BoundaryPoint[]): number => {
    if (points.length < 2) return 0;
    
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const next = points[(i + 1) % points.length];
      perimeter += calculateDistance(current.latitude, current.longitude, next.latitude, next.longitude);
    }
    
    return perimeter;
  };

  const startBoundaryWalk = () => {
    if (!gpsSupported) {
      alert("GPS is not available on this device");
      return;
    }
    
    setIsWalking(true);
    setCurrentWalk([]);
    
    // Start GPS tracking with high accuracy
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.error("GPS error:", error);
        alert("GPS tracking error. Please ensure location services are enabled.");
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000
      }
    );
  };

  const addBoundaryPoint = () => {
    if (!currentLocation) {
      alert("Current location not available. Please wait for GPS to lock.");
      return;
    }

    const newPoint: BoundaryPoint = {
      id: `bp-${Date.now()}`,
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      label: `Corner ${currentWalk.length + 1}`,
      timestamp: Date.now(),
      accuracy: currentLocation.accuracy
    };

    setCurrentWalk([...currentWalk, newPoint]);
  };

  const completeBoundaryWalk = () => {
    if (currentWalk.length < 3) {
      alert("You need at least 3 points to define a boundary area.");
      return;
    }

    const area = calculatePolygonArea(currentWalk);
    const perimeter = calculatePerimeter(currentWalk);

    const measurement: FieldMeasurement = {
      id: `field-${Date.now()}`,
      points: currentWalk,
      area: {
        squareMeters: area,
        acres: area / 4047 // Convert square meters to acres
      },
      perimeter,
      completedAt: new Date(),
      label: `Field Survey ${fieldMeasurements.length + 1}`
    };

    setFieldMeasurements([...fieldMeasurements, measurement]);
    setBoundaryPoints([...boundaryPoints, ...currentWalk]);
    
    // Stop GPS tracking
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    setIsWalking(false);
    setCurrentWalk([]);
    
    if (onSaveFieldMeasurement) {
      onSaveFieldMeasurement(measurement);
    }
  };

  const cancelBoundaryWalk = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    setIsWalking(false);
    setCurrentWalk([]);
  };

  const clearAllMeasurements = () => {
    setBoundaryPoints([]);
    setFieldMeasurements([]);
    setCurrentWalk([]);
  };

  const exportFieldData = () => {
    const report = {
      farmId,
      timestamp: new Date().toISOString(),
      fieldMeasurements: fieldMeasurements.map(m => ({
        ...m,
        area: {
          squareMeters: parseFloat(m.area.squareMeters.toFixed(2)),
          acres: parseFloat(m.area.acres.toFixed(4))
        },
        perimeter: parseFloat(m.perimeter.toFixed(2)),
        points: m.points.map(p => ({
          ...p,
          latitude: parseFloat(p.latitude.toFixed(8)),
          longitude: parseFloat(p.longitude.toFixed(8))
        }))
      })),
      summary: {
        totalFields: fieldMeasurements.length,
        totalArea: {
          squareMeters: fieldMeasurements.reduce((sum, m) => sum + m.area.squareMeters, 0),
          acres: fieldMeasurements.reduce((sum, m) => sum + m.area.acres, 0)
        }
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `field-survey-${farmId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-4">
      {/* GPS Status & Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Footprints className="h-5 w-5" />
            Field Boundary Surveyor
            {gpsSupported ? (
              <Badge variant="secondary" className="ml-2">GPS Ready</Badge>
            ) : (
              <Badge variant="destructive" className="ml-2">No GPS</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Current Location</Label>
              <div className="text-sm">
                {currentLocation ? (
                  <div>
                    <div>Lat: {currentLocation.lat.toFixed(6)}</div>
                    <div>Lng: {currentLocation.lng.toFixed(6)}</div>
                    <div className="text-xs text-gray-500">
                      ±{currentLocation.accuracy.toFixed(1)}m accuracy
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">Getting location...</div>
                )}
              </div>
            </div>
            
            <div>
              <Label>Current Walk</Label>
              <div className="text-lg font-semibold">
                {currentWalk.length} {currentWalk.length === 1 ? 'point' : 'points'}
              </div>
              <div className="text-xs text-gray-500">
                {currentWalk.length >= 3 ? 'Ready to complete' : 'Need at least 3 points'}
              </div>
            </div>
            
            <div>
              <Label>Completed Fields</Label>
              <div className="text-lg font-semibold">{fieldMeasurements.length}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isWalking ? (
              <Button onClick={startBoundaryWalk} disabled={!gpsSupported}>
                <Play className="h-4 w-4 mr-2" />
                Start Boundary Walk
              </Button>
            ) : (
              <>
                <Button 
                  onClick={addBoundaryPoint}
                  disabled={!currentLocation}
                  variant="default"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Mark Corner ({currentWalk.length + 1})
                </Button>
                <Button 
                  onClick={completeBoundaryWalk}
                  disabled={currentWalk.length < 3}
                  variant="default"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Complete Boundary
                </Button>
                <Button 
                  onClick={cancelBoundaryWalk}
                  variant="outline"
                >
                  Cancel Walk
                </Button>
              </>
            )}
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button variant="outline" size="sm" onClick={clearAllMeasurements}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button variant="outline" size="sm" onClick={exportFieldData}>
              <Save className="h-4 w-4 mr-2" />
              Export Field Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Walk Progress */}
      {isWalking && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Walking Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                <div className="font-medium text-blue-900 dark:text-blue-100">
                  Step {currentWalk.length + 1}: {currentWalk.length === 0 ? 'Mark Starting Point' : 'Mark Next Corner'}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {currentWalk.length === 0 
                    ? "Walk to the starting corner of your field boundary and tap 'Mark Corner'"
                    : "Walk to the next corner of your field boundary and tap 'Mark Corner'"
                  }
                </div>
              </div>
              
              {currentWalk.length > 0 && (
                <div className="text-sm">
                  <strong>Marked corners:</strong>
                  <div className="mt-1 space-y-1">
                    {currentWalk.map((point, index) => (
                      <div key={point.id} className="flex justify-between text-xs">
                        <span>{point.label}</span>
                        <span>{point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Field Measurements Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Field Measurements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {fieldMeasurements.map(measurement => (
                <div key={measurement.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">{measurement.label}</div>
                    <Badge variant="secondary">
                      {measurement.points.length} corners
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-green-700 dark:text-green-300">
                        Area: {measurement.area.acres.toFixed(2)} acres
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        {measurement.area.squareMeters.toFixed(0)} m²
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Perimeter: {measurement.perimeter.toFixed(1)} meters
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Completed: {measurement.completedAt.toLocaleString()}
                  </div>
                </div>
              ))}
              {fieldMeasurements.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No field measurements yet. Start a boundary walk to measure your first field.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Boundary Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {boundaryPoints.map(point => (
                <div key={point.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{point.label}</div>
                    <Badge variant="outline">GPS</Badge>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    <div>Lat: {point.latitude.toFixed(6)}</div>
                    <div>Lng: {point.longitude.toFixed(6)}</div>
                    {point.accuracy && (
                      <div className="text-gray-500">±{point.accuracy.toFixed(1)}m</div>
                    )}
                  </div>
                </div>
              ))}
              {boundaryPoints.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No boundary points yet. Start a boundary walk to mark GPS locations.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      {fieldMeasurements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Survey Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {fieldMeasurements.reduce((sum, m) => sum + m.area.acres, 0).toFixed(2)}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Total Acres</div>
              </div>
              
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {fieldMeasurements.length}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Fields Surveyed</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {boundaryPoints.length}
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">GPS Points</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Field Surveyor Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use the Field Surveyor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <h4>Step-by-Step Process:</h4>
            <ol className="space-y-2">
              <li><strong>Start Boundary Walk:</strong> Click "Start Boundary Walk" to begin GPS tracking</li>
              <li><strong>Walk the Perimeter:</strong> Walk to each corner of your field boundary</li>
              <li><strong>Mark Corners:</strong> At each corner, tap "Mark Corner" to record the GPS location</li>
              <li><strong>Complete the Boundary:</strong> After marking at least 3 corners, tap "Complete Boundary"</li>
              <li><strong>View Results:</strong> Area in acres and square meters will be automatically calculated</li>
            </ol>
            
            <h4>GPS Accuracy Tips:</h4>
            <ul className="space-y-1">
              <li>• Ensure location services are enabled for best accuracy</li>
              <li>• Wait for GPS to stabilize before marking corners (±5m accuracy is good)</li>
              <li>• Avoid surveying during heavy cloud cover or near tall buildings</li>
              <li>• Walk slowly and pause at each corner for accurate positioning</li>
            </ul>

            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded border-l-4 border-amber-500">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Professional Note:</strong> This tool provides field measurements for farm planning purposes. 
                For legal surveys or property boundaries, consult a licensed surveyor.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}