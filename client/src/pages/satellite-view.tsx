import React from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Satellite, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SatelliteMap } from "@/components/satellite-map";
import { apiRequest } from "@/lib/queryClient";
import { type Farm, type Plot } from "@shared/schema";

export function SatelliteViewPage() {
  const params = useParams<{ id: string }>();
  const farmId = params.id;

  const { data: farm, isLoading: farmLoading } = useQuery<Farm>({
    queryKey: ['/api/projects', farmId],
    enabled: !!farmId,
  });

  const { data: plots = [], isLoading: plotsLoading } = useQuery<Plot[]>({
    queryKey: ['/api/farms', farmId, 'plots'],
    enabled: !!farmId,
  });

  // Parse field measurement from layout data
  const fieldMeasurement = React.useMemo(() => {
    if (farm?.layoutData && typeof farm.layoutData === 'string') {
      try {
        const parsed = JSON.parse(farm.layoutData);
        return parsed.fieldMeasurement;
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [farm?.layoutData]);

  const handlePlotClick = (plot: Plot) => {
    console.log('Plot clicked:', plot);
    // Could open plot details modal or navigate to plot editor
  };

  if (farmLoading || plotsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!farm || !farmId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500 mb-4">Farm not found or invalid farm ID.</p>
            <Button asChild variant="outline">
              <Link href="/projects">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${farmId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Link>
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Satellite className="h-6 w-6" />
              Satellite View
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Aerial view of {farm.name} with planned layout overlay
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Map
          </Button>
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share View
          </Button>
        </div>
      </div>

      {/* Satellite Map */}
      <div className="min-h-[600px]">
        <SatelliteMap
          farm={farm}
          plots={plots}
          fieldMeasurement={fieldMeasurement}
          onPlotClick={handlePlotClick}
        />
      </div>

      {/* Farm Information Panel */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-2">Farm Details</h3>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div>Owner: {farm.ownerName}</div>
              <div>Location: {farm.location}</div>
              {farm.farmSize && <div>Size: {farm.farmSize} acres</div>}
              {farm.crops && farm.crops.length > 0 && (
                <div>Crops: {farm.crops.join(', ')}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-2">Survey Data</h3>
            {fieldMeasurement ? (
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div>Area: {fieldMeasurement.area.acres.toFixed(2)} acres</div>
                <div>Area: {fieldMeasurement.area.squareMeters.toFixed(0)} m²</div>
                <div>Perimeter: {(fieldMeasurement.perimeter / 1000).toFixed(2)} km</div>
                <div>Boundary Points: {fieldMeasurement.points.length}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No survey data available. 
                <Link href={`/projects/${farmId}/survey`} className="text-blue-600 hover:underline ml-1">
                  Start survey
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-2">Layout Planning</h3>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div>Total Plots: {plots.length}</div>
              {plots.length > 0 && (
                <>
                  <div>Plot Colors:</div>
                  <div className="flex gap-1 mt-1">
                    {Array.from(new Set(plots.map(p => p.color))).map(color => (
                      <div
                        key={color}
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: color }}
                        title={`${color} plots: ${plots.filter(p => p.color === color).length}`}
                      />
                    ))}
                  </div>
                </>
              )}
              {plots.length === 0 && (
                <div className="text-gray-500">
                  No plots planned yet.
                  <Link href={`/projects/${farmId}`} className="text-blue-600 hover:underline ml-1">
                    Add plots
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}